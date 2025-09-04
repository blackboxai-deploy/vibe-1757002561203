// Game object interfaces and types

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Car {
  id: string;
  position: Position;
  size: Size;
  color: string;
  speed: number;
  lane: number; // 0, 1, or 2 for the three lanes
}

export interface PlayerCar extends Car {
  targetLane: number; // For smooth lane transitions
  isMoving: boolean;
}

export type EnemyCar = Car;

export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  highScore: number;
  level: number;
  speed: number; // Base game speed multiplier
  timeElapsed: number;
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  laneWidth: number;
  carWidth: number;
  carHeight: number;
  playerSpeed: number; // Lane switching speed
  enemySpeed: number; // Initial enemy car speed
  spawnRate: number; // Initial enemy spawn rate (lower = more frequent)
  speedIncrement: number; // Speed increase per level
  pointsPerCar: number;
  pointsPerSecond: number;
}

export interface Controls {
  left: boolean;
  right: boolean;
  space: boolean;
  enter: boolean;
}

export interface GameBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export enum GameStatus {
  START_SCREEN = 'START_SCREEN',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export interface CollisionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}