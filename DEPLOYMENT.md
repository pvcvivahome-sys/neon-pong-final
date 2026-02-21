# 🚀 DEPLOYMENT NA RENDER - NEON PONG

## Korak 1: Priprema GitHub Repozitorijuma

### 1.1 Inicijalizuj Git repozitorijum
```bash
cd "c:\Users\Stefan\Desktop\iva profili\app\neon-pong"
git init
git add .
git commit -m "Initial commit - Neon Pong server sa JWT security"
```

### 1.2 Kreiraj GitHub repozitorijum
1. Idi na https://github.com/new
2. Kreiraj repozitorijum sa nazivom `neon-pong` (ili bilo koji drugi)
3. NE čini ga javnim ako ima osjetljive podatke

### 1.3 Povežи lokalnu git bazu sa GitHub-om
```bash
git branch -M main
git remote add origin https://github.com/TVOJE_KORISNICKO_IME/neon-pong.git
git push -u origin main
```

---

## Korak 2: MongoDB Atlas Setup

### 2.1 Proveri konekciju
1. Idi na https://www.mongodb.com/cloud/atlas
2. Prijavi se sa svojim nalogom (ili kreiraj novi)
3. Klikni na "Database" u lijevom meniju
4. Pronađi svoj cluster i klikni "Connect"
5. Odaberi "Drivers" tab
6. Kopira URI connection string koji izgleda ovako:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
   ```

### 2.2 Provjeri IP whitelist
- U MongoDB Atlas > "Security" > "Network Access"
- Trebam dozvola `0.0.0.0/0` (Allow access from anywhere) - dovoljna za development

### 2.3 Kreiraj novi Cluster za Production (opciono)
Ako hoćeš odvojen cluster za production:
1. Klikni "Create" u MongoDB Atlas
2. Odsaberi Free tier
3. Kreiraj novi cluster

---

## Korak 3: Render Setup

### 3.1 Kreiraj Render nalog
1. Idi na https://render.com
2. Klikni "Sign up" → Google authentication
3. Konektuj GitHub nalog
4. Dozvoli Render pristup repozitorijumima

### 3.2 Kreiraj novi Web servis
1. Na Render dashboard, klikni "+ New"
2. Odaberi "Web Service"
3. Konekcija GitHub-a će se tražiti automatski
4. Odaberi repozitorijum `neon-pong`

### 3.3 Konfiguraj servis
**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

**Environment Variables:** Klikni "Advanced" i dodaj:
```
MONGO_URI=mongodb+srv://iva:1234@cluster0.zolp3de.mongodb.net/neon_casino?retryWrites=true&w=majority
JWT_SECRET=neon_pong_2026_tajni_kljuc_za_tokene_zameni_kod_produkcije
NODE_ENV=production
```

### 3.4 Odaberi Plan
- Free plan je dostupan (ali server će biti u "sleep" ako nema zahtjeva)
- Recommended: Starter plan ($7/mesec) za bolju performansu

---

## Korak 4: Deploy

### 4.1 Deploy iz Render dashboard-a
1. Render će automatski početi deployment iz GitHub-a
2. Čekaj dok se build završi (3-5 minuta)
3. Kada vidiš "Live" status → Server je online!

### 4.2 Provjeri je li deployment uspješan
- Čekaj da vidim "Service is live"
- Otidi na URL koji je Render dao (npr. `https://neon-pong-abc123.onrender.com`)

---

## Korak 5: Testiranje Live Servera

### 5.1 Testiraj profil endpoint
```bash
curl https://neon-pong-abc123.onrender.com
```

### 5.2 Testiraj register endpoint
```bash
curl -X POST https://neon-pong-abc123.onrender.com/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo1","email":"demo1@test.com","password":"Demo123"}'
```

Odgovor bi trebao biti:
```json
{
  "status": "uspešno",
  "poruka": "Nalog je kreiran!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "demo1",
    "email": "demo1@test.com",
    "balans_demo": 5000,
    "balans_real": 0
  }
}
```

---

## 🎮 Demo Nalozi - Testiranje

### Registracija iz Terminal-a
```bash
# Windows PowerShell - Testiranje
$body = @{
  username = "stefan_test"
  email = "stefan@test.com"
  password = "Tajnalozinka123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://neon-pong-abc123.onrender.com/register" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### QA Demo Nalozi
Kreiraj ove test naloge:

| Username | Email | Password | Uloga |
|----------|-------|----------|-------|
| demo_user | demo@test.com | Demo123456 | Regular tester |
| admin_test | admin@test.com | Admin123456 | Admin tester |
| mobile_test | mobile@test.com | Mobile123456 | Mobile app tester |

---

## 📊 Monitoring

### Prosljeđivanje Render log-ova
1. Na Render dashboard → klikni na servis
2. "Logs" tab prikazuje sve server output
3. "Metrics" tab pokazuje CPU/Memory usage

### Greške sa MongoDB-om
Ako vidiš:
```
❌ GREŠKA PRI POVEZIVANJU: ECONNREFUSED
```
To znači MongoDB nije dostupna. Provjeri:
1. Da li je MongoDB Atlas cluster "Running" 
2. Da li je IP whitelist korektno postavljen
3. Da li je connection string ispravan

---

## 🔄 Automatski Deployment

Render će automatski deployer:
- Kada pushneš kod na GitHub main branch
- Automatski će se pokrenuti build i deployment
- Status ti javlja u real-time na Render dashboard

### Disable auto-deploy (ako trebaš)
Na Render > Settings > "Auto-deploy" → Off

---

## ❌ Troubleshooting

### Server se ne pokreće
```
Render Logs → Provjeri build log
npm ERR! → Nešto nije u package.json-u
```
**Rješenje:** 
```bash
npm install # Lokalno testiraj
git push # Push popravke
```

### MongoDB nije dostupna
```
mongoose.connection ECONNREFUSED
```
**Rješenje:**
1. Provjeri `MONGO_URI` env varijablu
2. Provjeri MongoDB Atlas cluster je "Running"
3. Provjeri Network Access

### Port je već u upotrebi
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Rješenje na lokalnom:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```
**Rješenje na Render:** Auto se rješava kada restartaš servis

---

## 📱 Frontend Integracija

### Ažuriraj frontend API URL
Izmijeni `public/dashboard.js`, `public/index.js` itd. sa:

```javascript
// Lokalno (development):
const API_URL = 'http://localhost:3000';

// Production (Render):
const API_URL = 'https://neon-pong-abc123.onrender.com';

// Auto-detect:
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000'
  : 'https://neon-pong-abc123.onrender.com';
```

---

## 🎯 Checklist Deploy

- [ ] GitHub repozitorijum kreiran i kod je pushen
- [ ] MongoDB Atlas URI je ispravan
- [ ] Environment variables su postavljene u Render
- [ ] npm install radi bez greške
- [ ] npm start pokreće server
- [ ] Server odgovara na zahtjeve
- [ ] /register endpoint tested
- [ ] /login endpoint tested
- [ ] Frontend API URL je ažuriran
- [ ] Demo nalogi su kreirani

---

## 📞 Podrška

Ako nešto ne radi:

1. **Provjeri Render logs** → Dashboard → Logs
2. **Provjeri MongoDB Atlas status** → Dashboard → Home
3. **Testiraj lokalno prvo** → `node server.js`
4. **Provjeri .env file** → `cat .env`

---

**Kreirano:** 21.02.2026  
**Status:** Ready for Production Deployment
