# ⚡ BRZI VODIČ - Deploy na Render

## TL;DR - 10 minuta za Live Server

### Korak 1: Git Setup (2 min)
```powershell
cd "c:\Users\Stefan\Desktop\iva profili\app\neon-pong"
git init
git add .
git commit -m "Neon Pong Backend"
```

### Korak 2: Push na GitHub (1 min)
1. Kreiraj novi [GitHub repozitorijum](https://github.com/new)
   - Naziv: `neon-pong`
   - Privatni? Da/Ne (po izboru)
2. Zatim pokreni:
```powershell
git remote add origin https://github.com/TVOJE_IME/neon-pong.git
git branch -M main
git push -u origin main
```

### Korak 3: Render Setup (5 min)
1. Idi na https://render.com
2. Sign up sa GitHub
3. Klikni "+ New" → "Web Service"
4. Odaberi `neon-pong` repozitorijum
5. Ispuni:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:**
     ```
     MONGO_URI = mongodb+srv://iva:1234@cluster0.zolp3de.mongodb.net/neon_casino?retryWrites=true&w=majority
     JWT_SECRET = neon_pong_2026_tajni_kljuc_za_tokene_zameni_kod_produkcije
     NODE_ENV = production
     ```
6. Klikni "Create Web Service"

### Korak 4: Čekaj Build (3 min)
- Render će automatski pokrenuti build
- Čekaj dok statusbar ne postane "Live" ✅
- Neka bude zelena - to znači sve ok!

### Korak 5: Test!
Kopira URL sa Render i testiraj u terminal-u:
```powershell
curl https://neon-pong-XXXX.onrender.com
```

✅ **Gotovo! Server je online!**

---

## Kreiraj Demo Naloga

Koristi Render URL da kreiraj test naloge:

```powershell
$url = "https://neon-pong-XXXX.onrender.com/register"
$body = @{
  username = "demo_user1"
  email = "demo1@test.com"
  password = "Demo123456"
} | ConvertTo-Json

$resp = Invoke-WebRequest -Uri $url -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
$resp.Content | ConvertFrom-Json
```

Trebao bi odgovor sa tokenom:
```json
{
  "status": "uspešno",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "demo_user1",
    "balans_demo": 5000
  }
}
```

---

## 🔄 Auto-Deploy

Kada pushneš kod na GitHub:
```powershell
git add .
git commit -m "Bug fix"
git push
```

Render će **automatski** deployer! Osim ako nisu disabled u Settings.

---

## 📱 Update Frontend

Zamijeni API URL-ove u JavaScript fajlovima:

```javascript
// Prije (localhost):
const API = 'http://localhost:3000'

// Depois (production):
const API = 'https://neon-pong-XXXX.onrender.com'
```

---

## ❓ Ako nešto ne radi

1. Provjeri Render Logs → Dashboard → Logs tab
2. Provjeri e-mail je validan (mogući problem sa Render-om)
3. Testiraj lokalno: `npm start` 
4. Restarturaj servis na Render ("Restart" button)

---

**Status:** ✅ Ready to Deploy
