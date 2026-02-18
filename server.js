require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const server = http.createServer(app);

// --- KONFIGURACIJA ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- MONGODB ATLAS POVEZIVANJE ---
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ POVEZAN NA MONGODB ATLAS"))
    .catch(err => console.error("❌ GREŠKA PRI POVEZIVANJU NA MONGO:", err));

// --- MODEL KORISNIKA ---
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    balans_real: { type: Number, default: 0 },
    balans_demo: { type: Number, default: 5000 },
    avatar: { type: String, default: null }
}));

// --- LISTA IGARA ---
const igre = [
    { id: "pong", naziv: "Neon Pong", status: "aktivna", ulog: 50 },
    { id: "cannon", naziv: "Cannon Duel", status: "aktivna", ulog: 100 },
    { id: "looptap", naziv: "Loop Tap", status: "aktivna", ulog: 30 },
    { id: "iksoks", naziv: "Tic-Tac-Toe", status: "aktivna", ulog: 50 },
    { id: "bomber", naziv: "Neon Bomber", status: "aktivna", ulog: 150 },
    { id: "bilijar", naziv: "Pool 8", status: "aktivna", ulog: 200 }
];

let gameRooms = {};

// --- HTTP RUTE ---

app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        const noviKorisnik = new User({ username, password, email });
        await noviKorisnik.save();
        console.log(`✅ Registrovan: ${username}`);
        res.json({ status: "uspešno", poruka: "Registracija uspela!" });
    } catch (err) {
        res.status(400).json({ status: "greška", poruka: "Korisnik već postoji!" });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username, password });
        if (!user) return res.status(401).json({ status: "greška", poruka: "Pogrešni podaci" });
        res.json({ status: "uspešno", podaci: user });
    } catch (err) {
        res.status(500).json({ status: "greška" });
    }
});

app.post('/proveri-ulaz', async (req, res) => {
    const { username, idIgre, tipValute } = req.body;
    const polje = tipValute === 'real' ? 'balans_real' : 'balans_demo';
    
    try {
        const user = await User.findOne({ username });
        const igra = igre.find(i => i.id === idIgre);

        if (user && igra && user[polje] >= igra.ulog) {
            user[polje] -= igra.ulog;
            await user.save();
            io.emit('update-balans', { username: user.username, noviBalans: user[polje], tip: tipValute });
            res.json({ status: "odobreno", noviBalans: user[polje] });
        } else {
            res.status(403).json({ status: "odbijeno", poruka: "Nemaš dovoljno sredstava!" });
        }
    } catch (err) {
        res.status(500).json({ status: "greška" });
    }
});

// --- SOCKET.IO MASTER LOGIKA ---
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log(`🔌 Novi korisnik: ${socket.id}`);

    socket.on('join-room', (data) => {
        const { room, user, ulog, limit, igraId } = data;
        socket.join(room);
        socket.username = user;
        socket.currentRoom = room;

        if (!gameRooms[room]) {
            gameRooms[room] = {
                igraId, ulog: parseInt(ulog) || 50, limit: parseInt(limit) || 5,
                p1: { id: socket.id, name: user, ready: false, score: 0, y: 250 },
                p2: { id: null, name: "Čekanje...", ready: false, score: 0, y: 250 },
                ball: { x: 500, y: 300, dx: 5, dy: 5 }, active: false
            };
            socket.emit('player-assignment', 'player1');
        } else if (!gameRooms[room].p2.id && gameRooms[room].p1.name !== user) {
            gameRooms[room].p2.id = socket.id;
            gameRooms[room].p2.name = user;
            socket.emit('player-assignment', 'player2');
            io.to(room).emit('opponent-joined', { name: user });
        }
    });

    socket.on('player-ready', (data) => {
        const room = gameRooms[data.room];
        if (!room) return;
        if (socket.id === room.p1.id) room.p1.ready = true;
        if (socket.id === room.p2.id) room.p2.ready = true;

        if (room.p1.ready && room.p2.ready) {
            room.active = true;
            io.to(data.room).emit('game-start');
            startPongLoop(data.room);
        }
    });

    socket.on('sync-pos', (data) => {
        const room = gameRooms[data.room];
        if (room) {
            if (socket.id === room.p1.id) room.p1.y = data.y;
            if (socket.id === room.p2.id) room.p2.y = data.y;
            socket.to(data.room).emit('opponent-pos', { y: data.y });
        }
    });

    socket.on('game-over', async (data) => {
        const room = gameRooms[data.room];
        if (room && room.active) {
            const nagrada = room.ulog * 2;
            io.to(data.room).emit('victory', { pobednik: data.pobednik, nagrada });
            
            try {
                const user = await User.findOne({ username: data.pobednik });
                if(user) {
                    const polje = data.tipValute === 'real' ? 'balans_real' : 'balans_demo';
                    user[polje] += nagrada;
                    await user.save();
                    io.emit('update-balans', { username: data.pobednik, noviBalans: user[polje], tip: data.tipValute });
                }
            } catch (e) { console.log("Greška kod nagrade"); }

            room.active = false;
            setTimeout(() => { delete gameRooms[data.room]; }, 5000);
        }
    });

    socket.on('disconnect', () => {
        if (socket.currentRoom) {
            io.to(socket.currentRoom).emit('opponent-disconnected');
            delete gameRooms[socket.currentRoom];
        }
    });
});

// Pong Engine
function resetBallServer(room) {
    room.ball = { x: 500, y: 300, dx: Math.random() > 0.5 ? 5 : -5, dy: (Math.random() - 0.5) * 6 };
}

function startPongLoop(roomID) {
    const loop = setInterval(() => {
        const room = gameRooms[roomID];
        if (!room || !room.active) return clearInterval(loop);
        
        let b = room.ball;
        b.x += b.dx; b.y += b.dy;

        // Odbijanje od zidova
        if (b.y < 0 || b.y > 600) b.dy *= -1;

        // Kolizija sa palicama (jednostavna logika)
        if (b.x < 30 && b.y > room.p1.y && b.y < room.p1.y + 100) b.dx *= -1.1;
        if (b.x > 970 && b.y > room.p2.y && b.y < room.p2.y + 100) b.dx *= -1.1;

        // Poeni
        if (b.x < 0) { room.p2.score++; resetBallServer(room); }
        if (b.x > 1000) { room.p1.score++; resetBallServer(room); }

        io.to(roomID).emit('game-update', { ball: b, p1Score: room.p1.score, p2Score: room.p2.score });

        if (room.p1.score >= room.limit || room.p2.score >= room.limit) {
            const win = room.p1.score >= room.limit ? room.p1.name : room.p2.name;
            io.to(roomID).emit('game-over', { pobednik: win });
            room.active = false;
            clearInterval(loop);
        }
    }, 1000 / 60);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 SERVER ONLINE NA PORTU ${PORT}`));