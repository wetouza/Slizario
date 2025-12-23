import { GAME_CONFIG } from '../../shared/constants';
import { ClientSnake } from './ClientSnake';
import { Food, Vector2 } from '../../shared/types';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private minimapCanvas: HTMLCanvasElement;
  private minimapCtx: CanvasRenderingContext2D;
  private time: number = 0;
  
  camera: Vector2 = { x: 0, y: 0 };
  
  constructor(canvas: HTMLCanvasElement, minimap: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.minimapCanvas = minimap;
    this.minimapCtx = minimap.getContext('2d')!;
    this.minimapCanvas.width = 150;
    this.minimapCanvas.height = 150;
  }
  
  render(
    snakes: Map<string, ClientSnake>,
    foods: Map<string, Food>,
    localPlayerId: string | null
  ): void {
    this.time += 0.016;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Градиентный фон
    const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w * 0.7);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    // Update camera
    const localSnake = localPlayerId ? snakes.get(localPlayerId) : null;
    if (localSnake) {
      this.camera.x = localSnake.head.x - w / 2;
      this.camera.y = localSnake.head.y - h / 2;
    }
    
    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);
    
    // Viewport bounds
    const viewLeft = this.camera.x - 50;
    const viewRight = this.camera.x + w + 50;
    const viewTop = this.camera.y - 50;
    const viewBottom = this.camera.y + h + 50;
    
    // Grid
    this.drawGrid(ctx);
    
    // Boundaries
    this.drawBoundaries(ctx);
    
    // Food
    for (const food of foods.values()) {
      if (food.x >= viewLeft && food.x <= viewRight && 
          food.y >= viewTop && food.y <= viewBottom) {
        this.drawFood(ctx, food);
      }
    }
    
    // Snakes
    const sortedSnakes = Array.from(snakes.values()).sort((a, b) => {
      if (a.id === localPlayerId) return 1;
      if (b.id === localPlayerId) return -1;
      return a.length - b.length;
    });
    
    for (const snake of sortedSnakes) {
      this.drawSnake(ctx, snake, snake.id === localPlayerId);
    }
    
    ctx.restore();
    
    this.drawMinimap(snakes, localPlayerId);
  }
  
  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const gridSize = 50;
    ctx.strokeStyle = 'rgba(78, 205, 196, 0.07)';
    ctx.lineWidth = 1;
    
    const startX = Math.floor(this.camera.x / gridSize) * gridSize;
    const startY = Math.floor(this.camera.y / gridSize) * gridSize;
    const endX = this.camera.x + this.canvas.width + gridSize;
    const endY = this.camera.y + this.canvas.height + gridSize;
    
    ctx.beginPath();
    for (let x = startX; x < endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }
  
  private drawBoundaries(ctx: CanvasRenderingContext2D): void {
    // Граница
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 25;
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, GAME_CONFIG.MAP_WIDTH - 12, GAME_CONFIG.MAP_HEIGHT - 12);
    ctx.shadowBlur = 0;
    
    // Danger zones
    const dangerSize = 80;
    
    const gl = ctx.createLinearGradient(0, 0, dangerSize, 0);
    gl.addColorStop(0, 'rgba(255, 71, 87, 0.4)');
    gl.addColorStop(1, 'rgba(255, 71, 87, 0)');
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, dangerSize, GAME_CONFIG.MAP_HEIGHT);
    
    const gr = ctx.createLinearGradient(GAME_CONFIG.MAP_WIDTH, 0, GAME_CONFIG.MAP_WIDTH - dangerSize, 0);
    gr.addColorStop(0, 'rgba(255, 71, 87, 0.4)');
    gr.addColorStop(1, 'rgba(255, 71, 87, 0)');
    ctx.fillStyle = gr;
    ctx.fillRect(GAME_CONFIG.MAP_WIDTH - dangerSize, 0, dangerSize, GAME_CONFIG.MAP_HEIGHT);
    
    const gt = ctx.createLinearGradient(0, 0, 0, dangerSize);
    gt.addColorStop(0, 'rgba(255, 71, 87, 0.4)');
    gt.addColorStop(1, 'rgba(255, 71, 87, 0)');
    ctx.fillStyle = gt;
    ctx.fillRect(0, 0, GAME_CONFIG.MAP_WIDTH, dangerSize);
    
    const gb = ctx.createLinearGradient(0, GAME_CONFIG.MAP_HEIGHT, 0, GAME_CONFIG.MAP_HEIGHT - dangerSize);
    gb.addColorStop(0, 'rgba(255, 71, 87, 0.4)');
    gb.addColorStop(1, 'rgba(255, 71, 87, 0)');
    ctx.fillStyle = gb;
    ctx.fillRect(0, GAME_CONFIG.MAP_HEIGHT - dangerSize, GAME_CONFIG.MAP_WIDTH, dangerSize);
  }
  
  private drawFood(ctx: CanvasRenderingContext2D, food: Food): void {
    const radius = GAME_CONFIG.FOOD_RADIUS;
    
    ctx.beginPath();
    ctx.arc(food.x, food.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = food.color;
    ctx.fill();
  }
  
  private drawSnake(ctx: CanvasRenderingContext2D, snake: ClientSnake, isLocal: boolean): void {
    const color = snake.color;
    const darkerColor = this.darkenColor(color, 0.35);
    const lighterColor = this.lightenColor(color, 0.2);
    const baseRadius = GAME_CONFIG.SEGMENT_RADIUS;
    
    // Glow для локального игрока
    if (isLocal) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
    }
    
    // Segments
    for (let i = snake.segments.length - 1; i >= 0; i--) {
      const seg = snake.segments[i];
      const taperFactor = i < 4 ? 0.5 + (i / 4) * 0.5 : 1;
      const radius = baseRadius * taperFactor;
      
      const segGradient = ctx.createRadialGradient(
        seg.x - radius * 0.3, seg.y - radius * 0.3, 0,
        seg.x, seg.y, radius
      );
      
      const isStripe = i % 5 === 0;
      segGradient.addColorStop(0, isStripe ? lighterColor : color);
      segGradient.addColorStop(1, isStripe ? color : darkerColor);
      
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = segGradient;
      ctx.fill();
    }
    
    // Head
    const headRadius = GAME_CONFIG.HEAD_RADIUS;
    
    const headGradient = ctx.createRadialGradient(
      snake.head.x - headRadius * 0.3, snake.head.y - headRadius * 0.3, 0,
      snake.head.x, snake.head.y, headRadius
    );
    headGradient.addColorStop(0, lighterColor);
    headGradient.addColorStop(1, color);
    
    ctx.beginPath();
    ctx.arc(snake.head.x, snake.head.y, headRadius, 0, Math.PI * 2);
    ctx.fillStyle = headGradient;
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    if (isLocal) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Eyes
    const eyeOffset = headRadius * 0.45;
    const eyeRadius = headRadius * 0.28;
    const eyeAngle1 = snake.angle + 0.5;
    const eyeAngle2 = snake.angle - 0.5;
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(
      snake.head.x + Math.cos(eyeAngle1) * eyeOffset,
      snake.head.y + Math.sin(eyeAngle1) * eyeOffset,
      eyeRadius, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      snake.head.x + Math.cos(eyeAngle2) * eyeOffset,
      snake.head.y + Math.sin(eyeAngle2) * eyeOffset,
      eyeRadius, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Pupils
    const pupilOffset = eyeRadius * 0.35;
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(
      snake.head.x + Math.cos(eyeAngle1) * eyeOffset + Math.cos(snake.angle) * pupilOffset,
      snake.head.y + Math.sin(eyeAngle1) * eyeOffset + Math.sin(snake.angle) * pupilOffset,
      eyeRadius * 0.55, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      snake.head.x + Math.cos(eyeAngle2) * eyeOffset + Math.cos(snake.angle) * pupilOffset,
      snake.head.y + Math.sin(eyeAngle2) * eyeOffset + Math.sin(snake.angle) * pupilOffset,
      eyeRadius * 0.55, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Eye shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(
      snake.head.x + Math.cos(eyeAngle1) * eyeOffset - eyeRadius * 0.2,
      snake.head.y + Math.sin(eyeAngle1) * eyeOffset - eyeRadius * 0.2,
      eyeRadius * 0.2, 0, Math.PI * 2
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      snake.head.x + Math.cos(eyeAngle2) * eyeOffset - eyeRadius * 0.2,
      snake.head.y + Math.sin(eyeAngle2) * eyeOffset - eyeRadius * 0.2,
      eyeRadius * 0.2, 0, Math.PI * 2
    );
    ctx.fill();
    
    // Name tag
    const nameY = snake.head.y - headRadius - 18;
    ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    
    const textWidth = ctx.measureText(snake.name).width;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(snake.head.x - textWidth/2 - 8, nameY - 11, textWidth + 16, 20, 5);
    ctx.fill();
    
    ctx.fillStyle = isLocal ? '#4ECDC4' : 'white';
    ctx.fillText(snake.name, snake.head.x, nameY + 4);
    
    ctx.font = '10px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`${snake.length}`, snake.head.x, nameY + 17);
  }
  
  private drawMinimap(snakes: Map<string, ClientSnake>, localPlayerId: string | null): void {
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const scaleX = w / GAME_CONFIG.MAP_WIDTH;
    const scaleY = h / GAME_CONFIG.MAP_HEIGHT;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(15, 15, 35, 0.9)');
    gradient.addColorStop(1, 'rgba(26, 26, 46, 0.9)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = 'rgba(78, 205, 196, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, h);
    
    for (const snake of snakes.values()) {
      const x = snake.head.x * scaleX;
      const y = snake.head.y * scaleY;
      const isLocal = snake.id === localPlayerId;
      const radius = isLocal ? 4 : 2;
      
      if (isLocal) {
        ctx.shadowColor = '#4ECDC4';
        ctx.shadowBlur = 6;
      }
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isLocal ? '#4ECDC4' : snake.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      this.camera.x * scaleX,
      this.camera.y * scaleY,
      this.canvas.width * scaleX,
      this.canvas.height * scaleY
    );
  }
  
  private darkenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * (1 - factor))}, ${Math.floor(g * (1 - factor))}, ${Math.floor(b * (1 - factor))})`;
  }
  
  private lightenColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.min(255, Math.floor(r + (255 - r) * factor))}, ${Math.min(255, Math.floor(g + (255 - g) * factor))}, ${Math.min(255, Math.floor(b + (255 - b) * factor))})`;
  }
}
