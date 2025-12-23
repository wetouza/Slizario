import { WebSocketServer, WebSocket } from 'ws';
import { Game } from './Game.js';
import { GAME_CONFIG } from '../shared/constants.js';
import { ClientMessage, ServerMessage, SnakeNetworkState } from '../shared/types.js';

const wss = new WebSocketServer({ port: GAME_CONFIG.SERVER_PORT });
const game = new Game();
const clients = new Map<string, WebSocket>();

console.log(`Server running on ws://localhost:${GAME_CONFIG.SERVER_PORT}`);

// Game callbacks
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
        
        console.log(`Player joined: ${snake.name} (${playerId})`);
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
      console.log(`Player left: ${playerId}`);
    }
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// Game loop
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const delta = now - lastTick;
  lastTick = now;
  
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

console.log('Game started!');
