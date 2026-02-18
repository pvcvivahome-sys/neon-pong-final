function pokreniIgru(id) {
    const glavni = document.getElementById('dashboard-sadrzaj');
    glavni.innerHTML = `<div id="game-container" style="width:100%;"></div>`;
    quoridorInit();
}

function quoridorInit() {
    const kontejner = document.getElementById('game-container');
    
    kontejner.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 85vh; font-family: 'Audiowide'; color: white;">
            <div style="text-align: center; margin-bottom: 10px;">
                <h2 style="color: #ffd700; letter-spacing: 5px; margin: 0;">QUORIDOR</h2>
                <div id="status-quoridor" style="margin-top: 10px; color: #ff4d4d;">P1: POMERI SE ILI POSTAVI ZID (SHIFT + KLIK)</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">P1 zidovi: <span id="p1-walls">10</span> | P2 zidovi: <span id="p2-walls">10</span></div>
            </div>

            <div id="q-board" style="position: relative; display: grid; grid-template-columns: repeat(9, 45px); grid-template-rows: repeat(9, 45px); gap: 10px; background: #222; padding: 10px; border: 4px solid #444; border-radius: 10px;">
            </div>

            <button onclick="location.reload()" class="btn-glass" style="margin-top: 30px; padding: 10px 40px !important;">IZLAZ</button>
        </div>
    `;

    const boardDiv = document.getElementById('q-board');
    let p1 = { r: 8, c: 4, walls: 10, color: '#ff4d4d' };
    let p2 = { r: 0, c: 4, walls: 10, color: '#00d7ff' };
    let turn = 1;
    let walls = []; // Čuva pozicije zidova

    function render() {
        boardDiv.innerHTML = '';
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.style.cssText = `
                    width: 45px; height: 45px; background: #333; 
                    border-radius: 4px; cursor: pointer; display: flex;
                    align-items: center; justify-content: center; position: relative;
                `;

                // Crtanje igrača
                if (p1.r === r && p1.c === c) cell.innerHTML = `<div style="width:30px; height:30px; border-radius:50%; background:${p1.color}; box-shadow: 0 0 15px ${p1.color}"></div>`;
                if (p2.r === r && p2.c === c) cell.innerHTML = `<div style="width:30px; height:30px; border-radius:50%; background:${p2.color}; box-shadow: 0 0 15px ${p2.color}"></div>`;

                cell.onclick = (e) => handleAction(r, c, e.shiftKey);
                boardDiv.appendChild(cell);
            }
        }
        
        // Crtanje postavljenih zidova
        walls.forEach(w => {
            const wall = document.createElement('div');
            const isHoriz = w.type === 'h';
            wall.style.position = 'absolute';
            wall.style.background = '#ffd700';
            wall.style.boxShadow = '0 0 10px #ffd700';
            wall.style.zIndex = '10';

            if (isHoriz) {
                wall.style.width = '100px';
                wall.style.height = '6px';
                wall.style.left = (w.c * 55) + 'px';
                wall.style.top = (w.r * 55 + 49) + 'px';
            } else {
                wall.style.width = '6px';
                wall.style.height = '100px';
                wall.style.left = (w.c * 55 + 49) + 'px';
                wall.style.top = (w.r * 55) + 'px';
            }
            boardDiv.appendChild(wall);
        });
    }

    function handleAction(r, c, isWall) {
        let p = turn === 1 ? p1 : p2;

        if (isWall) {
            // Postavljanje zida (Shift + klik)
            if (p.walls > 0) {
                walls.push({ r, c, type: r < 8 ? 'h' : 'v' }); // Pojednostavljeno za demo
                p.walls--;
                nextTurn();
            }
        } else {
            // Pomeranje figure
            const dr = Math.abs(r - p.r);
            const dc = Math.abs(c - p.c);
            if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
                p.r = r;
                p.c = c;
                if ((turn === 1 && p.r === 0) || (turn === 2 && p.r === 8)) {
                    alert(`IGRAČ ${turn} JE POBEDIO!`);
                    location.reload();
                }
                nextTurn();
            }
        }
        render();
    }

    function nextTurn() {
        turn = turn === 1 ? 2 : 1;
        const st = document.getElementById('status-quoridor');
        st.innerText = `NA POTEZU: IGRAČ ${turn} (${turn === 1 ? 'CRVENI' : 'PLAVI'})`;
        st.style.color = turn === 1 ? '#ff4d4d' : '#00d7ff';
        document.getElementById('p1-walls').innerText = p1.walls;
        document.getElementById('p2-walls').innerText = p2.walls;
    }

    render();
}

quoridorInit();