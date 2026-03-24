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
  color: string;
}

export const Chapter3: React.FC<Chapter3Props> = ({ hands, dimensions }) => {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, isPinching: false });
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

  // Initialize state and extract actual dot coordinates for the active menu
  useEffect(() => {
    if (!initializedMenus.current.has(activeMenu)) {
      initializedMenus.current.add(activeMenu);
      
      const randomColor = LOW_SATURATION_COLORS[Math.floor(Math.random() * LOW_SATURATION_COLORS.length)];
      
      // Initial empty state while loading coordinates
      setMenuStates(prev => ({
        ...prev,
        [activeMenu]: { nodes: [], completed: false, color: randomColor }
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
    if (hands.length === 0) {
      isPinchingRef.current = false;
      return;
    }

    const hand1 = hands[0];
    
    const indexTip = getScreenCoords(hand1[8]);
    const thumbTip = getScreenCoords(hand1[4]);

    const dist = Math.hypot(indexTip.x - thumbTip.x, indexTip.y - thumbTip.y);
    let isPinching = isPinchingRef.current;
    if (!isPinching && dist < 80) {
      isPinching = true;
    } else if (isPinching && dist > 110) {
      isPinching = false;
    }
    const wasPinching = isPinchingRef.current;
    isPinchingRef.current = isPinching;

    setCursorPos(prev => {
      if (Math.abs(prev.x - indexTip.x) < 0.1 && Math.abs(prev.y - indexTip.y) < 0.1 && prev.isPinching === isPinching) return prev;
      return { ...indexTip, isPinching };
    });

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
            nodes: prev[clampedZone].nodes.map(n => ({ ...n, activated: false }))
          }
        }));
      }
    } 
    // Right Canvas Interaction
    else {
      const currentState = menuStates[activeMenu];
      if (currentState && !currentState.completed && currentState.nodes.length > 0) {
        // Center of the right 3/4 area
        const centerX = dimensions.width * 0.25 + (dimensions.width * 0.75) / 2;
        const centerY = dimensions.height / 2;
        
        let changed = false;
        const newNodes = currentState.nodes.map(node => {
          if (!node.activated) {
            const nodeGlobalX = centerX + node.dx;
            const nodeGlobalY = centerY + node.dy;
            const nodeDist = Math.hypot(indexTip.x - nodeGlobalX, indexTip.y - nodeGlobalY);
            
            // Activate by simply hovering over the node (larger hit area, no pinch required)
            if (nodeDist < 80) { 
              changed = true;
              return { ...node, activated: true };
            }
          }
          return node;
        });

        if (changed) {
          const allActivated = newNodes.every(n => n.activated);
          setMenuStates(prev => ({
            ...prev,
            [activeMenu]: {
              ...prev[activeMenu],
              nodes: newNodes,
              completed: allActivated
            }
          }));
        }
      }
    }
  }, [hands, dimensions, activeMenu, menuStates]);

  const handleMenuClick = (index: number) => {
    setActiveMenu(index);
    setMenuStates(prev => {
      if (!prev[index]) return prev;
      return {
        ...prev,
        [index]: {
          ...prev[index],
          completed: false,
          nodes: prev[index].nodes.map(n => ({ ...n, activated: false }))
        }
      };
    });
  };

  const currentState = menuStates[activeMenu];

  return (
    <div className="absolute inset-0 w-full h-full bg-[#F4F4F4] z-40 overflow-hidden flex">
      {/* Left Menu Area (1/4) */}
      <div className="relative w-1/4 h-full border-r border-black/5 flex flex-col pt-12 bg-white/50 backdrop-blur-sm z-50">
        <div className="px-12 space-y-2 mb-12">
          <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase opacity-40 text-black">
            <span>Chapter 03</span>
          </div>
          <h1 className="text-2xl font-light italic serif tracking-tighter text-black">秩序互动</h1>
        </div>

        <div className="relative flex-1 flex flex-col w-full pb-12">
          <div className="absolute top-0 bottom-12 left-1/2 w-[1px] bg-black/5 -translate-x-1/2 -z-10" />
          
          {[0, 1, 2, 3].map(i => {
            const isActive = activeMenu === i;
            const isCompleted = menuStates[i]?.completed;
            return (
              <div 
                key={i} 
                className="flex-1 flex items-center justify-center relative w-full cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => handleMenuClick(i)}
              >
                <motion.div 
                  animate={{ 
                    scale: isActive ? 1.2 : 1,
                    opacity: isActive ? 1 : (isCompleted ? 0.5 : 0.2),
                    x: isActive ? 10 : 0
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="text-5xl font-light serif italic text-black"
                >
                  0{i + 1}
                </motion.div>
                <motion.div 
                  animate={{
                    scale: isActive ? 1 : 0,
                    opacity: isActive ? 1 : 0
                  }}
                  className="absolute left-1/2 -translate-x-12 w-1.5 h-1.5 rounded-full bg-black"
                />
              </div>
            );
          })}
        </div>
        
        <div className="absolute bottom-8 left-12 text-[10px] uppercase tracking-[0.2em] opacity-30">
          Slide to select<br/>Hover dots to activate
        </div>
      </div>

      {/* Right Canvas Area (3/4) */}
      <div className="relative w-3/4 h-full flex items-center justify-center">
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

        <AnimatePresence mode="wait">
          {currentState && (
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative w-[500px] h-[500px] flex items-center justify-center"
            >
              {/* Perfect Circular Halos (Rendered behind the dots) */}
              <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${currentState.completed ? 'opacity-0' : 'opacity-100'}`}>
                {currentState.nodes.map(node => {
                  const innerRadius = node.radius * 3.5;
                  const outerRadius = node.radius * 6.5;
                  return (
                    <div 
                      key={`halo-${node.id}`} 
                      className="absolute pointer-events-none" 
                      style={{ left: `calc(50% + ${node.dx}px)`, top: `calc(50% + ${node.dy}px)` }}
                    >
                      {/* Outer Halo */}
                      <div 
                        className="absolute rounded-full bg-black/[0.04] -translate-x-1/2 -translate-y-1/2"
                        style={{ width: outerRadius * 2, height: outerRadius * 2 }}
                      />
                      {/* Inner Halo */}
                      <div 
                        className="absolute rounded-full bg-black/[0.08] -translate-x-1/2 -translate-y-1/2"
                        style={{ width: innerRadius * 2, height: innerRadius * 2 }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Base Dot Asset */}
              <img 
                src={DOT_ASSETS[activeMenu]} 
                alt="Dot pattern"
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 z-10 ${currentState.completed ? 'opacity-20' : 'opacity-90'}`}
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />

              {/* Interactive Nodes (Only show if not completed) */}
              {!currentState.completed && currentState.nodes.map(node => (
                <AnimatePresence key={node.id}>
                  {!node.activated && (
                    <motion.div
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute w-16 h-16 -ml-8 -mt-8 flex items-center justify-center z-20"
                      style={{ left: `calc(50% + ${node.dx}px)`, top: `calc(50% + ${node.dy}px)` }}
                    >
                      {/* Subtle breathing ring to indicate interactivity, NO artificial dot */}
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.6, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full border border-black/30"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              ))}

              {/* Burst Effect on Completion */}
              <AnimatePresence>
                {currentState.completed && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none z-10"
                    style={{ backgroundColor: currentState.color }}
                  />
                )}
              </AnimatePresence>

              {/* Final Pattern Overlay */}
              <AnimatePresence>
                {currentState.completed && (
                  <motion.div
                    initial={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
                    animate={{ clipPath: 'circle(100% at 50% 50%)', opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 1 } }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="absolute inset-0 z-30"
                  >
                    <div 
                      className="w-full h-full"
                      style={{ 
                        backgroundColor: currentState.color,
                        WebkitMaskImage: `url("${PATTERN_ASSETS[activeMenu]}")`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskImage: `url("${PATTERN_ASSETS[activeMenu]}")`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        maskPosition: 'center',
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
