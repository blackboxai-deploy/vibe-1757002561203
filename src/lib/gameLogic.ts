import { 
  GameState, 
  GameConfig, 
  PlayerCar, 
  EnemyCar, 
  Controls,
  GameStatus 
} from '@/types/game';
import { 
  generateId, 
  getLaneCenter, 
  checkCollision, 
  carToCollisionBox,
  lerp,
  randomInt,
  getRandomEnemyColor,
  isOffScreen,
  loadHighScore,
  saveHighScore
} from '@/lib/gameUtils';

// Default game configuration - Mobile Portrait Optimized with Better Balance
export const DEFAULT_CONFIG: GameConfig = {
  canvasWidth: 360, // Mobile portrait width
  canvasHeight: 640, // Mobile portrait height
  laneWidth: 120, // 360/3 = 120px per lane
  carWidth: 45, // Smaller cars for mobile
  carHeight: 80, // Shorter cars to fit 6 in view
  playerSpeed: 10, // Faster lane switching for mobile
  enemySpeed: 2.0, // Slower base speed for better gameplay
  spawnRate: 120, // Less frequent spawns (every 2 seconds at 60fps)
  speedIncrement: 0.2, // Gentler speed increases
  pointsPerCar: 10,
  pointsPerSecond: 1,
};

// Initialize game state
export const createInitialGameState = (): GameState => {
  return {
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    highScore: loadHighScore(),
    level: 1,
    speed: 1.0,
    timeElapsed: 0,
  };
};

// Initialize player car
export const createPlayerCar = (config: GameConfig): PlayerCar => {
  const startLane = 1; // Middle lane
  return {
    id: 'player',
    position: {
      x: getLaneCenter(startLane, config.laneWidth),
      y: config.canvasHeight - 100, // Closer to bottom for mobile
    },
    size: {
      width: config.carWidth,
      height: config.carHeight,
    },
    color: '#dc2626', // Red color
    speed: config.playerSpeed,
    lane: startLane,
    targetLane: startLane,
    isMoving: false,
  };
};

// Create enemy car with lane selection
export const createEnemyCar = (config: GameConfig, preferredLane?: number): EnemyCar => {
  const lane = preferredLane !== undefined ? preferredLane : randomInt(0, 2);
  const isAmbulance = Math.random() < 0.08; // Reduced to 8% chance for ambulance
  
  return {
    id: generateId(),
    position: {
      x: getLaneCenter(lane, config.laneWidth),
      y: -config.carHeight / 2, // Start above screen
    },
    size: {
      width: config.carWidth,
      height: config.carHeight,
    },
    color: isAmbulance ? '#ffffff' : getRandomEnemyColor(),
    speed: config.enemySpeed * (isAmbulance ? 1.1 : 1), // Ambulances only 10% faster
    lane,
  };
};

// Update player car position (smooth lane transitions)
export const updatePlayerCar = (
  player: PlayerCar, 
  controls: Controls, 
  config: GameConfig,
  deltaTime: number
): PlayerCar => {
  const updated = { ...player };
  
  // Handle lane switching input
  if (controls.left && !updated.isMoving && updated.lane > 0) {
    updated.targetLane = updated.lane - 1;
    updated.isMoving = true;
  } else if (controls.right && !updated.isMoving && updated.lane < 2) {
    updated.targetLane = updated.lane + 1;
    updated.isMoving = true;
  }
  
  // Smooth lane transition
  if (updated.isMoving) {
    const targetX = getLaneCenter(updated.targetLane, config.laneWidth);
    const currentX = updated.position.x;
    const moveSpeed = updated.speed * deltaTime * 60; // Adjust for frame rate
    
    // Move towards target lane
    if (Math.abs(targetX - currentX) < moveSpeed) {
      // Reached target
      updated.position.x = targetX;
      updated.lane = updated.targetLane;
      updated.isMoving = false;
    } else {
      // Continue moving
      updated.position.x = lerp(currentX, targetX, 0.15);
    }
  }
  
  return updated;
};

// Update enemy cars
export const updateEnemyCars = (
  enemies: EnemyCar[],
  gameState: GameState,
  config: GameConfig,
  deltaTime: number
): EnemyCar[] => {
  return enemies
    .map(enemy => ({
      ...enemy,
      position: {
        ...enemy.position,
        y: enemy.position.y + enemy.speed * gameState.speed * deltaTime * 60,
      },
    }))
    .filter(enemy => !isOffScreen(enemy, config.canvasHeight));
};

