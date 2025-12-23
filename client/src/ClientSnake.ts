import { GAME_CONFIG } from '../../shared/constants';
import { SnakeNetworkState, Segment, Vector2 } from '../../shared/types';

export class ClientSnake {
  id: string;
  name: string;
  color: string;
  head: Vector2;
  targetHead: Vector2;
  angle: number;
  targetAngle: number;
  length: number;
  segments: Segment[];
  isBot: boolean;
  isLocal: boolean;
  
  constructor(state: SnakeNetworkState, isLocal: boolean) {
    this.id = state.id;
    this.name = state.name;
    this.color = state.color;
    this.head = { ...state.head };
    this.targetHead = { ...state.head };
    this.angle = state.angle;
    this.targetAngle = state.angle;
    this.length = state.length;
    this.isBot = state.isBot;
    this.isLocal = isLocal;
    this.segments = [];
    
    // Initialize segments
    this.rebuildSegments();
  }
  
  updateFromServer(state: SnakeNetworkState): void {
    this.targetHead = { ...state.head };
    this.targetAngle = state.angle;
    
    // Adjust segment count if length changed
    const lengthDiff = state.length - this.length;
    this.length = state.length;
    
    if (lengthDiff > 0) {
      // Add segments at tail
      const lastSeg = this.segments[this.segments.length - 1] || this.head;
      for (let i = 0; i < lengthDiff; i++) {
        this.segments.push({ x: lastSeg.x, y: lastSeg.y });
      }
    } else if (lengthDiff < 0) {
      // Remove segments from tail
      this.segments.splice(this.segments.length + lengthDiff);
    }
  }
  
  private rebuildSegments(): void {
    this.segments = [];
    for (let i = 0; i < this.length; i++) {
      this.segments.push({
        x: this.head.x - Math.cos(this.angle) * GAME_CONFIG.SEGMENT_SPACING * (i + 1),
        y: this.head.y - Math.sin(this.angle) * GAME_CONFIG.SEGMENT_SPACING * (i + 1)
      });
    }
  }
  
  interpolate(t: number): void {
    // Interpolate head position
    this.head.x += (this.targetHead.x - this.head.x) * t;
    this.head.y += (this.targetHead.y - this.head.y) * t;
    
    // Interpolate angle
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.angle += angleDiff * t;
  }
  
  updateSegments(): void {
    if (this.segments.length === 0) return;
    
    let leader: Vector2 = this.head;
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
