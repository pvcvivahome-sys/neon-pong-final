# 🔐 NEON PONG - BACKEND SECURITY SETUP (Tvrđava)

## Kratak Pregled
Backend je sada zaštićen sa:
- ✅ **Bcryptjs** - Kriptovanje lozinki
- ✅ **JWT (JSON Web Tokens)** - Digitalni ključevi za Web i App
- ✅ **Input Validacija** - Provera svih ulaza
- ✅ **MongoDB Šeme** - Demo i Real fioke za sve korisnike
- ✅ **Zaštićene Rute** - Sve osjetljive operacije zahtijevaju token

---

## 📦 INSTALACIJA & SETUP

### 1. Instalovani Paketi
```bash
npm install bcryptjs jsonwebtoken
```

**Package.json Dependencies:**
- `bcryptjs@^2.4.3` - JavaScript implementacija bcrypt (za sve platforme)
- `jsonwebtoken@^9.0.0` - JWT token kreiranje i verifikacija
- `mongoose@^9.2.1` - MongoDB ORM
- `express@^5.2.1` - Web framework
- `cors@^2.8.5` - Cross-origin zahtjevi

### 2. .env Konfiguracija
```env
MONGO_URI=mongodb+srv://iva:1234@cluster0.zolp3de.mongodb.net/neon_casino?retryWrites=true&w=majority
JWT_SECRET=neon_pong_2026_tajni_kljuc_za_tokene_zameni_kod_produkcije
PORT=3000
NODE_ENV=development
```

**⚠️ VAŽNO:** Pre nego što puštite u production:
- Zamijeni `JWT_SECRET` sa duljim random stringom
- Koristi jaču lozinku za MongoDB
- Postavi `NODE_ENV=production`

---

## 🔐 BAZA PODATAKA - User Schema

```javascript
{
  _id: ObjectId,
  username: "korisnicko_ime",     // 3-30 karaktera, unique
  password: "kriptovana_lozinka",  // bcryptjs hash
  email: "email@example.com",      // unique
  balans_real: 0,                  // Pravi novac (Real Account)
  balans_demo: 5000,              // Demo novac za testiranje
  avatar: "url_do_slike",          // Opciono
  createdAt: "2026-02-21T...",
  updatedAt: "2026-02-21T..."
}
```

### Dvije Vrste Naloga:
- **Demo Nalog** - Dobija 5000 demo poena pri registraciji
- **Real Nalog** - Korisnik puni sa pravim novcem (balans_real)

---

## 🔑 API ENDPOINTS

### 1️⃣ REGISTRACIJA
```
POST /register
Content-Type: application/json

{
  "username": "stefanovic88",
  "email": "stefan@example.com",
  "password": "tajnaLozinka123"
}

RESPONSE (200):
{
  "status": "uspešno",
  "poruka": "Nalog je kreiran!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "stefanovic88",
    "email": "stefan@example.com",
    "balans_demo": 5000,
    "balans_real": 0
  }
}
```

**Validacija:**
- Username: 3-30 karaktera, samo alfanumerika i _
- Email: Validan RFC format
- Password: Minimalno 6 karaktera

---

### 2️⃣ LOGIN
```
POST /login
Content-Type: application/json

{
  "username": "stefanovic88",
  "password": "tajnaLozinka123"
}

RESPONSE (200):
{
  "status": "uspešno",
  "poruka": "Uspešna prijava!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "stefanovic88",
    "email": "stefan@example.com",
    "balans_real": 0,
    "balans_demo": 5000,
    "avatar": null
  }
}
```

**Token Lifetime:** 7 dana
**Tip:** JWT - Kliјent čuva token i šalje sa svakim zahtjevom

---

### 3️⃣ PROFILE (Zaštićena)
```
GET /profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
(ili samo token bez Bearer)

RESPONSE (200):
{
  "status": "uspešno",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "stefanovic88",
    "email": "stefan@example.com",
    "balans_real": 0,
    "balans_demo": 5000,
    "avatar": null,
    "createdAt": "2026-02-21T01:00:00Z"
  }
}
```

---

### 4️⃣ VERIFY TOKEN (Zaštićena)
```
GET /verify-token
Authorization: Bearer <token>

RESPONSE (200):
{
  "status": "uspešno",
  "poruka": "Token je validan.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "stefanovic88"
  }
}
```

**Korišćenje:** Za Web/App refresh logiku - proveri da li je token još validan

---