// Check collisions between player and enemies
export const checkPlayerCollisions = (
  player: PlayerCar, 
  enemies: EnemyCar[]
): boolean => {
  const playerBox = carToCollisionBox(player);
  
  return enemies.some(enemy => {
    const enemyBox = carToCollisionBox(enemy);
    return checkCollision(playerBox, enemyBox);
  });
};

// Update game state
export const updateGameState = (
  gameState: GameState,
  deltaTime: number,
  config: GameConfig
): GameState => {
  if (!gameState.isPlaying || gameState.isPaused) {
    return gameState;
  }
  
  const updated = { ...gameState };
  
  // Update time
  updated.timeElapsed += deltaTime;
  
  // Add time-based score
  updated.score += config.pointsPerSecond * deltaTime;
  
  // Level progression (every 30 seconds)
  const newLevel = Math.floor(updated.timeElapsed / 30) + 1;
  if (newLevel > updated.level) {
    updated.level = newLevel;
    updated.speed += config.speedIncrement;
  }
  
  // Update high score
  if (updated.score > updated.highScore) {
    updated.highScore = Math.floor(updated.score);
    saveHighScore(updated.highScore);
  }
  
  return updated;
};

// Handle game over
export const gameOver = (gameState: GameState): GameState => {
  return {
    ...gameState,
    isPlaying: false,
    isGameOver: true,
    score: Math.floor(gameState.score),
  };
};

// Reset game for new round
export const resetGame = (config: GameConfig): {
  gameState: GameState;
  player: PlayerCar;
  enemies: EnemyCar[];
} => {
  return {
    gameState: {
      ...createInitialGameState(),
      isPlaying: true,
      highScore: loadHighScore(),
    },
    player: createPlayerCar(config),
    enemies: [],
  };
};

// Check if a lane has recent cars that would block escape routes
const isLaneRecentlyOccupied = (enemies: EnemyCar[], lane: number, config: GameConfig): boolean => {
  return enemies.some(enemy => 
    enemy.lane === lane && 
    enemy.position.y < config.canvasHeight * 0.5 && // Check top 50% only for escape routes
    enemy.position.y > -config.carHeight
  );
};

// Check if we can spawn a car without creating too dense traffic
const canSpawnInLane = (enemies: EnemyCar[], lane: number, config: GameConfig): boolean => {
  const carsInLane = enemies.filter(enemy => enemy.lane === lane);
  
  // Ensure minimum spacing between cars (2 car lengths for better gameplay)
  const minSpacing = config.carHeight * 2.0;
  const hasSpaceAtTop = !carsInLane.some(car => 
    car.position.y < minSpacing && car.position.y > -config.carHeight
  );
  
  // Don't allow more than 4 cars in a lane at once (reduced from 6)
  const maxCarsPerLane = 4;
  const tooManyCars = carsInLane.length >= maxCarsPerLane;
  
  return hasSpaceAtTop && !tooManyCars;
};

// Check if player has at least one clear escape route
const playerHasEscapeRoute = (enemies: EnemyCar[], playerLane: number, config: GameConfig): boolean => {
  const adjacentLanes = [];
  if (playerLane > 0) adjacentLanes.push(playerLane - 1); // Left lane
  if (playerLane < 2) adjacentLanes.push(playerLane + 1); // Right lane
  
  // Check if at least one adjacent lane is clear in the player area
  return adjacentLanes.some(lane => {
    const dangerousCars = enemies.filter(enemy => 
      enemy.lane === lane && 
      enemy.position.y > config.canvasHeight * 0.3 && // Player area (bottom 70%)
      enemy.position.y < config.canvasHeight
    );
    return dangerousCars.length === 0;
  });
};

