/**
 * NEON DASHBOARD CORE LOGIC
 * Verzija: 2.1
 * Namena: Upravljanje socketima, balansima i sobama bez dizajnerskih duplikata.
 */

const socket = io();
let korisnik = JSON.parse(localStorage.getItem('user')) || { username: "GUEST", balans: 0, avatar: null };
let izabranaIgraFilter = null; 

// 1. BAZA IGRA (Koristi se za popunjavanje select menija i provere)
const igreBaza = {
    skill: [
        { id: 'bilijar', naziv: '🎱 BILIJAR' },
        { id: 'bomber', naziv: '💣 BOMBER MAN' },
        { id: 'cannon', naziv: '🚀 CANNON DUEL' },
        { id: 'headsoccer', naziv: '⚽ HEAD SOCCER' },
        { id: 'looptap', naziv: '🔄 LOOP TAP' },
        { id: 'pong', naziv: '🏓 NEON PONG' }
    ],
    thinking: [
        { id: 'sah', naziv: '♟️ NEON CHESS' },
        { id: 'iksoks', naziv: '❌ IKS OKS' },
        { id: 'checkers', naziv: '🏁 DAMA (CHECKERS)' },
        { id: 'domino', naziv: '🀄 DOMINO' },
        { id: 'fourrow', naziv: '🔵 FOUR IN A ROW' },
        { id: 'mills', naziv: '🔱 MICA (MILLS)' },
        { id: 'quoridor', naziv: '🧱 QUORIDOR' }
    ]
};

// 2. INICIJALIZACIJA
window.onload = function() {
    osveziUI();
    socket.emit('join-game', { idIgre: 'lobby', username: korisnik.username });
    socket.emit('get-active-rooms');
};

// 3. UI KONTROLA (Podaci)
function osveziUI() {
    const elName = document.getElementById('display-username');
    const elBalans = document.getElementById('display-balans');
    const elPhoto = document.getElementById('user-photo');

    if(elName) elName.innerText = korisnik.username.toUpperCase();
    if(elBalans) elBalans.innerText = (Number(korisnik.balans) || 0).toFixed(2) + " 💰";
    if(elPhoto && korisnik.avatar) elPhoto.src = korisnik.avatar;
}

// 4. PROFILNE FUNKCIJE
function uploadSliku(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        korisnik.avatar = e.target.result;
        localStorage.setItem('user', JSON.stringify(korisnik));
        osveziUI();
    }
    reader.readAsDataURL(file);
}

function odjaviSe() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// 5. UPRAVLJANJE SOBAMA
function setujFilterIgre(id, naziv) {
    izabranaIgraFilter = id;
    const naslov = document.getElementById('naslov-soba');
    if(naslov) naslov.innerHTML = `<span style="font-size: 11px; color: #ffd700; letter-spacing: 2px;">⚔️ SOBE ZA: ${naziv}</span>`;
    
    socket.emit('get-active-rooms'); 
}

function potvrdiKreiranje() {
    const elIgra = document.getElementById('izbor-igre');
    const elUlog = document.getElementById('ulog-sobe');
    
    if(!elIgra || !elUlog) return;

    const igra = elIgra.value;
    const ulog = Number(elUlog.value);

    if (korisnik.balans < ulog) { 
        alert("Sistem: Nedovoljno kredita na vašem neon računu!"); 
        return; 
    }
    
    // Ako postoji funkcija za zatvaranje modala u HTML-u, pozovi je
    if(window.zatvoriModalSobe) zatvoriModalSobe();
    
    socket.emit('create-room', { igraID: igra, ulog: ulog, username: korisnik.username });
}

function pridruziSeSobi(sobaId) {
    socket.emit('join-room', { sobaId: sobaId, username: korisnik.username });
}

// 6. SOCKET LISTENERS (SERVER -> KLIJENT)
socket.on('osvezi-listu-soba', (sveSobe) => {
    const lista = document.getElementById('lista-soba');
    if(!lista) return;
    
    lista.innerHTML = '';
    const filtrirane = sveSobe.filter(s => !izabranaIgraFilter || s.igraID === izabranaIgraFilter);

    if (filtrirane.length === 0) {
        lista.innerHTML = `<div style="text-align:center; opacity:0.3; margin-top:20px; font-size:11px;">NEMA AKTIVNIH SOBA.</div>`;
        return;
    }

    filtrirane.forEach(soba => {
        lista.innerHTML += `
            <div class="room-card">
                <div class="room-details">
                    <span class="room-game-title">${soba.nazivIgre}</span>
                    <span class="room-bet">ULOG: ${soba.ulog} 💰</span>
                </div>
                <button onclick="pridruziSeSobi('${soba.id}')" class="btn-join">IZAZOVI</button>
            </div>`;
    });
});

socket.on('update-balans', (data) => {
    if (data.username === korisnik.username) {
        korisnik.balans = data.noviBalans;
        localStorage.setItem('user', JSON.stringify(korisnik));
        osveziUI();
    }
});

socket.on('lista-igraca', (igraci) => {
    const lista = document.getElementById('lista-igraca');
    if(!lista) return;
    lista.innerHTML = igraci.map(i => `
        <div class="player-item">
            <span class="status-dot"></span> ${i.username}
        </div>`).join('');
});