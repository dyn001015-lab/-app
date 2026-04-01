import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Hand, Pointer, Shrink, MoveHorizontal } from 'lucide-react';
import { NetworkSphere, OrbitParticles, PixelEffect } from './Effects';

const ASSETS = [
  'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E7%BA%BF%E6%80%A71.png',
  'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E7%BA%BF%E6%80%A72.png',
  'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E7%BA%BF%E6%80%A73.png',
  'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E7%BA%BF%E6%80%A74.png'
];

const CARD_DATA = [
  { title: "Advanced Management", desc: "The most advanced queuing technology in the market reduce latency and limit bandwidth without compromising the quality.", icon: Hand, hint: "Open Hand" },
  { title: "Acceleration", desc: "Our GPU optimization can significantly increase the speed experience by your network users.", icon: Pointer, hint: "Index Finger" },
  { title: "Monitoring", desc: "Sophisticated measurements to users what services are using your network and to measure the quality you're getting from the providers.", icon: Shrink, hint: "Pinch" },
  { title: "Restoration", desc: "Reconstruct fragmented data streams into coherent visual patterns through spatial interactions.", icon: MoveHorizontal, hint: "Horizontal Swipe" }
];

interface Chapter2Props {
  hands: any[];
  dimensions: { width: number; height: number };
}

