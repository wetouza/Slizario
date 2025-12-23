import { Game } from './Game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const menu = document.getElementById('menu') as HTMLDivElement;
const nameInput = document.getElementById('name-input') as HTMLInputElement;
const playBtn = document.getElementById('play-btn') as HTMLButtonElement;
const hud = document.getElementById('hud') as HTMLDivElement;
const leaderboard = document.getElementById('leaderboard') as HTMLDivElement;
const minimap = document.getElementById('minimap') as HTMLCanvasElement;
const deathScreen = document.getElementById('death-screen') as HTMLDivElement;
const finalLengthEl = document.getElementById('final-length') as HTMLSpanElement;
const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;

// Stats elements
const statBest = document.getElementById('stat-best') as HTMLElement;
const statGames = document.getElementById('stat-games') as HTMLElement;
const statKills = document.getElementById('stat-kills') as HTMLElement;
const statTime = document.getElementById('stat-time') as HTMLElement;
const onlineCount = document.getElementById('online-count') as HTMLElement;

// Skin selector
const skinOptions = document.querySelectorAll('.skin-option');
let selectedColor = '#FF6B6B';

// Local stats (in memory for this session)
let stats = {
  bestScore: 0,
  gamesPlayed: 0,
  kills: 0,
  playTime: 0
};

let game: Game | null = null;
let gameStartTime = 0;

function updateStatsDisplay() {
  statBest.textContent = stats.bestScore.toString();
  statGames.textContent = stats.gamesPlayed.toString();
  statKills.textContent = stats.kills.toString();
  const minutes = Math.floor(stats.playTime / 60);
  statTime.textContent = `${minutes}m`;
}

function showMenu() {
  menu.classList.remove('hidden');
  hud.classList.add('hidden');
  leaderboard.classList.add('hidden');
  minimap.classList.add('hidden');
  deathScreen.classList.add('hidden');
  updateStatsDisplay();
  
  // Update online count (bots + potential players)
  onlineCount.textContent = (5 + Math.floor(Math.random() * 3)).toString();
}

function showGame() {
  menu.classList.add('hidden');
  hud.classList.remove('hidden');
  leaderboard.classList.remove('hidden');
  minimap.classList.remove('hidden');
  deathScreen.classList.add('hidden');
}

function showDeath(finalLength: number) {
  // Update stats
  stats.gamesPlayed++;
  if (finalLength > stats.bestScore) {
    stats.bestScore = finalLength;
  }
  const sessionTime = Math.floor((Date.now() - gameStartTime) / 1000);
  stats.playTime += sessionTime;
  
  finalLengthEl.textContent = finalLength.toString();
  deathScreen.classList.remove('hidden');
}

function startGame() {
  const name = nameInput.value.trim() || 'Player';
  showGame();
  gameStartTime = Date.now();
  
  game = new Game(canvas, minimap, name, selectedColor);
  game.onDeath = (finalLength: number) => {
    showDeath(finalLength);
    game?.destroy();
    game = null;
  };
  
  game.start();
}

// Skin selector
skinOptions.forEach(option => {
  option.addEventListener('click', () => {
    skinOptions.forEach(o => o.classList.remove('selected'));
    option.classList.add('selected');
    selectedColor = (option as HTMLElement).dataset.color || '#FF6B6B';
  });
});

playBtn.addEventListener('click', startGame);
nameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') startGame();
});

restartBtn.addEventListener('click', () => {
  showMenu();
});

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

nameInput.focus();
updateStatsDisplay();

// Modal functionality
const modalOverlay = document.getElementById('modal-overlay') as HTMLDivElement;
const modalInner = document.getElementById('modal-inner') as HTMLDivElement;
const modalClose = document.getElementById('modal-close') as HTMLButtonElement;
const btnControls = document.getElementById('btn-controls') as HTMLDivElement;
const btnSettings = document.getElementById('btn-settings') as HTMLDivElement;
const btnLeaderboard = document.getElementById('btn-leaderboard') as HTMLDivElement;
const btnHelp = document.getElementById('btn-help') as HTMLDivElement;

// Settings state
let settings = {
  sound: true,
  music: false,
  showNames: true,
  showGrid: true,
  quality: 80
};

function openModal(content: string) {
  modalInner.innerHTML = content;
  modalOverlay.classList.remove('hidden');
  
  // Attach toggle listeners
  document.querySelectorAll('.setting-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      const key = (toggle as HTMLElement).dataset.setting as keyof typeof settings;
      if (key && typeof settings[key] === 'boolean') {
        (settings as any)[key] = toggle.classList.contains('active');
      }
    });
  });
}

