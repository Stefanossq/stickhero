
import React, { useEffect, useRef } from 'react';
import { PlayerCustomization } from '../types';

interface Props {
  customization: PlayerCustomization;
}

export const CharacterPreview: React.FC<Props> = ({ customization }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    let animationId: number;

    const render = () => {
      frame += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const headY = centerY - 15;
      
      ctx.strokeStyle = customization.color;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 10;
      ctx.shadowColor = customization.color;

      // Slight idle sway
      const sway = Math.sin(frame) * 2;
      const legSpread = 12;

      // Accessory: Cape (Rendered behind)
      if (customization.accessory === 'cape') {
        ctx.fillStyle = customization.color;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        const capeFlow = Math.sin(frame * 0.5) * 5;
        ctx.moveTo(centerX, centerY - 5);
        ctx.lineTo(centerX - 15 - capeFlow, centerY + 25);
        ctx.lineTo(centerX + 15 + capeFlow, centerY + 25);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Head
      ctx.beginPath();
      ctx.arc(centerX + sway * 0.5, headY, 12, 0, Math.PI * 2);
      ctx.stroke();

      // Body
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 5);
      ctx.lineTo(centerX, centerY + 20);
      ctx.stroke();

      // Legs
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + 20);
      ctx.lineTo(centerX - legSpread, centerY + 45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + 20);
      ctx.lineTo(centerX + legSpread, centerY + 45);
      ctx.stroke();

      // Arms (Idle position)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX - 18, centerY + 10 + sway);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + 18, centerY + 10 - sway);
      ctx.stroke();

      // Eyes
      ctx.fillStyle = customization.color === '#ffffff' ? 'black' : 'white';
      ctx.fillRect(centerX + sway * 0.5 - 4, headY - 2, 2, 2);
      ctx.fillRect(centerX + sway * 0.5 + 2, headY - 2, 2, 2);

      // Helm
      if (customization.helm !== 'none') {
        ctx.fillStyle = '#71717a';
        ctx.shadowBlur = 0;
        if (customization.helm === 'knight') {
          ctx.beginPath();
          ctx.moveTo(centerX - 15 + sway * 0.5, headY - 5);
          ctx.lineTo(centerX + 15 + sway * 0.5, headY - 5);
          ctx.lineTo(centerX + 15 + sway * 0.5, headY - 18);
          ctx.lineTo(centerX - 15 + sway * 0.5, headY - 18);
          ctx.fill();
        } else if (customization.helm === 'viking') {
          ctx.beginPath();
          ctx.moveTo(centerX - 10 + sway * 0.5, headY - 8);
          ctx.lineTo(centerX - 18 + sway * 0.5, headY - 22);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(centerX + 10 + sway * 0.5, headY - 8);
          ctx.lineTo(centerX + 18 + sway * 0.5, headY - 22);
          ctx.stroke();
        } else if (customization.helm === 'wizard') {
          ctx.beginPath();
          ctx.moveTo(centerX - 16 + sway * 0.5, headY - 8);
          ctx.lineTo(centerX + sway * 0.5, headY - 35);
          ctx.lineTo(centerX + 16 + sway * 0.5, headY - 8);
          ctx.fill();
        }
      }

      // Accessory: Scarf (Rendered on top)
      if (customization.accessory === 'scarf') {
        ctx.strokeStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(centerX - 8, centerY - 5);
        ctx.lineTo(centerX + 8, centerY - 5);
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.lineWidth = 4;
      }

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [customization]);

  return (
    <canvas 
      ref={canvasRef} 
      width={120} 
      height={120} 
      className="w-32 h-32 block"
    />
  );
};
