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
            localStorage.setItem('user', JSON.stringify(data.podaci));
            window.location.href = "dashboard.html"; 
        } else { alert("❌ " + data.poruka); }
    } catch (err) { alert("⚠️ Server nije dostupan."); }
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
                alert("✅ USPEŠNA REGISTRACIJA!\n\nSada se možeš ulogovati.");
                otvoriLogin(); // Ova funkcija se nalazi u index.html
            } else { alert("❌ GREŠKA: " + (data.poruka || "Problem.")); }
        } catch (err) { alert("⚠️ Server nije dostupan."); }
    });
}

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