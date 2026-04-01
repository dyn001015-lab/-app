import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const DOT_ASSETS = [
  'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%8A%BD%E8%B1%A11%EF%BC%88%E7%82%B9%EF%BC%89.png',
  'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%8A%BD%E8%B1%A12%EF%BC%88%E7%82%B9%EF%BC%89.png',
  'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%8A%BD%E8%B1%A13%EF%BC%88%E7%82%B9%EF%BC%89.png',
  'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%8A%BD%E8%B1%A14%EF%BC%88%E7%82%B9%EF%BC%89.png'
];

const PATTERN_ASSETS = [
  'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%8A%BD%E8%B1%A11.png',
  'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%8A%BD%E8%B1%A12.png',
  'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%8A%BD%E8%B1%A13.png',
  'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%8A%BD%E8%B1%A14.png'
];

const LOW_SATURATION_COLORS = [
  '#7A9CAC', // Muted Blue
  '#AC987A', // Muted Orange/Brown
  '#9CAC7A', // Muted Green
  '#AC7A9C', // Muted Pink
  '#8B7AAC', // Muted Purple
  '#ACAC7A'  // Muted Yellow
];

const DIGITS: Record<string, number[][]> = {
  '0': [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0],
  ],
  '1': [
    [0, 1, 0, 0],
    [1, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
    [0, 1, 0, 0],
  ],
  '2': [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 0, 1, 0],
    [0, 1, 0, 0],
    [1, 1, 1, 1],
  ],
  '3': [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [0, 0, 1, 1],
    [0, 0, 0, 1],
    [0, 1, 1, 0],
  ],
  '4': [
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [1, 1, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
  ]
};

