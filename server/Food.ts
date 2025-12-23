import { Food as FoodType } from '../shared/types.js';
import { GAME_CONFIG } from '../shared/constants.js';

let foodIdCounter = 0;

export class FoodManager {
  foods: Map<string, FoodType> = new Map();
  
  constructor() {
    this.spawnInitialFood();
  }
  
  private generateId(): string {
    return `food_${++foodIdCounter}`;
  }
  
  private randomColor(): string {
    return GAME_CONFIG.FOOD_COLORS[Math.floor(Math.random() * GAME_CONFIG.FOOD_COLORS.length)];
  }
  
  spawnInitialFood(): void {
    const margin = 50;
    for (let i = 0; i < GAME_CONFIG.FOOD_COUNT; i++) {
      this.spawnFood(
        margin + Math.random() * (GAME_CONFIG.MAP_WIDTH - margin * 2),
        margin + Math.random() * (GAME_CONFIG.MAP_HEIGHT - margin * 2)
      );
    }
  }
  
  spawnFood(x: number, y: number, value: number = GAME_CONFIG.FOOD_VALUE): FoodType {
    const food: FoodType = {
      id: this.generateId(),
      x,
      y,
      color: this.randomColor(),
      value
    };
    this.foods.set(food.id, food);
    return food;
  }
  
  spawnFoodFromSegments(segments: { x: number; y: number }[]): FoodType[] {
    const spawned: FoodType[] = [];
    for (const seg of segments) {
      // Add some randomness to position
      const food = this.spawnFood(
        seg.x + (Math.random() - 0.5) * 10,
        seg.y + (Math.random() - 0.5) * 10,
        GAME_CONFIG.SEGMENT_FOOD_VALUE
      );
      spawned.push(food);
    }
    return spawned;
  }
  
  removeFood(id: string): boolean {
    return this.foods.delete(id);
  }
  
  maintainFoodCount(): FoodType[] {
    const added: FoodType[] = [];
    const margin = 50;
    while (this.foods.size < GAME_CONFIG.FOOD_COUNT) {
      const food = this.spawnFood(
        margin + Math.random() * (GAME_CONFIG.MAP_WIDTH - margin * 2),
        margin + Math.random() * (GAME_CONFIG.MAP_HEIGHT - margin * 2)
      );
      added.push(food);
    }
    return added;
  }
  
  getAll(): FoodType[] {
    return Array.from(this.foods.values());
  }
  
  getById(id: string): FoodType | undefined {
    return this.foods.get(id);
  }
}
