const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// --- KONFIGURACIJA ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Putanja do baze
const USERS_FILE = path.join(__dirname, 'users.json');

// --- POMOĆNE FUNKCIJE ZA BAZU (FS) ---
const procitajKorisnike = () => {
    try {
        if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Greška pri čitanju baze:", err);
        return [];
    }
};

const zapisiKorisnike = (users) => {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err) {
        console.error("Greška pri upisu u bazu:", err);
    }
};

// --- EMAIL SERVIS (Opciono) ---
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: { user: "TVOJ_EMAIL@gmail.com", pass: "TVOJ_APP_PASSWORD" },
});

// --- LISTA IGARA ---
const igre = [
    { id: "pong", naziv: "Neon Pong", status: "aktivna", ulog: 50 },
    { id: "cannon", naziv: "Cannon Duel", status: "aktivna", ulog: 100 },
    { id: "looptap", naziv: "Loop Tap", status: "aktivna", ulog: 30 },
    { id: "iksoks", naziv: "Tic-Tac-Toe", status: "aktivna", ulog: 50 },
    { id: "bomber", naziv: "Neon Bomber", status: "aktivna", ulog: 150 },
    { id: "mills", naziv: "Mice (Mlin)", status: "aktivna", ulog: 80 },
    { id: "bilijar", naziv: "Pool 8", status: "aktivna", ulog: 200 },
    { id: "checkers", naziv: "Dame", status: "aktivna", ulog: 100 },
    { id: "quoridor", naziv: "Quoridor", status: "aktivna", ulog: 150 }
];

const kategorijeIgra = {
    skill: ['pong', 'cannon', 'looptap', 'bomber', 'bilijar'],
    thinking: ['iksoks', 'mills', 'checkers', 'quoridor']
};

let gameRooms = {};

// --- HTTP RUTE ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/register', (req, res) => {
    const { username, password, email } = req.body;
    let users = procitajKorisnike();

    if (users.find(u => u.username === username || u.email === email)) {
        return res.status(400).json({ status: "greška", poruka: "Korisnik već postoji!" });
    }

    const noviKorisnik = {
        id: Date.now(),
        username, password, email,
        balans_real: 0,
        balans_demo: 5000,
        role: "user",
        verified: true,
        createdAt: Date.now()
    };

    users.push(noviKorisnik);
    zapisiKorisnike(users);
    console.log(`✅ Registrovan: ${username}`);
    res.json({ status: "uspešno", poruka: "Registracija uspela!" });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = procitajKorisnike();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) return res.status(401).json({ status: "greška", poruka: "Pogrešni podaci" });
    res.json({ status: "uspešno", podaci: user });
});

app.get('/lobby', (req, res) => {
    res.json({ dostupne_igre: igre });
});

app.post('/proveri-ulaz', (req, res) => {
    const { username, idIgre, tipValute } = req.body; // tipValute: 'real' ili 'demo'
    let users = procitajKorisnike();
    const user = users.find(u => u.username === username);
    const igra = igre.find(i => i.id === idIgre);

    const polje = tipValute === 'real' ? 'balans_real' : 'balans_demo';

    if (user && igra && user[polje] >= igra.ulog) {
        user[polje] -= igra.ulog;
        zapisiKorisnike(users);
        io.emit('update-balans', { username: user.username, noviBalans: user[polje], tip: tipValute });
        res.json({ status: "odobreno", noviBalans: user[polje] });
    } else {
        res.status(403).json({ status: "odbijeno", poruka: "Nemaš dovoljno sredstava!" });
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
        socket.igraId = igraId;

        if (!gameRooms[room]) {
            gameRooms[room] = {
                igraId, ulog: parseInt(ulog) || 50, limit: parseInt(limit) || 5,
                p1: { id: socket.id, name: user, ready: false, score: 0, pos: {x:0, y:0} },
                p2: { id: null, name: "Čekanje...", ready: false, score: 0, pos: {x:0, y:0} },
                ball: { x: 500, y: 300, dx: 5, dy: 5 }, active: false, starting: false, turn: 'p1'
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
        if (data.role === 'player1') room.p1.ready = true;
        if (data.role === 'player2') room.p2.ready = true;
        io.to(data.room).emit('ready-update', { p1Ready: room.p1.ready, p2Ready: room.p2.ready });

        if (room.p1.ready && room.p2.ready && !room.active) {
            room.starting = true;
            let counter = 3;
            let countdown = setInterval(() => {
                io.to(data.room).emit('countdown', counter);
                if (counter-- < 0) {
                    clearInterval(countdown);
                    room.active = true;
                    room.starting = false;
                    if (room.igraId === 'pong') startPongLoop(data.room);
                    io.to(data.room).emit('game-start');
                }
            }, 1000);
        }
    });

    socket.on('sync-pos', (data) => {
        if (gameRooms[data.room]) socket.to(data.room).emit('opponent-pos', data);
    });

    socket.on('game-over', (data) => {
        const room = gameRooms[data.room];
        if (room && room.active) {
            const nagrada = room.ulog * 2;
            io.to(data.room).emit('victory', { pobednik: data.pobednik, nagrada });
            dodeliNagradu(data.pobednik, nagrada, data.tipValute || 'demo');
            room.active = false;
            setTimeout(() => { delete gameRooms[data.room]; }, 5000);
        }
    });

    socket.on('disconnect', () => {
        if (socket.currentRoom) delete gameRooms[socket.currentRoom];
    });
});

// --- POMOĆNE FUNKCIJE ZA IGRE ---
function dodeliNagradu(username, iznos, tipValute) {
    let users = procitajKorisnike();
    const user = users.find(u => u.username === username);
    const polje = tipValute === 'real' ? 'balans_real' : 'balans_demo';
    if (user) {
        user[polje] += iznos;
        zapisiKorisnike(users);
        io.emit('update-balans', { username, noviBalans: user[polje], tip: tipValute });
    }
}

function resetBallServer(room) {
    room.ball = { x: 500, y: 300, dx: Math.random() > 0.5 ? 5 : -5, dy: (Math.random() - 0.5) * 6 };
}

function startPongLoop(roomID) {
    const loop = setInterval(() => {
        const room = gameRooms[roomID];
        if (!room || !room.active) return clearInterval(loop);
        let b = room.ball;
        b.x += b.dx; b.y += b.dy;
        if (b.y < 0 || b.y > 600) b.dy *= -1;
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

// --- POKRETANJE ---
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 NEON SERVER ONLINE NA PORTU ${PORT}`);
});