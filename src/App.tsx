/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GestureManager } from './components/GestureManager';
import { Chapter2 } from './components/Chapter2';
import { Chapter3 } from './components/Chapter3';
import { Chapter4 } from './components/Chapter4';
import { Chapter5 } from './components/Chapter5';
import { Sparkles, Hand, Wind, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

const ASSETS = {
  TRADITIONAL: 'https://github.com/dyn001015-lab/web/blob/main/%E4%BC%A0%E7%BB%9F.png?raw=true',
  FLEXIBLE: [
    'https://github.com/dyn001015-lab/web/blob/main/%E6%9F%94%E6%80%A71.png?raw=true',
    'https://github.com/dyn001015-lab/web/blob/main/%E6%9F%94%E6%80%A72.png?raw=true',
    'https://github.com/dyn001015-lab/web/blob/main/%E6%9F%94%E6%80%A73.png?raw=true',
    'https://github.com/dyn001015-lab/web/blob/main/%E6%9F%94%E6%80%A74.png?raw=true',
  ]
};

type Phase = 'initial' | 'dissipating' | 'flexible' | 'chapter2' | 'chapter3' | 'chapter4' | 'chapter5';

export default function App() {
  const [phase, setPhase] = useState<Phase>('initial');
  const phaseRef = useRef<Phase>('initial');
  const [clenchValue, setClenchValue] = useState(0);
  const [openValue, setOpenValue] = useState(0);
  const [dragX, setDragX] = useState(0);
  const lastTransitionTime = useRef(0);
  const [hands, setHands] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);

  const [dimensions, setDimensions] = useState({ width: 1000, height: 1000 });

  // Keep phaseRef in sync with phase state
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleGesture = useCallback((type: 'swipe' | 'clench' | 'open' | 'swipeLeft' | 'swipeRight' | 'navClickLeft' | 'navClickRight', value: number) => {
    const currentPhase = phaseRef.current;
    const now = Date.now();
    
    // 800ms Cooldown
    if (now - lastTransitionTime.current < 800) return;

    if (type === 'navClickLeft') {
      // Previous Page
      if (currentPhase === 'chapter5') {
        setPhase('chapter4');
        lastTransitionTime.current = now;
      } else if (currentPhase === 'chapter4') {
        setPhase('chapter3');
        lastTransitionTime.current = now;
      } else if (currentPhase === 'chapter3') {
        setPhase('chapter2');
        lastTransitionTime.current = now;
      } else if (currentPhase === 'chapter2') {
        setPhase('flexible');
        lastTransitionTime.current = now;
      }
    } else if (type === 'navClickRight') {
      // Next Page
      if (currentPhase === 'initial') {
        setPhase('dissipating');
        setTimeout(() => setPhase('flexible'), 2000);
        lastTransitionTime.current = now;
      } else if (currentPhase === 'flexible') {
        setPhase('chapter2');
        lastTransitionTime.current = now;
      } else if (currentPhase === 'chapter2') {
        setPhase('chapter3');
        lastTransitionTime.current = now;
      } else if (currentPhase === 'chapter3') {
        setPhase('chapter4');
        lastTransitionTime.current = now;
      } else if (currentPhase === 'chapter4') {
        setPhase('chapter5');
        lastTransitionTime.current = now;
      }
    }

    if (type === 'clench') {
      setClenchValue(value);
      setOpenValue(0);
    }
    if (type === 'open') {
      setOpenValue(value);
      setClenchValue(0);
    }
  }, []);

  const handleSwipeUpdate = useCallback((offset: number) => {
    // Swipe navigation is disabled, only click navigation is allowed
  }, []);

  const handleHandsUpdate = useCallback((newHands: any[]) => {
    setHands(prev => {
      // Only update if the number of hands changed or if there are hands.
      // Deep comparison might be too expensive here, but we can avoid
      // setting state if both are empty.
      if (prev.length === 0 && newHands.length === 0) return prev;
      return newHands;
    });
  }, []);

  // Particle System for dissipation
  useEffect(() => {
    if (phase !== 'dissipating') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const createParticles = () => {
      const colors = [
        'rgba(212, 175, 55, 0.8)',  // Gold
        'rgba(139, 0, 0, 0.8)',    // Deep Red
        'rgba(255, 215, 0, 0.6)',  // Bright Gold
        'rgba(165, 42, 42, 0.7)',  // Brownish Red
        'rgba(255, 255, 255, 0.4)' // Shimmer white
      ];
      for (let i = 0; i < 1000; i++) {
        particles.current.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 200,
          y: canvas.height / 2 + (Math.random() - 0.5) * 300,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          size: Math.random() * 2 + 0.5, // Finer particles
          alpha: Math.random() * 0.5 + 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          friction: 0.97 + Math.random() * 0.02,
          gravity: 0.01 + Math.random() * 0.03,
          wind: (Math.random() - 0.3) * 1.5,
          shimmer: Math.random() * 0.1
        });
      }
    };

    createParticles();

    let animationFrame: number;
    const animate = () => {
      if (phase !== 'dissipating') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach((p, i) => {
        p.vx += p.wind;
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        
        p.x += p.vx;
        p.y += p.vy;
        
        if (p.x < 20 || p.x > canvas.width - 20) p.vx *= -0.8;
        if (p.y < 20 || p.y > canvas.height - 20) p.vy *= -0.8;

        p.alpha -= 0.003;
        p.size *= 0.997;
        
        // Shimmer effect
        const currentAlpha = p.alpha * (0.8 + Math.sin(Date.now() * 0.01 + i) * 0.2);
        
        ctx.globalAlpha = Math.max(0, currentAlpha);
        ctx.fillStyle = p.color;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        if (p.alpha <= 0) particles.current.splice(i, 1);
      });

      if (particles.current.length > 0) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animate();
    return () => {
      cancelAnimationFrame(animationFrame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = [];
    };
  }, [phase]);

  return (
    <div className={`min-h-screen ${phase === 'flexible' ? 'bg-white' : 'bg-[#E4E3E0]'} transition-colors duration-1000 text-[#141414] font-mono selection:bg-[#141414] selection:text-[#E4E3E0] overflow-hidden flex flex-col items-center justify-center relative`}>
      {/* Header Info */}
      <AnimatePresence>
        {phase !== 'chapter2' && phase !== 'chapter3' && phase !== 'chapter4' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-12 left-12 space-y-2 z-10"
          >
            <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase opacity-50">
              <Zap size={12} />
              <span>Chapter 01 / Perception Prologue</span>
            </div>
            <h1 className="text-4xl font-light italic serif tracking-tighter">感知序章</h1>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-12 right-12 text-right space-y-1 z-10">
        <div className="text-[10px] tracking-[0.1em] uppercase opacity-30">Interactive Protocol</div>
        <div className="text-[11px] font-medium">GATES [ BY EQUAL.STUDIO ]</div>
      </div>

      {/* Main Stage */}
      <motion.div 
        className="relative w-full h-screen flex items-center justify-center"
        animate={{ 
          x: 0,
        }}
        transition={{ 
          type: 'spring', 
          damping: 25, 
          stiffness: 120,
          mass: 0.5
        }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
          width={dimensions.width}
          height={dimensions.height}
        />

        <AnimatePresence mode="wait">
          {phase === 'initial' && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(40px)', x: -200 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // expo.out
              className="relative flex items-center justify-center"
            >
              <div className="absolute -inset-40 border border-[#141414]/5 rounded-full animate-[spin_30s_linear_infinite] pointer-events-none" />
              <img
                src={ASSETS.TRADITIONAL}
                alt="Traditional Knot"
                className="w-[320px] md:w-[520px] h-auto object-contain drop-shadow-2xl grayscale contrast-125"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40">
                <div className="w-[1px] h-16 bg-[#141414]" />
                <div className="text-[10px] uppercase tracking-[0.4em] animate-pulse flex items-center gap-2">
                  <Hand size={12} />
                  Tap Right Edge to Start
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'flexible' && (
            <motion.div
              key="flexible"
              initial={{ opacity: 0, x: 200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -200 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} // expo.out
              className="relative w-full max-w-7xl px-12 flex items-center justify-between gap-4 md:gap-8"
            >
              {[
                { src: ASSETS.FLEXIBLE[0], color: 'from-blue-400/40' },
                { src: ASSETS.FLEXIBLE[1], color: 'from-purple-500/40' },
                { src: ASSETS.FLEXIBLE[2], color: 'from-amber-500/40' },
                { src: ASSETS.FLEXIBLE[3], color: 'from-emerald-500/40' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    scale: 1 + (clenchValue * 0.1) - (openValue * 0.15),
                    filter: `blur(${openValue * 25}px) saturate(${1 + clenchValue * 4}) brightness(${1 + clenchValue * 0.5})`,
                    rotateY: clenchValue * 15,
                    z: clenchValue * -50, // Pulling into depth
                  }}
                  transition={{ 
                    delay: i * 0.1,
                    scale: { type: 'spring', stiffness: 150, damping: 20 },
                    filter: { duration: 0.6, ease: "easeOut" }
                  }}
                  className="relative flex-1 flex flex-col items-center justify-center group"
                >
                  {/* Individual Color Halo & Ripple */}
                  <motion.div 
                    animate={{ 
                      scale: 1.2 + clenchValue * 1.5 + openValue * 2,
                      opacity: 0.1 + clenchValue * 0.8 + openValue * 0.2,
                      boxShadow: openValue > 0.1 ? `0 0 ${openValue * 100}px ${item.color.split('-')[1].split('/')[0]}` : 'none'
                    }}
                    className={`absolute inset-0 bg-gradient-to-b ${item.color} to-transparent rounded-full blur-[60px] md:blur-[100px] -z-10`}
                  />

                  {/* Diffusion Ripples (Open Gesture) - Celestial Orbit Style */}
                  {openValue > 0.05 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-full aspect-square max-w-[300px] flex items-center justify-center">
                        {[0, 1, 2, 3, 4, 5, 6].map((ring) => (
                          <motion.div
                            key={ring}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ 
                              scale: [1, 2 + ring * 0.3], 
                              opacity: [openValue * 0.7, 0],
                            }}
                            transition={{ 
                              duration: 4, 
                              repeat: Infinity, 
                              delay: ring * 0.4,
                              ease: "easeOut" 
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              border: `${ring === 3 ? '1px dotted' : '0.5px solid'} ${
                                item.color.includes('blue') ? '#60A5FA66' : 
                                item.color.includes('purple') ? '#A855F766' :
                                item.color.includes('amber') ? '#F59E0B66' : '#10B98166'
                              }`,
                            }}
                            className="absolute rounded-full flex items-center justify-center"
                          >
                            {/* "Planet" dots on specific orbits */}
                            {[1, 2, 4, 6].includes(ring) && (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ 
                                  duration: 8 + ring * 4, 
                                  repeat: Infinity, 
                                  ease: "linear" 
                                }}
                                className="absolute inset-0"
                              >
                                <div 
                                  style={{ 
                                    backgroundColor: 'white',
                                    boxShadow: `0 0 12px ${
                                      item.color.includes('blue') ? '#60A5FA' : 
                                      item.color.includes('purple') ? '#A855F7' :
                                      item.color.includes('amber') ? '#F59E0B' : '#10B981'
                                    }`,
                                    width: ring === 6 ? '6px' : '4px',
                                    height: ring === 6 ? '6px' : '4px',
                                    top: ring % 2 === 0 ? '-2px' : 'auto',
                                    bottom: ring % 2 !== 0 ? '-2px' : 'auto',
                                  }}
                                  className="absolute left-1/2 -translate-x-1/2 rounded-full" 
                                />
                              </motion.div>
                            )}

                            {/* Asteroid Belt Style (Ring 3) */}
                            {ring === 3 && (
                              <div className="absolute inset-0 rounded-full border-[3px] border-dotted border-white/10 scale-[1.02]" />
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <motion.img
                    src={item.src}
                    alt={`Flexible ${i + 1}`}
                    animate={{
                      scale: 1 - (clenchValue * 0.1), // Center collapse
                      filter: openValue > 0.1 ? `blur(${openValue * 5}px)` : 'none'
                    }}
                    className="w-full h-auto max-w-[280px] object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />

                  {/* Individual Status Line */}
                  <motion.div
                    animate={{
                      width: 20 + (clenchValue * 60),
                      opacity: 0.2 + (clenchValue * 0.8)
                    }}
                    className={`h-[2px] mt-8 bg-gradient-to-r ${item.color.replace('from-', 'bg-')} to-transparent`}
                  />
                </motion.div>
              ))}

              {/* Interaction Hints */}
              <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 flex items-center gap-16 opacity-50">
                <div className="flex flex-col items-center gap-4">
                  <motion.div 
                    animate={{ 
                      scale: clenchValue > 0.1 ? 0.85 : 1,
                      backgroundColor: clenchValue > 0.1 ? '#141414' : 'transparent',
                      color: clenchValue > 0.1 ? '#E4E3E0' : '#141414'
                    }}
                    className="p-3 border border-[#141414] rounded-full transition-colors duration-300"
                  >
                    <Hand size={20} />
                  </motion.div>
                  <div className="text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em]">Condense</span>
                    <span className="text-[8px] uppercase tracking-[0.1em] opacity-60">Pinch to intensify color</span>
                  </div>
                </div>

                <div className="w-[1px] h-12 bg-[#141414]/10" />

                <div className="flex flex-col items-center gap-4">
                  <motion.div 
                    animate={{ 
                      scale: openValue > 0.1 ? 1.2 : 1,
                      borderColor: openValue > 0.1 ? '#141414' : '#14141433'
                    }}
                    className="p-3 border border-[#141414] rounded-full transition-all duration-300"
                  >
                    <Hand size={20} />
                  </motion.div>
                  <div className="text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.2em]">Resonate</span>
                    <span className="text-[8px] uppercase tracking-[0.1em] opacity-60">Open to expand field</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Chapter 2 */}
          {phase === 'chapter2' && (
            <motion.div
              key="chapter2"
              initial={{ opacity: 0, x: 200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -200 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Chapter2 hands={hands} dimensions={dimensions} />
            </motion.div>
          )}

          {/* Chapter 3 */}
          {phase === 'chapter3' && (
            <motion.div
              key="chapter3"
              initial={{ opacity: 0, x: 200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -200 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Chapter3 hands={hands} dimensions={dimensions} />
            </motion.div>
          )}

          {/* Chapter 4 */}
          {phase === 'chapter4' && (
            <motion.div
              key="chapter4"
              initial={{ opacity: 0, x: 200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -200 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Chapter4 hands={hands} dimensions={dimensions} />
            </motion.div>
          )}

          {/* Chapter 5 */}
          {phase === 'chapter5' && (
            <motion.div
              key="chapter5"
              initial={{ opacity: 0, x: 200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -200 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0"
            >
              <Chapter5 hands={hands} dimensions={dimensions} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Interaction Guide */}
      <div className="fixed bottom-12 left-12 flex items-center gap-8 z-10">
        <div className="flex flex-col gap-1">
          <div className="text-[9px] uppercase tracking-widest opacity-30">Status</div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${phase === 'initial' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-[11px] font-medium uppercase">{phase}</span>
          </div>
        </div>
        
        <div className="h-8 w-[1px] bg-[#141414]/10" />

        <div className="flex flex-col gap-1">
          <div className="text-[9px] uppercase tracking-widest opacity-30">Intensity</div>
          <div className="w-32 h-1 bg-[#141414]/5 rounded-full overflow-hidden">
            <motion.div 
              animate={{ width: `${(clenchValue + openValue) * 100}%` }}
              className="h-full bg-[#141414]" 
            />
          </div>
        </div>
      </div>

      {/* Gesture Manager */}
      <GestureManager 
        onGesture={handleGesture} 
        onSwipeUpdate={handleSwipeUpdate}
        onHandsUpdate={handleHandsUpdate} 
        debug={false} 
      />

      {/* Index Finger Cursor */}
      {hands.length > 0 && hands[0][8] && (
        <div 
          className="fixed w-6 h-6 rounded-full border-2 border-white bg-black/30 pointer-events-none z-[10000] transition-transform duration-75 flex items-center justify-center"
          style={{
            left: `${(1 - hands[0][8].x) * 100}vw`,
            top: `${hands[0][8].y * 100}vh`,
            transform: `translate(-50%, -50%) scale(${clenchValue > 0.1 ? 0.6 : 1})`,
          }}
        >
          {clenchValue > 0.1 && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
      )}

      {/* Navigation Guide Icons */}
      {phase !== 'initial' && (
        <button 
          id="jump-prev"
          className="fixed top-1/2 left-6 -translate-y-1/2 w-8 h-8 rounded-full bg-white/40 backdrop-blur-md border border-black/10 shadow-lg flex items-center justify-center z-[9999] cursor-pointer hover:bg-white/80 hover:scale-110 active:scale-95 transition-all duration-300 group"
          onClick={() => {
            const currentPhase = phaseRef.current;
            if (currentPhase === 'chapter5') setPhase('chapter4');
            else if (currentPhase === 'chapter4') setPhase('chapter3');
            else if (currentPhase === 'chapter3') setPhase('chapter2');
            else if (currentPhase === 'chapter2') setPhase('flexible');
          }}
        >
          <ChevronLeft size={16} className="opacity-60 group-hover:opacity-100 transition-opacity text-black" />
        </button>
      )}
      
      {phase !== 'chapter4' && (
        <button 
          id="jump-next"
          className="fixed top-1/2 right-6 -translate-y-1/2 w-8 h-8 rounded-full bg-white/40 backdrop-blur-md border border-black/10 shadow-lg flex items-center justify-center z-[9999] cursor-pointer hover:bg-white/80 hover:scale-110 active:scale-95 transition-all duration-300 group"
          onClick={() => {
            const currentPhase = phaseRef.current;
            if (currentPhase === 'initial') {
              setPhase('dissipating');
              setTimeout(() => setPhase('flexible'), 2000);
            } else if (currentPhase === 'flexible') setPhase('chapter2');
            else if (currentPhase === 'chapter2') setPhase('chapter3');
            else if (currentPhase === 'chapter3') setPhase('chapter4');
            else if (currentPhase === 'chapter4') setPhase('chapter5');
          }}
        >
          <ChevronRight size={16} className="opacity-60 group-hover:opacity-100 transition-opacity text-black" />
        </button>
      )}

      {/* Background Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/p6.png')]" />
    </div>
  );
}
