import { Vector2, Segment, SnakeState, SnakeNetworkState } from '../shared/types.js';
import { GAME_CONFIG } from '../shared/constants.js';

export class Snake {
  id: string;
  name: string;
  color: string;
  head: Vector2;
  angle: number;
  targetAngle: number;
  segments: Segment[];
  isBot: boolean;
  isDead: boolean;
  
  constructor(id: string, name: string, x: number, y: number, isBot = false, color?: string) {
    this.id = id;
    this.name = name;
    this.color = color || GAME_CONFIG.SNAKE_COLORS[Math.floor(Math.random() * GAME_CONFIG.SNAKE_COLORS.length)];
    this.head = { x, y };
    this.angle = Math.random() * Math.PI * 2;
    this.targetAngle = this.angle;
    this.segments = [];
    this.isBot = isBot;
    this.isDead = false;
    
    // Initialize segments behind head
    for (let i = 0; i < GAME_CONFIG.INITIAL_LENGTH; i++) {
      this.segments.push({
        x: x - Math.cos(this.angle) * GAME_CONFIG.SEGMENT_SPACING * (i + 1),
        y: y - Math.sin(this.angle) * GAME_CONFIG.SEGMENT_SPACING * (i + 1)
      });
    }
  }
  
  get length(): number {
    return this.segments.length;
  }
  
  setTargetAngle(angle: number): void {
    this.targetAngle = angle;
  }
  
  update(): void {
    if (this.isDead) return;
    
    // Smooth turning
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    if (Math.abs(angleDiff) > GAME_CONFIG.TURN_SPEED) {
      this.angle += Math.sign(angleDiff) * GAME_CONFIG.TURN_SPEED;
    } else {
      this.angle = this.targetAngle;
    }
    
    // Normalize angle
    while (this.angle > Math.PI) this.angle -= Math.PI * 2;
    while (this.angle < -Math.PI) this.angle += Math.PI * 2;
    
    // Move head
    const prevHead = { ...this.head };
    this.head.x += Math.cos(this.angle) * GAME_CONFIG.BASE_SPEED;
    this.head.y += Math.sin(this.angle) * GAME_CONFIG.BASE_SPEED;
    
    // Update segments - follow the leader
    if (this.segments.length > 0) {
      let leader = prevHead;
      for (let i = 0; i < this.segments.length; i++) {
        const seg = this.segments[i];
        const dx = leader.x - seg.x;
        const dy = leader.y - seg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > GAME_CONFIG.SEGMENT_SPACING) {
          const ratio = GAME_CONFIG.SEGMENT_SPACING / dist;
          seg.x = leader.x - dx * ratio;
          seg.y = leader.y - dy * ratio;
        }
        leader = seg;
      }
    }
  }
  
  grow(amount: number): void {
    const lastSeg = this.segments[this.segments.length - 1] || this.head;
    for (let i = 0; i < amount; i++) {
      if (this.segments.length >= GAME_CONFIG.MAX_LENGTH) break;
      this.segments.push({ x: lastSeg.x, y: lastSeg.y });
    }
  }
  
  removeTailFrom(index: number): Segment[] {
    const removed = this.segments.splice(index);
    return removed;
  }
  
  checkWallCollision(): boolean {
    const margin = GAME_CONFIG.HEAD_RADIUS;
    return (
      this.head.x < margin ||
      this.head.x > GAME_CONFIG.MAP_WIDTH - margin ||
      this.head.y < margin ||
      this.head.y > GAME_CONFIG.MAP_HEIGHT - margin
    );
  }
  
  checkSelfCollision(): boolean {
    // Свой хвост не убивает - как в оригинальном Slither.io
    return false;
  }
  
  getState(): SnakeState {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      head: { ...this.head },
      angle: this.angle,
      length: this.length,
      segments: this.segments.map(s => ({ ...s })),
      isBot: this.isBot
    };
  }
  
  getNetworkState(): SnakeNetworkState {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      head: { ...this.head },
      angle: this.angle,
      length: this.length,
      isBot: this.isBot
    };
  }
}
