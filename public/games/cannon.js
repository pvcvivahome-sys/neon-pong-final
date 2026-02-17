function pokreniCannon() {
    const glavni = document.getElementById('dashboard-sadrzaj') || document.getElementById('glavni-ekran');
    
    glavni.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 85vh; font-family: 'Audiowide';">
            <h2 style="color: #ff4d4d; letter-spacing: 5px; margin-bottom: 10px;">CANNON DUEL</h2>
            <div style="color: #ffd700; font-size: 12px; margin-bottom: 10px;">IGRAČ 1 (A-D, W-Pucaj) | IGRAČ 2 (Strelice, ENTER-Pucaj)</div>
            <canvas id="cannonCanvas" width="1000" height="500" style="border: 2px solid #ff4d4d; background: #000; box-shadow: 0 0 20px rgba(255, 77, 77, 0.2);"></canvas>
            <button onclick="location.reload()" class="btn-glass" style="margin-top: 20px; padding: 10px 40px !important;">IZLAZ</button>
        </div>
    `;

    const canvas = document.getElementById('cannonCanvas');
    const ctx = canvas.getContext('2d');

    // KONFIGURACIJA
    const gravity = 0.2;
    let particles = [];

    let p1 = { x: 100, y: 450, angle: -45, power: 10, score: 0, color: '#ff4d4d', lastShot: 0 };
    let p2 = { x: 900, y: 450, angle: -135, power: 10, score: 0, color: '#00d7ff', lastShot: 0 };
    let projectiles = [];

    // KONTROLE
    const keys = {};
    window.onkeydown = (e) => keys[e.code] = true;
    window.onkeyup = (e) => keys[e.code] = false;

    function fire(player) {
        const now = Date.now();
        if (now - player.lastShot < 1000) return; // Cooldown 1 sekunda
        
        player.lastShot = now;
        const rad = player.angle * Math.PI / 180;
        projectiles.push({
            x: player.x + Math.cos(rad) * 40,
            y: player.y + Math.sin(rad) * 40,
            vx: Math.cos(rad) * player.power,
            vy: Math.sin(rad) * player.power,
            color: player.color
        });
    }

    function createExplosion(x, y, color) {
        for(let i=0; i<15; i++) {
            particles.push({
                x, y, 
                vx: (Math.random()-0.5)*10, 
                vy: (Math.random()-0.5)*10, 
                life: 1, 
                color
            });
        }
    }

    function update() {
        // Player 1 kontrole
        if (keys['KeyA']) p1.angle -= 2;
        if (keys['KeyD']) p1.angle += 2;
        if (keys['KeyW']) fire(p1);

        // Player 2 kontrole
        if (keys['ArrowLeft']) p2.angle -= 2;
        if (keys['ArrowRight']) p2.angle += 2;
        if (keys['Enter']) fire(p2);

        // Fizika projektila
        projectiles.forEach((p, index) => {
            p.vx *= 0.99; // vazdušni otpor
            p.vy += gravity;
            p.x += p.vx;
            p.y += p.vy;

            // Sudar sa Player 1
            if (Math.hypot(p.x - p1.x, p.y - p1.y) < 30 && p.color !== p1.color) {
                p2.score++;
                createExplosion(p1.x, p1.y, p1.color);
                projectiles.splice(index, 1);
            }
            // Sudar sa Player 2
            else if (Math.hypot(p.x - p2.x, p.y - p2.y) < 30 && p.color !== p2.color) {
                p1.score++;
                createExplosion(p2.x, p2.y, p2.color);
                projectiles.splice(index, 1);
            }
            // Van ekrana
            else if (p.y > canvas.height || p.x < 0 || p.x > canvas.width) {
                projectiles.splice(index, 1);
            }
        });

        // Čestice
        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.02;
            if(p.life <= 0) particles.splice(i, 1);
        });
    }

    function draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Teren (Suptilna linija)
        ctx.strokeStyle = '#333';
        ctx.beginPath(); ctx.moveTo(0, 480); ctx.lineTo(1000, 480); ctx.stroke();

        // Crtanje igrača
        [p1, p2].forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle * Math.PI / 180);
            
            // Cev topa
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 15; ctx.shadowColor = p.color;
            ctx.fillRect(0, -5, 40, 10);
            
            // Telo topa
            ctx.restore();
            ctx.beginPath();
            ctx.arc(p.x, p.y, 20, 0, Math.PI*2);
            ctx.fill();
        });

        // Projektili
        projectiles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2); ctx.fill();
        });

        // Čestice
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 3, 3);
        });
        ctx.globalAlpha = 1;

        // Scoreboard
        ctx.fillStyle = '#fff';
        ctx.font = '20px Audiowide';
        ctx.fillText(`P1: ${p1.score}`, 50, 50);
        ctx.fillText(`P2: ${p2.score}`, 880, 50);
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

    loop();
}

pokreniCannon();