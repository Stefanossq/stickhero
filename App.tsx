
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameContainer } from './components/GameContainer';
import { HUD } from './components/HUD';
import { CharacterPreview } from './components/CharacterPreview';
import { GoogleGenAI } from "@google/genai";
import { GameState, Platform, PlayerCustomization } from './types';
import { Play, RotateCcw, Trophy, Zap, Save, Trash2, ArrowRight, Palette, Shield, User } from 'lucide-react';

const INITIAL_LEVEL = 1;
const SAVE_KEY = 'stickhero_save_data_v2';

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

const DEFAULT_CUSTOM: PlayerCustomization = {
  color: '#ffffff',
  helm: 'none',
  accessory: 'none'
};

const COLORS = [
  { name: 'Pure', hex: '#ffffff' },
  { name: 'Fire', hex: '#ef4444' },
  { name: 'Nature', hex: '#22c55e' },
  { name: 'Void', hex: '#8b5cf6' },
  { name: 'Sun', hex: '#eab308' },
  { name: 'Cyan', hex: '#06b6d4' }
];

const HELMS: Array<PlayerCustomization['helm']> = ['none', 'knight', 'viking', 'wizard'];
const ACCESSORIES: Array<PlayerCustomization['accessory']> = ['none', 'cape', 'scarf'];

