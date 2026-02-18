function pokreniIgru(id) {
    const glavni = document.getElementById('dashboard-sadrzaj');
    glavni.innerHTML = `<div id="game-container" style="width:100%;"></div>`;
    checkersInit();
}

function checkersInit() {
    const kontejner = document.getElementById('game-container');
    
    kontejner.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 85vh; font-family: 'Audiowide'; color: white;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #ffd700; letter-spacing: 5px; margin: 0;">CHECKERS (DAME)</h2>
                <div id="status-checkers" style="margin-top: 10px; color: #ff4d4d;">NA POTEZU: IGRAČ 1 (CRVENI)</div>
            </div>

            <div id="checkers-board" style="display: grid; grid-template-columns: repeat(8, 60px); grid-template-rows: repeat(8, 60px); border: 5px solid #333; box-shadow: 0 0 30px rgba(0,0,0,0.5);">
            </div>

            <button onclick="location.reload()" class="btn-glass" style="margin-top: 30px; padding: 10px 40px !important;">IZLAZ</button>
        </div>
    `;

    const boardDiv = document.getElementById('checkers-board');
    const statusText = document.getElementById('status-checkers');
    
    let board = [];
    let turn = 1; // 1 = Crveni, 2 = Plavi
    let selected = null;

    function initBoard() {
        for (let r = 0; r < 8; r++) {
            board[r] = [];
            for (let c = 0; c < 8; c++) {
                let piece = null;
                if ((r + c) % 2 !== 0) {
                    if (r < 3) piece = { player: 2, king: false };
                    else if (r > 4) piece = { player: 1, king: false };
                }
                board[r][c] = piece;
            }
        }
    }

    function render() {
        boardDiv.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.style.width = '60px';
                cell.style.height = '60px';
                cell.style.background = (r + c) % 2 === 0 ? '#1a1a1a' : '#0a0a0c';
                cell.style.display = 'flex';
                cell.style.alignItems = 'center';
                cell.style.justifyContent = 'center';
                cell.style.position = 'relative';

                if (selected && selected.r === r && selected.c === c) {
                    cell.style.background = 'rgba(255, 215, 0, 0.2)';
                }

                const p = board[r][c];
                if (p) {
                    const piece = document.createElement('div');
                    piece.style.width = '45px';
                    piece.style.height = '45px';
                    piece.style.borderRadius = '50%';
                    piece.style.background = p.player === 1 ? '#ff4d4d' : '#00d7ff';
                    piece.style.boxShadow = `0 0 15px ${p.player === 1 ? '#ff4d4d' : '#00d7ff'}88`;
                    piece.style.cursor = 'pointer';
                    piece.style.border = '2px solid rgba(255,255,255,0.2)';
                    
                    if (p.king) {
                        piece.innerHTML = '<span style="color: gold; font-size: 20px;">👑</span>';
                        piece.style.display = 'flex';
                        piece.style.alignItems = 'center';
                        piece.style.justifyContent = 'center';
                    }
                    cell.appendChild(piece);
                }

                cell.onclick = () => handleCellClick(r, c);
                boardDiv.appendChild(cell);
            }
        }
    }

    function handleCellClick(r, c) {
        const clickedPiece = board[r][c];

        if (selected) {
            if (movePiece(selected.r, selected.c, r, c)) {
                selected = null;
                turn = turn === 1 ? 2 : 1;
                statusText.innerText = `NA POTEZU: IGRAČ ${turn} (${turn === 1 ? 'CRVENI' : 'PLAVI'})`;
                statusText.style.color = turn === 1 ? '#ff4d4d' : '#00d7ff';
            } else {
                selected = (clickedPiece && clickedPiece.player === turn) ? {r, c} : null;
            }
        } else {
            if (clickedPiece && clickedPiece.player === turn) {
                selected = { r, c };
            }
        }
        render();
    }

    function movePiece(fromR, fromC, toR, toC) {
        if (board[toR][toC] !== null) return false;
        
        const piece = board[fromR][fromC];
        const rowDiff = toR - fromR;
        const colDiff = Math.abs(toC - fromC);
        const direction = piece.player === 1 ? -1 : 1;

        // Regularno pomeranje
        if (colDiff === 1 && (piece.king ? Math.abs(rowDiff) === 1 : rowDiff === direction)) {
            board[toR][toC] = piece;
            board[fromR][fromC] = null;
            checkKing(toR, toC);
            return true;
        }

        // Preskakanje (uzimanje figure)
        if (colDiff === 2 && (piece.king ? Math.abs(rowDiff) === 2 : rowDiff === direction * 2)) {
            const midR = fromR + rowDiff / 2;
            const midC = fromC + (toC - fromC) / 2;
            const midPiece = board[midR][midC];

            if (midPiece && midPiece.player !== piece.player) {
                board[toR][toC] = piece;
                board[fromR][fromC] = null;
                board[midR][midC] = null;
                checkKing(toR, toC);
                return true;
            }
        }

        return false;
    }

    function checkKing(r, c) {
        const piece = board[r][c];
        if (piece.player === 1 && r === 0) piece.king = true;
        if (piece.player === 2 && r === 7) piece.king = true;
    }

    initBoard();
    render();
}

checkersInit();