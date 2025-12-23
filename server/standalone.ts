// Standalone server with static file serving for production
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { Game } from './Game.js';
import { GAME_CONFIG } from '../shared/constants.js';
import { ClientMessage, ServerMessage, SnakeNetworkState } from '../shared/types.js';

const PORT = parseInt(process.env.PORT || '8080');
const STATIC_DIR = join(process.cwd(), 'dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// HTTP server for static files
const httpServer = createServer((req, res) => {
  let filePath = join(STATIC_DIR, req.url === '/' ? 'index.html' : req.url || '');
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  // Try to serve file, fallback to index.html for SPA
  if (!existsSync(filePath)) {
    filePath = join(STATIC_DIR, 'index.html');
  }
  
  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// WebSocket server
const wss = new WebSocketServer({ server: httpServer });
const game = new Game();
const clients = new Map<string, WebSocket>();

console.log(`Starting server on port ${PORT}...`);

game.onSnakeDeath = (snakeId: string, killerId: string | null) => {
  const ws = clients.get(snakeId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    const snake = game.getSnake(snakeId);
    const msg: ServerMessage = {
      type: 'death',
      killerId,
      finalLength: snake?.length ?? 0
    };
    ws.send(JSON.stringify(msg));
  }
};

game.onFoodUpdate = (added, removed) => {
  const msg: ServerMessage = {
    type: 'food_update',
    added,
    removed
  };
  broadcast(msg);
};

function broadcast(msg: ServerMessage, exclude?: string): void {
  const data = JSON.stringify(msg);
  for (const [id, ws] of clients) {
    if (id !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

wss.on('connection', (ws: WebSocket) => {
  let playerId: string | null = null;
  
  ws.on('message', (data: Buffer) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString());
      
      if (msg.type === 'join') {
        playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        clients.set(playerId, ws);
        
        const snake = game.addPlayer(playerId, msg.name || 'Player', msg.color);
        
        const initMsg: ServerMessage = {
          type: 'init',
          playerId,
          state: game.getState()
        };
        ws.send(JSON.stringify(initMsg));
        
        console.log(`Player joined: ${snake.name} (${playerId}) - Total: ${clients.size}`);
      }
      
      if (msg.type === 'input' && playerId) {
        game.setPlayerInput(playerId, msg.targetAngle);
      }
    } catch (e) {
      console.error('Message parse error:', e);
    }
  });
  
  ws.on('close', () => {
    if (playerId) {
      game.removeSnake(playerId);
      clients.delete(playerId);
      console.log(`Player left: ${playerId} - Total: ${clients.size}`);
    }
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Game loop
setInterval(() => {
  game.update();
}, 1000 / GAME_CONFIG.TICK_RATE);

// Network state broadcast
setInterval(() => {
  const snakes: SnakeNetworkState[] = Array.from(game.snakes.values())
    .filter(s => !s.isDead)
    .map(s => s.getNetworkState());
  
  const msg: ServerMessage = {
    type: 'state',
    snakes,
    timestamp: Date.now()
  };
  
  broadcast(msg);
}, 1000 / GAME_CONFIG.NETWORK_TICK_RATE);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Game started!');
});
