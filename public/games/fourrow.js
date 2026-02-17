function pokreniIgru(id) {
    // Ova funkcija premošćuje tvoj glavni sistem ako se pozove direktno
    const glavni = document.getElementById('dashboard-sadrzaj');
    glavni.innerHTML = `<div id="game-container" style="width:100%;"></div>`;
    fourInRowInit();
}

function fourInRowInit() {
    const kontejner = document.getElementById('game-container');
    
    kontejner.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; font-family: 'Audiowide'; color: white;">
            <div style="margin-bottom: 20px; text-align: center;">
                <h2 style="color: #ffd700; letter-spacing: 5px; margin: 0;">4 IN A ROW</h2>
                <div id="status-poruka" style="margin-top: 10px; color: #00d7ff; font-size: 14px;">NA POTEZU: PLAVI</div>
            </div>

            <div id="f4-board" style="background: #111; padding: 15px; border-radius: 15px; border: 4px solid #333; box-shadow: 0 0 30px rgba(0,0,0,0.5); display: grid; grid-template-columns: repeat(7, 60px); gap: 10px; cursor: pointer;">
            </div>

            <button onclick="location.reload()" class="btn-glass" style="margin-top: 30px; padding: 10px 40px !important;">IZLAZ</button>
        </div>
    `;

    const boardDiv = document.getElementById('f4-board');
    const statusText = document.getElementById('status-poruka');
    
    const ROWS = 6;
    const COLS = 7;
    let currentPlayer = 1; // 1 = Plavi (#00d7ff), 2 = Zlatni (#ffd700)
    let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    let gameActive = true;

    // Kreiranje vizuelne table
    function kreirajTablu() {
        boardDiv.innerHTML = '';
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const polje = document.createElement('div');
                polje.id = `cell-${r}-${c}`;
                polje.style.width = '60px';
                polje.style.height = '60px';
                polje.style.borderRadius = '50%';
                polje.style.background = '#050505';
                polje.style.boxShadow = 'inset 0 0 10px rgba(0,0,0,0.8)';
                polje.style.border = '1px solid #222';
                polje.onclick = () => ubaciZeton(c);
                boardDiv.appendChild(polje);
            }
        }
    }

    function ubaciZeton(col) {
        if (!gameActive) return;

        // Pronađi najniže slobodno mesto u koloni
        for (let r = ROWS - 1; r >= 0; r--) {
            if (board[r][col] === 0) {
                board[r][col] = currentPlayer;
                azurirajPolje(r, col);
                
                if (proveriPobedu(r, col)) {
                    gameActive = false;
                    statusText.innerText = `POBEDA! IGRAČ ${currentPlayer === 1 ? 'PLAVI' : 'ZLATNI'} JE POBEDIO!`;
                    statusText.style.color = currentPlayer === 1 ? '#00d7ff' : '#ffd700';
                    return;
                }

                if (board.every(row => row.every(cell => cell !== 0))) {
                    statusText.innerText = "NEREREŠENO!";
                    gameActive = false;
                    return;
                }

                currentPlayer = currentPlayer === 1 ? 2 : 1;
                statusText.innerText = `NA POTEZU: ${currentPlayer === 1 ? 'PLAVI' : 'ZLATNI'}`;
                statusText.style.color = currentPlayer === 1 ? '#00d7ff' : '#ffd700';
                break;
            }
        }
    }

    function azurirajPolje(r, c) {
        const polje = document.getElementById(`cell-${r}-${c}`);
        const boja = currentPlayer === 1 ? '#00d7ff' : '#ffd700';
        polje.style.background = boja;
        polje.style.boxShadow = `0 0 20px ${boja}88, inset 0 0 10px rgba(0,0,0,0.5)`;
        polje.style.border = `1px solid ${boja}`;
    }

    function proveriPobedu(r, c) {
        const player = board[r][c];
        const smeri = [
            [0, 1],  // Horizontalno
            [1, 0],  // Vertikalno
            [1, 1],  // Dijagonalno desno
            [1, -1]  // Dijagonalno levo
        ];

        for (let [dr, dc] of smeri) {
            let count = 1;
            
            // Proveri u jednom smeru
            for (let i = 1; i < 4; i++) {
                let nr = r + dr * i, nc = c + dc * i;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) count++;
                else break;
            }
            // Proveri u suprotnom smeru
            for (let i = 1; i < 4; i++) {
                let nr = r - dr * i, nc = c - dc * i;
                if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === player) count++;
                else break;
            }

            if (count >= 4) return true;
        }
        return false;
    }

    kreirajTablu();
}

// Pozivanje inicijalizacije
fourInRowInit();