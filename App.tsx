
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameContainer } from './components/GameContainer';
import { HUD } from './components/HUD';
import { GoogleGenAI } from "@google/genai";
import { GameState, Platform } from './types';
import { Play, RotateCcw, Trophy, Zap, Save, Trash2, ArrowRight } from 'lucide-react';

const INITIAL_LEVEL = 1;
const SAVE_KEY = 'stickhero_save_data';

const LEVELS: Record<number, Platform[]> = {
  1: [
    { pos: { x: 0, y: 550 }, size: { x: 800, y: 50 }, type: 'platform' },
    { pos: { x: 200, y: 450 }, size: { x: 150, y: 20 }, type: 'platform' },
    { pos: { x: 450, y: 350 }, size: { x: 150, y: 20 }, type: 'platform' },
    { pos: { x: 700, y: 250 }, size: { x: 100, y: 20 }, type: 'goal' },
  ],
  2: [
    { pos: { x: 0, y: 550 }, size: { x: 200, y: 50 }, type: 'platform' },
    { pos: { x: 250, y: 500 }, size: { x: 100, y: 20 }, type: 'platform' },
    { pos: { x: 400, y: 450 }, size: { x: 100, y: 20 }, type: 'platform' },
    { pos: { x: 550, y: 400 }, size: { x: 100, y: 20 }, type: 'platform' },
    { pos: { x: 300, y: 300 }, size: { x: 200, y: 20 }, type: 'platform' },
    { pos: { x: 100, y: 200 }, size: { x: 50, y: 20 }, type: 'goal' },
    { pos: { x: 300, y: 530 }, size: { x: 500, y: 20 }, type: 'hazard' },
  ],
  3: [
    { pos: { x: 0, y: 550 }, size: { x: 100, y: 50 }, type: 'platform' },
    { pos: { x: 150, y: 450 }, size: { x: 50, y: 20 }, type: 'platform' },
    { pos: { x: 300, y: 350 }, size: { x: 50, y: 20 }, type: 'platform' },
    { pos: { x: 450, y: 250 }, size: { x: 50, y: 20 }, type: 'platform' },
    { pos: { x: 600, y: 150 }, size: { x: 50, y: 20 }, type: 'platform' },
    { pos: { x: 750, y: 100 }, size: { x: 50, y: 20 }, type: 'goal' },
    { pos: { x: 100, y: 580 }, size: { x: 700, y: 20 }, type: 'hazard' },
  ]
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    player: {
      pos: { x: 50, y: 500 },
      size: { x: 30, y: 50 },
      vel: { x: 0, y: 0 },
      isGrounded: false,
      isJumping: false,
      facing: 'right',
      animFrame: 0
    },
    platforms: LEVELS[INITIAL_LEVEL],
    level: INITIAL_LEVEL,
    status: 'menu',
    message: "Welcome, Stick Hero. Reach the goal to ascend."
  });

  const [aiNarration, setAiNarration] = useState<string>("Wait... who is this? Ah, the new stick. Don't fall, it's embarrassing.");
  const [saveToast, setSaveToast] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const aiRef = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    // Check for saved progress
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      setHasSavedProgress(true);
    }
  }, []);

  const saveProgress = useCallback((levelOverride?: number) => {
    const levelToSave = levelOverride || gameState.level;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ level: levelToSave }));
    setHasSavedProgress(true);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  }, [gameState.level]);

  const resetProgress = () => {
    localStorage.removeItem(SAVE_KEY);
    setHasSavedProgress(false);
    resetGame();
  };

  const fetchAiCommentary = async (event: 'start' | 'win' | 'fail' | 'stuck') => {
    if (!aiRef.current) return;
    try {
      const response = await aiRef.current.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a cynical but slightly helpful narrator in a 2D stickman platformer. The player just ${event} in Level ${gameState.level}. Provide a short, witty one-liner comment (max 15 words).`,
        config: { temperature: 0.9 }
      });
      setAiNarration(response.text || "Just keep moving.");
    } catch (e) {
      console.error(e);
    }
  };

  const startGame = (fromSave: boolean = false) => {
    if (fromSave) {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const { level } = JSON.parse(saved);
        setGameState(prev => ({
          ...prev,
          status: 'playing',
          level: level,
          platforms: LEVELS[level] || LEVELS[INITIAL_LEVEL],
          player: { ...prev.player, pos: { x: 50, y: 500 }, vel: { x: 0, y: 0 } },
          message: `Resuming from Level ${level}.`
        }));
      }
    } else {
      setGameState(prev => ({ ...prev, status: 'playing' }));
    }
    fetchAiCommentary('start');
  };

  const resetGame = () => {
    setGameState({
      player: {
        pos: { x: 50, y: 500 },
        size: { x: 30, y: 50 },
        vel: { x: 0, y: 0 },
        isGrounded: false,
        isJumping: false,
        facing: 'right',
        animFrame: 0
      },
      platforms: LEVELS[INITIAL_LEVEL],
      level: INITIAL_LEVEL,
      status: 'playing',
      message: "Restarting... Try again."
    });
    fetchAiCommentary('fail');
  };

  const handleWin = useCallback(() => {
    if (gameState.level < Object.keys(LEVELS).length) {
      const nextLevel = gameState.level + 1;
      setGameState(prev => ({
        ...prev,
        level: nextLevel,
        platforms: LEVELS[nextLevel],
        player: { ...prev.player, pos: { x: 50, y: 500 }, vel: { x: 0, y: 0 } },
        message: `Level ${nextLevel} reached!`
      }));
      saveProgress(nextLevel); // Auto-save on win
      fetchAiCommentary('win');
    } else {
      setGameState(prev => ({ ...prev, status: 'won', message: "You've ascended to godhood! (Or at least the end of the demo)." }));
      fetchAiCommentary('win');
    }
  }, [gameState.level, saveProgress]);

  const handleGameOver = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'gameover', message: "Gravity won this round." }));
    fetchAiCommentary('fail');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 font-mono">
      <div className="max-w-4xl w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2 tracking-tighter">
              <Zap className="text-yellow-400 fill-yellow-400" />
              STICK HERO
            </h1>
            <p className="text-zinc-500 text-xs">A physics-based quest for the goal.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => saveProgress()}
              className={`p-2 rounded border transition-all ${saveToast ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'}`}
              title="Manual Save"
            >
              <Save size={20} className={saveToast ? 'animate-bounce' : ''} />
            </button>
            <div className="bg-zinc-900 px-4 py-2 rounded border border-zinc-800">
              <span className="text-zinc-500 mr-2">LEVEL</span>
              <span className="text-white font-bold">{gameState.level}</span>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="relative aspect-[16/9] w-full bg-zinc-900 rounded-xl border-4 border-zinc-800 overflow-hidden shadow-2xl">
          {saveToast && (
            <div className="absolute top-4 right-4 z-30 bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
              <Save size={14} />
              PROGRESS SAVED
            </div>
          )}

          {gameState.status === 'menu' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <h2 className="text-4xl font-black mb-8 animate-pulse text-white">READY TO ASCEND?</h2>
              <div className="flex flex-col gap-4 w-64">
                <button 
                  onClick={() => startGame(false)}
                  className="group flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition-all transform hover:scale-105"
                >
                  <Play className="fill-current" />
                  NEW GAME
                </button>
                
                {hasSavedProgress && (
                  <button 
                    onClick={() => startGame(true)}
                    className="group flex items-center justify-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-500 transition-all transform hover:scale-105 border border-emerald-400/30"
                  >
                    <ArrowRight />
                    CONTINUE
                  </button>
                )}

                {hasSavedProgress && (
                  <button 
                    onClick={resetProgress}
                    className="flex items-center justify-center gap-2 text-zinc-500 hover:text-red-400 text-xs mt-4 transition-colors"
                  >
                    <Trash2 size={12} />
                    RESET ALL PROGRESS
                  </button>
                )}
              </div>
            </div>
          )}

          {gameState.status === 'won' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 text-center px-4">
              <Trophy className="w-20 h-20 text-yellow-400 mb-4 animate-bounce" />
              <h2 className="text-5xl font-black mb-2 text-white">CHAMPION!</h2>
              <p className="text-zinc-400 mb-8 max-w-md">The stick world recognizes your prowess. You have reached the pinnacle.</p>
              <button 
                onClick={resetGame}
                className="flex items-center gap-2 bg-zinc-100 text-black px-6 py-3 rounded-lg font-bold hover:bg-white transition-colors"
              >
                <RotateCcw size={20} />
                PLAY AGAIN
              </button>
            </div>
          )}

          {gameState.status === 'gameover' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/80 text-center">
              <h2 className="text-6xl font-black mb-4 text-white">WASTED</h2>
              <p className="text-red-200 mb-8">The void claimed another stick.</p>
              <button 
                onClick={resetGame}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-red-100 transition-colors"
              >
                <RotateCcw size={20} />
                TRY AGAIN
              </button>
            </div>
          )}

          <GameContainer 
            gameState={gameState} 
            setGameState={setGameState} 
            onWin={handleWin}
            onGameOver={handleGameOver}
          />
        </div>

        {/* Narrator/HUD */}
        <HUD narration={aiNarration} message={gameState.message} />

        {/* Controls Info */}
        <div className="flex gap-4 justify-center text-zinc-600 text-sm">
          <div className="bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
            <span className="font-bold text-zinc-400">WASD</span> to Move
          </div>
          <div className="bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
            <span className="font-bold text-zinc-400">SPACE</span> to Jump
          </div>
          <div className="bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
            <span className="font-bold text-zinc-400">R</span> to Reset
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
