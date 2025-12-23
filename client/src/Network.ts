import { GAME_CONFIG } from '../../shared/constants';
import { 
  ClientMessage, ServerMessage, GameState, 
  SnakeNetworkState, Food 
} from '../../shared/types';

export class Network {
  private ws: WebSocket | null = null;
  private connected = false;
  
  onInit?: (playerId: string, state: GameState) => void;
  onState?: (snakes: SnakeNetworkState[], timestamp: number) => void;
  onDeath?: (killerId: string | null, finalLength: number) => void;
  onFoodUpdate?: (added: Food[], removed: string[]) => void;
  
  connect(name: string, color?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // В продакшене используем тот же хост, в dev - localhost
      const isSecure = window.location.protocol === 'https:';
      const wsProtocol = isSecure ? 'wss:' : 'ws:';
      const wsHost = window.location.host;
      
      // Если это dev сервер (порт 5173 или 3000), подключаемся к отдельному WS серверу
      const isDev = window.location.port === '5173' || window.location.port === '3000';
      const wsUrl = isDev 
        ? `ws://${window.location.hostname}:${GAME_CONFIG.SERVER_PORT}`
        : `${wsProtocol}//${wsHost}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.connected = true;
        this.send({ type: 'join', name, color });
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('Parse error:', e);
        }
      };
      
      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        reject(err);
      };
      
      this.ws.onclose = () => {
        this.connected = false;
      };
    });
  }
  
  private handleMessage(msg: ServerMessage): void {
    switch (msg.type) {
      case 'init':
        this.onInit?.(msg.playerId, msg.state);
        break;
      case 'state':
        this.onState?.(msg.snakes, msg.timestamp);
        break;
      case 'death':
        this.onDeath?.(msg.killerId, msg.finalLength);
        break;
      case 'food_update':
        this.onFoodUpdate?.(msg.added, msg.removed);
        break;
    }
  }
  
  sendInput(targetAngle: number): void {
    if (this.connected) {
      this.send({ type: 'input', targetAngle });
    }
  }
  
  private send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }
  
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }
}