function closeModal() {
  modalOverlay.classList.add('hidden');
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Controls modal
btnControls.addEventListener('click', () => {
  openModal(`
    <h3 class="modal-title">🎮 Controls</h3>
    
    <div class="modal-section">
      <h4>Desktop</h4>
      <div class="control-row">
        <span class="control-key">Mouse</span>
        <span class="control-desc">Move cursor to control snake direction</span>
      </div>
    </div>
    
    <div class="modal-section">
      <h4>Mobile</h4>
      <div class="control-row">
        <span class="control-key">Touch</span>
        <span class="control-desc">Touch and drag to control direction</span>
      </div>
      <div class="control-row">
        <span class="control-key">Joystick</span>
        <span class="control-desc">Virtual joystick appears where you touch</span>
      </div>
    </div>
    
    <div class="modal-section">
      <h4>Tips</h4>
      <div class="control-row">
        <span class="control-key">💡</span>
        <span class="control-desc">Circle around smaller snakes to trap them</span>
      </div>
      <div class="control-row">
        <span class="control-key">💡</span>
        <span class="control-desc">Cut off enemies by crossing their path</span>
      </div>
    </div>
  `);
});

// Settings modal
btnSettings.addEventListener('click', () => {
  openModal(`
    <h3 class="modal-title">⚙️ Settings</h3>
    
    <div class="modal-section">
      <div class="setting-row">
        <span class="setting-label">Sound Effects</span>
        <div class="setting-toggle ${settings.sound ? 'active' : ''}" data-setting="sound"></div>
      </div>
      <div class="setting-row">
        <span class="setting-label">Background Music</span>
        <div class="setting-toggle ${settings.music ? 'active' : ''}" data-setting="music"></div>
      </div>
      <div class="setting-row">
        <span class="setting-label">Show Player Names</span>
        <div class="setting-toggle ${settings.showNames ? 'active' : ''}" data-setting="showNames"></div>
      </div>
      <div class="setting-row">
        <span class="setting-label">Show Grid</span>
        <div class="setting-toggle ${settings.showGrid ? 'active' : ''}" data-setting="showGrid"></div>
      </div>
      <div class="setting-row">
        <span class="setting-label">Graphics Quality</span>
        <input type="range" class="setting-slider" min="0" max="100" value="${settings.quality}">
      </div>
    </div>
  `);
});

// Leaderboard modal
btnLeaderboard.addEventListener('click', () => {
  // Generate fake leaderboard with your best score
  const fakeNames = ['xXSlitherXx', 'ProGamer228', 'SnakeKing', 'Destroyer', 'NinjaSnek', 'Dragon', 'Phoenix', 'Venom', 'Shadow', 'Hunter'];
  const entries = fakeNames.map((name, i) => ({
    name,
    score: Math.floor(500 - i * 40 + Math.random() * 20)
  }));
  
  // Insert player's best score
  if (stats.bestScore > 0) {
    entries.push({ name: 'You', score: stats.bestScore });
    entries.sort((a, b) => b.score - a.score);
  }
  
  const top10 = entries.slice(0, 10);
  
  openModal(`
    <h3 class="modal-title">🏆 Leaderboard</h3>
    
    <div class="modal-section">
      <h4>Top Players Today</h4>
      ${top10.map((entry, i) => `
        <div class="lb-entry ${entry.name === 'You' ? 'self' : ''}">
          <div class="lb-rank">${i + 1}</div>
          <div class="lb-name">${entry.name}</div>
          <div class="lb-score">${entry.score}</div>
        </div>
      `).join('')}
    </div>
  `);
});

// Help modal
btnHelp.addEventListener('click', () => {
  openModal(`
    <h3 class="modal-title">❓ How to Play</h3>
    
    <div class="help-item">
      <h5>🎯 Objective</h5>
      <p>Grow your snake as long as possible by eating food and defeating other players.</p>
    </div>
    
    <div class="help-item">
      <h5>🍎 Eating Food</h5>
      <p>Collect the glowing orbs scattered around the map. Each orb makes your snake longer.</p>
    </div>
    
    <div class="help-item">
      <h5>💀 Defeating Enemies</h5>
      <p>Make other snakes crash into your body. When they die, they drop food you can collect!</p>
    </div>
    
    <div class="help-item">
      <h5>⚠️ Staying Alive</h5>
      <p>Avoid crashing into other snakes' bodies or the red walls at the edge of the map.</p>
    </div>
    
    <div class="help-item">
      <h5>🐍 Your Own Body</h5>
      <p>You can safely pass through your own body - it won't kill you!</p>
    </div>
    
    <div class="help-item">
      <h5>💡 Pro Tips</h5>
      <p>• Circle around smaller snakes to trap them<br>
         • Stay near the center for more food<br>
         • Watch out for larger snakes trying to cut you off</p>
    </div>
  `);
});
