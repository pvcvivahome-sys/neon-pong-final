function pokreniIgru(id) {
    const glavni = document.getElementById('dashboard-sadrzaj');
    glavni.innerHTML = `<div id="game-container" style="width:100%;"></div>`;
    iksOksInit();
}

function iksOksInit() {
    const kontejner = document.getElementById('game-container');
    
    kontejner.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; font-family: 'Audiowide'; color: white;">
            <div style="margin-bottom: 30px; text-align: center;">
                <h2 style="color: #ffd700; letter-spacing: 10px; margin: 0;">IKS - OKS</h2>
                <div id="status-iksoks" style="margin-top: 15px; color: #ff4d4d; font-size: 18px; letter-spacing: 2px;">NA POTEZU: X</div>
            </div>

            <div id="xo-board" style="display: grid; grid-template-columns: repeat(3, 120px); grid-template-rows: repeat(3, 120px); gap: 15px;">
                ${Array(9).fill().map((_, i) => `
                    <div id="cell-${i}" onclick="odigrajPotez(${i})" style="width: 120px; height: 120px; background: rgba(255,255,255,0.03); border: 2px solid #333; border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 50px; cursor: pointer; transition: 0.3s; box-shadow: inset 0 0 15px rgba(0,0,0,0.5);"></div>
                `).join('')}
            </div>

            <button onclick="location.reload()" class="btn-glass" style="margin-top: 40px; padding: 10px 40px !important;">IZLAZ</button>
        </div>
    `;

    // Logika igre
    let board = Array(9).fill(null);
    let currentPlayer = 'X'; // X je Crveni, O je Plavi
    let gameActive = true;

    window.odigrajPotez = function(index) {
        if (!gameActive || board[index]) return;

        board[index] = currentPlayer;
        const cell = document.getElementById(`cell-${index}`);
        
        // Stilovi za X i O
        cell.innerText = currentPlayer;
        if (currentPlayer === 'X') {
            cell.style.color = '#ff4d4d';
            cell.style.borderColor = '#ff4d4d';
            cell.style.textShadow = '0 0 20px #ff4d4d';
            currentPlayer = 'O';
            document.getElementById('status-iksoks').innerText = "NA POTEZU: O";
            document.getElementById('status-iksoks').style.color = '#00d7ff';
        } else {
            cell.style.color = '#00d7ff';
            cell.style.borderColor = '#00d7ff';
            cell.style.textShadow = '0 0 20px #00d7ff';
            currentPlayer = 'X';
            document.getElementById('status-iksoks').innerText = "NA POTEZU: X";
            document.getElementById('status-iksoks').style.color = '#ff4d4d';
        }

        proveriRezultat();
    };

    function proveriRezultat() {
        const winPatterns = [
            [0,1,2], [3,4,5], [6,7,8], // Redovi
            [0,3,6], [1,4,7], [2,5,8], // Kolone
            [0,4,8], [2,4,6]           // Dijagonale
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                gameActive = false;
                const pobednik = board[a];
                document.getElementById('status-iksoks').innerText = `POBEDNIK: ${pobednik}!`;
                document.getElementById('status-iksoks').style.fontSize = '30px';
                highlightWinningCells(pattern);
                return;
            }
        }

        if (!board.includes(null)) {
            document.getElementById('status-iksoks').innerText = "NEREŠENO!";
            gameActive = false;
        }
    }

    function highlightWinningCells(pattern) {
        pattern.forEach(i => {
            const cell = document.getElementById(`cell-${i}`);
            cell.style.background = 'rgba(255,215,0,0.1)';
            cell.style.boxShadow = '0 0 30px rgba(255,215,0,0.3)';
        });
    }
}

iksOksInit();