'use client';

import React from 'react';
import { GameState, GameStatus } from '@/types/game';
import { formatScore, formatTime } from '@/lib/gameUtils';
import { Button } from '@/components/ui/button';

interface GameUIProps {
  gameState: GameState;
  gameStatus: GameStatus;
  onStartGame: () => void;
  onRestartGame: () => void;
  onTogglePause: () => void;
}

const GameUI: React.FC<GameUIProps> = ({
  gameState,
  gameStatus,
  onStartGame,
  onRestartGame,
  onTogglePause,
}) => {
  // Start Screen - Mobile optimized
  if (gameStatus === GameStatus.START_SCREEN) {
    return (
      <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-10">
        <div className="text-center text-white p-4 bg-gray-900 rounded-lg shadow-2xl max-w-xs mx-4">
          <h1 className="text-3xl font-bold mb-3 text-red-500">
            LANE WEAVER
          </h1>
          <p className="text-base mb-4">
            Navigate your red car through traffic!
          </p>
          <div className="text-xs mb-4 space-y-1">
            <p><span className="font-semibold">Mobile:</span></p>
            <p>Tap left/right sides to change lanes</p>
            <p>Tap center to pause</p>
            <p><span className="font-semibold">Desktop:</span></p>
            <p>← → Arrow Keys, SPACE to pause</p>
          </div>
          <p className="text-xs mb-4 text-yellow-400">
            Avoid collisions and survive!<br/>
            Watch for 🚑 ambulances - they're faster!
          </p>
          {gameState.highScore > 0 && (
            <p className="text-xs mb-3 text-green-400">
              High Score: {formatScore(gameState.highScore)}
            </p>
          )}
          <Button 
            onClick={onStartGame}
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2"
          >
            START GAME
          </Button>
        </div>
      </div>
    );
  }

  // Game Over Screen - Mobile optimized
  if (gameStatus === GameStatus.GAME_OVER) {
    const isNewHighScore = gameState.score === gameState.highScore && gameState.score > 0;
    
    return (
      <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-10">
        <div className="text-center text-white p-4 bg-gray-900 rounded-lg shadow-2xl max-w-xs mx-4">
          <h2 className="text-2xl font-bold mb-3 text-red-500">
            GAME OVER
          </h2>
          
          {isNewHighScore && (
            <div className="mb-3">
              <p className="text-lg font-bold text-yellow-400 animate-pulse">
                🎉 NEW HIGH SCORE! 🎉
              </p>
            </div>
          )}
          
          <div className="space-y-1 mb-4">
            <p className="text-lg">
              <span className="font-semibold">Score:</span> {formatScore(gameState.score)}
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-semibold">Time:</span> {formatTime(gameState.timeElapsed)}
            </p>
            <p className="text-sm text-gray-300">
              <span className="font-semibold">Level:</span> {gameState.level}
            </p>
            {gameState.highScore > 0 && (
              <p className="text-xs text-green-400">
                High Score: {formatScore(gameState.highScore)}
              </p>
            )}
          </div>
          
          <Button 
            onClick={onRestartGame}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2"
          >
            PLAY AGAIN
          </Button>
        </div>
      </div>
    );
  }

  // In-Game HUD - Mobile optimized
  return (
    <div className="absolute top-2 left-2 right-2 flex justify-between items-start text-white z-10">
      {/* Left side - Game stats */}
      <div className="bg-black bg-opacity-70 rounded-lg p-2 min-w-[120px]">
        <div className="space-y-0.5 text-xs">
          <div className="flex justify-between">
            <span>Score:</span>
            <span className="font-mono font-bold text-yellow-400">
              {formatScore(Math.floor(gameState.score))}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span className="font-mono">{formatTime(gameState.timeElapsed)}</span>
          </div>
          <div className="flex justify-between">
            <span>Lvl:</span>
            <span className="font-mono">{gameState.level}</span>
          </div>
          <div className="flex justify-between">
            <span>Speed:</span>
            <span className="font-mono">{gameState.speed.toFixed(1)}x</span>
          </div>
        </div>
      </div>

      {/* Right side - High score */}
      <div className="bg-black bg-opacity-70 rounded-lg p-2">
        <div className="text-xs space-y-0.5">
          {gameState.highScore > 0 && (
            <div className="text-green-400 font-semibold">
              Best: {formatScore(gameState.highScore)}
            </div>
          )}
          <div className="text-xs text-gray-300">
            <div>📱 Tap sides</div>
          </div>
        </div>
      </div>

      {/* Pause indicator */}
      {gameStatus === GameStatus.PAUSED && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-gray-900 rounded-lg p-4 text-center">
            <h3 className="text-xl font-bold mb-3">PAUSED</h3>
            <p className="text-xs mb-3">Tap center or press SPACE</p>
            <Button 
              onClick={onTogglePause}
              variant="outline"
              size="sm"
              className="text-white border-white hover:bg-white hover:text-black"
            >
              RESUME
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameUI;