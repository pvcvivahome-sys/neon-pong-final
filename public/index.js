// --- LOGIKA: Slanje podataka za Login ---
async function izvrsiLogin() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        const data = await response.json();
        if (response.ok) {
            // ✅ ISPRAVLJENO: Čuva token i user objekat kako je server vraća
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log("✅ Uspešan login! Prebacivanje na dashboard...");
            window.location.href = "dashboard.html"; 
        } else { 
            alert("❌ " + (data.poruka || "Greška pri loginu")); 
        }
    } catch (err) { 
        console.error("Greška:", err);
        alert("⚠️ Server nije dostupan."); 
    }
}

// --- LOGIKA: Slanje podataka za Registraciju ---
const mainRegForm = document.getElementById('mainRegisterForm');
if (mainRegForm) {
    mainRegForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm').value;

        if (password !== confirmPassword) {
            alert("❌ Lozinke se ne poklapaju!");
            return;
        }

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email })
            });
            const data = await response.json();
            if (response.ok) {
                // ✅ ISPRAVLJENO: Čuva token i user nakon registracije
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                alert("✅ USPEŠNA REGISTRACIJA!\n\nPrebaciujem te na dashboard...");
                window.location.href = "dashboard.html"; // Direktno na dashboard umesto na login modal
            } else { 
                alert("❌ GREŠKA: " + (data.poruka || "Problem.")); 
            }
        } catch (err) { 
            console.error("Greška:", err);
            alert("⚠️ Server nije dostupan."); 
        }
    });
}
// RUTA ZA LOGIN (Pristup sistemu)
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Tražimo korisnika u MongoDB
        // Pretpostavljamo da koristiš User model (Mongoose)
        const korisnik = await User.findOne({ username: username });

        if (!korisnik) {
            return res.status(401).json({ poruka: "Korisnik nije pronađen." });
        }

        // 2. Provera lozinke (Ovdje ide obična provera jer nismo radili bcrypt)
        if (korisnik.password !== password) {
            return res.status(401).json({ poruka: "Pogrešna lozinka." });
        }

        // 3. Ako je sve OK, šaljemo podatke nazad
        console.log(`✅ Korisnik ${username} se uspešno ulogovao.`);
        res.json({
            poruka: "Uspešna prijava!",
            podaci: {
                username: korisnik.username,
                balance: korisnik.balance
            }
        });

    } catch (err) {
        console.error("Greška pri loginu:", err);
        res.status(500).json({ poruka: "Serverska greška." });
    }
});

// --- LOGIKA: Provera da li korisnik sme da uđe u igru ---
function proveriPristup() {
    const user = localStorage.getItem('user');
    if (!user) { 
        alert("Moraš se ulogovati!"); 
        otvoriLogin(); 
    } else { 
        window.location.href = "dashboard.html"; 
    }
}