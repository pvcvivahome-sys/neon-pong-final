function pokreniIgru(id) {
    const glavni = document.getElementById('dashboard-sadrzaj');
    glavni.innerHTML = `<div id="game-container" style="width:100%;"></div>`;
    millsInit();
}

function millsInit() {
    const kontejner = document.getElementById('game-container');
    
    kontejner.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 85vh; font-family: 'Audiowide'; color: white;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #ffd700; letter-spacing: 5px; margin: 0;">MILLS GAME (MLIN)</h2>
                <div id="status-mills" style="margin-top: 10px; color: #ff4d4d;">IGRAČ 1: POSTAVITE FIGURU</div>
                <div style="font-size: 10px; color: #666; margin-top: 5px;">P1: 🔴 | P2: 🔵</div>
            </div>

            <div id="mills-board" style="position: relative; width: 450px; height: 450px; background: rgba(255,255,255,0.02); border: 2px solid #333; border-radius: 10px;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 4px solid #444; margin: 20px;"></div>
                <div style="position: absolute; top: 75px; left: 75px; right: 75px; bottom: 75px; border: 4px solid #444;"></div>
                <div style="position: absolute; top: 150px; left: 150px; right: 150px; bottom: 150px; border: 4px solid #444;"></div>
                
                <div style="position: absolute; top: 20px; bottom: 20px; left: 50%; width: 4px; background: #444; transform: translateX(-50%); z-index: 0; height: 130px;"></div>
                <div style="position: absolute; bottom: 20px; left: 50%; width: 4px; background: #444; transform: translateX(-50%); z-index: 0; height: 130px;"></div>
                <div style="position: absolute; left: 20px; right: 20px; top: 50%; height: 4px; background: #444; transform: translateY(-50%); z-index: 0; width: 130px;"></div>
                <div style="position: absolute; right: 20px; top: 50%; height: 4px; background: #444; transform: translateY(-50%); z-index: 0; width: 130px;"></div>

                <div id="mills-points-container"></div>
            </div>

            <button onclick="location.reload()" class="btn-glass" style="margin-top: 30px; padding: 10px 40px !important;">IZLAZ</button>
        </div>
    `;

    const pointsPositions = [
        { r: 0, c: 0, x: 20, y: 20 }, { r: 0, c: 3, x: 225, y: 20 }, { r: 0, c: 6, x: 430, y: 20 },
        { r: 1, c: 1, x: 75, y: 75 }, { r: 1, c: 3, x: 225, y: 75 }, { r: 1, c: 5, x: 375, y: 75 },
        { r: 2, c: 2, x: 150, y: 150 }, { r: 2, c: 3, x: 225, y: 150 }, { r: 2, c: 4, x: 300, y: 150 },
        { r: 3, c: 0, x: 20, y: 225 }, { r: 3, c: 1, x: 75, y: 225 }, { r: 3, c: 2, x: 150, y: 225 },
        { r: 3, c: 4, x: 300, y: 225 }, { r: 3, c: 5, x: 375, y: 225 }, { r: 3, c: 6, x: 430, y: 225 },
        { r: 4, c: 2, x: 150, y: 300 }, { r: 4, c: 3, x: 225, y: 300 }, { r: 4, c: 4, x: 300, y: 300 },
        { r: 5, c: 1, x: 75, y: 375 }, { r: 5, c: 3, x: 225, y: 375 }, { r: 5, c: 5, x: 375, y: 375 },
        { r: 6, c: 0, x: 20, y: 430 }, { r: 6, c: 3, x: 225, y: 430 }, { r: 6, c: 6, x: 430, y: 430 }
    ];

    let state = {
        board: Array(24).fill(null),
        phase: 'placing', // 'placing', 'moving', 'removing'
        turn: 1,
        p1Left: 9,
        p2Left: 9,
        p1OnBoard: 0,
        p2OnBoard: 0,
        selected: null
    };

    const container = document.getElementById('mills-points-container');
    const status = document.getElementById('status-mills');

    function checkMill(pos, player) {
        const mills = [
            [0,1,2], [3,4,5], [6,7,8], [9,10,11], [12,13,14], [15,16,17], [18,19,20], [21,22,23], // Horiz
            [0,9,21], [3,10,18], [6,11,15], [1,4,7], [16,19,22], [8,12,17], [5,13,20], [2,14,23] // Vert
        ];
        return mills.some(m => m.includes(pos) && m.every(p => state.board[p] === player));
    }

    window.handleClick = function(i) {
        if (state.phase === 'placing') {
            if (state.board[i]) return;
            state.board[i] = state.turn;
            if (state.turn === 1) { state.p1Left--; state.p1OnBoard++; } 
            else { state.p2Left--; state.p2OnBoard++; }

            if (checkMill(i, state.turn)) {
                state.phase = 'removing';
                status.innerText = `MLIN! IGRAČ ${state.turn} UKLANJA FIGURU`;
            } else {
                nextTurn();
            }
        } else if (state.phase === 'removing') {
            if (state.board[i] && state.board[i] !== state.turn) {
                state.board[i] = null;
                if (state.turn === 1) state.p2OnBoard--; else state.p1OnBoard--;
                state.phase = (state.p1Left > 0 || state.p2Left > 0) ? 'placing' : 'moving';
                nextTurn();
            }
        }
        render();
    };

    function nextTurn() {
        state.turn = state.turn === 1 ? 2 : 1;
        if (state.p1Left === 0 && state.p2Left === 0) state.phase = 'moving';
        status.innerText = `IGRAČ ${state.turn} JE NA POTEZU`;
        status.style.color = state.turn === 1 ? '#ff4d4d' : '#00d7ff';
    }

    function render() {
        container.innerHTML = '';
        pointsPositions.forEach((p, i) => {
            const dot = document.createElement('div');
            dot.style.cssText = `
                position: absolute; left: ${p.x}px; top: ${p.y}px;
                width: 24px; height: 24px; border-radius: 50%;
                background: ${state.board[i] === 1 ? '#ff4d4d' : state.board[i] === 2 ? '#00d7ff' : '#222'};
                border: 2px solid #555; transform: translate(-50%, -50%);
                cursor: pointer; z-index: 10; transition: 0.2s;
                box-shadow: ${state.board[i] ? '0 0 15px currentColor' : 'none'};
            `;
            dot.onclick = () => handleClick(i);
            container.appendChild(dot);
        });
    }

    render();
}

millsInit();