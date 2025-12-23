import { Snake } from './Snake.js';
import { FoodManager } from './Food.js';
import { GAME_CONFIG } from '../shared/constants.js';

const BOT_NAMES = [
  // Типичные игровые ники
  'xXSlitherXx', 'ProGamer228', 'SnakeKing', 'Destroyer', 'NoobMaster69',
  'CoolDude', 'FastSnake', 'BigBoss', 'Hunter', 'Killer99',
  'Shadow', 'NinjaSnek', 'Dragon', 'Phoenix', 'Venom',
  // Обычные имена
  'Alex', 'Max', 'John', 'Mike', 'Sam', 'Leo', 'Dan', 'Tom', 'Nick',
  'Emma', 'Mia', 'Lily', 'Anna', 'Kate',
  // Мемные ники
  'snek', 'danger noodle', 'nope rope', 'wiggle worm', 'long boi',
  'im new', 'dont kill me', 'friendly', 'help', 'gg',
  // Разные языки
  'Змейка', 'питон', 'кобра', '蛇', 'へび'
];

type BotPersonality = 'aggressive' | 'passive' | 'hunter' | 'farmer' | 'chaotic';

export class BotController {
  snake: Snake;
  private personality: BotPersonality;
  private lastDecisionTime: number = 0;
  private nextDecisionTime: number = 0;
  private targetAngle: number;
  private currentBehavior: string = 'idle';
  
  // Человеческие характеристики
  private mouseX: number = 0;
  private mouseY: number = 0;
  private targetMouseX: number = 0;
  private targetMouseY: number = 0;
  private mouseSmoothing: number;
  private reactionDelay: number;
  private accuracy: number;
  private attention: number; // как часто отвлекается
  private panicLevel: number = 0;
  
  // Состояния
  private isDistracted: boolean = false;
  private distractedUntil: number = 0;
  private lastDirectionChange: number = 0;
  private consecutiveTurns: number = 0;
  private favoriteDirection: number = 1; // 1 или -1
  
  constructor(snake: Snake) {
    this.snake = snake;
    this.targetAngle = snake.angle;
    
    // Случайная личность
    const personalities: BotPersonality[] = ['aggressive', 'passive', 'hunter', 'farmer', 'chaotic'];
    this.personality = personalities[Math.floor(Math.random() * personalities.length)];
    
    // Человеческие параметры с вариацией
    this.mouseSmoothing = 0.05 + Math.random() * 0.1; // Плавность движения мыши
    this.reactionDelay = 80 + Math.random() * 200; // Время реакции 80-280ms
    this.accuracy = 0.6 + Math.random() * 0.35; // Точность прицеливания
    this.attention = 0.85 + Math.random() * 0.14; // Внимательность
    this.favoriteDirection = Math.random() > 0.5 ? 1 : -1;
    
    // Начальная позиция "мыши"
    this.mouseX = snake.head.x + Math.cos(snake.angle) * 200;
    this.mouseY = snake.head.y + Math.sin(snake.angle) * 200;
    this.targetMouseX = this.mouseX;
    this.targetMouseY = this.mouseY;
  }
  
  static createBot(id: string): Snake {
    const margin = 300;
    const x = margin + Math.random() * (GAME_CONFIG.MAP_WIDTH - margin * 2);
    const y = margin + Math.random() * (GAME_CONFIG.MAP_HEIGHT - margin * 2);
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    return new Snake(id, name, x, y, true);
  }
  
  update(snakes: Snake[], foodManager: FoodManager, now: number): void {
    if (this.snake.isDead) return;
    
    // Симуляция движения мыши (плавное, как у человека)
    this.updateMousePosition(now);
    
    // Вычисляем угол от головы к "мыши"
    const dx = this.mouseX - this.snake.head.x;
    const dy = this.mouseY - this.snake.head.y;
    this.targetAngle = Math.atan2(dy, dx);
    
    // Добавляем небольшое дрожание руки
    const handShake = (Math.random() - 0.5) * 0.02 * (1 + this.panicLevel);
    this.snake.setTargetAngle(this.targetAngle + handShake);
    
    // Принятие решений с человеческой задержкой
    if (now < this.nextDecisionTime) return;
    
    // Случайная вариация времени между решениями
    const baseDelay = this.reactionDelay;
    const variance = baseDelay * 0.5 * Math.random();
    this.nextDecisionTime = now + baseDelay + variance;
    
    // Иногда бот "отвлекается"
    if (Math.random() > this.attention && !this.isDistracted) {
      this.isDistracted = true;
      this.distractedUntil = now + 500 + Math.random() * 1500;
    }
    
    if (this.isDistracted) {
      if (now > this.distractedUntil) {
        this.isDistracted = false;
      } else {
        // Продолжаем двигаться в том же направлении
        return;
      }
    }
    
    this.makeDecision(snakes, foodManager, now);
  }
  
