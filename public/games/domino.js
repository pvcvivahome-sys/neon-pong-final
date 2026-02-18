function pokreniDomino() {
    const glavni = document.getElementById('dashboard-sadrzaj') || document.body;
    
    glavni.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 85vh; font-family: 'Audiowide'; color: white; user-select: none;">
            <div style="display: flex; justify-content: space-between; width: 900px; margin-bottom: 20px;">
                <div id="p1-info" style="color: #ff4d4d;">P1: <span id="p1-count">7</span> pločica</div>
                <h2 style="color: #ffd700; letter-spacing: 5px; margin: 0;">DOMINO DUEL</h2>
                <div id="p2-info" style="color: #00d7ff;">P2: <span id="p2-count">7</span> pločica</div>
            </div>

            <div id="domino-board" style="width: 900px; height: 350px; background: rgba(255,255,255,0.03); border: 2px dashed rgba(255,215,0,0.2); border-radius: 20px; display: flex; align-items: center; justify-content: center; overflow-x: auto; padding: 20px; gap: 5px;">
                <div id="board-placeholder" style="color: rgba(255,255,255,0.1); font-size: 12px;">TABLA JE PRAZNA. IGRAC 1 POČINJE.</div>
            </div>

            <div id="current-player-hand" style="margin-top: 30px; display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <div id="turn-indicator" style="color: #ff4d4d; font-size: 14px; letter-spacing: 2px;">NA POTEZU: IGRAČ 1</div>
                <div id="hand-tiles" style="display: flex; gap: 10px; padding: 10px;"></div>
                <button id="draw-btn" class="btn-glass" style="padding: 5px 20px !important; font-size: 10px !important;">KUPI PLOČICU</button>
            </div>

            <button onclick="location.reload()" class="btn-glass" style="margin-top: 30px; padding: 10px 40px !important;">IZLAZ</button>
        </div>
    `;

    // LOGIKA IGRE
    let deck = [];
    let p1Hand = [];
    let p2Hand = [];
    let board = []; // Niz postavljenih domina
    let turn = 1; // 1 ili 2

    // Kreiranje špila (0-0 do 6-6)
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            deck.push([i, j]);
        }
    }
    deck.sort(() => Math.random() - 0.5);

    // Podela karata
    p1Hand = deck.splice(0, 7);
    p2Hand = deck.splice(0, 7);

    function createTileUI(sideA, sideB, isVertical = true, onClick = null) {
        const tile = document.createElement('div');
        tile.style.cssText = `
            width: ${isVertical ? '40px' : '80px'};
            height: ${isVertical ? '80px' : '40px'};
            background: #222;
            border: 2px solid #444;
            border-radius: 5px;
            display: flex;
            flex-direction: ${isVertical ? 'column' : 'row'};
            cursor: pointer;
            transition: 0.2s;
            flex-shrink: 0;
        `;
        
        const half1 = `<div style="flex:1; display:flex; align-items:center; justify-content:center; font-size:18px; color:#fff; border-${isVertical ? 'bottom' : 'right'}:1px solid #444;">${sideA}</div>`;
        const half2 = `<div style="flex:1; display:flex; align-items:center; justify-content:center; font-size:18px; color:#fff;">${sideB}</div>`;
        
        tile.innerHTML = half1 + half2;
        if (onClick) tile.onclick = onClick;
        
        tile.onmouseover = () => { tile.style.borderColor = '#ffd700'; tile.style.transform = 'translateY(-5px)'; };
        tile.onmouseout = () => { tile.style.borderColor = '#444'; tile.style.transform = 'translateY(0)'; };
        
        return tile;
    }

    function updateUI() {
        const handDiv = document.getElementById('hand-tiles');
        const boardDiv = document.getElementById('domino-board');
        const turnText = document.getElementById('turn-indicator');
        const currentHand = turn === 1 ? p1Hand : p2Hand;

        // Update info
        document.getElementById('p1-count').innerText = p1Hand.length;
        document.getElementById('p2-count').innerText = p2Hand.length;
        turnText.innerText = `NA POTEZU: IGRAČ ${turn}`;
        turnText.style.color = turn === 1 ? '#ff4d4d' : '#00d7ff';

        // Render hand
        handDiv.innerHTML = '';
        currentHand.forEach((tile, index) => {
            const tileUI = createTileUI(tile[0], tile[1], true, () => tryPlay(index));
            handDiv.appendChild(tileUI);
        });

        // Render board
        if (board.length > 0) {
            boardDiv.innerHTML = '';
            board.forEach(tile => {
                boardDiv.appendChild(createTileUI(tile[0], tile[1], false));
            });
        }
    }

    function tryPlay(index) {
        const hand = turn === 1 ? p1Hand : p2Hand;
        const tile = hand[index];

        if (board.length === 0) {
            board.push(tile);
            hand.splice(index, 1);
            endTurn();
        } else {
            const leftEnd = board[0][0];
            const rightEnd = board[board.length - 1][1];

            // Provera desne strane (jednostavna verzija: uvek dodajemo desno radi preglednosti)
            if (tile[0] === rightEnd) {
                board.push([tile[0], tile[1]]);
                hand.splice(index, 1);
                endTurn();
            } else if (tile[1] === rightEnd) {
                board.push([tile[1], tile[0]]);
                hand.splice(index, 1);
                endTurn();
            } 
            // Provera leve strane
            else if (tile[1] === leftEnd) {
                board.unshift([tile[0], tile[1]]);
                hand.splice(index, 1);
                endTurn();
            } else if (tile[0] === leftEnd) {
                board.unshift([tile[1], tile[0]]);
                hand.splice(index, 1);
                endTurn();
            } else {
                alert("Ova pločica ne može da se poveže!");
            }
        }
    }

    function endTurn() {
        if (p1Hand.length === 0 || p2Hand.length === 0) {
            alert(`IGRAČ ${turn} JE POBEDIO!`);
            location.reload();
            return;
        }
        turn = turn === 1 ? 2 : 1;
        updateUI();
    }

    document.getElementById('draw-btn').onclick = () => {
        if (deck.length > 0) {
            const newTile = deck.pop();
            if (turn === 1) p1Hand.push(newTile);
            else p2Hand.push(newTile);
            updateUI();
        } else {
            alert("Nema više pločica u špilu! Menjam potez.");
            turn = turn === 1 ? 2 : 1;
            updateUI();
        }
    };

    updateUI();
}

pokreniDomino();