const App: React.FC = () => {
  const [custom, setCustom] = useState<PlayerCustomization>(DEFAULT_CUSTOM);
  const [gameState, setGameState] = useState<GameState>({
    player: {
      pos: { x: 50, y: 500 },
      size: { x: 30, y: 50 },
      vel: { x: 0, y: 0 },
      isGrounded: false,
      isJumping: false,
      facing: 'right',
      animFrame: 0,
      customization: DEFAULT_CUSTOM
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
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setHasSavedProgress(true);
      if (parsed.custom) setCustom(parsed.custom);
    }
  }, []);

  const saveProgress = useCallback((levelOverride?: number) => {
    const levelToSave = levelOverride || gameState.level;
    localStorage.setItem(SAVE_KEY, JSON.stringify({ 
      level: levelToSave,
      custom: custom 
    }));
    setHasSavedProgress(true);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  }, [gameState.level, custom]);

  const resetProgress = () => {
    localStorage.removeItem(SAVE_KEY);
    setHasSavedProgress(false);
    setCustom(DEFAULT_CUSTOM);
    resetGame();
  };

  const fetchAiCommentary = async (event: 'start' | 'win' | 'fail' | 'stuck') => {
    if (!aiRef.current) return;
    try {
      const response = await aiRef.current.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a cynical but slightly helpful narrator in a 2D stickman platformer. The player just ${event} in Level ${gameState.level}. Their style is ${custom.helm} helm with a ${custom.accessory}. Provide a short, witty one-liner comment (max 15 words).`,
        config: { temperature: 0.9 }
      });
      setAiNarration(response.text || "Just keep moving.");
    } catch (e) {
      console.error(e);
    }
  };

  const startGame = (fromSave: boolean = false) => {
    let levelToLoad = INITIAL_LEVEL;
    if (fromSave) {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const { level } = JSON.parse(saved);
        levelToLoad = level;
      }
    }

    setGameState(prev => ({
      ...prev,
      status: 'playing',
      level: levelToLoad,
      platforms: LEVELS[levelToLoad] || LEVELS[INITIAL_LEVEL],
      player: { 
        ...prev.player, 
        pos: { x: 50, y: 500 }, 
        vel: { x: 0, y: 0 },
        customization: custom
      },
      message: fromSave ? `Resuming from Level ${levelToLoad}.` : "The journey begins."
    }));
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
        animFrame: 0,
        customization: custom
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
      saveProgress(nextLevel);
      fetchAiCommentary('win');
    } else {
      setGameState(prev => ({ ...prev, status: 'won', message: "You've ascended to godhood!" }));
      fetchAiCommentary('win');
    }
  }, [gameState.level, saveProgress]);

  const handleGameOver = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'gameover', message: "Gravity won this round." }));
    fetchAiCommentary('fail');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-950 font-mono">
      <div className="max-w-5xl w-full flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2 tracking-tighter">
              <Zap className="text-yellow-400 fill-yellow-400" />
              STICK HERO
            </h1>
            <p className="text-zinc-500 text-xs uppercase tracking-widest">Customizable Physics Odyssey</p>
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

        {/* Game Area Container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Game Screen */}
          <div className="lg:col-span-3 relative aspect-[16/9] w-full bg-zinc-900 rounded-2xl border-4 border-zinc-800 overflow-hidden shadow-2xl">
            {saveToast && (
              <div className="absolute top-4 right-4 z-30 bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
                <Save size={14} />
                PROGRESS SAVED
              </div>
            )}

            {gameState.status === 'menu' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md px-10">
                <div className="flex flex-col lg:flex-row gap-12 items-center w-full">
                  
                  {/* Left: Customization UI */}
                  <div className="flex-1 space-y-6 w-full max-w-sm">
                    <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-4">
                      <User className="text-yellow-400" />
                      LOCKER ROOM
                    </h2>

                    {/* Character Preview Integrated into Menu */}
                    <div className="bg-zinc-800/50 rounded-2xl p-4 border border-zinc-700/50 flex flex-col items-center">
                      <CharacterPreview customization={custom} />
                    </div>
                    
                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2 mb-2">
                        <Palette size={12} /> Body Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COLORS.map(c => (
                          <button
                            key={c.hex}
                            onClick={() => setCustom(prev => ({...prev, color: c.hex}))}
                            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${custom.color === c.hex ? 'border-white' : 'border-transparent'}`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2 mb-2">
                        <Shield size={12} /> Headgear
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {HELMS.map(h => (
                          <button
                            key={h}
                            onClick={() => setCustom(prev => ({...prev, helm: h}))}
                            className={`px-3 py-2 rounded text-xs font-bold uppercase transition-all ${custom.helm === h ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-2 mb-2">
                        <Zap size={12} /> Accessories
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {ACCESSORIES.map(a => (
                          <button
                            key={a}
                            onClick={() => setCustom(prev => ({...prev, accessory: a}))}
                            className={`px-3 py-2 rounded text-xs font-bold uppercase transition-all ${custom.accessory === a ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col gap-4 w-64 items-center">
                    <h2 className="text-4xl font-black text-white tracking-tighter text-center mb-4">READY?</h2>
                    <button 
                      onClick={() => startGame(false)}
                      className="group flex items-center justify-center gap-3 bg-white text-black px-8 py-5 rounded-2xl font-black text-xl hover:bg-yellow-400 transition-all transform hover:scale-105 w-full shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                      <Play className="fill-current" />
                      ASCEND
                    </button>
                    
                    {hasSavedProgress && (
                      <button 
                        onClick={() => startGame(true)}
                        className="group flex items-center justify-center gap-3 bg-zinc-800 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-zinc-700 transition-all transform hover:scale-105 border border-zinc-700 w-full"
                      >
                        <ArrowRight className="text-emerald-400" />
                        CONTINUE
                      </button>
                    )}

                    {hasSavedProgress && (
                      <button 
                        onClick={resetProgress}
                        className="flex items-center justify-center gap-2 text-zinc-600 hover:text-red-500 text-xs mt-4 transition-colors"
                      >
                        <Trash2 size={12} />
                        DELETE PROGRESS
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {gameState.status === 'won' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/90 text-center px-4">
                <Trophy className="w-20 h-20 text-yellow-400 mb-4 animate-bounce" />
                <h2 className="text-5xl font-black mb-2 text-white">CHAMPION!</h2>
                <p className="text-zinc-400 mb-8 max-w-md italic">"{aiNarration}"</p>
                <button 
                  onClick={resetGame}
                  className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-xl font-black hover:bg-yellow-400 transition-all"
                >
                  <RotateCcw size={20} />
                  GO AGAIN
                </button>
              </div>
            )}

            {gameState.status === 'gameover' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/90 text-center">
                <h2 className="text-7xl font-black mb-4 text-white italic">WASTED</h2>
                <p className="text-red-200 mb-8 opacity-70">"{aiNarration}"</p>
                <button 
                  onClick={resetGame}
                  className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-xl font-black hover:bg-red-200 transition-all shadow-lg"
                >
                  <RotateCcw size={20} />
                  REVIVE
                </button>
              </div>
            )}

            <GameContainer 
              gameState={{...gameState, player: {...gameState.player, customization: custom}}} 
              setGameState={setGameState} 
              onWin={handleWin}
              onGameOver={handleGameOver}
            />
          </div>

          {/* Sidebar HUD */}
          <div className="flex flex-col gap-6">
            <HUD narration={aiNarration} message={gameState.message} />
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hidden lg:block">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Handbook</h4>
              <ul className="space-y-3 text-xs text-zinc-400">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> Goal: Green Platform</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Hazard: Avoid Red</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white" /> Move: WASD / Arrows</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white" /> Jump: Space</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;
