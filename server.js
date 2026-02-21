require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// 1. SETUP: Uvoz paketa za sigurnost
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// --- KONFIGURACIJA ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- MONGODB ATLAS POVEZIVANJE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ TVRĐAVA POVEZANA NA MONGODB"))
    .catch(err => console.error("❌ GREŠKA PRI POVEZIVANJU:", err));

// --- BAZA: Model sa fiokama za Demo i Real ---
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true, minlength: 3, maxlength: 30 },
    password: { type: String, required: true }, // Kriptovana lozinka
    email: { type: String, unique: true, required: true },
    balans_real: { type: Number, default: 0 },
    balans_demo: { type: Number, default: 5000 },
    avatar: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// --- SIGURNOST: Middleware za provere (Za Web i App) ---
const zastitiRutu = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ status: "greška", poruka: "Pristup odbijen. Nema tokena." });

    try {
        const verifikovan = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verifikovan;
        next();
    } catch (err) {
        return res.status(401).json({ status: "greška", poruka: "Nevalidan ili istekao token." });
    }
};

// --- VALIDACIJA: Pomoćne funkcije ---
const validacijaImeila = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const validacijaLozinke = (password) => {
    // Minimalno 6 karaktera
    return password && password.length >= 6;
};

const validacijaKorisnickog = (username) => {
    // Minimalno 3, maksimalno 30 karaktera, samo alfanumerika i _
    const regex = /^[a-z0-9_]{3,30}$/i;
    return regex.test(username);
};

// --- HTTP RUTE ---

// 1. REGISTRACIJA: Sa bcrypt kriptovanjem i validacijom
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    
    try {
        // Validacija ulaza
        if (!username || !password || !email) {
            return res.status(400).json({ status: "greška", poruka: "Svi polja su obavezna." });
        }

        if (!validacijaKorisnickog(username)) {
            return res.status(400).json({ status: "greška", poruka: "Korisničko ime mora biti 3-30 karaktera, samo cifre i slova." });
        }

        if (!validacijaImeila(email)) {
            return res.status(400).json({ status: "greška", poruka: "Email nije validan." });
        }

        if (!validacijaLozinke(password)) {
            return res.status(400).json({ status: "greška", poruka: "Lozinka mora biti najmanje 6 karaktera." });
        }

        // Provera da li korisnik već postoji
        const postoji = await User.findOne({ $or: [{ username }, { email }] });
        if (postoji) {
            return res.status(409).json({ status: "greška", poruka: "Korisničko ime ili email već postoji." });
        }

        // Kriptovanje lozinke
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Kreiranje novi korisnika sa Demo balansom
        const noviKorisnik = new User({ 
            username, 
            password: hashedPassword, 
            email,
            balans_demo: 5000  // Demo nalog dobija 5000 za igranje
        });

        await noviKorisnik.save();
        
        // Generisanje JWT tokena za automatski login nakon registracije
        const token = jwt.sign({ id: noviKorisnik._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ 
            status: "uspešno", 
            poruka: "Nalog je kreiran!",
            token,
            user: {
                id: noviKorisnik._id,
                username: noviKorisnik.username,
                email: noviKorisnik.email,
                balans_demo: noviKorisnik.balans_demo,
                balans_real: noviKorisnik.balans_real
            }
        });
    } catch (err) {
        console.error("Greška pri registraciji:", err);
        res.status(500).json({ status: "greška", poruka: "Greška pri kreiranju naloga." });
    }
});

// 2. LOGIN: Sa JWT sistemom (Digitalni ključ) - Za Web i App
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Validacija ulaza
        if (!username || !password) {
            return res.status(400).json({ status: "greška", poruka: "Korisničko ime i lozinka su obavezni." });
        }

        // Pronalaženje korisnika
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ status: "greška", poruka: "Korisničko ime ili lozinka nisu tačni." });
        }

        // Upoređivanje lozinke
        const validnaLozinka = await bcrypt.compare(password, user.password);
        if (!validnaLozinka) {
            return res.status(401).json({ status: "greška", poruka: "Korisničko ime ili lozinka nisu tačni." });
        }

        // Generisanje JWT tokena (Traje 7 dana - pogodan za Web i App)
        const token = jwt.sign(
            { id: user._id, username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '7d' }
        );

        res.json({ 
            status: "uspešno",
            poruka: "Uspešna prijava!",
            token,  // Ovaj token App/Web čuvaju i šalju sa svakim requestom
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                balans_real: user.balans_real,
                balans_demo: user.balans_demo,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error("Greška pri loginu:", err);
        res.status(500).json({ status: "greška", poruka: "Greška na serveru." });
    }
});

// 3. PROFIL: Preuzimanje podataka korisnika (Zaštićena ruta - za Web i App)
app.get('/profile', zastitiRutu, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ status: "greška", poruka: "Korisnik nije pronađen." });
        }

        res.json({ 
            status: "uspešno",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                balans_real: user.balans_real,
                balans_demo: user.balans_demo,
                avatar: user.avatar,
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        console.error("Greška pri učitavanju profila:", err);
        res.status(500).json({ status: "greška", poruka: "Greška na serveru." });
    }
});

// 4. VERIFIKACIJA TOKENA: Provera da li je token validan (Za App refresh logiku)
app.get('/verify-token', zastitiRutu, (req, res) => {
    res.json({ 
        status: "uspešno", 
        poruka: "Token je validan.",
        user: req.user 
    });
});

// 5. UPDATE PROFILA: Ažuriranje korisničkog profila (avatar, email, itd.)
app.put('/profile', zastitiRutu, async (req, res) => {
    const { email, avatar } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ status: "greška", poruka: "Korisnik nije pronađen." });
        }

        // Ažuriranje dozvoljenih polja
        if (email && email !== user.email) {
            // Provera da li email već postoji
            const exists = await User.findOne({ email });
            if (exists) {
                return res.status(409).json({ status: "greška", poruka: "Email već postoji." });
            }
            user.email = email;
        }

        if (avatar) {
            user.avatar = avatar;
        }

        await user.save();

        res.json({ 
            status: "uspešno",
            poruka: "Profil je ažuriran.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error("Greška pri ažuriranju profila:", err);
        res.status(500).json({ status: "greška", poruka: "Greška na serveru." });
    }
});

// 6. PROVERA ULAZA: Zaštićena ruta
app.post('/proveri-ulaz', zastitiRutu, async (req, res) => {
    const { idIgre, tipValute } = req.body;
    const polje = tipValute === 'real' ? 'balans_real' : 'balans_demo';
    
    try {
        // req.user.id dobijamo direktno iz tokena (sigurnije je)
        const user = await User.findById(req.user.id);
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
const gameRooms = {}; // Čuvanje stanja svih aktivnih igara

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
// --- LISTA IGARA ---
const igre = [
    { id: "pong", naziv: "Neon Pong", status: "aktivna", ulog: 50 },
    { id: "cannon", naziv: "Cannon Duel", status: "aktivna", ulog: 100 },
    { id: "looptap", naziv: "Loop Tap", status: "aktivna", ulog: 30 },
    { id: "iksoks", naziv: "Tic-Tac-Toe", status: "aktivna", ulog: 50 },
    { id: "bomber", naziv: "Neon Bomber", status: "aktivna", ulog: 150 },
    { id: "bilijar", naziv: "Pool 8", status: "aktivna", ulog: 200 }
];
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