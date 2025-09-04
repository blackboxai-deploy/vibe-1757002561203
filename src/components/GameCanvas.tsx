'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { PlayerCar, EnemyCar, GameConfig } from '@/types/game';

interface GameCanvasProps {
  width: number;
  height: number;
  player: PlayerCar;
  enemies: EnemyCar[];
  config: GameConfig;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  width,
  height,
  player,
  enemies,
  config,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw road with lanes - Mobile optimized
  const drawRoad = (ctx: CanvasRenderingContext2D) => {
    // Background (asphalt)
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, width, height);

    // Lane dividers - adjusted for mobile
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2; // Thinner lines for mobile
    ctx.setLineDash([15, 15]); // Shorter dashes for mobile

    // Draw lane divider lines
    for (let i = 1; i < 3; i++) {
      const x = i * config.laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Road edges
    ctx.setLineDash([]);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3; // Slightly thinner for mobile
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(width, height);
    ctx.stroke();
  };

  // Draw a car
  const drawCar = (ctx: CanvasRenderingContext2D, car: PlayerCar | EnemyCar) => {
    const { x, y } = car.position;
    const { width: carWidth, height: carHeight } = car.size;
    const isAmbulance = car.color === '#ffffff';

    // Car body
    ctx.fillStyle = car.color;
    ctx.fillRect(
      x - carWidth / 2,
      y - carHeight / 2,
      carWidth,
      carHeight
    );

    // Car outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      x - carWidth / 2,
      y - carHeight / 2,
      carWidth,
      carHeight
    );

    // Ambulance special markings - Mobile optimized
    if (isAmbulance) {
      // Red cross on top - smaller for mobile
      ctx.fillStyle = '#ff0000';
      const crossSize = 8; // Smaller cross for mobile cars
      // Vertical bar
      ctx.fillRect(x - 1.5, y - crossSize / 2, 3, crossSize);
      // Horizontal bar
      ctx.fillRect(x - crossSize / 2, y - 1.5, crossSize, 3);

      // Red stripes on sides - thinner for mobile
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x - carWidth / 2, y - 8, carWidth, 2);
      ctx.fillRect(x - carWidth / 2, y + 8, carWidth, 2);

      // Ambulance text (emoji) - smaller for mobile
      ctx.font = '12px Arial';
      ctx.fillStyle = '#ff0000';
      ctx.textAlign = 'center';
      ctx.fillText('🚑', x, y + carHeight / 2 + 15);
    }

    // Windshield
    ctx.fillStyle = isAmbulance ? '#e6f3ff' : '#87ceeb';
    ctx.fillRect(
      x - carWidth / 2 + 5,
      y - carHeight / 2 + 5,
      carWidth - 10,
      carHeight / 3
    );

    // Rear window (for enemy cars)
    if (car.id !== 'player') {
      ctx.fillRect(
        x - carWidth / 2 + 5,
        y + carHeight / 2 - 5 - carHeight / 3,
        carWidth - 10,
        carHeight / 3
      );
    }

    // Wheels - smaller for mobile
    ctx.fillStyle = '#1a1a1a';
    const wheelWidth = 6; // Smaller wheels
    const wheelHeight = 12;
    
    // Front wheels
    ctx.fillRect(x - carWidth / 2 - 1, y - carHeight / 3, wheelWidth, wheelHeight);
    ctx.fillRect(x + carWidth / 2 - 5, y - carHeight / 3, wheelWidth, wheelHeight);
    
    // Rear wheels
    ctx.fillRect(x - carWidth / 2 - 1, y + carHeight / 6, wheelWidth, wheelHeight);
    ctx.fillRect(x + carWidth / 2 - 5, y + carHeight / 6, wheelWidth, wheelHeight);

    // Lights - smaller for mobile cars
    if (car.id === 'player') {
      ctx.fillStyle = '#ffffcc';
      ctx.fillRect(x - carWidth / 2 + 6, y - carHeight / 2 - 2, 8, 4);
      ctx.fillRect(x + carWidth / 2 - 14, y - carHeight / 2 - 2, 8, 4);
    } else if (isAmbulance) {
      // Flashing emergency lights (alternating red/blue) - smaller
      const flashColor = Math.floor(Date.now() / 200) % 2 === 0 ? '#ff0000' : '#0000ff';
      ctx.fillStyle = flashColor;
      ctx.fillRect(x - carWidth / 2 + 6, y - carHeight / 2 - 2, 8, 4);
      ctx.fillRect(x + carWidth / 2 - 14, y - carHeight / 2 - 2, 8, 4);
    } else {
      // Regular taillights for other enemy cars - smaller
      ctx.fillStyle = '#ff4444';
      ctx.fillRect(x - carWidth / 2 + 6, y + carHeight / 2 - 2, 8, 4);
      ctx.fillRect(x + carWidth / 2 - 14, y + carHeight / 2 - 2, 8, 4);
    }
  };

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw road
    drawRoad(ctx);

    // Draw enemy cars first (so player appears on top)
    enemies.forEach(enemy => {
      drawCar(ctx, enemy);
    });

    // Draw player car
    drawCar(ctx, player);
  }, [width, height, enemies, player, config]);

  // Render on prop changes
  useEffect(() => {
    render();
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="border border-gray-400 bg-gray-800 shadow-lg touch-none"
      style={{
        imageRendering: 'crisp-edges',
        maxWidth: '100vw',
        maxHeight: '80vh',
        width: 'auto',
        height: 'auto',
      }}
    />
  );
};

export default GameCanvas;