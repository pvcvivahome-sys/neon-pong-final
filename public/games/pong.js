function pokreniPong() {
    const glavni = document.getElementById('dashboard-sadrzaj');
    
    glavni.style.display = "flex";
    glavni.style.justifyContent = "center";
    glavni.style.alignItems = "center";

    const roomID = window.currentRoomID || "PONG_TEST";
    const ulog = window.currentUlog || 50;
    const limitPoena = window.currentLimit || 5;

    glavni.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
            
            <div id="pong-header" style="width: 1000px; display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; font-family: 'Audiowide'; color: #fff;">
                <div style="text-align: left; min-width: 150px;">
                    <div style="font-size: 10px; opacity: 0.5; letter-spacing: 2px;">PLAYER 1</div>
                    <div id="p1-score" style="font-size: 40px; color: #ffd700; text-shadow: 0 0 20px rgba(255,215,0,0.5);">0</div>
                </div>
                
                <div id="invite-container" style="text-align: center; padding-bottom: 10px;">
                    <div style="font-size: 9px; color: #ffd700; letter-spacing: 2px; margin-bottom: 5px;">KLIKNI DA KOPIRAŠ KOD:</div>
                    <div id="room-id-display" onclick="copyRoomCode()" style="font-size: 18px; cursor: pointer; opacity: 0.8; letter-spacing: 2px; color: #fff; border: 1px dashed #ffd700; padding: 5px 20px; border-radius: 10px; margin-bottom: 5px;">
                        ${roomID}
                    </div>
                    <div style="font-size: 10px; color: rgba(255,255,255,0.4);">ULOG: <span style="color: #ffd700;">${ulog}</span> | CILJ: <span style="color: #ffd700;">${limitPoena}</span></div>
                </div>

                <div style="text-align: right; min-width: 150px;">
                    <div style="font-size: 10px; opacity: 0.5; letter-spacing: 2px;">PLAYER 2</div>
                    <div id="p2-score" style="font-size: 40px; color: #ffd700; text-shadow: 0 0 20px rgba(255,215,0,0.5);">0</div>
                </div>
            </div>
            
            <div style="position: relative; border: 4px solid #1a1a1a; border-radius: 15px; overflow: hidden; box-shadow: 0 0 100px rgba(0,0,0,0.5);">
                <canvas id="pongCanvas" width="1000" height="600" style="background: #000; display: block;"></canvas>
                
                <div id="status-overlay" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 10; width: 100%;">
                    <div id="countdown-text" style="font-size: 120px; color: #ffd700; font-family: 'Audiowide'; text-shadow: 0 0 30px #ffd700; display: none;"></div>
                    
                    <div id="ready-zone" style="background: rgba(0,0,0,0.9); padding: 40px; border-radius: 20px; border: 1px solid #ffd700; display: inline-block; min-width: 300px;">
                        <h3 id="waiting-text" style="color: #fff; font-family: 'Audiowide'; margin-bottom: 20px; letter-spacing: 2px;">ČEKANJE PROTIVNIKA...</h3>
                        <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 25px;">
                            <div id="p1-ready-indicator" style="padding: 10px 15px; border: 1px solid #444; color: #444; border-radius: 5px; font-size: 11px; font-family: 'Audiowide';">P1: NOT READY</div>
                            <div id="p2-ready-indicator" style="padding: 10px 15px; border: 1px solid #444; color: #444; border-radius: 5px; font-size: 11px; font-family: 'Audiowide';">P2: NOT READY</div>
                        </div>
                        <button id="ready-btn" onclick="postaviSpreman()" style="display: none; background: #ffd700; color: #000; border: none; padding: 18px 50px; font-family: 'Audiowide'; cursor: pointer; border-radius: 5px; font-weight: bold; letter-spacing: 2px; transition: 0.3s;">SPREMAN SAM!</button>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 25px;">
                <button onclick="location.reload()" class="btn-glass" style="border-color: #ff4d4d !important; color: #ff4d4d !important; padding: 10px 40px !important; font-size: 12px !important;">NAPUSTI STO</button>
            </div>
        </div>
    `;

    const canvas = document.getElementById('pongCanvas');
    const ctx = canvas.getContext('2d');
    
    let role = "spectator";
    let gameState = {
        ball: { x: 500, y: 300 },
        p1: { y: 250, score: 0 },
        p2: { y: 250, score: 0 },
        active: false
    };

    // Socket Emits
    socket.emit('join-room', { room: roomID, user: korisnik.username, ulog: ulog, limit: limitPoena, igraId: 'pong' });

    window.postaviSpreman = function() {
        socket.emit('player-ready', { room: roomID, role: role });
        document.getElementById('ready-btn').style.display = 'none';
        document.getElementById('waiting-text').innerText = "ČEKAMO PROTIVNIKA...";
    };

    window.copyRoomCode = function() {
        navigator.clipboard.writeText(roomID);
        const display = document.getElementById('room-id-display');
        const original = display.innerText;
        display.innerText = "KOPIRANO!";
        display.style.color = "#2ecc71";
        setTimeout(() => {
            display.innerText = original;
            display.style.color = "#fff";
        }, 1500);
    };

    // Socket Listeners
    socket.on('player-assignment', (assignedRole) => {
        role = assignedRole;
    });

    socket.on('game-update', (newState) => {
        gameState = newState;
        document.getElementById('p1-score').innerText = gameState.p1.score;
        document.getElementById('p2-score').innerText = gameState.p2.score;
        
        const overlay = document.getElementById('status-overlay');
        const readyBtn = document.getElementById('ready-btn');

        if(gameState.active) {
            overlay.style.display = 'none';
        } else {
            overlay.style.display = 'block';
            // Prikaži dugme samo ako su oba igrača tu i niko nije kliknuo
            if(role !== 'spectator' && gameState.p2.id) {
                if(document.getElementById('waiting-text').innerText !== "ČEKAMO PROTIVNIKA...") {
                    readyBtn.style.display = 'block';
                    document.getElementById('waiting-text').innerText = "OBA IGRAČA SU TU";
                }
            }
        }
    });

    socket.on('ready-update', (data) => {
        const p1Ind = document.getElementById('p1-ready-indicator');
        const p2Ind = document.getElementById('p2-ready-indicator');
        if(data.p1Ready) { p1Ind.style.color = "#2ecc71"; p1Ind.style.borderColor = "#2ecc71"; p1Ind.innerText = "P1: READY"; }
        if(data.p2Ready) { p2Ind.style.color = "#2ecc71"; p2Ind.style.borderColor = "#2ecc71"; p2Ind.innerText = "P2: READY"; }
    });

    socket.on('countdown', (num) => {
        document.getElementById('ready-zone').style.display = 'none';
        const cdText = document.getElementById('countdown-text');
        cdText.style.display = 'block';
        cdText.innerText = num === 0 ? "START!" : num;
        
        cdText.style.transform = "scale(1.5)";
        setTimeout(() => { cdText.style.transform = "scale(1)"; }, 150);
    });

    socket.on('game-over', (data) => {
        const overlay = document.getElementById('status-overlay');
        overlay.style.display = 'block';
        document.getElementById('ready-zone').style.display = 'inline-block';
        document.getElementById('ready-zone').innerHTML = `
            <div style="color: #fff; font-size: 14px; margin-bottom: 10px;">POBEDNIK:</div>
            <div style="color: #ffd700; font-size: 30px; margin-bottom: 15px; font-family: 'Audiowide';">${data.pobednik.toUpperCase()}</div>
            <div style="color: #2ecc71; font-size: 16px;">+ ${data.nagrada} 💰</div>
        `;
        setTimeout(() => { location.reload(); }, 5000);
    });

    // Kontrole i crtanje
    canvas.addEventListener('mousemove', (e) => {
        if (role === "spectator" || !gameState.active) return;
        let rect = canvas.getBoundingClientRect();
        let mouseY = e.clientY - rect.top - 60;
        socket.emit('paddle-move', { room: roomID, role: role, y: mouseY });
    });

    function draw() {
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Grid
        ctx.strokeStyle = "#111";
        ctx.lineWidth = 1;
        for(let i=0; i<canvas.width; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,600); ctx.stroke(); }
        for(let j=0; j<canvas.height; j+=50) { ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(1000,j); ctx.stroke(); }

        // Srednja linija
        ctx.strokeStyle = "rgba(255, 215, 0, 0.2)";
        ctx.setLineDash([20, 15]);
        ctx.beginPath(); ctx.moveTo(500, 0); ctx.lineTo(500, 600); ctx.stroke();
        ctx.setLineDash([]);

        // Reketi i loptica
        drawPaddle(20, gameState.p1.y, 15, 120, role === 'player1' ? "#ffd700" : "#ffffff");
        drawPaddle(canvas.width - 35, gameState.p2.y, 15, 120, role === 'player2' ? "#ffd700" : "#ffffff");
        
        ctx.shadowBlur = 25; ctx.shadowColor = "#ffd700";
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(gameState.ball.x, gameState.ball.y, 10, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        requestAnimationFrame(draw);
    }

    function drawPaddle(x, y, w, h, color) {
        ctx.shadowBlur = 20; ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill();
        ctx.shadowBlur = 0;
    }

    draw();
}

// Pokretanje
pokreniPong();