import { Car, CollisionBox, Position } from '@/types/game';

// Generate unique IDs for game objects
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

// Calculate lane center position based on lane index
export const getLaneCenter = (lane: number, laneWidth: number): number => {
  return (lane * laneWidth) + (laneWidth / 2);
};

// Check collision between two rectangular objects
export const checkCollision = (obj1: CollisionBox, obj2: CollisionBox): boolean => {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
};

// Convert car object to collision box
export const carToCollisionBox = (car: Car): CollisionBox => {
  return {
    x: car.position.x - car.size.width / 2,
    y: car.position.y - car.size.height / 2,
    width: car.size.width,
    height: car.size.height
  };
};

// Clamp a value between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Linear interpolation for smooth animations
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

// Random number generator helpers
export const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(randomBetween(min, max + 1));
};

// Choose random element from array
export const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Distance calculation between two points
export const distance = (pos1: Position, pos2: Position): number => {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Check if a car is off screen (for cleanup)
export const isOffScreen = (car: Car, canvasHeight: number): boolean => {
  return car.position.y - car.size.height / 2 > canvasHeight;
};

// Format time for display (seconds to MM:SS)
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Format score with commas
export const formatScore = (score: number): string => {
  return score.toLocaleString();
};

// Get contrasting text color based on background
export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation - could be enhanced
  const darkColors = ['black', 'blue', 'darkblue', 'purple', 'darkgreen'];
  return darkColors.includes(backgroundColor.toLowerCase()) ? 'white' : 'black';
};

// Car color options for enemy cars
export const ENEMY_CAR_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green  
  '#f59e0b', // Yellow
  '#ef4444', // Red (different shade from player)
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

// Get random enemy car color
export const getRandomEnemyColor = (): string => {
  return randomChoice(ENEMY_CAR_COLORS);
};

// Save high score to localStorage
export const saveHighScore = (score: number): void => {
  try {
    localStorage.setItem('carGame_highScore', score.toString());
  } catch (error) {
    console.warn('Could not save high score to localStorage:', error);
  }
};

// Load high score from localStorage
export const loadHighScore = (): number => {
  try {
    const saved = localStorage.getItem('carGame_highScore');
    return saved ? parseInt(saved, 10) || 0 : 0;
  } catch (error) {
    console.warn('Could not load high score from localStorage:', error);
    return 0;
  }
};