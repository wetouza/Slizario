import { Snake } from './Snake.js';
import { FoodManager } from './Food.js';
import { BotController } from './Bot.js';
import { GAME_CONFIG } from '../shared/constants.js';
import { GameState, Food } from '../shared/types.js';

export class Game {
  snakes: Map<string, Snake> = new Map();
  bots: Map<string, BotController> = new Map();
  foodManager: FoodManager;
  
  onSnakeDeath?: (snakeId: string, killerId: string | null) => void;
  onFoodUpdate?: (added: Food[], removed: string[]) => void;
  
  constructor() {
    this.foodManager = new FoodManager();
    this.spawnBots();
  }
  
  private spawnBots(): void {
    for (let i = 0; i < GAME_CONFIG.BOT_COUNT; i++) {
      this.addBot();
    }
  }
  
  addBot(): Snake {
    const id = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const snake = BotController.createBot(id);
    const controller = new BotController(snake);
    this.snakes.set(id, snake);
    this.bots.set(id, controller);
    return snake;
  }
  
  addPlayer(id: string, name: string, color?: string): Snake {
    const margin = 200;
    const x = margin + Math.random() * (GAME_CONFIG.MAP_WIDTH - margin * 2);
    const y = margin + Math.random() * (GAME_CONFIG.MAP_HEIGHT - margin * 2);
    const snake = new Snake(id, name, x, y, false, color);
    this.snakes.set(id, snake);
    return snake;
  }
  
  removeSnake(id: string): void {
    const snake = this.snakes.get(id);
    if (snake && snake.segments.length > 0) {
      // Конвертируем все сегменты в еду
      const addedFood = this.foodManager.spawnFoodFromSegments(snake.segments);
      if (this.onFoodUpdate && addedFood.length > 0) {
        this.onFoodUpdate(addedFood, []);
      }
    }
    this.snakes.delete(id);
    this.bots.delete(id);
  }
  
  setPlayerInput(playerId: string, targetAngle: number): void {
    const snake = this.snakes.get(playerId);
    if (snake && !snake.isDead) {
      snake.setTargetAngle(targetAngle);
    }
  }
  
  update(): void {
    const now = Date.now();
    const removedFood: string[] = [];
    const addedFood: Food[] = [];
    
    // Update bots AI
    for (const bot of this.bots.values()) {
      bot.update(Array.from(this.snakes.values()), this.foodManager, now);
    }
    
    // Update all snakes
    for (const snake of this.snakes.values()) {
      if (snake.isDead) continue;
      snake.update();
    }
    
    // Check collisions
    const snakeArray = Array.from(this.snakes.values());
    
    for (const snake of snakeArray) {
      if (snake.isDead) continue;
      
      // Wall collision
      if (snake.checkWallCollision()) {
        snake.isDead = true;
        this.onSnakeDeath?.(snake.id, null);
        continue;
      }
      
      // Self collision
      if (snake.checkSelfCollision()) {
        snake.isDead = true;
        this.onSnakeDeath?.(snake.id, snake.id);
        continue;
      }
      
      // Food collision
      for (const food of this.foodManager.foods.values()) {
        const dx = snake.head.x - food.x;
        const dy = snake.head.y - food.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < GAME_CONFIG.HEAD_RADIUS + GAME_CONFIG.FOOD_RADIUS) {
          snake.grow(food.value);
          this.foodManager.removeFood(food.id);
          removedFood.push(food.id);
        }
      }
      
      // Head vs other snake's body collision - DEATH
      for (const other of snakeArray) {
        if (other.id === snake.id || other.isDead) continue;
        
        // Столкновение головы с телом другой змеи = смерть
        for (let i = 0; i < other.segments.length; i++) {
          const seg = other.segments[i];
          const dx = snake.head.x - seg.x;
          const dy = snake.head.y - seg.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < GAME_CONFIG.HEAD_RADIUS + GAME_CONFIG.SEGMENT_RADIUS) {
            // Змея умирает от столкновения с телом другой змеи
            snake.isDead = true;
            this.onSnakeDeath?.(snake.id, other.id);
            break;
          }
        }
        if (snake.isDead) break;
      }
    }
    
    // Remove dead snakes and respawn bots
    for (const snake of snakeArray) {
      if (snake.isDead) {
        this.removeSnake(snake.id);
        
        // Respawn bot after delay
        if (snake.isBot) {
          setTimeout(() => this.addBot(), 2000);
        }
      }
    }
    
    // Maintain food count
    const newFood = this.foodManager.maintainFoodCount();
    addedFood.push(...newFood);
    
    // Notify food changes
    if ((addedFood.length > 0 || removedFood.length > 0) && this.onFoodUpdate) {
      this.onFoodUpdate(addedFood, removedFood);
    }
  }
  
  getState(): GameState {
    return {
      snakes: Array.from(this.snakes.values()).map(s => s.getNetworkState()),
      foods: this.foodManager.getAll(),
      timestamp: Date.now()
    };
  }
  
  getSnake(id: string): Snake | undefined {
    return this.snakes.get(id);
  }
}
