function pokreniIgru(id) {
    const glavni = document.getElementById('dashboard-sadrzaj');
    glavni.innerHTML = `<div id="game-container" style="width:100%;"></div>`;
    headSoccerInit();
}

function headSoccerInit() {
    const kontejner = document.getElementById('game-container');
    
    kontejner.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 85vh; font-family: 'Audiowide'; color: white;">
            <div style="display: flex; justify-content: space-between; width: 800px; margin-bottom: 10px;">
                <div id="p1-score-soccer" style="color: #ff4d4d; font-size: 24px;">0</div>
                <h2 style="color: #ffd700; letter-spacing: 5px; margin: 0;">HEAD SOCCER</h2>
                <div id="p2-score-soccer" style="color: #00d7ff; font-size: 24px;">0</div>
            </div>
            
            <canvas id="soccerCanvas" width="800" height="400" style="border-bottom: 5px solid #333; background: #050505; box-shadow: 0 0 20px rgba(0,255,0,0.05);"></canvas>
            
            <div style="margin-top: 15px; display: flex; gap: 30px; font-size: 11px; color: #666;">
                <div>P1: [W] SKOK | [A][D] KRETANJE</div>
                <div>P2: [UP] SKOK | [LEVO][DESNO] KRETANJE</div>
            </div>
            
            <button onclick="location.reload()" class="btn-glass" style="margin-top: 20px; padding: 10px 40px !important;">IZLAZ</button>
        </div>
    `;

    const canvas = document.getElementById('soccerCanvas');
    const ctx = canvas.getContext('2d');

    // KONFIGURACIJA
    const gravity = 0.5;
    const groundY = 350;

    let ball = { x: 400, y: 200, vx: 0, vy: 0, radius: 12 };
    let p1 = { x: 150, y: groundY, vy: 0, score: 0, color: '#ff4d4d', radius: 25, isJumping: false };
    let p2 = { x: 650, y: groundY, vy: 0, score: 0, color: '#00d7ff', radius: 25, isJumping: false };

    const keys = {};
    window.onkeydown = (e) => keys[e.code] = true;
    window.onkeyup = (e) => keys[e.code] = false;

    function update() {
        // P1 kretanje
        if (keys['KeyA']) p1.x -= 5;
        if (keys['KeyD']) p1.x += 5;
        if (keys['KeyW'] && !p1.isJumping) { p1.vy = -12; p1.isJumping = true; }

        // P2 kretanje
        if (keys['ArrowLeft']) p2.x -= 5;
        if (keys['ArrowRight']) p2.x += 5;
        if (keys['ArrowUp'] && !p2.isJumping) { p2.vy = -12; p2.isJumping = true; }

        // Fizika igrača (gravitacija)
        [p1, p2].forEach(p => {
            p.y += p.vy;
            p.vy += gravity;
            if (p.y >= groundY) {
                p.y = groundY;
                p.vy = 0;
                p.isJumping = false;
            }
            // Ograničenje terena
            if (p.x < p.radius) p.x = p.radius;
            if (p.x > canvas.width - p.radius) p.x = canvas.width - p.radius;
        });

        // Fizika lopte
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vy += 0.3; // gravitacija lopte
        ball.vx *= 0.99; // trenje vazduha

        // Zidovi i tlo
        if (ball.y + ball.radius > groundY + 20) {
            ball.y = groundY + 20 - ball.radius;
            ball.vy *= -0.7;
        }
        if (ball.x < ball.radius || ball.x > canvas.width - ball.radius) {
            ball.vx *= -0.8;
            ball.x = ball.x < ball.radius ? ball.radius : canvas.width - ball.radius;
        }

        // Kolizija igrača i lopte
        [p1, p2].forEach(p => {
            let dx = ball.x - p.x;
            let dy = ball.y - p.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < ball.radius + p.radius) {
                // Odskok lopte od glave
                let angle = Math.atan2(dy, dx);
                let speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) + 5;
                ball.vx = Math.cos(angle) * speed;
                ball.vy = Math.sin(angle) * speed;
            }
        });

        // PROVERA GOLA
        if (ball.y > 250) { // Samo ako je lopta nisko
            if (ball.x <= 20) { // Gol za P2
                p2.score++;
                resetPositions();
            } else if (ball.x >= 780) { // Gol za P1
                p1.score++;
                resetPositions();
            }
        }
    }

    function resetPositions() {
        document.getElementById('p1-score-soccer').innerText = p1.score;
        document.getElementById('p2-score-soccer').innerText = p2.score;
        ball = { x: 400, y: 150, vx: 0, vy: 0, radius: 12 };
        p1.x = 150; p2.x = 650;
    }

    function draw() {
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Teren (trava vizuelno)
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, groundY + 20, 800, 1);

        // Golovi
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ff4d4d'; // Levi gol
        ctx.strokeRect(0, 250, 20, 100);
        ctx.strokeStyle = '#00d7ff'; // Desni gol
        ctx.strokeRect(780, 250, 20, 100);

        // Igrači
        [p1, p2].forEach(p => {
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            // Oči (da bi se znalo gde gledaju)
            ctx.fillStyle = 'white';
            ctx.beginPath();
            let eyeX = p === p1 ? p.x + 10 : p.x - 10;
            ctx.arc(eyeX, p.y - 5, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Lopta
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }
    loop();
}

headSoccerInit();