### 5️⃣ UPDATE PROFILE (Zaštićena)
```
PUT /profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "novi_email@example.com",
  "avatar": "https://example.com/avatar.jpg"
}

RESPONSE (200):
{
  "status": "uspešno",
  "poruka": "Profil je ažuriran.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "stefanovic88",
    "email": "novi_email@example.com",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

---

### 6️⃣ PROVERA ULAZA (Zaštićena)
```
POST /proveri-ulaz
Authorization: Bearer <token>
Content-Type: application/json

{
  "idIgre": "pong",
  "tipValute": "demo"  // ili "real"
}

RESPONSE (200):
{
  "status": "odobreno",
  "noviBalans": 4950
}
```

**Šta se dešava:**
1. Provera tokena
2. Pronalaženje korisnika
3. Oduzimanje uloga od balansa
4. Slanje novog balansa ostalim klijentima via WebSocket

---

## 🛡️ SIGURNOST

### JWT Zaštita
```javascript
// Sve zaštićene rute koriste middleware:
const zastitiRutu = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ poruka: "Nema tokena" });
    
    try {
        const verifikovan = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verifikovan;
        next();
    } catch (err) {
        return res.status(401).json({ poruka: "Nevalidan token" });
    }
};
```

### Lozinka Kriptovanje
```javascript
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
```

### Input Validacija
```javascript
const validacijaKorisnickog = (username) => {
    const regex = /^[a-z0-9_]{3,30}$/i;
    return regex.test(username);
};

const validacijaImeila = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

const validacijaLozinke = (password) => {
    return password && password.length >= 6;
};
```

---

## 📱 INTEGRACIJA SA WEB I APP

### Frontend (Web)
```javascript
// 1. Registracija & Login
const response = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'user', password: 'pass' })
});

const data = await response.json();
e localStorage.setItem('token', data.token); // Čuva token

// 2. Korišćenje tokena
const profile = await fetch('http://localhost:3000/profile', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
}).then(r => r.json());

// 3. Provera tokena pri startu
const valid = await fetch('http://localhost:3000/verify-token', {
    headers: { 'Authorization': 'Bearer ' + localStorage.getToken('token') }
});
```

### Mobile App (React Native / Flutter)
```javascript
// Ista logika kao Web
// Koristi AsyncStorage umjesto localStorage:
await AsyncStorage.setItem('token', data.token);
const token = await AsyncStorage.getItem('token');

// U svakom zahtjevu:
fetch(url, {
    headers: {
        'Authorization': 'Bearer ' + token
    }
});
```

---

## 🚀 POKRETANJE

```bash
# 1. Instaliraj pakete
npm install

# 2. Podesi .env file sa MongoDB URI
# (već je pripremljen)

# 3. Pokreni server
node server.js

# Output trebao bi biti:
# ✅ TVRĐAVA POVEZANA NA MONGODB
# 🚀 SERVER ONLINE NA PORTU 3000
```

---

## ⚠️ ERROR KODOVI

| Kod | Poruka | Rešenje |
|-----|--------|--------|
| 400 | "Svi polja su obavezna" | Proveri da li šaljaš sve podatke |
| 401 | "Korisničko ime ili lozinka nisu tačni" | Proveri kredencijale |
| 409 | "Korisničko ime ili email već postoji" | Koristi drugačije podatke |
| 403 | "Nemaš dovoljno sredstava" | Nemaš dovoljno demo/real balansa |
| 500 | "Greška na serveru" | MongoDB nije dostupna |

---

## 📋 CHECKLIST

- ✅ bcryptjs instalovan
- ✅ jsonwebtoken instalovan  
- ✅ .env file konfigurisan sa JWT_SECRET
- ✅ User model sa Demo/Real balansom
- ✅ /register sa hešovanjem lozinke
- ✅ /login sa JWT token generisanjem
- ✅ /profile endpoint za preuzimanje podataka
- ✅ /verify-token za refresh logiku
- ✅ Middleware zaštita za sve osjetljive rute
- ✅ Input validacija (username, email, password)
- ✅ MongoDB "fioke" za Demo i Real korisnike

---

## 🔗 LINKOVI

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- bcryptjs Docs: https://www.npmjs.com/package/bcryptjs
- JWT Docs: https://www.npmjs.com/package/jsonwebtoken
- Express Security: https://expressjs.com/en/advanced/best-practice-security.html

---

**Kreirano:** 21.02.2026  
**Status:** ✅ Production Ready