// Find safe lanes for spawning (ensures at least one adjacent lane is clear)
const findSafeLanesForSpawning = (
  enemies: EnemyCar[], 
  playerLane: number, 
  config: GameConfig
): number[] => {
  const safeLanes: number[] = [];
  
  // First, ensure player always has an escape route
  if (!playerHasEscapeRoute(enemies, playerLane, config)) {
    // Player is in danger! Don't spawn any cars that would block escape routes
    const adjacentLanes = [];
    if (playerLane > 0) adjacentLanes.push(playerLane - 1);
    if (playerLane < 2) adjacentLanes.push(playerLane + 1);
    
    // Only allow spawning in non-adjacent lanes to give player breathing room
    for (let lane = 0; lane < 3; lane++) {
      if (!adjacentLanes.includes(lane) && lane !== playerLane && canSpawnInLane(enemies, lane, config)) {
        safeLanes.push(lane);
      }
    }
    
    // If no safe non-adjacent lanes, return empty array (skip this spawn)
    return safeLanes;
  }
  
  // Normal spawning logic when player has escape routes
  for (let lane = 0; lane < 3; lane++) {
    const canSpawn = canSpawnInLane(enemies, lane, config);
    
    if (canSpawn) {
      // Check if spawning here would still leave player with escape routes
      const tempEnemies = [...enemies];
      // Simulate adding a car to this lane
      tempEnemies.push({
        id: 'temp',
        position: { x: 0, y: -config.carHeight / 2 },
        size: { width: config.carWidth, height: config.carHeight },
        color: '#000000',
        speed: config.enemySpeed,
        lane: lane
      });
      
      // Ensure player still has escape routes after this spawn
      if (playerHasEscapeRoute(tempEnemies, playerLane, config)) {
        safeLanes.push(lane);
      }
    }
  }
  
  // If no safe lanes found and player is safe, allow least crowded lane
  if (safeLanes.length === 0 && playerHasEscapeRoute(enemies, playerLane, config)) {
    let bestLane = 1;
    let minCars = Number.MAX_SAFE_INTEGER;
    
    for (let lane = 0; lane < 3; lane++) {
      if (canSpawnInLane(enemies, lane, config)) {
        const carsInLane = enemies.filter(enemy => enemy.lane === lane).length;
        if (carsInLane < minCars) {
          minCars = carsInLane;
          bestLane = lane;
        }
      }
    }
    if (minCars < Number.MAX_SAFE_INTEGER) {
      safeLanes.push(bestLane);
    }
  }
  
  return safeLanes;
};

// Smart spawn enemy car logic with safety checks
export const shouldSpawnEnemy = (
  frameCount: number,
  gameState: GameState,
  config: GameConfig,
  enemies: EnemyCar[],
  playerLane: number
): boolean => {
  // Base spawn rate with gentler progression
  const adjustedSpawnRate = Math.max(
    60, // Minimum spawn rate (1 second at 60fps) - increased from 30
    config.spawnRate - (gameState.level - 1) * 8 // Gentler progression
  );
  
  // Don't spawn if it's not time yet
  if (frameCount % adjustedSpawnRate !== 0) {
    return false;
  }
  
  // Don't spawn if player doesn't have escape routes
  if (!playerHasEscapeRoute(enemies, playerLane, config)) {
    return false;
  }
  
  // Don't spawn if traffic is too dense overall
  const totalCars = enemies.length;
  const maxTotalCars = 8; // Reduced from allowing 18 cars (6 per lane * 3)
  if (totalCars >= maxTotalCars) {
    return false;
  }
  
  return true;
};

// Smart enemy car creation with lane safety
export const createSmartEnemyCar = (
  enemies: EnemyCar[],
  playerLane: number,
  config: GameConfig
): EnemyCar | null => {
  const safeLanes = findSafeLanesForSpawning(enemies, playerLane, config);
  
  // If no safe lanes available, don't spawn a car
  if (safeLanes.length === 0) {
    return null;
  }
  
  const selectedLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
  return createEnemyCar(config, selectedLane);
};

// Add points for avoiding cars
export const addCarAvoidedPoints = (gameState: GameState, config: GameConfig): GameState => {
  return {
    ...gameState,
    score: gameState.score + config.pointsPerCar,
  };
};

// Toggle pause state
export const togglePause = (gameState: GameState): GameState => {
  if (!gameState.isPlaying) return gameState;
  
  return {
    ...gameState,
    isPaused: !gameState.isPaused,
  };
};

// Get current game status
export const getGameStatus = (gameState: GameState): GameStatus => {
  if (gameState.isGameOver) return GameStatus.GAME_OVER;
  if (gameState.isPaused) return GameStatus.PAUSED;
  if (gameState.isPlaying) return GameStatus.PLAYING;
  return GameStatus.START_SCREEN;
};