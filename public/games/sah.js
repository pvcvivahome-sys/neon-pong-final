function pokreniSah() {
    console.log("Šah je pokrenut!");
    
    // Prilagođeno tvom dashboard-u (može biti dashboard-sadrzaj ili glavni-ekran)
    const glavni = document.getElementById('dashboard-sadrzaj') || document.getElementById('glavni-ekran');
    
    glavni.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; font-family: 'Audiowide';">
            <h2 style="color: #ffd700; letter-spacing: 5px; margin-bottom: 20px;">NEON CHESS</h2>
            
            <div id="sah-tabla" style="display: grid; grid-template-columns: repeat(8, 60px); grid-template-rows: repeat(8, 60px); border: 10px solid #222; box-shadow: 0 0 30px rgba(255,215,0,0.1);"></div>
            
            <div style="margin-top: 30px;">
                <button onclick="location.reload()" class="btn-glass" style="padding: 10px 40px !important; color: white; border: 1px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); cursor: pointer;">IZLAZ</button>
            </div>
        </div>
    `;

    inicijalizujTablu();
}

function inicijalizujTablu() {
    const tabla = document.getElementById('sah-tabla');
    const figureMape = {
        'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
        'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
    };

    const raspored = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['','','','','','','',''],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];

    tabla.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const polje = document.createElement('div');
            polje.style.width = '60px';
            polje.style.height = '60px';
            polje.style.display = 'flex';
            polje.style.alignItems = 'center';
            polje.style.justifyContent = 'center';
            polje.style.fontSize = '40px';
            polje.style.cursor = 'pointer';
            polje.style.transition = '0.2s';
            
            // Boje polja (Neon tamna varijanta)
            polje.style.backgroundColor = (r + c) % 2 === 0 ? '#333' : '#111';
            
            const oznakaFigure = raspored[r][c];
            if (oznakaFigure) {
                polje.innerText = figureMape[oznakaFigure];
                // Bele figure (velika slova) svetle zlatno, crne (mala) svetle belo/sivo
                if (oznakaFigure === oznakaFigure.toUpperCase()) {
                    polje.style.color = '#ffd700';
                    polje.style.textShadow = '0 0 10px rgba(255,215,0,0.5)';
                } else {
                    polje.style.color = '#ffffff';
                    polje.style.textShadow = '0 0 10px rgba(255,255,255,0.3)';
                }
            }

            polje.onclick = () => selektujPolje(polje);
            tabla.appendChild(polje);
        }
    }
}

let selektovanoPolje = null;
let originalnaBoja = "";

function selektujPolje(polje) {
    if (!selektovanoPolje) {
        // Prva selekcija: mora biti figura
        if (polje.innerText !== "") {
            selektovanoPolje = polje;
            originalnaBoja = polje.style.backgroundColor;
            polje.style.backgroundColor = "rgba(255, 215, 0, 0.3)"; // Highlight
            polje.style.outline = "2px solid #ffd700";
        }
    } else {
        // Pomeranje na novo polje
        if (polje !== selektovanoPolje) {
            polje.innerText = selektovanoPolje.innerText;
            polje.style.color = selektovanoPolje.style.color;
            polje.style.textShadow = selektovanoPolje.style.textShadow;
            selektovanoPolje.innerText = "";
        }
        
        // Resetuj selekciju
        selektovanoPolje.style.backgroundColor = originalnaBoja;
        selektovanoPolje.style.outline = "none";
        selektovanoPolje = null;
    }
}

// AUTOMATSKO POKRETANJE
pokreniSah();