const DotDigit = ({ digit, isActive, isCompleted }: { digit: string, isActive: boolean, isCompleted: boolean }) => {
  const grid = DIGITS[digit] || DIGITS['0'];
  return (
    <div className="flex flex-col gap-[2px]">
      {grid.map((row, rIdx) => (
        <div key={rIdx} className="flex gap-[2px]">
          {row.map((val, cIdx) => (
            <div 
              key={cIdx} 
              className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full transition-colors duration-300 ${
                val 
                  ? (isActive ? 'bg-black' : isCompleted ? 'bg-black/40' : 'bg-black/15') 
                  : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const DotNumber = ({ number, isActive, isCompleted }: { number: number, isActive: boolean, isCompleted: boolean }) => {
  const str = `0${number + 1}`;
  return (
    <div className="flex gap-2">
      <DotDigit digit={str[0]} isActive={isActive} isCompleted={isCompleted} />
      <DotDigit digit={str[1]} isActive={isActive} isCompleted={isCompleted} />
    </div>
  );
};

// Helper function to dynamically find opaque pixels (dots) in the user's image
const extractHotspots = (src: string): Promise<{dx: number, dy: number, radius: number}[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 500; // Match the container size
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve([]);
          return;
        }
        
        // Draw image to fit within 500x500 (object-contain equivalent)
        const scale = Math.min(size / img.width, size / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (size - w) / 2;
        const y = (size - h) / 2;
        ctx.drawImage(img, x, y, w, h);

        const imageData = ctx.getImageData(0, 0, size, size).data;
        const clusters: {x: number, y: number, count: number}[] = [];
        const CLUSTER_RADIUS = 35; // Radius to group pixels into a single dot

        // Sample pixels to find opaque regions (the dots)
        for (let i = 0; i < imageData.length; i += 16) {
          if (imageData[i + 3] > 128) { // Alpha > 50%
            const pixelIndex = i / 4;
            const px = pixelIndex % size;
            const py = Math.floor(pixelIndex / size);
            
            let foundCluster = false;
            for (const cluster of clusters) {
              if (Math.hypot(cluster.x - px, cluster.y - py) < CLUSTER_RADIUS) {
                // Approximate running average for centroid
                cluster.x = (cluster.x * cluster.count + px) / (cluster.count + 1);
                cluster.y = (cluster.y * cluster.count + py) / (cluster.count + 1);
                cluster.count++;
                foundCluster = true;
                break;
              }
            }

            if (!foundCluster) {
              clusters.push({ x: px, y: py, count: 1 });
            }
          }
        }

        // Filter out noise (clusters with too few pixels) and map to center-relative coordinates
        const validDots = clusters
          .filter(c => c.count > 2)
          .map(c => ({ 
            dx: c.x - size/2, 
            dy: c.y - size/2,
            radius: Math.min(12, Math.max(2.5, Math.sqrt(c.count / Math.PI)))
          }));

        resolve(validDots);
      } catch (e) {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = src;
  });
};

interface Chapter3Props {
  hands: any[];
  dimensions: { width: number; height: number };
}

interface InteractionNode {
  id: number;
  dx: number;
  dy: number;
  radius: number;
  activated: boolean;
}

interface MenuState {
  nodes: InteractionNode[];
  completed: boolean;
  precision: number;
  color: string;
  progress: number;
}

const FloatingDots = ({ 
  nodes, 
  handPositions,
  isPinching,
  isTriggered,
  precision,
  onProgress
}: { 
  nodes: any[], 
  handPositions: {x: number, y: number}[],
  isPinching: boolean,
  isTriggered: boolean,
  precision: number,
  onProgress: (progress: number) => void
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<any[]>([]);
  const requestRef = useRef<number>();

  useEffect(() => {
    if (nodes && nodes.length > 0) {
      dotsRef.current = nodes.map(node => ({
        id: node.id,
        targetX: node.dx,
        targetY: node.dy,
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 500,
        vx: 0,
        vy: 0,
        radius: node.radius,
        baseFloatVx: (Math.random() - 0.5) * 1.5,
        baseFloatVy: (Math.random() - 0.5) * 1.5,
        finalTargetSet: false,
        finalX: 0,
        finalY: 0,
        isSettled: false,
        alpha: 1,
        burstAlpha: 0,
        trail: []
      }));
    }
  }, [nodes]);

  const stateRef = useRef({ handPositions, isPinching, isTriggered, precision });
  useEffect(() => {
    stateRef.current = { handPositions, isPinching, isTriggered, precision };
  }, [handPositions, isPinching, isTriggered, precision]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      const { handPositions: hPos, isPinching: pinching, isTriggered: triggered, precision: prec } = stateRef.current;
      
      let settledCount = 0;

      dotsRef.current.forEach(dot => {
        if (triggered) {
          if (!dot.finalTargetSet) {
             dot.finalX = dot.targetX;
             dot.finalY = dot.targetY;
             dot.finalTargetSet = true;
          }
          if (!dot.isSettled) {
             dot.isSettled = true;
             dot.burstAlpha = 1;
          }
          // Fast forward snap
          dot.x += (dot.finalX - dot.x) * 0.25;
          dot.y += (dot.finalY - dot.y) * 0.25;
          settledCount++;
        } else {
          dot.finalTargetSet = false;
          
          if (dot.isSettled) {
             // Keep it settled
             dot.x = dot.targetX;
             dot.y = dot.targetY;
             settledCount++;
          } else {
            // Floating
            dot.x += dot.baseFloatVx;
            dot.y += dot.baseFloatVy;
            
            // Bounce off edges
            if (dot.x < -250 || dot.x > 250) dot.baseFloatVx *= -1;
            if (dot.y < -250 || dot.y > 250) dot.baseFloatVy *= -1;
            
            // Attraction from hands
            let isAttracted = false;
            hPos.forEach(hand => {
              const dx = dot.x - hand.x;
              const dy = dot.y - hand.y;
              const d = Math.hypot(dx, dy);
              
              const attractionRadius = pinching ? 150 : 80;
              const attractionForce = pinching ? 4.0 : 1.5;

              if (d < attractionRadius) {
                isAttracted = true;
                // Pull towards target position instead of hand
                const targetDx = dot.targetX - dot.x;
                const targetDy = dot.targetY - dot.y;
                const targetDist = Math.hypot(targetDx, targetDy);
                
                if (targetDist > 0) {
                   dot.vx += (targetDx / targetDist) * attractionForce;
                   dot.vy += (targetDy / targetDist) * attractionForce;
                }
              }
            });

            // Check if it reached the target
            const distToTarget = Math.hypot(dot.targetX - dot.x, dot.targetY - dot.y);
            if (distToTarget < 15) {
               dot.isSettled = true;
               dot.burstAlpha = 1;
               dot.x = dot.targetX;
               dot.y = dot.targetY;
               dot.vx = 0;
               dot.vy = 0;
            } else {
              // Friction
              dot.vx *= 0.88;
              dot.vy *= 0.88;
              dot.x += dot.vx;
              dot.y += dot.vy;
            }
          }
        }
        
        if (dot.isSettled) {
           dot.alpha = Math.max(0, dot.alpha - 0.05);
        } else {
           dot.alpha = Math.min(1, dot.alpha + 0.05);
        }
        
        // Update trail
        if (!dot.isSettled || triggered) {
           dot.trail.push({x: dot.x, y: dot.y});
           if (dot.trail.length > 5) dot.trail.shift();
        } else {
           if (dot.trail.length > 0) dot.trail.shift();
        }

        // Draw trail
        if (dot.trail.length > 1 && dot.alpha > 0) {
           ctx.beginPath();
           ctx.moveTo(centerX + dot.trail[0].x, centerY + dot.trail[0].y);
           for (let i = 1; i < dot.trail.length; i++) {
              ctx.lineTo(centerX + dot.trail[i].x, centerY + dot.trail[i].y);
           }
           ctx.strokeStyle = `rgba(120, 120, 120, ${0.3 * dot.alpha})`;
           ctx.lineWidth = dot.radius;
           ctx.lineCap = 'round';
           ctx.stroke();
        }

        if (dot.alpha > 0) {
           ctx.beginPath();
           let drawX = centerX + dot.x;
           let drawY = centerY + dot.y;
           
           ctx.arc(drawX, drawY, dot.radius, 0, Math.PI * 2);
           ctx.fillStyle = `rgba(120, 120, 120, ${0.6 * dot.alpha})`;
           ctx.fill();
        }

        // Draw burst effect
        if (dot.burstAlpha > 0) {
           ctx.beginPath();
           ctx.arc(centerX + dot.x, centerY + dot.y, dot.radius * (2 - dot.burstAlpha) * 3, 0, Math.PI * 2);
           ctx.fillStyle = `rgba(255, 255, 255, ${dot.burstAlpha})`;
           ctx.fill();
           dot.burstAlpha -= 0.05;
        }
      });
      
      if (!triggered && dotsRef.current.length > 0) {
         const currentProgress = settledCount / dotsRef.current.length;
         onProgress(currentProgress);
      }

      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [onProgress]);

  return (
    <canvas 
      ref={canvasRef} 
      width={500} 
      height={500} 
      className="absolute inset-0 pointer-events-none z-20"
    />
  );
};

export const Chapter3: React.FC<Chapter3Props> = ({ hands, dimensions }) => {
  const isPinchingRef = useRef(false);
  const [activeMenu, setActiveMenu] = useState<number>(0);
  const [menuStates, setMenuStates] = useState<Record<number, MenuState>>({});
  const initializedMenus = useRef<Set<number>>(new Set());

  const getScreenCoords = (landmark: any) => {
    if (!landmark) return { x: 0, y: 0 };
    return {
      x: (1 - landmark.x) * dimensions.width,
      y: landmark.y * dimensions.height
    };
  };

  // Derived state calculated during render
  let handPositions: {x: number, y: number}[] = [];
  let isPinching = false;
  
  const indexTip = hands.length > 0 ? getScreenCoords(hands[0][8]) : { x: 0, y: 0 };
  const thumbTip = hands.length > 0 ? getScreenCoords(hands[0][4]) : { x: 0, y: 0 };
  const pinchDist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);

  if (hands.length > 0) {
    if (!isPinchingRef.current && pinchDist < 80) isPinchingRef.current = true;
    else if (isPinchingRef.current && pinchDist > 110) isPinchingRef.current = false;
    isPinching = isPinchingRef.current;
  } else {
    isPinchingRef.current = false;
  }
  const cursorPos = { ...indexTip, isPinching: isPinchingRef.current };

  const rightCenterX = dimensions.width * 0.25 + (dimensions.width * 0.75) / 2;
  const rightCenterY = dimensions.height / 2;

  if (hands.length >= 2) {
    const hand1 = getScreenCoords(hands[0][8]);
    const hand2 = getScreenCoords(hands[1][8]);
    handPositions = [
      { x: hand1.x - rightCenterX, y: hand1.y - rightCenterY },
      { x: hand2.x - rightCenterX, y: hand2.y - rightCenterY }
    ];
  } else if (hands.length === 1) {
    handPositions = [
      { x: indexTip.x - rightCenterX, y: indexTip.y - rightCenterY }
    ];
  }

  // Initialize state and extract actual dot coordinates for the active menu
  useEffect(() => {
    if (!initializedMenus.current.has(activeMenu)) {
      initializedMenus.current.add(activeMenu);
      
      const assignedColor = LOW_SATURATION_COLORS[activeMenu % 4];
      
      // Initial empty state while loading coordinates
      setMenuStates(prev => ({
        ...prev,
        [activeMenu]: { nodes: [], completed: false, precision: 1, color: assignedColor, progress: 0 }
      }));

      // Dynamically find the dots in the user's image
      extractHotspots(DOT_ASSETS[activeMenu]).then(points => {
        // Fallback coordinates just in case image processing fails
        const finalPoints = points.length > 0 ? points : [
          { dx: -80, dy: -100, radius: 4 }, { dx: 120, dy: 40, radius: 5 }, { dx: -50, dy: 150, radius: 3 },
          { dx: 80, dy: -80, radius: 6 }, { dx: -100, dy: 80, radius: 4 }
        ];
        
        const nodes = finalPoints.map((p, i) => ({
          id: i,
          dx: p.dx,
          dy: p.dy,
          radius: p.radius || 4,
          activated: false
        }));

        setMenuStates(prev => ({
          ...prev,
          [activeMenu]: { ...prev[activeMenu], nodes }
        }));
      });
    }
  }, [activeMenu]);

  useEffect(() => {
    if (hands.length === 0) return;

    // Left Menu Selection (Left 25% of screen)
    if (indexTip.x < dimensions.width * 0.25) {
      const zone = Math.floor((indexTip.y / dimensions.height) * 4);
      const clampedZone = Math.max(0, Math.min(3, zone));
      
      // Smooth slide to select (no pinch required)
      if (activeMenu !== clampedZone) {
        setActiveMenu(clampedZone);
      }
      
      // Auto-reset: if hovering over the left menu zone of a completed item
      const hoveredState = menuStates[clampedZone];
      if (hoveredState?.completed) {
        setMenuStates(prev => ({
          ...prev,
          [clampedZone]: {
            ...prev[clampedZone],
            completed: false,
            progress: 0,
            nodes: prev[clampedZone].nodes.map(n => ({ ...n, activated: false }))
          }
        }));
      }
    } 
  }, [hands, dimensions, activeMenu, menuStates, indexTip.x, indexTip.y]);

  const handleMenuClick = (index: number) => {
    setActiveMenu(index);
    setMenuStates(prev => {
      if (!prev[index]) return prev;
      return {
        ...prev,
        [index]: {
          ...prev[index],
          completed: false,
          progress: 0,
          nodes: prev[index].nodes.map(n => ({ ...n, activated: false }))
        }
      };
    });
  };

  const handleProgressUpdate = (progress: number) => {
    setMenuStates(prev => {
      const current = prev[activeMenu];
      if (!current) return prev;
      
      const isCompleted = current.completed || progress >= 0.98;
      
      // Throttle state updates to prevent infinite re-renders
      if (Math.abs(current.progress - progress) < 0.01 && current.completed === isCompleted) {
        return prev;
      }
      
      return {
        ...prev,
        [activeMenu]: {
          ...current,
          progress,
          completed: isCompleted,
          precision: 1
        }
      };
    });
  };

  const currentState = menuStates[activeMenu];

  return (
    <div className="absolute inset-0 w-full h-full bg-[#F4F4F4] z-40 overflow-hidden flex">
      {/* Left Menu Area (1/4) */}
      <div className="relative w-1/4 h-full border-r border-black/5 flex flex-col pt-12 bg-white/50 backdrop-blur-sm z-50">
        <div className="px-12 space-y-2 mb-8 shrink-0">
          <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase opacity-40 text-black">
            <span>Chapter 03</span>
          </div>
          <h1 className="text-2xl font-light italic serif tracking-tighter text-black">秩序互动</h1>
        </div>

        <div className="relative flex-1 flex flex-col w-full pb-12 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="absolute top-0 bottom-12 left-1/2 w-[1px] bg-black/5 -translate-x-1/2 -z-10" />
          
          {[0, 1, 2, 3].map(i => {
            const isActive = activeMenu === i;
            const isCompleted = menuStates[i]?.completed;
            return (
              <div 
                key={i} 
                className="flex-1 min-h-[100px] flex items-center justify-center relative w-full cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => handleMenuClick(i)}
              >
                <motion.div 
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    x: isActive ? 12 : 0
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <DotNumber number={i} isActive={isActive} isCompleted={isCompleted} />
                </motion.div>
                <motion.div 
                  animate={{
                    scale: isActive ? 1 : 0,
                    opacity: isActive ? 1 : 0
                  }}
                  className="absolute left-1/2 -translate-x-16 w-1.5 h-1.5 rounded-full bg-black"
                />
              </div>
            );
          })}
        </div>
        
        <div className="absolute bottom-8 left-12 text-[10px] uppercase tracking-[0.2em] opacity-30">
          Slide to select<br/>Hover dots to activate
        </div>
      </div>

      {/* Flowing Halo Background Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {currentState && !currentState.completed && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[100px] opacity-30"
            style={{
              background: `radial-gradient(circle, ${currentState.color} 0%, transparent 70%)`
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
              rotate: [0, 90, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
      </div>

      {/* Right Canvas Area (3/4) */}
      <div className="relative w-3/4 h-full flex items-center justify-center z-10">
        {/* Global Noise Overlay for Paper Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.4] mix-blend-multiply z-50" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
          }} 
        />

        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black" />
          <div className="absolute top-0 left-1/2 w-[1px] h-full bg-black" />
        </div>

        {/* Order Progress Bar */}
        {currentState && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-64 h-1 bg-black/10 rounded-full overflow-hidden z-50">
            <motion.div 
              className="h-full"
              style={{ backgroundColor: currentState.color }}
              animate={{ width: `${currentState.progress * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentState && (
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ 
                opacity: 1, 
                scale: currentState.completed ? 1 : 0.85,
                boxShadow: currentState.completed ? 'none' : `inset 0 0 50px rgba(0,0,0,0.05)`
              }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative w-[500px] h-[500px] flex items-center justify-center rounded-full"
            >
              {/* Floating Dots Canvas */}
              <FloatingDots 
                nodes={currentState.nodes} 
                handPositions={handPositions}
                isPinching={isPinching}
                isTriggered={currentState.completed} 
                precision={currentState.precision}
                onProgress={handleProgressUpdate}
              />

              {/* Burst Effect on Completion (Light Burst) */}
              <AnimatePresence>
                {currentState.completed && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 3, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-2xl pointer-events-none z-10 bg-white"
                  />
                )}
              </AnimatePresence>

              {/* Final Pattern Overlay with Morandi Color */}
              <AnimatePresence>
                {currentState && (
                  <motion.div
                    animate={{ 
                      opacity: currentState.progress,
                      scale: currentState.completed ? 1 : 0.95
                    }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
                  >
                    <div 
                      className="relative w-full h-full"
                      style={{
                        backgroundColor: currentState.color,
                        WebkitMaskImage: `url(${PATTERN_ASSETS[activeMenu]})`,
                        maskImage: `url(${PATTERN_ASSETS[activeMenu]})`,
                        WebkitMaskSize: 'cover',
                        maskSize: 'cover',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center'
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Virtual Cursor */}
      {hands.length > 0 && (
        <div 
          className="fixed z-[100] pointer-events-none flex items-center justify-center transition-opacity duration-75"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className={`w-3 h-3 rounded-full transition-all duration-200 ${cursorPos.isPinching ? 'bg-amber-500 scale-75' : 'bg-black/60 backdrop-blur-sm'}`} />
          {cursorPos.isPinching && (
            <div className="absolute inset-[-4px] border border-amber-500/50 rounded-full animate-ping" />
          )}
        </div>
      )}
    </div>
  );
};