export const Chapter2: React.FC<Chapter2Props> = ({ hands, dimensions }) => {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  
  // Hover & Click state
  const [hoverProgress, setHoverProgress] = useState(0);
  const hoverProgressRef = useRef(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredIdRef = useRef<string | null>(null);
  const [cursorPos, setCursorPos] = useState({x: 0, y: 0});
  const clickCooldown = useRef(false);
  
  // Material 1: Halo rotation
  const [isPalmStill, setIsPalmStill] = useState(false);
  const lastPalmPos = useRef<{x: number, y: number} | null>(null);
  const palmVelocity = useRef(0);
  
  // Material 2: Tail
  const [tailPositions, setTailPositions] = useState<{x: number, y: number}[]>([]);
  
  // Material 3: ASCII effect
  const [asciiAmount, setAsciiAmount] = useState(0);
  
  // Material 4: Puzzle erase
  const [eraseProgress, setEraseProgress] = useState(0);
  const lastEraseX = useRef<number | null>(null);

  const scrambleStages = useMemo(() => {
    const stages = [];
    // 4 scrambled stages
    for (let s = 0; s < 4; s++) {
      stages.push(Array.from({ length: 81 }).map(() => ({
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 800,
        rotate: (Math.random() - 0.5) * 360
      })));
    }
    // Final 5th stage is perfectly assembled
    stages.push(Array.from({ length: 81 }).map(() => ({ x: 0, y: 0, rotate: 0 })));
    return stages;
  }, []);

  const getLocalCoords = (landmark: any) => {
    if (!landmark) return { x: 0, y: 0 };
    return {
      x: (1 - landmark.x) * dimensions.width,
      y: landmark.y * dimensions.height
    };
  };

  const getViewportCoords = (landmark: any) => {
    if (!landmark) return { x: 0, y: 0 };
    return {
      x: (1 - landmark.x) * window.innerWidth,
      y: landmark.y * window.innerHeight
    };
  };

  useEffect(() => {
    if (hands.length === 0) {
      setIsPalmStill(false);
      lastPalmPos.current = null;
      setTailPositions(prev => prev.length > 0 ? prev.slice(1) : prev);
      setEraseProgress(prev => prev > 0 ? Math.max(0, prev - 0.02) : prev);
      if (hoverProgressRef.current !== 0) {
        hoverProgressRef.current = 0;
        setHoverProgress(0);
      }
      if (hoveredIdRef.current !== null) {
        hoveredIdRef.current = null;
        setHoveredId(null);
      }
      return;
    }

    const hand1 = hands[0];
    
    const indexTipLocal = getLocalCoords(hand1[8]);
    const indexTipViewport = getViewportCoords(hand1[8]);
    const palmLocal = getLocalCoords(hand1[9]);

    setCursorPos(prev => {
      if (Math.abs(prev.x - indexTipLocal.x) < 0.1 && Math.abs(prev.y - indexTipLocal.y) < 0.1) return prev;
      return indexTipLocal;
    });

    // --- Hover & Click Logic ---
    if (!clickCooldown.current) {
      let currentHover: string | null = null;

      if (selectedCard === null) {
        cardRefs.current.forEach((card, index) => {
          if (!card) return;
          const rect = card.getBoundingClientRect();
          if (indexTipViewport.x >= rect.left && indexTipViewport.x <= rect.right &&
              indexTipViewport.y >= rect.top && indexTipViewport.y <= rect.bottom) {
            currentHover = `card-${index}`;
          }
        });
      } else {
        if (closeBtnRef.current) {
          const rect = closeBtnRef.current.getBoundingClientRect();
          const padding = 40; // Generous padding
          if (indexTipViewport.x >= rect.left - padding && indexTipViewport.x <= rect.right + padding &&
              indexTipViewport.y >= rect.top - padding && indexTipViewport.y <= rect.bottom + padding) {
            currentHover = 'close-btn';
          }
        }
      }

      if (currentHover) {
        if (hoveredIdRef.current !== currentHover) {
          hoveredIdRef.current = currentHover;
          setHoveredId(currentHover);
          hoverProgressRef.current = 0;
          setHoverProgress(0);
        } else {
          hoverProgressRef.current += 4; // approx 25 frames to click
          if (hoverProgressRef.current >= 100) {
            clickCooldown.current = true;
            setTimeout(() => { clickCooldown.current = false; }, 1000);
            
            if (currentHover?.startsWith('card-')) {
              setSelectedCard(parseInt(currentHover.split('-')[1]));
            } else if (currentHover === 'close-btn') {
              setSelectedCard(null);
            }
            hoverProgressRef.current = 0;
            setHoverProgress(0);
          } else {
            setHoverProgress(hoverProgressRef.current);
          }
        }
      } else {
        if (hoveredIdRef.current !== null) {
          hoveredIdRef.current = null;
          setHoveredId(null);
          hoverProgressRef.current = 0;
          setHoverProgress(0);
        }
      }
    }

    if (selectedCard === null) return;

    // Specific logic for each material
    if (selectedCard === 0) {
      if (lastPalmPos.current) {
        const v = Math.sqrt(Math.pow(palm.x - lastPalmPos.current.x, 2) + Math.pow(palm.y - lastPalmPos.current.y, 2));
        palmVelocity.current = palmVelocity.current * 0.8 + v * 0.2;
        setIsPalmStill(palmVelocity.current < 15);
      }
      lastPalmPos.current = palm;
    } else {
      setIsPalmStill(false);
      lastPalmPos.current = null;
    }
    
    if (selectedCard === 1) {
      setTailPositions(prev => {
        const newPos = [...prev, { x: indexTipLocal.x, y: indexTipLocal.y }];
        if (newPos.length > 20) newPos.shift();
        return newPos;
      });
    } else {
      setTailPositions(prev => prev.length > 0 ? prev.slice(1) : prev);
    }
    
    if (selectedCard === 2) {
      const thumbTip = getLocalCoords(hand1[4]);
      const dist = Math.sqrt(Math.pow(indexTipLocal.x - thumbTip.x, 2) + Math.pow(indexTipLocal.y - thumbTip.y, 2));
      const amount = Math.max(0, 1 - (dist / 150));
      setAsciiAmount(amount);
    }
    
    if (selectedCard === 3) {
      if (lastEraseX.current !== null) {
        const delta = Math.abs(palm.x - lastEraseX.current);
        setEraseProgress(prev => Math.min(1, prev + delta * 0.002));
      }
      lastEraseX.current = palm.x;
    } else {
      setEraseProgress(prev => prev > 0 ? Math.max(0, prev - 0.02) : prev);
      lastEraseX.current = null;
    }

  }, [hands, dimensions, selectedCard]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#141414] text-[#E4E3E0] overflow-hidden flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-[#050505]" />
      {selectedCard === 0 && <NetworkSphere active={true} />}

      {/* Header Info */}
      <div className="absolute top-12 left-12 space-y-2 z-10 pointer-events-none">
        <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase opacity-50 text-white">
          <span>Chapter 02 / Spatial Symbiosis</span>
        </div>
        <h1 className="text-4xl font-light italic serif tracking-tighter text-white">空间共生</h1>
      </div>

      <div className="absolute top-12 right-12 max-w-xs text-[10px] text-white/50 leading-relaxed hidden md:block text-right z-10 pointer-events-none">
        We proactively analyze, enhance, and secure your infrastructure to ensure peak performance, minimal downtime, and seamless connectivity.
      </div>

      {/* Cards Section (Moved down and larger assets) */}
      <div className="relative z-10 w-full max-w-[1600px] px-8 md:px-16 mt-32">
        <div className="flex flex-row justify-center gap-8">
          {CARD_DATA.map((data, index) => (
            <div 
              key={index}
              ref={el => cardRefs.current[index] = el}
              onClick={() => setSelectedCard(index)}
              className={`relative flex flex-col border transition-all duration-500 rounded-3xl p-8 cursor-pointer group w-72 ${hoveredId === `card-${index}` ? 'border-white/50 bg-white/20 scale-105 shadow-2xl shadow-white/10' : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'}`}
            >
              {/* Image Container */}
              <div className="flex-1 flex items-center justify-center relative h-[240px]">
                <img 
                  src={ASSETS[index]} 
                  className="w-48 h-48 object-contain group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex items-center gap-2 mt-4 text-white/50">
                <data.icon size={16} />
                <span className="text-xs uppercase tracking-wider">{data.hint}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interaction Modal */}
      <AnimatePresence>
        {selectedCard !== null && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(20px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            <button 
              ref={closeBtnRef}
              onClick={() => setSelectedCard(null)}
              className={`absolute top-12 right-12 p-4 transition-colors z-50 rounded-full ${hoveredId === 'close-btn' ? 'bg-white/20 text-white scale-110' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
            >
              <X className="w-8 h-8" />
            </button>

            <div className="relative w-[600px] h-[600px] flex items-center justify-center">
              {/* Material 1: Halo */}
              {selectedCard === 0 && (
                <div className="relative flex items-center justify-center w-full h-full">
                  <NetworkSphere active={isPalmStill} />
                  <motion.img 
                    src={ASSETS[0]} 
                    className="w-64 h-64 object-contain relative z-10"
                    animate={{ 
                      scale: isPalmStill ? 1.1 : 1,
                      filter: isPalmStill ? 'brightness(1.2)' : 'brightness(1)'
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Material 2: Tail */}
              {selectedCard === 1 && (
                <div className="relative flex items-center justify-center w-full h-full bg-[#000000]">
                  {/* The static central image is removed. Only the holographic 3D particle tail will be visible. */}
                </div>
              )}

              {/* Material 3: Digital Pixel */}
              {selectedCard === 2 && (
                <div className="relative flex items-center justify-center w-full h-full bg-[#000000]">
                  <PixelEffect amount={asciiAmount} imageSrc={ASSETS[2]} />
                </div>
              )}

              {/* Material 4: Puzzle Erase */}
              {selectedCard === 3 && (
                <div className="relative flex items-center justify-center w-[450px] h-[450px]">
                  <div className="absolute inset-0 grid grid-cols-9 grid-rows-9 gap-[1px]">
                    {Array.from({ length: 81 }).map((_, i) => {
                      const row = Math.floor(i / 9);
                      const col = i % 9;
                      const xOffset = -(col * 100);
                      const yOffset = -(row * 100);
                      
                      const totalStages = 4;
                      const scaledProgress = eraseProgress * totalStages;
                      const currentStageIdx = Math.min(totalStages - 1, Math.floor(scaledProgress));
                      const nextStageIdx = Math.min(totalStages, currentStageIdx + 1);
                      const localProgress = scaledProgress - currentStageIdx;

                      const currentScramble = scrambleStages[currentStageIdx][i];
                      const nextScramble = scrambleStages[nextStageIdx][i];

                      // Interpolate between current stage and next stage
                      const scrambleX = currentScramble.x + (nextScramble.x - currentScramble.x) * localProgress;
                      const scrambleY = currentScramble.y + (nextScramble.y - currentScramble.y) * localProgress;
                      const scrambleRotate = currentScramble.rotate + (nextScramble.rotate - currentScramble.rotate) * localProgress;

                      return (
                        <motion.div 
                          key={i}
                          className="relative overflow-hidden w-full h-full bg-black/40"
                          animate={{
                            x: scrambleX,
                            y: scrambleY,
                            rotate: scrambleRotate,
                            opacity: 0.2 + eraseProgress * 0.8
                          }}
                        >
                          <img 
                            src={ASSETS[3]} 
                            className="absolute max-w-none w-[900%] h-[900%]"
                            style={{ left: `${xOffset}%`, top: `${yOffset}%` }}
                            referrerPolicy="no-referrer"
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Virtual Cursor */}
      {hands.length > 0 && (
        <div 
          className="fixed z-[100] pointer-events-none flex items-center justify-center transition-opacity duration-200"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className={`w-3 h-3 rounded-full transition-colors duration-200 ${hoverProgress > 0 ? 'bg-amber-400' : 'bg-white/80'}`} />
          {hoverProgress > 0 && (
            <svg className="absolute w-12 h-12 -rotate-90">
              <circle
                cx="24" cy="24" r="20"
                stroke="rgba(251, 191, 36, 0.2)"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="24" cy="24" r="20"
                stroke="rgba(251, 191, 36, 1)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 - (125.6 * hoverProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
            </svg>
          )}
        </div>
      )}

      {/* Tail effect canvas for Material 2 (Global overlay but only when modal is open) */}
      {selectedCard === 1 && tailPositions.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[60]">
          {tailPositions.map((pos, i) => {
            const progress = i / tailPositions.length;
            return (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ 
                  left: pos.x, 
                  top: pos.y,
                  opacity: progress * 0.8,
                  transform: `translate(-50%, -50%) scale(${progress})`
                }}
              >
                {/* Holographic 3D Particle Rotation Effect */}
                <motion.div
                  className="relative w-48 h-48 flex items-center justify-center"
                  animate={{ rotateY: 360, rotateZ: 90 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <img 
                    src={ASSETS[1]}
                    className="absolute w-full h-full object-contain"
                    style={{ 
                      filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.8)) hue-rotate(180deg) brightness(1.5)',
                      mixBlendMode: 'screen'
                    }}
                    referrerPolicy="no-referrer"
                  />
                  {/* Holographic rings */}
                  <div className="absolute inset-0 border-2 border-cyan-400/50 rounded-full" style={{ transform: 'rotateX(75deg)' }} />
                  <div className="absolute inset-0 border-2 border-blue-500/50 rounded-full" style={{ transform: 'rotateY(75deg)' }} />
                  {/* Particles */}
                  {Array.from({length: 5}).map((_, j) => (
                    <motion.div
                      key={j}
                      className="absolute w-2 h-2 bg-cyan-300 rounded-full"
                      animate={{
                        x: [0, (Math.random() - 0.5) * 100],
                        y: [0, (Math.random() - 0.5) * 100],
                        opacity: [1, 0]
                      }}
                      transition={{ duration: 1, repeat: Infinity, delay: Math.random() }}
                    />
                  ))}
                </motion.div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