  private updateMousePosition(now: number): void {
    // Плавное движение мыши к цели (как человек двигает мышь)
    const smoothing = this.mouseSmoothing * (1 + this.panicLevel * 0.5);
    
    this.mouseX += (this.targetMouseX - this.mouseX) * smoothing;
    this.mouseY += (this.targetMouseY - this.mouseY) * smoothing;
    
    // Добавляем микро-движения (тремор руки)
    if (Math.random() < 0.3) {
      this.mouseX += (Math.random() - 0.5) * 3;
      this.mouseY += (Math.random() - 0.5) * 3;
    }
  }
  
  private makeDecision(snakes: Snake[], foodManager: FoodManager, now: number): void {
    const head = this.snake.head;
    this.panicLevel = Math.max(0, this.panicLevel - 0.1);
    
    // 1. Проверка стен (высший приоритет)
    const wallAvoid = this.checkWalls(head);
    if (wallAvoid) {
      this.setMouseTarget(wallAvoid.x, wallAvoid.y);
      this.currentBehavior = 'avoiding_wall';
      this.panicLevel = Math.min(1, this.panicLevel + 0.3);
      return;
    }
    
    // 2. Проверка опасности (другие змеи)
    const danger = this.checkDanger(snakes, head);
    if (danger) {
      this.setMouseTarget(danger.x, danger.y);
      this.currentBehavior = 'fleeing';
      this.panicLevel = Math.min(1, this.panicLevel + 0.2);
      return;
    }
    
    // 3. Поведение в зависимости от личности
    switch (this.personality) {
      case 'aggressive':
        if (this.tryAttack(snakes, head)) return;
        if (this.tryHuntFood(foodManager, snakes, head)) return;
        break;
        
      case 'hunter':
        if (Math.random() < 0.7 && this.tryAttack(snakes, head)) return;
        if (this.tryHuntFood(foodManager, snakes, head)) return;
        break;
        
      case 'farmer':
        if (this.tryHuntFood(foodManager, snakes, head)) return;
        if (Math.random() < 0.2 && this.tryAttack(snakes, head)) return;
        break;
        
      case 'passive':
        if (this.tryHuntFood(foodManager, snakes, head)) return;
        break;
        
      case 'chaotic':
        if (Math.random() < 0.3) {
          this.randomTurn(now);
          return;
        }
        if (Math.random() < 0.5 && this.tryAttack(snakes, head)) return;
        if (this.tryHuntFood(foodManager, snakes, head)) return;
        break;
    }
    
    // 4. Блуждание
    this.wander(now);
  }
  
  private checkWalls(head: { x: number; y: number }): { x: number; y: number } | null {
    const hardMargin = 100;
    const softMargin = 180;
    
    let needsAvoid = false;
    let avoidX = head.x;
    let avoidY = head.y;
    
    if (head.x < hardMargin) {
      avoidX = head.x + 300;
      needsAvoid = true;
    } else if (head.x > GAME_CONFIG.MAP_WIDTH - hardMargin) {
      avoidX = head.x - 300;
      needsAvoid = true;
    } else if (head.x < softMargin) {
      avoidX = head.x + 150;
      needsAvoid = true;
    } else if (head.x > GAME_CONFIG.MAP_WIDTH - softMargin) {
      avoidX = head.x - 150;
      needsAvoid = true;
    }
    
    if (head.y < hardMargin) {
      avoidY = head.y + 300;
      needsAvoid = true;
    } else if (head.y > GAME_CONFIG.MAP_HEIGHT - hardMargin) {
      avoidY = head.y - 300;
      needsAvoid = true;
    } else if (head.y < softMargin) {
      avoidY = head.y + 150;
      needsAvoid = true;
    } else if (head.y > GAME_CONFIG.MAP_HEIGHT - softMargin) {
      avoidY = head.y - 150;
      needsAvoid = true;
    }
    
    if (needsAvoid) {
      // Добавляем неточность (человек не идеально избегает)
      const inaccuracy = (1 - this.accuracy) * 50;
      avoidX += (Math.random() - 0.5) * inaccuracy;
      avoidY += (Math.random() - 0.5) * inaccuracy;
      return { x: avoidX, y: avoidY };
    }
    
    return null;
  }
  
  private checkDanger(snakes: Snake[], head: { x: number; y: number }): { x: number; y: number } | null {
    const dangerZone = 100;
    
    for (const other of snakes) {
      if (other.id === this.snake.id || other.isDead) continue;
      
      // Проверяем голову врага
      const hdx = other.head.x - head.x;
      const hdy = other.head.y - head.y;
      const headDist = Math.sqrt(hdx * hdx + hdy * hdy);
      
      if (headDist < dangerZone) {
        // Убегаем в противоположную сторону
        const fleeX = head.x - hdx * 2;
        const fleeY = head.y - hdy * 2;
        
        // Человеческая неточность при панике
        const panic = (1 - this.accuracy) * 80;
        return {
          x: fleeX + (Math.random() - 0.5) * panic,
          y: fleeY + (Math.random() - 0.5) * panic
        };
      }
      
      // Проверяем тело врага на пути
      const lookAhead = 80;
      const futureX = head.x + Math.cos(this.snake.angle) * lookAhead;
      const futureY = head.y + Math.sin(this.snake.angle) * lookAhead;
      
      for (let i = 0; i < Math.min(other.segments.length, 50); i++) {
        const seg = other.segments[i];
        const sdx = seg.x - futureX;
        const sdy = seg.y - futureY;
        const segDist = Math.sqrt(sdx * sdx + sdy * sdy);
        
        if (segDist < 40) {
          // Поворачиваем в сторону (предпочитаем любимое направление)
          const perpAngle = this.snake.angle + (Math.PI / 2) * this.favoriteDirection;
          return {
            x: head.x + Math.cos(perpAngle) * 150,
            y: head.y + Math.sin(perpAngle) * 150
          };
        }
      }
    }
    
    return null;
  }
  
