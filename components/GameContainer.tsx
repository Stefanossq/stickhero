
import React, { useEffect, useRef, useCallback } from 'react';
import { GameState, Platform, Player } from '../types';

interface Props {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onWin: () => void;
  onGameOver: () => void;
}

const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const SPEED = 5;
const FRICTION = 0.8;

export const GameContainer: React.FC<Props> = ({ gameState, setGameState, onWin, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const requestRef = useRef<number>();

  const update = useCallback(() => {
    if (gameState.status !== 'playing') return;

    setGameState(prev => {
      const { player, platforms } = prev;
      let newVelX = player.vel.x;
      let newVelY = player.vel.y + GRAVITY;
      
      // Horizontal movement
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) {
        newVelX = -SPEED;
      } else if (keys.current['KeyD'] || keys.current['ArrowRight']) {
        newVelX = SPEED;
      } else {
        newVelX *= FRICTION;
      }

      // Jump
      if ((keys.current['Space'] || keys.current['KeyW'] || keys.current['ArrowUp']) && player.isGrounded) {
        newVelY = JUMP_FORCE;
      }

      // Prediction
      let newPosX = player.pos.x + newVelX;
      let newPosY = player.pos.y + newVelY;
      let isGrounded = false;
      let facing = player.facing;
      if (newVelX > 0.1) facing = 'right';
      if (newVelX < -0.1) facing = 'left';

      // Collisions
      for (const p of platforms) {
        // Simple AABB
        if (
          newPosX < p.pos.x + p.size.x &&
          newPosX + player.size.x > p.pos.x &&
          newPosY < p.pos.y + p.size.y &&
          newPosY + player.size.y > p.pos.y
        ) {
          if (p.type === 'goal') {
            onWin();
            return prev; // Let the onWin handle the transition
          }
          if (p.type === 'hazard') {
            onGameOver();
            return prev;
          }

          // Platform resolution (simplistic)
          if (player.pos.y + player.size.y <= p.pos.y) {
            newPosY = p.pos.y - player.size.y;
            newVelY = 0;
            isGrounded = true;
          } else if (player.pos.y >= p.pos.y + p.size.y) {
            newPosY = p.pos.y + p.size.y;
            newVelY = 0;
          } else {
            newPosX = player.pos.x;
            newVelX = 0;
          }
        }
      }

      // Screen boundaries
      if (newPosX < 0) newPosX = 0;
      if (newPosX > 800 - player.size.x) newPosX = 800 - player.size.x;
      
      // Fall off
      if (newPosY > 600) {
        onGameOver();
        return prev;
      }

      return {
        ...prev,
        player: {
          ...player,
          pos: { x: newPosX, y: newPosY },
          vel: { x: newVelX, y: newVelY },
          isGrounded,
          facing,
          animFrame: (player.animFrame + Math.abs(newVelX) * 0.1) % 10
        }
      };
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameState.status, onWin, onGameOver, setGameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    requestRef.current = requestAnimationFrame(update);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  // Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, 800, 600);

      // Draw Background Details
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      for(let i=0; i<800; i+=40) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, 600);
        ctx.stroke();
      }
      for(let i=0; i<600; i+=40) {
        ctx.beginPath();
        ctx.moveTo(0, i); ctx.lineTo(800, i);
        ctx.stroke();
      }

      // Draw Platforms
      gameState.platforms.forEach(p => {
        if (p.type === 'goal') {
          ctx.fillStyle = '#4ade80';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#4ade80';
        } else if (p.type === 'hazard') {
          ctx.fillStyle = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ef4444';
        } else {
          ctx.fillStyle = '#3f3f46';
          ctx.shadowBlur = 0;
        }
        ctx.fillRect(p.pos.x, p.pos.y, p.size.x, p.size.y);
        ctx.shadowBlur = 0;
        
        // Highlights
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(p.pos.x, p.pos.y, p.size.x, 2);
      });

      // Draw Stickman
      const { pos, size, facing, animFrame, vel } = gameState.player;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      const centerX = pos.x + size.x / 2;
      const centerY = pos.y + size.y / 2;
      
      // Head
      ctx.beginPath();
      ctx.arc(centerX, pos.y + 10, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Body
      ctx.beginPath();
      ctx.moveTo(centerX, pos.y + 18);
      ctx.lineTo(centerX, pos.y + 35);
      ctx.stroke();

      // Animation calculations
      const walkCycle = Math.sin(animFrame);
      const legAngle = Math.abs(vel.x) > 0.5 ? walkCycle * 0.5 : 0;
      const armAngle = Math.abs(vel.x) > 0.5 ? -walkCycle * 0.4 : 0;

      // Legs
      ctx.beginPath();
      ctx.moveTo(centerX, pos.y + 35);
      ctx.lineTo(centerX - 10 - legAngle * 10, pos.y + 50);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(centerX, pos.y + 35);
      ctx.lineTo(centerX + 10 + legAngle * 10, pos.y + 50);
      ctx.stroke();

      // Arms
      const armOffset = facing === 'right' ? 5 : -5;
      ctx.beginPath();
      ctx.moveTo(centerX, pos.y + 22);
      ctx.lineTo(centerX - 15 - armAngle * 15, pos.y + 25 + (vel.y < 0 ? -15 : 0));
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(centerX, pos.y + 22);
      ctx.lineTo(centerX + 15 + armAngle * 15, pos.y + 25 + (vel.y < 0 ? -15 : 0));
      ctx.stroke();

      // Eyes
      ctx.fillStyle = 'black';
      const eyeX = facing === 'right' ? centerX + 3 : centerX - 5;
      ctx.fillRect(eyeX, pos.y + 8, 2, 2);
    };

    render();
  }, [gameState]);

  return (
    <canvas 
      ref={canvasRef} 
      width={800} 
      height={600} 
      className="w-full h-full block bg-zinc-900"
    />
  );
};
