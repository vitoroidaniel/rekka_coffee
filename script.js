// Configurație
const config = {
    symbols: {
        winning: '🍋',
        regular: '☕'
    },
    prizes: [
        "Ciocolată mică",
        "Ciocolată mare",
        "Reducere 20% la 3 limonade",
        "Limonadă gratis + 4 achiziționate",
        "Mai încearcă"
    ],
    colors: ['#6f4e37', '#8c7b6b', '#b59a7b', '#d2b48c', '#e6d5c3']
};

// Elemente DOM
const elements = {
    grid: document.getElementById('grid'),
    wheelContainer: document.getElementById('wheelContainer'),
    wheel: document.getElementById('wheel'),
    spinBtn: document.getElementById('spinBtn'),
    result: document.getElementById('result'),
    scratchSound: document.getElementById('scratchSound'),
    winSound: document.getElementById('winSound')
};

// Stare joc
let gameState = {
    grid: [],
    revealedCards: 0,
    canPlay: true,
    winningPositions: []
};

// Inițializare joc
function initGame() {
    resetGame();
    createScratchCards();
    createWheel();
}

// Resetare joc
function resetGame() {
    gameState = {
        grid: [],
        revealedCards: 0,
        canPlay: true,
        winningPositions: []
    };
    elements.grid.innerHTML = '';
    elements.wheelContainer.classList.add('hidden');
    elements.result.classList.add('hidden');
    elements.spinBtn.disabled = false;
}

// Creare carduri scratch
function createScratchCards() {
    // Generează 3 poziții câștigătoare consecutive
    const winningPattern = Math.floor(Math.random() * 4);
    switch(winningPattern) {
        case 0: gameState.winningPositions = [0,1,2]; break;
        case 1: gameState.winningPositions = [4,5,6]; break;
        case 2: gameState.winningPositions = [8,9,10]; break;
        case 3: gameState.winningPositions = [0,4,8]; break;
    }

    // Completează grila
    for (let i = 0; i < 16; i++) {
        gameState.grid.push(
            gameState.winningPositions.includes(i) ? config.symbols.winning : config.symbols.regular
        );
        
        const card = document.createElement('div');
        card.className = 'scratch-card';
        card.dataset.index = i;
        
        // Imagine card
        const img = document.createElement('img');
        img.src = gameState.winningPositions.includes(i) 
            ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23FFD700"/><path d="M30,50 Q50,30 70,50 Q50,70 30,50" fill="%23F5E356"/></svg>' 
            : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M30,70 L50,20 L70,70 Z" fill="%236f4e37"/><circle cx="50" cy="50" r="35" fill="%238B4513"/></svg>';
        img.className = 'card-image';
        img.style.display = 'none';
        card.appendChild(img);
        
        // Mască scratch
        const mask = document.createElement('div');
        mask.className = 'scratch-mask';
        card.appendChild(mask);
        
        // Evenimente scratch
        setupScratchEvents(card, mask, i);
        
        elements.grid.appendChild(card);
    }
}

// Configurare evenimente scratch
function setupScratchEvents(card, mask, index) {
    let isScratching = false;
    
    // Desktop mouse events
    card.addEventListener('mousedown', (e) => {
        if (!gameState.canPlay || card.classList.contains('revealed')) return;
        isScratching = true;
        scratchCard(e, card, mask, index);
        e.preventDefault();
    });
    
    card.addEventListener('mousemove', (e) => {
        if (isScratching && gameState.canPlay && !card.classList.contains('revealed')) {
            scratchCard(e, card, mask, index);
            e.preventDefault();
        }
    });
    
    card.addEventListener('mouseup', () => {
        isScratching = false;
    });
    
    card.addEventListener('mouseleave', () => {
        isScratching = false;
    });
    
    // Mobile touch events
    card.addEventListener('touchstart', (e) => {
        if (!gameState.canPlay || card.classList.contains('revealed')) return;
        scratchCard(e.touches[0], card, mask, index);
        e.preventDefault();
    });
    
    card.addEventListener('touchmove', (e) => {
        if (gameState.canPlay && !card.classList.contains('revealed')) {
            scratchCard(e.touches[0], card, mask, index);
            e.preventDefault();
        }
    });
    
    card.addEventListener('touchend', () => {
        isScratching = false;
    });
}

// Funcție scratch
function scratchCard(inputEvent, card, mask, index) {
    elements.scratchSound.currentTime = 0;
    elements.scratchSound.play();
    
    const rect = card.getBoundingClientRect();
    const x = inputEvent.clientX - rect.left;
    const y = inputEvent.clientY - rect.top;
    
    // Creează efect de zgâriere
    const hole = document.createElement('div');
    hole.style.cssText = `
        position: absolute;
        left: ${x-15}px;
        top: ${y-15}px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: transparent;
        pointer-events: none;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
    `;
    mask.appendChild(hole);
    
    // Revelare card dacă zgâriat suficient
    if (mask.children.length > 5 && !card.classList.contains('revealed')) {
        revealCard(card, index);
    }
}

// Revelare card
function revealCard(card, index) {
    card.classList.add('revealed');
    card.querySelector('img').style.display = 'block';
    gameState.revealedCards++;
    
    // Verifică câștig
    if (gameState.winningPositions.includes(index)) {
        card.classList.add('winning-card');
    }
    
    if (checkWin()) {
        gameState.canPlay = false;
        setTimeout(() => {
            elements.winSound.play();
            elements.wheelContainer.classList.remove('hidden');
        }, 1000);
    }
}

// Verificare câștig
function checkWin() {
    return gameState.winningPositions.every(pos => {
        return elements.grid.children[pos].classList.contains('revealed');
    });
}

// Creare roată noroc
function createWheel() {
    elements.wheel.innerHTML = '';
    const sectionAngle = 360 / config.prizes.length;
    
    config.prizes.forEach((prize, index) => {
        const section = document.createElement('div');
        section.className = 'wheel-section';
        section.style.transform = `rotate(${index * sectionAngle}deg)`;
        section.style.backgroundColor = config.colors[index % config.colors.length];
        section.innerHTML = `
            <div style="transform: rotate(${sectionAngle/2}deg); width: 100%; text-align: center; padding: 0 10px;">
                ${prize}
            </div>
        `;
        elements.wheel.appendChild(section);
    });
}

// Rotire roată
elements.spinBtn.addEventListener('click', () => {
    elements.spinBtn.disabled = true;
    const winnerIndex = Math.floor(Math.random() * config.prizes.length);
    const spins = 5;
    const degreesToRotate = 360 * spins + (winnerIndex * (360 / config.prizes.length));
    
    elements.wheel.style.transform = `rotate(${degreesToRotate}deg)`;
    
    setTimeout(() => {
        elements.result.textContent = `Felicitări! Ai câștigat: ${config.prizes[winnerIndex]}`;
        elements.result.classList.remove('hidden');
        
        // Reset după 5 secunde
        setTimeout(initGame, 5000);
    }, 4000);
});

// Inițializare la încărcare
window.addEventListener('load', initGame);