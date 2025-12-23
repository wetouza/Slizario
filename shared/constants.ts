// Game constants shared between client and server

export const GAME_CONFIG = {
  // Map dimensions
  MAP_WIDTH: 3000,
  MAP_HEIGHT: 3000,
  
  // Snake settings
  SEGMENT_RADIUS: 10,
  SEGMENT_SPACING: 8,
  HEAD_RADIUS: 12,
  INITIAL_LENGTH: 10,
  MAX_LENGTH: 500,
  
  // Movement
  BASE_SPEED: 3,
  TURN_SPEED: 0.15,
  
  // Food
  FOOD_RADIUS: 6,
  FOOD_COUNT: 300,
  FOOD_VALUE: 1,
  SEGMENT_FOOD_VALUE: 2,
  
  // Network
  SERVER_PORT: 8080,
  TICK_RATE: 60,
  NETWORK_TICK_RATE: 20,
  
  // Bots
  BOT_COUNT: 5,
  BOT_VISION_RANGE: 400,
  BOT_REACTION_DELAY: 150,
  
  // Colors
  SNAKE_COLORS: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
  ],
  FOOD_COLORS: [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ]
} as const;

export const MESSAGE_TYPE = {
  // Client -> Server
  JOIN: 'join',
  INPUT: 'input',
  
  // Server -> Client
  INIT: 'init',
  STATE: 'state',
  DEATH: 'death',
  FOOD_UPDATE: 'food_update'
} as const;