  private tryAttack(snakes: Snake[], head: { x: number; y: number }): boolean {
    if (this.snake.length < 15) return false; // Слишком маленький для атаки
    
    const attackRange = 200;
    let bestTarget: { x: number; y: number } | null = null;
    let bestScore = -Infinity;
    
    for (const other of snakes) {
      if (other.id === this.snake.id || other.isDead) continue;
      if (other.length >= this.snake.length * 0.9) continue; // Не атакуем равных или больших
      
      const dx = other.head.x - head.x;
      const dy = other.head.y - head.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > attackRange) continue;
      
      // Целимся в тело, не в голову
      const targetIndex = Math.floor(other.segments.length * 0.4);
      if (targetIndex >= other.segments.length) continue;
      
      const target = other.segments[targetIndex];
      const score = other.length - dist * 0.5;
      
      if (score > bestScore) {
        bestScore = score;
        bestTarget = { x: target.x, y: target.y };
      }
    }
    
    if (bestTarget) {
      // Добавляем упреждение и неточность
      const inaccuracy = (1 - this.accuracy) * 30;
      this.setMouseTarget(
        bestTarget.x + (Math.random() - 0.5) * inaccuracy,
        bestTarget.y + (Math.random() - 0.5) * inaccuracy
      );
      this.currentBehavior = 'attacking';
      return true;
    }
    
    return false;
  }
  
  private tryHuntFood(foodManager: FoodManager, snakes: Snake[], head: { x: number; y: number }): boolean {
    const visionRange = 200 + this.accuracy * 100;
    let bestFood: { x: number; y: number; score: number } | null = null;
    
    for (const food of foodManager.foods.values()) {
      const dx = food.x - head.x;
      const dy = food.y - head.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > visionRange) continue;
      
      // Оценка: ближе = лучше, больше value = лучше
      let score = (visionRange - dist) + food.value * 30;
      
      // Штраф за еду рядом с большими змеями
      for (const snake of snakes) {
        if (snake.id === this.snake.id || snake.isDead) continue;
        const sdx = snake.head.x - food.x;
        const sdy = snake.head.y - food.y;
        const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
        
        if (sdist < 80 && snake.length > this.snake.length) {
          score -= 200;
        }
      }
      
      if (!bestFood || score > bestFood.score) {
        bestFood = { x: food.x, y: food.y, score };
      }
    }
    
    if (bestFood && bestFood.score > 0) {
      this.setMouseTarget(bestFood.x, bestFood.y);
      this.currentBehavior = 'hunting_food';
      return true;
    }
    
    return false;
  }
  
  private wander(now: number): void {
    this.currentBehavior = 'wandering';
    
    // Иногда меняем направление
    if (now - this.lastDirectionChange > 1000 + Math.random() * 2000) {
      this.lastDirectionChange = now;
      
      // Человек обычно делает плавные повороты, иногда резкие
      const turnAmount = Math.random() < 0.2 
        ? (Math.random() - 0.5) * Math.PI // Резкий поворот
        : (Math.random() - 0.5) * 0.5; // Плавный поворот
      
      const newAngle = this.snake.angle + turnAmount;
      const distance = 150 + Math.random() * 100;
      
      this.setMouseTarget(
        this.snake.head.x + Math.cos(newAngle) * distance,
        this.snake.head.y + Math.sin(newAngle) * distance
      );
    }
  }
  
  private randomTurn(now: number): void {
    this.currentBehavior = 'random';
    this.lastDirectionChange = now;
    
    const turnAmount = (Math.random() - 0.5) * Math.PI;
    const newAngle = this.snake.angle + turnAmount;
    const distance = 100 + Math.random() * 150;
    
    this.setMouseTarget(
      this.snake.head.x + Math.cos(newAngle) * distance,
      this.snake.head.y + Math.sin(newAngle) * distance
    );
  }
  
  private setMouseTarget(x: number, y: number): void {
    // Ограничиваем цель в пределах карты
    this.targetMouseX = Math.max(50, Math.min(GAME_CONFIG.MAP_WIDTH - 50, x));
    this.targetMouseY = Math.max(50, Math.min(GAME_CONFIG.MAP_HEIGHT - 50, y));
  }
}
