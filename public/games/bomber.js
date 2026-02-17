function pokreniIgru(id) {
    const glavni = document.getElementById('dashboard-sadrzaj');
    glavni.innerHTML = `<div id="game-container" style="width:100%;"></div>`;
    bomberInit();
}

function bomberInit() {
    const kontejner = document.getElementById('game-container');
    
    kontejner.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 85vh; font-family: 'Audiowide'; color: white;">
            <div style="margin-bottom: 10px; display: flex; gap: 40px; align-items: center;">
                <div style="color: #ff4d4d;">P1: [WASD] + [SPACE]</div>
                <h2 style="color: #ffd700; letter-spacing: 5px;">BOMBER MAN</h2>
                <div style="color: #00d7ff;">P2: [STRELICE] + [ENTER]</div>
            </div>

            <canvas id="bomberCanvas" width="550" height="550" style="border: 5px solid #333; box-shadow: 0 0 20px rgba(0,0,0,0.5); background: #111;"></canvas>

            <button onclick="location.reload()" class="btn-glass" style="margin-top: 20px; padding: 10px 40px !important;">IZLAZ</button>
        </div>
    `;

    const canvas = document.getElementById('bomberCanvas');
    const ctx = canvas.getContext('2d');

    const TILE_SIZE = 50;
    const ROWS = 11;
    const COLS = 11;

    // Mapa: 0 = prazno, 1 = zid (neuništiv), 2 = kutija (uništiva)
    let grid = [];
    for (let r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < COLS; c++) {
            if (r % 2 === 1 && c % 2 === 1) grid[r][c] = 1; // Fiksni zidovi
            else if ((r < 2 && c < 2) || (r > ROWS-3 && c > COLS-3)) grid[r][c] = 0; // Sigurne zone za start
            else grid[r][c] = Math.random() < 0.7 ? 2 : 0; // Nasumične kutije
        }
    }

    const p1 = { x: 0, y: 0, color: '#ff4d4d', bombs: [], alive: true };
    const p2 = { x: 10, y: 10, color: '#00d7ff', bombs: [], alive: true };

    const keys = {};
    window.onkeydown = (e) => keys[e.code] = true;
    window.onkeyup = (e) => keys[e.code] = false;

    function canMove(r, c) {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
        return grid[r][c] === 0;
    }

    function placeBomb(p) {
        if (p.bombs.length > 0) return; // Limit: jedna bomba po igraču
        const bx = p.x, by = p.y;
        const bomb = { r: by, c: bx, timer: 2000 };
        p.bombs.push(bomb);

        setTimeout(() => explode(bomb, p), bomb.timer);
    }

    function explode(bomb, p) {
        const directions = [[0,0], [0,1], [0,-1], [1,0], [-1,0]];
        const explosionTiles = [];

        directions.forEach(d => {
            const nr = bomb.r + d[0];
            const nc = bomb.c + d[1];
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                if (grid[nr][nc] === 2) grid[nr][nc] = 0; // Ruši kutiju
                if (grid[nr][nc] !== 1) {
                    explosionTiles.push({ r: nr, c: nc });
                    // Provera da li je igrač u eksploziji
                    if (p1.x === nc && p1.y === nr) p1.alive = false;
                    if (p2.x === nc && p2.y === nr) p2.alive = false;
                }
            }
        });

        p.bombs = [];
        // Vizuelni efekat eksplozije (privremeno)
        drawExplosion(explosionTiles);
    }

    function drawExplosion(tiles) {
        tiles.forEach(t => {
            ctx.fillStyle = "white";
            ctx.shadowBlur = 20; ctx.shadowColor = "orange";
            ctx.fillRect(t.c * TILE_SIZE, t.r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        });
    }

    let moveCooldown = 0;
    function update() {
        if (!p1.alive || !p2.alive) return;

        if (moveCooldown > 0) moveCooldown--;
        else {
            let moved = false;
            // P1 kontrole
            if (keys['KeyW'] && canMove(p1.y - 1, p1.x)) { p1.y--; moved = true; }
            else if (keys['KeyS'] && canMove(p1.y + 1, p1.x)) { p1.y++; moved = true; }
            else if (keys['KeyA'] && canMove(p1.y, p1.x - 1)) { p1.x--; moved = true; }
            else if (keys['KeyD'] && canMove(p1.y, p1.x + 1)) { p1.x++; moved = true; }
            
            // P2 kontrole
            if (keys['ArrowUp'] && canMove(p2.y - 1, p2.x)) { p2.y--; moved = true; }
            else if (keys['ArrowDown'] && canMove(p2.y + 1, p2.x)) { p2.y++; moved = true; }
            else if (keys['ArrowLeft'] && canMove(p2.y, p2.x - 1)) { p2.x--; moved = true; }
            else if (keys['ArrowRight'] && canMove(p2.y, p2.x + 1)) { p2.x++; moved = true; }

            if (moved) moveCooldown = 10;
        }

        if (keys['Space']) placeBomb(p1);
        if (keys['Enter']) placeBomb(p2);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (grid[r][c] === 1) { // Zid
                    ctx.fillStyle = '#333';
                    ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    ctx.strokeStyle = '#555'; ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                } else if (grid[r][c] === 2) { // Kutija
                    ctx.fillStyle = '#443300';
                    ctx.fillRect(c * TILE_SIZE + 5, r * TILE_SIZE + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                }
            }
        }

        // Bombe
        [p1, p2].forEach(p => {
            p.bombs.forEach(b => {
                ctx.fillStyle = '#fff';
                ctx.shadowBlur = 15; ctx.shadowColor = 'white';
                ctx.beginPath();
                ctx.arc(b.c * TILE_SIZE + TILE_SIZE/2, b.r * TILE_SIZE + TILE_SIZE/2, 15, 0, Math.PI*2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });
        });

        // Igrači
        if (p1.alive) {
            ctx.fillStyle = p1.color; ctx.shadowBlur = 15; ctx.shadowColor = p1.color;
            ctx.fillRect(p1.x * TILE_SIZE + 10, p1.y * TILE_SIZE + 10, 30, 30);
        }
        if (p2.alive) {
            ctx.fillStyle = p2.color; ctx.shadowBlur = 15; ctx.shadowColor = p2.color;
            ctx.fillRect(p2.x * TILE_SIZE + 10, p2.y * TILE_SIZE + 10, 30, 30);
        }

        if (!p1.alive || !p2.alive) {
            ctx.fillStyle = "white";
            ctx.font = "30px Audiowide";
            ctx.fillText("GAME OVER!", 180, 270);
            ctx.font = "15px Audiowide";
            ctx.fillText(p1.alive ? "P1 POBEĐUJE!" : "P2 POBEĐUJE!", 210, 300);
        }
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }
    loop();
}

bomberInit();