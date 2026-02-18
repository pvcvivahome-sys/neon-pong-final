function pokreniIgru(id) {
    const glavni = document.getElementById('dashboard-sadrzaj');
    glavni.innerHTML = `<div id="game-container" style="width:100%;"></div>`;
    bilijarInit();
}

function bilijarInit() {
    const kontejner = document.getElementById('game-container');
    
    kontejner.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 85vh; font-family: 'Audiowide'; color: white;">
            <div style="text-align: center; margin-bottom: 10px;">
                <h2 style="color: #ffd700; letter-spacing: 5px; margin: 0;">NEON BILLIARDS</h2>
                <div id="status-bilijar" style="margin-top: 5px; color: #ff4d4d;">IGRAČ 1: CILJAJTE MIŠEM I POVUCITE</div>
            </div>

            <canvas id="poolCanvas" width="800" height="400" style="border: 10px solid #333; border-radius: 20px; background: #051a05; cursor: crosshair; box-shadow: 0 0 30px rgba(0,0,0,0.5);"></canvas>

            <button onclick="location.reload()" class="btn-glass" style="margin-top: 20px; padding: 10px 40px !important;">IZLAZ</button>
        </div>
    `;

    const canvas = document.getElementById('poolCanvas');
    const ctx = canvas.getContext('2d');

    let balls = [];
    const ballRadius = 12;
    let isDragging = false;
    let mousePos = { x: 0, y: 0 };
    let turn = 1;

    // Inicijalizacija loptica
    function initBalls() {
        balls = [];
        // Bela loptica
        balls.push({ x: 200, y: 200, vx: 0, vy: 0, color: '#fff', type: 'cue' });
        
        // Formacija trougla (pojednostavljena za demo)
        const startX = 550;
        const startY = 200;
        let count = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j <= i; j++) {
                balls.push({
                    x: startX + i * (ballRadius * 2),
                    y: startY + (j - i / 2) * (ballRadius * 2.2),
                    vx: 0, vy: 0,
                    color: count % 2 === 0 ? '#ff4d4d' : '#00d7ff',
                    type: 'object'
                });
                count++;
            }
        }
    }

    canvas.onmousedown = (e) => {
        if (balls.every(b => Math.abs(b.vx) < 0.1 && Math.abs(b.vy) < 0.1)) {
            isDragging = true;
        }
    };

    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
    };

    canvas.onmouseup = () => {
        if (isDragging) {
            const cueBall = balls[0];
            const dx = cueBall.x - mousePos.x;
            const dy = cueBall.y - mousePos.y;
            cueBall.vx = dx * 0.15;
            cueBall.vy = dy * 0.15;
            isDragging = false;
            turn = turn === 1 ? 2 : 1;
            document.getElementById('status-bilijar').innerText = `IGRAČ ${turn}: ČEKAJTE DA SE LOPTICE ZAUSTAVE`;
            document.getElementById('status-bilijar').style.color = turn === 1 ? '#ff4d4d' : '#00d7ff';
        }
    };

    function update() {
        balls.forEach((b, i) => {
            b.x += b.vx;
            b.y += b.vy;
            b.vx *= 0.985; // Trenje
            b.vy *= 0.985;

            // Sudar sa ivicama
            if (b.x < ballRadius || b.x > canvas.width - ballRadius) { b.vx *= -0.8; b.x = b.x < ballRadius ? ballRadius : canvas.width - ballRadius; }
            if (b.y < ballRadius || b.y > canvas.height - ballRadius) { b.vy *= -0.8; b.y = b.y < ballRadius ? ballRadius : canvas.height - ballRadius; }

            // Sudari između loptica
            for (let j = i + 1; j < balls.length; j++) {
                const b2 = balls[j];
                const dx = b2.x - b.x;
                const dy = b2.y - b.y;
                const dist = Math.hypot(dx, dy);

                if (dist < ballRadius * 2) {
                    // Osnovna fizika elastičnog sudara
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);

                    // Rotacija brzina
                    const vx1 = b.vx * cos + b.vy * sin;
                    const vy1 = b.vy * cos - b.vx * sin;
                    const vx2 = b2.vx * cos + b2.vy * sin;
                    const vy2 = b2.vy * cos - b2.vx * sin;

                    // Razmena vodoravnih brzina
                    const finalVx1 = vx2;
                    const finalVx2 = vx1;

                    b.vx = finalVx1 * cos - vy1 * sin;
                    b.vy = vy1 * cos + finalVx1 * sin;
                    b2.vx = finalVx2 * cos - vy2 * sin;
                    b2.vy = vy2 * cos + finalVx2 * sin;

                    // Razdvajanje da se ne zalepe
                    const overlap = ballRadius * 2 - dist;
                    b.x -= (overlap / 2) * cos;
                    b.y -= (overlap / 2) * sin;
                    b2.x += (overlap / 2) * cos;
                    b2.y += (overlap / 2) * sin;
                }
            }
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Rupe (vizuelno)
        ctx.fillStyle = '#000';
        [ [0,0], [400,0], [800,0], [0,400], [400,400], [800,400] ].forEach(pos => {
            ctx.beginPath(); ctx.arc(pos[0], pos[1], 25, 0, Math.PI*2); ctx.fill();
        });

        // Linija za ciljanje
        if (isDragging) {
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.moveTo(balls[0].x, balls[0].y);
            ctx.lineTo(mousePos.x, mousePos.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Loptice
        balls.forEach(b => {
            ctx.fillStyle = b.color;
            ctx.shadowBlur = 10; ctx.shadowColor = b.color;
            ctx.beginPath(); ctx.arc(b.x, b.y, ballRadius, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
            // Sjaj na loptici
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath(); ctx.arc(b.x - 4, b.y - 4, 4, 0, Math.PI*2); ctx.fill();
        });
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    initBalls();
    loop();
}

bilijarInit();