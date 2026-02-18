function pokreniLooptap() {
    const glavni = document.getElementById('dashboard-sadrzaj') || document.body;
    
    glavni.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 85vh; font-family: 'Audiowide'; color: white;">
            <h2 style="color: #ffd700; letter-spacing: 5px; margin-bottom: 5px;">LOOP TAP DUEL</h2>
            <p style="font-size: 10px; color: #aaa; margin-bottom: 20px;">Pritisni svoj taster kada loptica uđe u zonu!</p>
            
            <div style="display: flex; gap: 50px; align-items: center;">
                <div style="text-align: center;">
                    <div style="color: #ff4d4d; margin-bottom: 10px;">IGRAČ 1 (Taster: W)</div>
                    <canvas id="ltCanvas1" width="300" height="300" style="border-radius: 50%; box-shadow: 0 0 20px rgba(255, 77, 77, 0.2);"></canvas>
                    <div id="score1" style="font-size: 30px; margin-top: 10px; color: #ff4d4d;">0</div>
                </div>

                <div style="text-align: center;">
                    <div style="color: #00d7ff; margin-bottom: 10px;">IGRAČ 2 (Taster: UP ARROW)</div>
                    <canvas id="ltCanvas2" width="300" height="300" style="border-radius: 50%; box-shadow: 0 0 20px rgba(0, 215, 255, 0.2);"></canvas>
                    <div id="score2" style="font-size: 30px; margin-top: 10px; color: #00d7ff;">0</div>
                </div>
            </div>

            <button onclick="location.reload()" class="btn-glass" style="margin-top: 30px; padding: 10px 40px !important;">IZLAZ</button>
        </div>
    `;

    const setupPlayer = (canvasId, color, hitKey) => {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 120;
        
        let state = {
            ballAngle: 0,
            targetAngle: Math.random() * Math.PI * 2,
            targetWidth: 0.5,
            speed: 0.05,
            score: 0,
            gameOver: false
        };

        const update = () => {
            if (state.gameOver) return;
            state.ballAngle += state.speed;
            if (state.ballAngle > Math.PI * 2) state.ballAngle -= Math.PI * 2;
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Glavni krug (staza)
            ctx.strokeStyle = "#222";
            ctx.lineWidth = 15;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Meta (Zona za udarac)
            ctx.strokeStyle = color;
            ctx.lineWidth = 15;
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, state.targetAngle, state.targetAngle + state.targetWidth);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Loptica koja se okreće
            const bx = centerX + Math.cos(state.ballAngle) * radius;
            const by = centerY + Math.sin(state.ballAngle) * radius;
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(bx, by, 8, 0, Math.PI * 2);
            ctx.fill();
        };

        const checkHit = () => {
            if (state.gameOver) return;

            // Normalizacija uglova za proveru sudara
            let ball = state.ballAngle % (Math.PI * 2);
            let targetStart = state.targetAngle % (Math.PI * 2);
            let targetEnd = (state.targetAngle + state.targetWidth) % (Math.PI * 2);

            let isHit = false;
            if (targetStart < targetEnd) {
                isHit = ball >= targetStart && ball <= targetEnd;
            } else {
                isHit = ball >= targetStart || ball <= targetEnd;
            }

            if (isHit) {
                state.score++;
                state.speed += 0.005; // Povećaj brzinu
                state.targetAngle = Math.random() * Math.PI * 2; // Pomeri metu
                state.targetWidth = Math.max(0.2, state.targetWidth - 0.01); // Smanji metu
            } else {
                state.gameOver = true;
                ctx.fillStyle = "rgba(255,0,0,0.5)";
                ctx.fillRect(0,0, canvas.width, canvas.height);
            }
            return state.score;
        };

        return { update, draw, checkHit, hitKey, state };
    };

    const p1 = setupPlayer('ltCanvas1', '#ff4d4d', 'KeyW');
    const p2 = setupPlayer('ltCanvas2', '#00d7ff', 'ArrowUp');

    window.onkeydown = (e) => {
        if (e.code === p1.hitKey) {
            const s = p1.checkHit();
            if (s) document.getElementById('score1').innerText = s;
        }
        if (e.code === p2.hitKey) {
            const s = p2.checkHit();
            if (s) document.getElementById('score2').innerText = s;
        }
    };

    function gameLoop() {
        p1.update();
        p1.draw();
        p2.update();
        p2.draw();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
}

pokreniLooptap();