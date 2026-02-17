import React, { useMemo } from 'react';
import { SPRITES, PALETTE } from '../game/constants';

interface SpriteProps {
  type: string;
  size?: number; // pixel size
  className?: string;
  onClick?: () => void;
  imageUrl?: string;
}

export const Sprite: React.FC<SpriteProps> = ({ type, size = 2, className, onClick, imageUrl }) => {
  const spriteData = SPRITES[type];

  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={type}
        className={className}
        onClick={onClick}
        style={{ 
          width: size * 16, // Approximate size based on 16x16 sprite
          height: size * 16,
          imageRendering: 'pixelated',
          cursor: onClick ? 'pointer' : 'default'
        }}
      />
    );
  }

  if (!spriteData) return null;

  const width = spriteData[0].length;
  const height = spriteData.length;

  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorIndex = spriteData[y][x];
        if (colorIndex !== 0) {
          ctx.fillStyle = PALETTE[colorIndex as keyof typeof PALETTE];
          ctx.fillRect(x * size, y * size, size, size);
        }
      }
    }
  }, [type, size, spriteData]);

  return (
    <canvas
      ref={canvasRef}
      width={width * size}
      height={height * size}
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', imageRendering: 'pixelated' }}
    />
  );
};
