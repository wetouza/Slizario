// Shared types between client and server

export interface Vector2 {
  x: number;
  y: number;
}

export interface Segment {
  x: number;
  y: number;
}

export interface SnakeState {
  id: string;
  name: string;
  color: string;
  head: Vector2;
  angle: number;
  length: number;
  segments: Segment[];
  isBot: boolean;
}

export interface SnakeNetworkState {
  id: string;
  name: string;
  color: string;
  head: Vector2;
  angle: number;
  length: number;
  isBot: boolean;
}

export interface Food {
  id: string;
  x: number;
  y: number;
  color: string;
  value: number;
}

export interface GameState {
  snakes: SnakeNetworkState[];
  foods: Food[];
  timestamp: number;
}

// Messages
export interface JoinMessage {
  type: 'join';
  name: string;
  color?: string;
}

export interface InputMessage {
  type: 'input';
  targetAngle: number;
}

export interface InitMessage {
  type: 'init';
  playerId: string;
  state: GameState;
}

export interface StateMessage {
  type: 'state';
  snakes: SnakeNetworkState[];
  timestamp: number;
}

export interface DeathMessage {
  type: 'death';
  killerId: string | null;
  finalLength: number;
}

export interface FoodUpdateMessage {
  type: 'food_update';
  added: Food[];
  removed: string[];
}

export type ClientMessage = JoinMessage | InputMessage;
export type ServerMessage = InitMessage | StateMessage | DeathMessage | FoodUpdateMessage;
