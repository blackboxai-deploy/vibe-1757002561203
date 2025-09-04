'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from '@/components/GameCanvas';
import GameUI from '@/components/GameUI';
import { 
  GameState, 
  PlayerCar, 
  EnemyCar, 
  Controls,
  GameStatus
} from '@/types/game';
import {
  DEFAULT_CONFIG,
  createInitialGameState,
  createPlayerCar,
  createSmartEnemyCar,
  updatePlayerCar,
  updateEnemyCars,
  checkPlayerCollisions,
  updateGameState,
  gameOver,
  resetGame,
  shouldSpawnEnemy,
  addCarAvoidedPoints,
  togglePause,
  getGameStatus,
} from '@/lib/gameLogic';

const CarGame: React.FC = () => {
  // Game state
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [player, setPlayer] = useState<PlayerCar>(createPlayerCar(DEFAULT_CONFIG));
  const [enemies, setEnemies] = useState<EnemyCar[]>([]);
  const [controls, setControls] = useState<Controls>({
    left: false,
    right: false,
    space: false,
    enter: false,
  });

  // Game loop references
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const previousEnemyCountRef = useRef<number>(0);
  const playerRef = useRef<PlayerCar>(player);

  // Get current game status
  const currentGameStatus = getGameStatus(gameState);

  // Handle keyboard input
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowLeft':
        event.preventDefault();
        setControls(prev => ({ ...prev, left: true }));
        break;
      case 'ArrowRight':
        event.preventDefault();
        setControls(prev => ({ ...prev, right: true }));
        break;
      case 'Space':
        event.preventDefault();
        setControls(prev => ({ ...prev, space: true }));
        break;
      case 'Enter':
        event.preventDefault();
        setControls(prev => ({ ...prev, enter: true }));
        break;
    }
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowLeft':
        event.preventDefault();
        setControls(prev => ({ ...prev, left: false }));
        break;
      case 'ArrowRight':
        event.preventDefault();
        setControls(prev => ({ ...prev, right: false }));
        break;
      case 'Space':
        event.preventDefault();
        setControls(prev => ({ ...prev, space: false }));
        break;
      case 'Enter':
        event.preventDefault();
        setControls(prev => ({ ...prev, enter: false }));
        break;
    }
  }, []);

  // Handle touch controls for mobile
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    const touch = event.touches[0];
    const canvasRect = event.currentTarget.getBoundingClientRect();
    const touchX = touch.clientX - canvasRect.left;
    const canvasWidth = canvasRect.width;
    
    // Divide screen into thirds for lane control
    if (touchX < canvasWidth / 3) {
      // Left third - move left
      setControls(prev => ({ ...prev, left: true }));
    } else if (touchX > (canvasWidth * 2) / 3) {
      // Right third - move right  
      setControls(prev => ({ ...prev, right: true }));
    } else {
      // Middle third - pause/resume
      setControls(prev => ({ ...prev, space: true }));
    }
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    setControls(prev => ({ 
      ...prev, 
      left: false, 
      right: false, 
      space: false 
    }));
  }, []);

  // Start new game
  const startGame = useCallback(() => {
    const { gameState: newGameState, player: newPlayer, enemies: newEnemies } = 
      resetGame(DEFAULT_CONFIG);
    
    setGameState(newGameState);
    setPlayer(newPlayer);
    setEnemies(newEnemies);
    frameCountRef.current = 0;
    previousEnemyCountRef.current = 0;
  }, []);

  // Restart game
  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  // Toggle pause
  const handleTogglePause = useCallback(() => {
    setGameState(prev => togglePause(prev));
  }, []);

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    const deltaTime = (currentTime - lastTimeRef.current) / 1000;
    lastTimeRef.current = currentTime;
    
    // Skip if delta time is too large (tab was inactive)
    if (deltaTime > 0.1) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    setGameState(prevGameState => {
      if (!prevGameState.isPlaying || prevGameState.isPaused) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return prevGameState;
      }

      // Update game state
      const updatedGameState = updateGameState(prevGameState, deltaTime, DEFAULT_CONFIG);

      // Update player
      setPlayer(prevPlayer => {
        const updatedPlayer = updatePlayerCar(prevPlayer, controls, DEFAULT_CONFIG, deltaTime);
        playerRef.current = updatedPlayer; // Keep ref updated
        return updatedPlayer;
      });

      // Update enemies
      setEnemies(prevEnemies => {
        let updatedEnemies = updateEnemyCars(
          prevEnemies, 
          updatedGameState, 
          DEFAULT_CONFIG, 
          deltaTime
        );

        // Add points for cars that passed
        const carsPassedBottom = prevEnemies.length - updatedEnemies.length;
        let scoreUpdatedState = updatedGameState;
        for (let i = 0; i < carsPassedBottom; i++) {
          scoreUpdatedState = addCarAvoidedPoints(scoreUpdatedState, DEFAULT_CONFIG);
        }

        // Spawn new enemies using smart logic
        frameCountRef.current++;
        if (shouldSpawnEnemy(
          frameCountRef.current, 
          updatedGameState, 
          DEFAULT_CONFIG,
          updatedEnemies,
          playerRef.current.lane
        )) {
          const newEnemy = createSmartEnemyCar(updatedEnemies, playerRef.current.lane, DEFAULT_CONFIG);
          if (newEnemy) {
            updatedEnemies = [...updatedEnemies, newEnemy];
          }
        }

        // Update state with score changes
        if (scoreUpdatedState.score !== updatedGameState.score) {
          setGameState(scoreUpdatedState);
        }

        return updatedEnemies;
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
      return updatedGameState;
    });
  }, [controls]);

  // Check for collisions
  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      if (checkPlayerCollisions(player, enemies)) {
        setGameState(prev => gameOver(prev));
      }
    }
  }, [player, enemies, gameState.isPlaying, gameState.isPaused]);

  // Handle keyboard and touch events
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Handle control actions (with debouncing)
  useEffect(() => {
    if (controls.enter) {
      if (currentGameStatus === GameStatus.START_SCREEN || 
          currentGameStatus === GameStatus.GAME_OVER) {
        startGame();
      }
    }

    if (controls.space) {
      if (currentGameStatus === GameStatus.PLAYING || 
          currentGameStatus === GameStatus.PAUSED) {
        handleTogglePause();
      }
    }
  }, [controls.enter, controls.space, currentGameStatus, startGame, handleTogglePause]);

  // Start game loop
  useEffect(() => {
    if (gameState.isPlaying) {
      lastTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.isPlaying, gameLoop]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-2">
      <div className="relative max-w-sm mx-auto">
        <div 
          className="touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <GameCanvas
            width={DEFAULT_CONFIG.canvasWidth}
            height={DEFAULT_CONFIG.canvasHeight}
            player={player}
            enemies={enemies}
            config={DEFAULT_CONFIG}
          />
        </div>
        
        <GameUI
          gameState={gameState}
          gameStatus={currentGameStatus}
          onStartGame={startGame}
          onRestartGame={restartGame}
          onTogglePause={handleTogglePause}
        />
      </div>
      
      <div className="mt-2 text-xs text-gray-300 text-center px-4">
        <p className="mb-1">
          📱 <strong>Mobile Controls:</strong> Tap left/right sides to change lanes, center to pause
        </p>
        <p>
          ⌨️ <strong>Desktop:</strong> Arrow keys to change lanes, Space to pause
        </p>
      </div>
    </div>
  );
};

export default CarGame;