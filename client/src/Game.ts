import { Network } from './Network';
import { Renderer } from './Renderer';
import { Input } from './Input';
import { ClientSnake } from './ClientSnake';
import { Food } from '../../shared/types';

export class Game {
  private canvas: HTMLCanvasElement;
  private network: Network;
  private renderer: Renderer;
  private input: Input;
  private playerName: string;
  private playerColor: string;
  
  private playerId: string | null = null;
  private snakes: Map<string, ClientSnake> = new Map();
  private foods: Map<string, Food> = new Map();
  
  private running = false;
  private animationId: number | null = null;
  
  private lengthDisplay: HTMLElement;
  private leaderboardList: HTMLElement;
  private frameCount = 0;
  
  onDeath?: (finalLength: number) => void;
  
  constructor(canvas: HTMLCanvasElement, minimap: HTMLCanvasElement, name: string, color: string = '#FF6B6B') {
    this.canvas = canvas;
    this.playerName = name;
    this.playerColor = color;
    this.network = new Network();
    this.renderer = new Renderer(canvas, minimap);
    this.input = new Input(canvas);
    
    this.lengthDisplay = document.getElementById('length')!;
    this.leaderboardList = document.getElementById('leaderboard-list')!;
    
    this.setupNetworkHandlers();
  }
  
  private setupNetworkHandlers(): void {
    this.network.onInit = (playerId, state) => {
      this.playerId = playerId;
      
      for (const snakeState of state.snakes) {
        const snake = new ClientSnake(snakeState, snakeState.id === playerId);
        this.snakes.set(snakeState.id, snake);
      }
      
      for (const food of state.foods) {
        this.foods.set(food.id, food);
      }
    };
    
    this.network.onState = (snakes, timestamp) => {
      const existingIds = new Set<string>();
      
      for (const state of snakes) {
        existingIds.add(state.id);
        
        let snake = this.snakes.get(state.id);
        if (snake) {
          snake.updateFromServer(state);
        } else {
          snake = new ClientSnake(state, state.id === this.playerId);
          this.snakes.set(state.id, snake);
        }
      }
      
      for (const id of this.snakes.keys()) {
        if (!existingIds.has(id)) {
          this.snakes.delete(id);
        }
      }
    };
    
    this.network.onDeath = (killerId, finalLength) => {
      this.running = false;
      this.onDeath?.(finalLength);
    };
    
    this.network.onFoodUpdate = (added, removed) => {
      for (const id of removed) {
        this.foods.delete(id);
      }
      for (const food of added) {
        this.foods.set(food.id, food);
      }
    };
  }
  
  async start(): Promise<void> {
    try {
      await this.network.connect(this.playerName, this.playerColor);
      this.running = true;
      this.gameLoop();
    } catch (e) {
      console.error('Failed to connect:', e);
      alert('Failed to connect to server. Make sure the server is running.');
    }
  }
  
  private gameLoop = (): void => {
    if (!this.running) return;
    
    this.update();
    this.render();
    
    this.animationId = requestAnimationFrame(this.gameLoop);
  };
  
  private update(): void {
    this.frameCount++;
    
    // Отправляем input каждые 3 кадра (~20 раз в секунду при 60fps)
    if (this.frameCount % 3 === 0) {
      this.network.sendInput(this.input.getTargetAngle());
    }
    
    // Фиксированный фактор интерполяции
    const interpFactor = 0.15;
    for (const snake of this.snakes.values()) {
      snake.interpolate(interpFactor);
      snake.updateSegments();
    }
    
    // HUD каждые 10 кадров
    if (this.frameCount % 10 === 0) {
      this.updateHUD();
    }
  }
  
  private updateHUD(): void {
    const localSnake = this.playerId ? this.snakes.get(this.playerId) : null;
    if (localSnake) {
      this.lengthDisplay.textContent = localSnake.length.toString();
    }
    
    const sorted = Array.from(this.snakes.values())
      .sort((a, b) => b.length - a.length)
      .slice(0, 8);
    
    let html = '';
    for (const snake of sorted) {
      const isSelf = snake.id === this.playerId;
      html += `<li class="${isSelf ? 'self' : ''}">${snake.name}: ${snake.length}</li>`;
    }
    this.leaderboardList.innerHTML = html;
  }
  
  private render(): void {
    this.renderer.render(this.snakes, this.foods, this.playerId);
  }
  
  destroy(): void {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.network.disconnect();
    this.input.destroy();
    this.snakes.clear();
    this.foods.clear();
  }
}
