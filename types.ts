
export interface Vector2D {
  x: number;
  y: number;
}

export interface Entity {
  pos: Vector2D;
  size: Vector2D;
}

export interface Platform extends Entity {
  type: 'platform' | 'hazard' | 'goal';
  color?: string;
}

export interface PlayerCustomization {
  color: string;
  helm: 'none' | 'knight' | 'viking' | 'wizard';
  accessory: 'none' | 'cape' | 'scarf';
}

export interface Player extends Entity {
  vel: Vector2D;
  isGrounded: boolean;
  isJumping: boolean;
  facing: 'left' | 'right';
  animFrame: number;
  customization: PlayerCustomization;
}

export interface GameState {
  player: Player;
  platforms: Platform[];
  level: number;
  status: 'playing' | 'won' | 'gameover' | 'menu';
  message: string;
}

export type Action = 
  | { type: 'MOVE_LEFT'; payload: boolean }
  | { type: 'MOVE_RIGHT'; payload: boolean }
  | { type: 'JUMP' }
  | { type: 'TICK' }
  | { type: 'RESET' }
  | { type: 'NEXT_LEVEL' };
