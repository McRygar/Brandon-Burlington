import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sprite } from './Sprite';
import { LEVELS, PARTY_ITEMS, DECOR_ITEMS, ITEM_NAMES } from '../game/constants';
import { soundManager } from '../game/SoundManager';
import { AssetService, GameAssets } from '../services/AssetService';

interface GameItem {
  id: number;
  type: string;
  x: number;
  y: number;
  hidden: boolean;
  isPartyItem: boolean;
  isSecret?: boolean; // For the jar
}

const ROOM_WIDTH = 320;
const ROOM_HEIGHT = 240;

export const GameCanvas: React.FC = () => {
  // --- State ---
  const [assets, setAssets] = useState<GameAssets | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState('');
  
  const [level, setLevel] = useState(1);
  const [time, setTime] = useState(LEVELS[0].time);
  const [items, setItems] = useState<GameItem[]>([]);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'LEVEL_COMPLETE' | 'GAME_OVER' | 'WIN'>('START');
  const [message, setMessage] = useState('');
  const [messageTimer, setMessageTimer] = useState<number | null>(null);
  
  const [hoveredItem, setHoveredItem] = useState<GameItem | null>(null);
  const [computerCleared, setComputerCleared] = useState(false);

  // --- Refs ---
  const timerRef = useRef<number | null>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) setContainer(node);
  }, []);
  const [scale, setScale] = useState(1);

  // --- Effects ---

  // 1. Scaling Logic
  useEffect(() => {
    if (!container) return;

    const updateScale = () => {
      const { clientWidth, clientHeight } = container;
      const scaleX = clientWidth / ROOM_WIDTH;
      const scaleY = clientHeight / ROOM_HEIGHT;
      // Use 95% scale to ensure it fits comfortably within the frame without touching edges
      setScale(Math.min(scaleX, scaleY) * 0.95);
    };

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    window.addEventListener('resize', updateScale);
    updateScale();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [container]);

  // 2. Asset Loading
  useEffect(() => {
    const load = async () => {
      try {
        const loadedAssets = await AssetService.loadAssets();
        setAssets(loadedAssets);
      } catch (e) {
        console.error("Failed to load assets", e);
        setLoadingError("Failed to generate assets. Using fallback graphics.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // 3. Game Timer
  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerRef.current = window.setInterval(() => {
        setTime(prev => {
          if (prev <= 0) {
            setGameState('GAME_OVER');
            soundManager.stopBGM();
            soundManager.playLose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  // 4. Win State Music
  useEffect(() => {
    if (gameState === 'WIN') {
      soundManager.playCelebration();
    } else if (gameState === 'PLAYING') {
      soundManager.playBGM();
    }
  }, [gameState]);

  // --- Game Logic ---

  const showMessage = (msg: string, duration = 1000) => {
    setMessage(msg);
    if (messageTimer) clearTimeout(messageTimer);
    const timer = window.setTimeout(() => setMessage(''), duration);
    setMessageTimer(timer);
  };

  const isValidPosition = (x: number, y: number) => {
    // Check collision with fixed decor zones (approximate bounds)
    const zones = [
      { x: 20, y: 160, w: 90, h: 70 }, // Bed area
      { x: 240, y: 160, w: 70, h: 60 }, // Computer area
      { x: 260, y: 20, w: 60, h: 110 }, // Closet area
      { x: 20, y: 20, w: 60, h: 110 },  // Door area
    ];
    
    // Check bounds (keep away from edges)
    if (x < 30 || x > ROOM_WIDTH - 30) return false;
    if (y < 50 || y > ROOM_HEIGHT - 30) return false; // Keep away from very top (HUD) and bottom

    for (const z of zones) {
      // Check if point is inside zone (with margin)
      if (x > z.x - 15 && x < z.x + z.w + 15 &&
          y > z.y - 15 && y < z.y + z.h + 15) {
        return false;
      }
    }
    return true;
  };

  const initLevel = useCallback((lvl: number) => {
    const levelData = LEVELS[lvl - 1];
    if (!levelData) return;

    setTime(levelData.time);
    setComputerCleared(false);
    
    const newItems: GameItem[] = [];
    let idCounter = 0;

    // Fixed Decor
    newItems.push({ id: idCounter++, type: 'BED', x: 20, y: 160, hidden: false, isPartyItem: false });
    newItems.push({ id: idCounter++, type: 'COMPUTER', x: 240, y: 160, hidden: false, isPartyItem: false });
    newItems.push({ id: idCounter++, type: 'CLOSET', x: 260, y: 20, hidden: false, isPartyItem: false });
    newItems.push({ id: idCounter++, type: 'DOOR', x: 20, y: 20, hidden: false, isPartyItem: false });

    // Level 5 Secret
    if (lvl === 5) {
      newItems.push({
        id: idCounter++,
        type: 'GREEN_JAR',
        x: 150,
        y: 60,
        hidden: false,
        isPartyItem: true,
        isSecret: true
      });
      newItems.push({
        id: idCounter++,
        type: 'POSTER',
        x: 150,
        y: 60,
        hidden: false,
        isPartyItem: false
      });
    } else {
      // Random Decor
      for (let i = 0; i < 5; i++) {
        const type = DECOR_ITEMS[Math.floor(Math.random() * DECOR_ITEMS.length)];
        let x = 0, y = 0, tries = 0;
        do {
          x = Math.random() * (ROOM_WIDTH - 40) + 20;
          y = Math.random() * (ROOM_HEIGHT - 60) + 20;
          tries++;
        } while (!isValidPosition(x, y) && tries < 50);

        newItems.push({
          id: idCounter++,
          type,
          x,
          y,
          hidden: false,
          isPartyItem: false,
        });
      }
    }

    // Party Items
    for (let i = 0; i < levelData.items; i++) {
      const type = PARTY_ITEMS[Math.floor(Math.random() * PARTY_ITEMS.length)];
      let x = 0, y = 0, tries = 0;
      do {
        x = Math.random() * (ROOM_WIDTH - 40) + 20;
        y = Math.random() * (ROOM_HEIGHT - 40) + 20;
        tries++;
      } while (!isValidPosition(x, y) && tries < 50);

      newItems.push({
        id: idCounter++,
        type,
        x,
        y,
        hidden: false,
        isPartyItem: true,
      });
    }

    setItems(newItems);
    setGameState('PLAYING');
    soundManager.playBGM();
  }, []);

  const startGame = () => {
    setLevel(1);
    initLevel(1);
  };

  const nextLevel = () => {
    if (level >= 5) {
      setGameState('WIN');
      soundManager.stopBGM();
      soundManager.playWin();
    } else {
      setLevel(prev => {
        const next = prev + 1;
        initLevel(next);
        return next;
      });
    }
  };

  const checkWinCondition = (currentItems: GameItem[], isComputerCleared: boolean) => {
    const remaining = currentItems.filter(i => i.isPartyItem && !i.hidden).length;
    
    if (remaining === 0 && isComputerCleared) {
      setGameState('LEVEL_COMPLETE');
      soundManager.playWin(); 
    } else if (remaining === 0 && !isComputerCleared) {
      showMessage("Don't forget the computer!");
    }
  };

  const handleItemClick = (item: GameItem) => {
    if (gameState !== 'PLAYING') return;

    // Computer
    if (item.type === 'COMPUTER') {
      if (!computerCleared) {
        soundManager.playPickup();
        setComputerCleared(true);
        showMessage("Browser History Cleared! (+1)");
        checkWinCondition(items, true);
      } else {
        showMessage("History already clean.");
      }
      return;
    }

    // Secret Poster (Level 5)
    if (level === 5 && item.type === 'POSTER') {
      const jar = items.find(i => i.type === 'GREEN_JAR');
      if (jar && jar.isSecret) {
        soundManager.playPickup();
        showMessage("You found a secret compartment!");
        setItems(prev => prev.map(i => {
          if (i.id === item.id) return { ...i, hidden: true };
          if (i.type === 'GREEN_JAR') return { ...i, isSecret: false };
          return i;
        }));
        return;
      }
    }

    // Party Items
    if (item.isPartyItem) {
      if (item.isSecret) return;

      soundManager.playPickup();
      const newItems = items.map(i => i.id === item.id ? { ...i, hidden: true } : i);
      setItems(newItems);
      checkWinCondition(newItems, computerCleared);
    } else {
      // Decor
      if (!item.isPartyItem) {
        soundManager.playError();
        showMessage("Nothing to hide here!");
      }
    }
  };

  const getRemainingCount = () => {
    let count = items.filter(i => i.isPartyItem && !i.hidden).length;
    if (!computerCleared) count += 1;
    return count;
  };

  // --- Render Helpers ---

  const getTooltipText = (item: GameItem) => {
    if (item.type === 'COMPUTER') {
      return computerCleared ? "History Cleared" : "Clear History (+1)";
    }
    if (item.type === 'POSTER' && level === 5) {
      return "Suspicious Poster...";
    }
    return ITEM_NAMES[item.type] || item.type;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 font-pixel text-white p-4">
        <h1 className="text-4xl text-yellow-400 mb-4 animate-pulse">GENERATING 90s ASSETS...</h1>
        <div className="text-xl text-gray-400">Please wait while the AI paints your room.</div>
        <div className="mt-4 text-sm text-gray-600">Using Gemini 2.5 Flash Image Model</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen bg-black overflow-hidden">
      <div 
        ref={containerRef}
        className="relative flex justify-center items-center w-full h-full bg-black"
      >
        <div 
          className="relative bg-[#d7ccc8] shadow-2xl overflow-hidden font-pixel text-white"
          style={{ 
            width: ROOM_WIDTH, 
            height: ROOM_HEIGHT,
            transform: `scale(${scale})`,
            imageRendering: 'pixelated',
            backgroundImage: assets?.background ? `url(${assets.background})` : undefined,
            backgroundSize: 'cover'
          }}
        >
          {/* --- HUD Layer --- */}
          <div className="absolute top-2 left-0 right-0 z-30 flex flex-col items-center pointer-events-none drop-shadow-md">
             {gameState === 'START' && (
               <h1 className="text-xl text-yellow-400 mb-1 tracking-widest">PANIC CLEAN: 1999</h1>
             )}
             
             <div className="flex gap-4 text-sm bg-black/60 px-3 py-1 rounded-full backdrop-blur-[2px] border border-white/10">
               <div className="text-yellow-200">LVL: {level}</div>
               <div className={time < 10 ? 'text-red-500 animate-pulse' : 'text-green-300'}>TIME: {time}</div>
               <div className="text-blue-300">LEFT: {getRemainingCount()}</div>
             </div>
             
             <div className="h-4 text-xs text-red-300 mt-1 font-bold">{message || loadingError}</div>
          </div>

          {/* --- Background Layer (Floor fallback) --- */}
          {!assets?.background && (
            <div 
              className="absolute bottom-0 w-full bg-[#8d6e63]" 
              style={{ height: '30%' }} 
            />
          )}

          {/* --- Items Layer --- */}
          {items.map(item => (
            !item.hidden && !item.isSecret && (
              <div
                key={item.id}
                className="absolute transition-transform hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center group"
                style={{
                  left: item.x - 16,
                  top: item.y - 16,
                  padding: '16px',
                  zIndex: item.y, // Depth sorting
                  filter: item.isPartyItem ? 'drop-shadow(2px 2px 0 rgba(0,0,0,0.3))' : undefined
                }}
                onClick={() => handleItemClick(item)}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Fallback Blocks */}
                {['BED', 'COMPUTER', 'CLOSET', 'DOOR'].includes(item.type) ? (
                  <div 
                    className={`
                      ${!assets?.background ? (
                        item.type === 'BED' ? 'bg-blue-800' :
                        item.type === 'COMPUTER' ? 'bg-gray-800 border-2 border-gray-400' :
                        item.type === 'CLOSET' ? 'bg-amber-900' :
                        'bg-amber-800 border-4 border-amber-950'
                      ) : 'bg-transparent'}
                      ${item.type === 'BED' ? 'w-24 h-16' : ''}
                      ${item.type === 'COMPUTER' ? 'w-16 h-12' : ''}
                      ${item.type === 'CLOSET' ? 'w-20 h-32' : ''}
                      ${item.type === 'DOOR' ? 'w-16 h-32' : ''}
                    `}
                    style={{ width: item.type === 'BED' ? 80 : undefined }}
                  >
                    {!assets?.background && item.type === 'COMPUTER' && <div className="bg-blue-400 w-10 h-8 m-2 animate-pulse"></div>}
                  </div>
                ) : (
                  <Sprite 
                    type={item.type} 
                    size={1} 
                    imageUrl={assets?.items?.[item.type]}
                  />
                )}
              </div>
            )
          ))}

          {/* --- Tooltip Layer --- */}
          {hoveredItem && gameState === 'PLAYING' && (
            <div 
              className="absolute z-50 bg-black/90 text-white px-2 py-1 text-[10px] pointer-events-none border border-white/30 whitespace-nowrap rounded shadow-lg"
              style={{
                left: hoveredItem.x,
                top: hoveredItem.y - 20,
                transform: `translate(-50%, -100%) scale(${1/scale})`,
                transformOrigin: 'bottom center'
              }}
            >
              {getTooltipText(hoveredItem)}
            </div>
          )}

          {/* --- Overlays Layer --- */}
          {gameState === 'START' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-2 text-center">
              <h1 className="text-xl text-yellow-400 mb-2 font-bold tracking-widest drop-shadow-lg">PANIC CLEAN: 1999</h1>
              
              <div className="bg-gray-800/80 p-3 rounded border border-gray-600 max-w-[280px] mb-3 shadow-xl">
                <h3 className="text-xs text-blue-300 mb-2 font-bold uppercase border-b border-gray-600 pb-1">Mission Briefing</h3>
                <ul className="text-left text-[10px] space-y-1 text-gray-200 leading-tight">
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-1">➤</span>
                    Parents arrive in <span className="text-red-400 font-bold mx-1">60s</span>.
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-1">➤</span>
                    Hide <span className="text-green-400 font-bold mx-1">Party Items</span>.
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-1">➤</span>
                    <span className="text-blue-300 font-bold mx-1">CLEAR HISTORY!</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-yellow-400 mr-1">➤</span>
                    Watch out for false alarms.
                  </li>
                </ul>
              </div>

              <button 
                onClick={startGame}
                className="px-4 py-2 bg-red-600 text-white font-bold text-sm hover:bg-red-500 border-2 border-white animate-bounce shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-0.5 active:shadow-none transition-all"
              >
                START CLEANING
              </button>
            </div>
          )}

          {gameState === 'LEVEL_COMPLETE' && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
              <h2 className="text-xl text-green-400 mb-2 font-bold">ROOM CLEAN!</h2>
              <p className="text-white mb-4 text-sm">Phew! That was close.</p>
              <button 
                onClick={nextLevel}
                className="px-6 py-2 bg-green-600 text-white font-bold text-lg hover:bg-green-500 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
              >
                NEXT LEVEL
              </button>
            </div>
          )}

          {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50">
              <h2 className="text-2xl text-red-600 mb-2 font-bold">BUSTED!</h2>
              <p className="text-white mb-4 text-sm">Your parents found the stash.</p>
              <button 
                onClick={startGame}
                className="px-6 py-2 bg-gray-600 text-white font-bold text-lg hover:bg-gray-500 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
              >
                TRY AGAIN
              </button>
            </div>
          )}

          {gameState === 'WIN' && (
            <div className="absolute inset-0 bg-blue-900/95 flex flex-col items-center justify-center z-50 text-center overflow-hidden">
              <div className="animate-[scroll_10s_linear_infinite] flex flex-col items-center">
                <h2 className="text-3xl text-yellow-400 mb-8 font-bold drop-shadow-md">YOU SURVIVED!</h2>
                
                <div className="space-y-4 text-white text-sm font-mono mb-12">
                  <p className="text-green-300">PANIC CLEAN: 1999</p>
                  <p>---</p>
                  <p className="text-gray-400">Concept & Code</p>
                  <p>Gemini 2.5</p>
                  <p>---</p>
                  <p className="text-gray-400">Art Direction</p>
                  <p>Procedural AI</p>
                  <p>---</p>
                  <p className="text-gray-400">Music</p>
                  <p>Web Audio Synth</p>
                  <p>---</p>
                  <p className="text-gray-400">Special Thanks</p>
                  <p>To all the messy teens</p>
                  <p>of the 90s</p>
                  <p>---</p>
                  <p className="text-yellow-200 text-lg mt-4">THANKS FOR PLAYING!</p>
                </div>
              </div>

              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button 
                  onClick={startGame}
                  className="px-6 py-3 bg-yellow-600 text-white font-bold text-lg hover:bg-yellow-500 border-4 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none transition-all"
                >
                  PLAY AGAIN
                </button>
              </div>
              
              <style>{`
                @keyframes scroll {
                  0% { transform: translateY(100%); }
                  100% { transform: translateY(-100%); }
                }
              `}</style>
            </div>
          )}
        </div>
      </div>
      
      <div className="absolute bottom-2 right-2 text-gray-500 text-xs z-10 font-mono">
        Music: Techno Grunge (Procedural) | Style: 16-bit
      </div>
    </div>
  );
};
