import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Download, X, Maximize, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { toPng } from 'html-to-image';

const ASSETS = {
  flexible: [
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%9F%94%E6%80%A71.png',
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%9F%94%E6%80%A72.png',
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%9F%94%E6%80%A73.png',
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%9F%94%E6%80%A74.png'
  ],
  linear: [
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E7%BA%BF%E6%80%A71.png',
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E7%BA%BF%E6%80%A72.png',
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E7%BA%BF%E6%80%A73.png',
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E7%BA%BF%E6%80%A74.png'
  ],
  abstract: [
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%8A%BD%E8%B1%A11.png',
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%8A%BD%E8%B1%A12.png',
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%8A%BD%E8%B1%A13.png',
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/%E6%8A%BD%E8%B1%A14.png'
  ],
  vases: [
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/IMG_4005%202.png',
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/IMG_4005%203.png',
    'https://raw.githubusercontent.com/dyn001015-lab/web/main/IMG_4005.png'
  ]
};

type Category = 'flexible' | 'linear' | 'abstract';
type StyleType = 'normal' | 'tech' | 'emboss' | 'pixel' | 'grid' | 'neon' | 'beaded';

const getStyleProps = (style: StyleType): React.CSSProperties => {
  switch (style) {
    case 'tech':
      return {
        filter: 'url(#wireframe) drop-shadow(0 0 4px rgba(255,255,255,0.8))'
      };
    case 'emboss':
      return {
        filter: 'brightness(0) invert(1) drop-shadow(1px 2px 3px rgba(0,0,0,0.3)) drop-shadow(3px 8px 16px rgba(0,0,0,0.15))',
      };
    case 'pixel':
      return {
        WebkitMaskImage: 'repeating-linear-gradient(to right, black 0, black 4px, transparent 4px, transparent 5px), repeating-linear-gradient(to bottom, black 0, black 4px, transparent 4px, transparent 5px)',
        WebkitMaskComposite: 'source-in',
        maskImage: 'repeating-linear-gradient(to right, black 0, black 4px, transparent 4px, transparent 5px), repeating-linear-gradient(to bottom, black 0, black 4px, transparent 4px, transparent 5px)',
        maskComposite: 'intersect',
        filter: 'contrast(1.4) saturate(1.5) drop-shadow(1px 1px 0px rgba(0,0,0,0.2))'
      };
    case 'grid':
      return {
        WebkitMaskImage: 'repeating-linear-gradient(to right, black 0, black 1px, transparent 1px, transparent 6px), repeating-linear-gradient(to bottom, black 0, black 1px, transparent 1px, transparent 6px)',
        WebkitMaskComposite: 'source-over',
        maskImage: 'repeating-linear-gradient(to right, black 0, black 1px, transparent 1px, transparent 6px), repeating-linear-gradient(to bottom, black 0, black 1px, transparent 1px, transparent 6px)',
        maskComposite: 'add',
        filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.6))'
      };
    case 'neon':
      return {
        filter: 'saturate(2.5) brightness(1.2) drop-shadow(0 0 2px #fff) drop-shadow(0 0 6px #f0f) drop-shadow(0 0 12px #0ff)',
        WebkitMaskImage: 'repeating-linear-gradient(to bottom, black 0, black 2px, transparent 2px, transparent 3px)',
        maskImage: 'repeating-linear-gradient(to bottom, black 0, black 2px, transparent 2px, transparent 3px)',
      };
    case 'beaded':
      return {
        WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 40%, transparent 45%), radial-gradient(circle at 50% 50%, black 40%, transparent 45%)',
        WebkitMaskPosition: '0 0, 3px 3px',
        WebkitMaskSize: '6px 6px',
        maskImage: 'radial-gradient(circle at 50% 50%, black 40%, transparent 45%), radial-gradient(circle at 50% 50%, black 40%, transparent 45%)',
        maskPosition: '0 0, 3px 3px',
        maskSize: '6px 6px',
        filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5)) drop-shadow(-1px -1px 1px rgba(255,255,255,0.8)) saturate(1.2)'
      };
    default:
      return {
        filter: 'drop-shadow(0 20px 25px rgba(0,0,0,0.1))',
      };
  }
};

const FOLDER_COLORS: Record<Category, string> = {
  flexible: '#A0AEC0', // Lighter Slate
  linear: '#A3A398',   // Lighter Olive
  abstract: '#B5A6B0'  // Lighter Mauve
};

const GlassFolder = ({ isOpen, title, colorHex }: { isOpen: boolean, title: string, colorHex: string }) => {
  return (
    <div className="flex flex-col items-center gap-2 w-full py-1">
      <div className="relative w-16 h-11">
        {/* Back Cover */}
        <div
          className="absolute inset-0 rounded-lg shadow-sm"
          style={{ backgroundColor: colorHex }}
        >
          {/* Folder Tab */}
          <div
            className="absolute -top-1 left-1.5 w-6 h-2 rounded-t-sm"
            style={{ backgroundColor: colorHex }}
          />
        </div>

        {/* Documents */}
        <motion.div
          initial={false}
          animate={{
            y: isOpen ? -10 : 0,
            x: isOpen ? -2 : 0,
            rotate: isOpen ? -6 : 0
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="absolute top-1 left-1 right-2 h-8 bg-[#F8F9FA] rounded-sm shadow-sm border border-black/5 flex flex-col gap-0.5 p-1 z-0"
        >
          <div className="w-3/4 h-0.5 bg-black/10 rounded-full" />
          <div className="w-full h-0.5 bg-black/10 rounded-full" />
          <div className="w-5/6 h-0.5 bg-black/10 rounded-full" />
        </motion.div>

        <motion.div
          initial={false}
          animate={{
            y: isOpen ? -14 : 0,
            x: isOpen ? 3 : 0,
            rotate: isOpen ? 8 : 0
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.05 }}
          className="absolute top-1 left-2 right-1 h-8 bg-white rounded-sm shadow-sm border border-black/5 flex flex-col gap-0.5 p-1 z-0"
        >
          <div className="w-1/2 h-0.5 bg-black/10 rounded-full" />
          <div className="w-full h-0.5 bg-black/10 rounded-full" />
          <div className="w-4/5 h-0.5 bg-black/10 rounded-full" />
        </motion.div>

        {/* Front Cover (Glassmorphism) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-8 rounded-lg border border-white/30 shadow-[0_-2px_8px_rgba(0,0,0,0.1)] overflow-hidden z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(160,160,160,0.4) 0%, rgba(100,100,100,0.15) 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-50" />
        </div>
      </div>
      <span className="text-[9px] tracking-widest font-light text-black/80">{title}</span>
    </div>
  );
};

interface Chapter4Props {
  hands: any[];
  dimensions: { width: number; height: number };
}

interface PlacedItem {
  id: string;
  src: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zIndex: number;
}

interface DragState {
  id?: string;
  src: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  startPinchDist?: number;
  startPinchAngle?: number;
  startScale?: number;
  startRotation?: number;
}

export const Chapter4: React.FC<Chapter4Props> = ({ hands, dimensions }) => {
  const [activeFolder, setActiveFolder] = useState<Category | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [draggingItem, setDraggingItem] = useState<DragState | null>(null);
  const [cursor, setCursor] = useState({ x: -100, y: -100, isPinching: false });
  const [activeStyle, setActiveStyle] = useState<StyleType>('normal');
  const [isCaptured, setIsCaptured] = useState(false);
  const [vaseIndex, setVaseIndex] = useState(0);
  const [dwellProgress, setDwellProgress] = useState(0);
  const dwellTarget = useRef<HTMLElement | null>(null);
  const dwellStartTime = useRef<number | null>(null);
  
  const stampRef = useRef<HTMLDivElement>(null);
  const leftMenuRef = useRef<HTMLDivElement>(null);
  const isPinchingRef = useRef(false);
  const draggingRef = useRef<DragState | null>(null);
  
  // Scroll & Gesture Refs
  const prevIndexY = useRef<number | null>(null);
  const targetScrollY = useRef<number>(0);
  const currentScrollY = useRef<number>(0);
  const scrollRafId = useRef<number | null>(null);
  const frameGestureCount = useRef<number>(0);
  const smoothedScale = useRef<number>(1);
  const smoothedRotation = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Auto-scroll when folder expands
  useEffect(() => {
    if (activeFolder && leftMenuRef.current) {
      const timer = setTimeout(() => {
        const folderEl = leftMenuRef.current?.querySelector(`[data-folder="${activeFolder}"]`)?.parentElement;
        if (folderEl && leftMenuRef.current) {
          const containerRect = leftMenuRef.current.getBoundingClientRect();
          const folderRect = folderEl.getBoundingClientRect();
          
          // If the folder's bottom is outside the container or it's just too low
          if (folderRect.bottom > containerRect.bottom - 100 || folderRect.top < containerRect.top + 100) {
            const targetScroll = leftMenuRef.current.scrollTop + (folderRect.top - containerRect.top) - 20;
            targetScrollY.current = Math.max(0, targetScroll);
          }
        }
      }, 300); // Wait for animation
      return () => clearTimeout(timer);
    }
  }, [activeFolder]);

  // Smooth Scroll Loop
  useEffect(() => {
    const updateScroll = () => {
      if (leftMenuRef.current) {
        currentScrollY.current += (targetScrollY.current - currentScrollY.current) * 0.15;
        if (Math.abs(targetScrollY.current - currentScrollY.current) > 0.5) {
          leftMenuRef.current.scrollTop = currentScrollY.current;
        }
      }
      scrollRafId.current = requestAnimationFrame(updateScroll);
    };
    scrollRafId.current = requestAnimationFrame(updateScroll);
    return () => {
      if (scrollRafId.current) cancelAnimationFrame(scrollRafId.current);
    };
  }, []);

  const handleMenuScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (Math.abs(e.currentTarget.scrollTop - currentScrollY.current) > 5) {
      targetScrollY.current = e.currentTarget.scrollTop;
      currentScrollY.current = e.currentTarget.scrollTop;
    }
  };

  const handleDrop = (dropX: number, dropY: number) => {
    if (draggingRef.current) {
      const stampRect = stampRef.current?.getBoundingClientRect();
      if (stampRect && dropX > stampRect.left && dropX < stampRect.right && dropY > stampRect.top && dropY < stampRect.bottom) {
        const newItem: PlacedItem = {
          id: draggingRef.current.id || `item-${Date.now()}`,
          src: draggingRef.current.src,
          x: dropX - stampRect.left,
          y: dropY - stampRect.top,
          rotation: draggingRef.current.rotation,
          scale: draggingRef.current.scale,
          zIndex: Date.now()
        };
        setPlacedItems(prev => [...prev, newItem]);
      }
      draggingRef.current = null;
      setDraggingItem(null);
    }
  };

  // Hand Tracking Logic
  useEffect(() => {
    if (!hands || hands.length === 0) {
      setCursor(prev => prev.isPinching ? { ...prev, isPinching: false } : prev);
      if (isPinchingRef.current && draggingRef.current) {
        handleDrop(cursor.x, cursor.y);
      }
      isPinchingRef.current = false;
      prevIndexY.current = null;
      frameGestureCount.current = 0;
      return;
    }

    // Removed Framing Gesture Detection (Two Hands) as per request
    frameGestureCount.current = 0;

    const hand = hands[0];
    const indexTip = hand[8];
    const thumbTip = hand[4];

    if (!indexTip || !thumbTip) return;

    const ix = (1 - indexTip.x) * dimensions.width;
    const iy = indexTip.y * dimensions.height;
    
    const tx = (1 - thumbTip.x) * dimensions.width;
    const ty = thumbTip.y * dimensions.height;

    const cx = ix;
    const cy = iy;

    const dist = Math.hypot(ix - tx, iy - ty);
    const angle = Math.atan2(iy - ty, ix - tx) * (180 / Math.PI);

    let isPinching = isPinchingRef.current;
    if (!isPinching && dist < 30) { // Further lowered threshold for maximum sensitivity
      isPinching = true;
    } else if (isPinching && dist > 60) { // Stable release threshold
      isPinching = false;
    }

    setCursor({ x: cx, y: cy, isPinching });

    // Dwell interaction logic for buttons
    const element = document.elementFromPoint(cx, cy) as HTMLElement;
    const button = element?.closest('[data-style-btn], [data-capture-btn], [data-close-capture-btn], [data-vase-prev], [data-vase-next], [data-folder], [data-download-btn], [data-share-btn], [data-prev-btn], [data-next-btn]') as HTMLElement;

    if (button) {
      if (dwellTarget.current !== button) {
        dwellTarget.current = button;
        dwellStartTime.current = Date.now();
        setDwellProgress(0);
      } else {
        const elapsed = Date.now() - (dwellStartTime.current || 0);
        // Fast touch (150ms) for close button, standard 600ms for others
        const isCloseBtn = button.hasAttribute('data-close-capture-btn');
        const requiredDwellTime = isCloseBtn ? 150 : 600;
        
        const progress = Math.min(elapsed / requiredDwellTime, 1);
        setDwellProgress(progress);

        if (progress >= 1) {
          button.click();
          dwellTarget.current = null;
          dwellStartTime.current = null;
          setDwellProgress(0);
        }
      }
    } else {
      dwellTarget.current = null;
      dwellStartTime.current = null;
      setDwellProgress(0);
    }

    const wasPinching = isPinchingRef.current;
    isPinchingRef.current = isPinching;

    if (isPinching && !wasPinching) {
      // Pinch start
      const cursorEl = document.getElementById('virtual-cursor');
      if (cursorEl) cursorEl.style.display = 'none';
      
      const el = document.elementFromPoint(cx, cy);
      
      if (cursorEl) cursorEl.style.display = 'flex';

      if (el) {
        const folderBtn = el.closest('[data-folder]') as HTMLElement;
        if (folderBtn) {
          const category = folderBtn.dataset.folder as Category;
          setActiveFolder(prev => prev === category ? null : category);
        }

        const styleBtn = el.closest('[data-style-btn]') as HTMLElement;
        if (styleBtn) {
          const style = styleBtn.dataset.styleBtn as StyleType;
          setActiveStyle(prev => prev === style ? 'normal' : style);
          return;
        }

        const captureBtn = el.closest('[data-capture-btn]') as HTMLElement;
        if (captureBtn) {
          setIsCaptured(true);
          return;
        }

        const closeCaptureBtn = el.closest('[data-close-capture-btn]') as HTMLElement;
        if (closeCaptureBtn) {
          setIsCaptured(false);
          return;
        }

        const draggableItem = el.closest('[data-draggable]') as HTMLElement;
        if (draggableItem) {
          const src = draggableItem.dataset.src!;
          const id = draggableItem.dataset.id;
          
          let rotation = Math.random() * 40 - 20;
          let scale = 0.4 + Math.random() * 0.25;
          
          if (id) {
            setPlacedItems(prev => {
              const existing = prev.find(p => p.id === id);
              if (existing) {
                rotation = existing.rotation;
                scale = existing.scale;
              }
              return prev.filter(p => p.id !== id);
            });
          }

          const newState = { 
            id, src, x: cx, y: cy, rotation, scale,
            startPinchDist: dist,
            startPinchAngle: angle,
            startScale: scale,
            startRotation: rotation
          };
          smoothedScale.current = scale;
          smoothedRotation.current = rotation;
          draggingRef.current = newState;
          setDraggingItem(newState);
        }
      }
    } else if (isPinching && wasPinching) {
      // Pinch move
      if (draggingRef.current) {
        let deltaAngle = angle - (draggingRef.current.startPinchAngle || angle);
        if (deltaAngle > 180) deltaAngle -= 360;
        if (deltaAngle < -180) deltaAngle += 360;
        
        const targetScale = Math.max(0.1, Math.min(5, (draggingRef.current.startScale || 1) * (dist / (draggingRef.current.startPinchDist || dist))));
        const targetRotation = (draggingRef.current.startRotation || 0) + deltaAngle;

        // Apply smoothing (Low-pass filter)
        smoothedScale.current += (targetScale - smoothedScale.current) * 0.25;
        smoothedRotation.current += (targetRotation - smoothedRotation.current) * 0.25;

        const updatedState = { 
          ...draggingRef.current, 
          x: cx, 
          y: cy,
          scale: smoothedScale.current,
          rotation: smoothedRotation.current
        };
        draggingRef.current = updatedState;
        setDraggingItem(updatedState);
      }
    } else if (!isPinching && wasPinching) {
      // Pinch end
      handleDrop(cx, cy);
    }
  }, [hands, dimensions]);

  const handleDownload = async () => {
    if (cardRef.current) {
      try {
        const dataUrl = await toPng(cardRef.current, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: '#ffffff'
        });
        const link = document.createElement('a');
        link.download = `aesthetic-id-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Download failed', err);
      }
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    
    // Attempt to focus window first
    window.focus();

    // Try modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }).catch(() => {
        // Fallback to execCommand if writeText fails (e.g. focus issue)
        copyToClipboardFallback(url);
      });
    } else {
      // Fallback for non-secure contexts or missing API
      copyToClipboardFallback(url);
    }
  };

  const copyToClipboardFallback = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Ensure it's not visible but part of the DOM
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
  };

  // Mouse Fallback Logic
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (draggingRef.current && !isPinchingRef.current) {
        const updatedState = { ...draggingRef.current, x: e.clientX, y: e.clientY };
        draggingRef.current = updatedState;
        setDraggingItem(updatedState);
      }
    };
    const handlePointerUp = (e: PointerEvent) => {
      if (draggingRef.current && !isPinchingRef.current) {
        handleDrop(e.clientX, e.clientY);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent, src: string, id?: string) => {
    if (isPinchingRef.current) return; // Ignore mouse if hand is active
    e.preventDefault();
    
    let rotation = Math.random() * 40 - 20;
    let scale = 0.4 + Math.random() * 0.25;
    
    if (id) {
      const existing = placedItems.find(p => p.id === id);
      if (existing) {
        rotation = existing.rotation;
        scale = existing.scale;
      }
      setPlacedItems(prev => prev.filter(p => p.id !== id));
    }

    const newState = { id, src, x: e.clientX, y: e.clientY, rotation, scale };
    draggingRef.current = newState;
    setDraggingItem(newState);
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#F4F4F4] z-40 overflow-hidden flex">
      {/* Left Menu Area (1/4) */}
      <div 
        ref={leftMenuRef}
        onScroll={handleMenuScroll}
        className="relative w-1/4 h-full border-r border-black/5 flex flex-col pt-12 bg-white/50 backdrop-blur-sm z-50 overflow-y-auto custom-scrollbar"
      >
        <div className="px-12 space-y-2 mb-12 shrink-0">
          <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase opacity-40 text-black">
            <span>Chapter 04</span>
          </div>
          <h1 className="text-2xl font-light italic serif tracking-tighter text-black">界·定</h1>
        </div>

        <div className="flex flex-col gap-6 w-full px-8 pb-12">
          {(['flexible', 'linear', 'abstract'] as Category[]).map((category) => {
            const isActive = activeFolder === category;
            const title = category === 'flexible' ? '柔性' : category === 'linear' ? '线性' : '抽象';
            
            return (
              <div key={category} className="flex flex-col items-center w-full bg-white/40 rounded-2xl p-4 shadow-sm border border-black/5">
                <button 
                  data-folder={category}
                  onClick={() => setActiveFolder(isActive ? null : category)}
                  className="cursor-pointer hover:scale-105 transition-transform w-full bg-transparent border-none p-0"
                >
                  <GlassFolder isOpen={isActive} title={title} colorHex={FOLDER_COLORS[category]} />
                </button>
                
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden w-full"
                    >
                      <div className="grid grid-cols-2 gap-3 pt-6 pb-2">
                        {ASSETS[category].map((src, i) => (
                          <div 
                            key={i}
                            data-draggable="true"
                            data-src={src}
                            onPointerDown={(e) => handlePointerDown(e, src)}
                            className="aspect-square bg-black/5 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:bg-black/10 transition-colors flex items-center justify-center"
                          >
                            <img src={src} className="w-full h-full object-contain mix-blend-multiply pointer-events-none" referrerPolicy="no-referrer" crossOrigin="anonymous" />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
        
        <div className="absolute bottom-8 left-12 text-[10px] uppercase tracking-[0.2em] opacity-30 pointer-events-none flex flex-col gap-1">
          <span>Click to open & drag</span>
          <span>Slide to scroll</span>
        </div>
      </div>

      {/* Right Canvas Area (3/4) */}
      <div className="relative w-3/4 h-full flex items-center justify-center bg-[#F4F4F4]">
        {/* Global Noise Overlay for Paper Texture */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.4] mix-blend-multiply z-0" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
          }} 
        />

        {/* Stamp Frame & Hint Wrapper */}
        <div className="flex flex-col items-center gap-8">
          <div 
            ref={stampRef}
            className="relative w-[336px] h-[432px] shrink-0 transition-transform duration-500"
            style={{ filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.1))' }}
          >
          {/* Stamp Background with perforated edges */}
          <div 
            className="absolute inset-0 bg-[#FDFDFD]"
            style={{
              maskImage: 'radial-gradient(circle at 12px 12px, transparent 5px, black 5.5px)',
              maskSize: '24px 24px',
              maskPosition: '-12px -12px',
              WebkitMaskImage: 'radial-gradient(circle at 12px 12px, transparent 5px, black 5.5px)',
              WebkitMaskSize: '24px 24px',
              WebkitMaskPosition: '-12px -12px',
            }}
          />
          {/* Solid inner background to fill internal holes */}
          <div className="absolute inset-[10px] bg-[#FDFDFD]" />
          
          {/* Inner Solid Border */}
          <div className="absolute inset-[16px] border border-black/10 pointer-events-none z-10" />

          {/* Vase Carousel - Now with click buttons for hand tracking */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* Left Click Area */}
            <button 
              data-vase-prev="true"
              onClick={() => setVaseIndex(prev => (prev - 1 + ASSETS.vases.length) % ASSETS.vases.length)}
              className="absolute left-0 top-0 bottom-0 w-1/4 pointer-events-auto flex items-center justify-start pl-4 group"
            >
              <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft size={20} className="text-black/40" />
              </div>
            </button>

            {/* Right Click Area */}
            <button 
              data-vase-next="true"
              onClick={() => setVaseIndex(prev => (prev + 1) % ASSETS.vases.length)}
              className="absolute right-0 top-0 bottom-0 w-1/4 pointer-events-auto flex items-center justify-end pr-4 group"
            >
              <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={20} className="text-black/40" />
              </div>
            </button>

            <div className="absolute inset-0 flex items-end justify-center pb-6">
              <div className="relative w-full h-[80%] flex items-center justify-center overflow-hidden pointer-events-none">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={vaseIndex}
                    src={ASSETS.vases[vaseIndex]}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    className="h-full w-auto object-contain"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                </AnimatePresence>
                <div className="absolute bottom-2 text-black/10 text-[10px] tracking-[0.2em] font-light">
                  TAP SIDES TO CHANGE VASE
                </div>
              </div>
            </div>
          </div>

          {/* Placed Items */}
          {placedItems.map(item => (
            <div
              key={item.id}
              data-draggable="true"
              data-src={item.src}
              data-id={item.id}
              onPointerDown={(e) => handlePointerDown(e, item.src, item.id)}
              className="absolute cursor-grab active:cursor-grabbing"
              style={{
                left: item.x,
                top: item.y,
                transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                zIndex: item.zIndex
              }}
            >
              <img src={item.src} className="w-48 h-48 object-contain pointer-events-none transition-all duration-500" style={getStyleProps(activeStyle)} referrerPolicy="no-referrer" crossOrigin="anonymous" />
            </div>
          ))}
        </div>
          
          <button 
            data-capture-btn="true"
            onClick={() => setIsCaptured(true)}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <Maximize size={14} />
            <span>Click to Capture</span>
          </button>
        </div>

        {/* Controls Container */}
        <div className="absolute top-8 right-8 bg-white/90 p-4 rounded-2xl backdrop-blur-md shadow-xl border border-black/10 z-50">
          <div className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider text-center">Style Lab</div>
          <div className="grid grid-cols-3 gap-3">
            {(['tech', 'emboss', 'pixel', 'grid', 'neon', 'beaded'] as StyleType[]).map((style) => (
              <button
                key={style}
                data-style-btn={style}
                onClick={() => setActiveStyle(prev => prev === style ? 'normal' : style)}
                className={`w-12 h-12 rounded-xl border-2 transition-all duration-300 ${activeStyle === style ? 'border-black scale-110 shadow-lg' : 'border-transparent shadow-sm hover:scale-105'} bg-gray-100 flex items-center justify-center overflow-hidden relative`}
                title={style}
              >
                <div className="w-8 h-8 bg-zinc-800 rounded-md" style={getStyleProps(style)} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dragging Item Overlay */}
      {draggingItem && (
        <div 
          className="fixed pointer-events-none z-[200]"
          style={{
            left: draggingItem.x,
            top: draggingItem.y,
            transform: `translate(-50%, -50%) rotate(${draggingItem.rotation}deg) scale(${draggingItem.scale * 1.1})`
          }}
        >
          <img src={draggingItem.src} className="w-48 h-48 object-contain transition-all duration-500" style={getStyleProps(activeStyle)} referrerPolicy="no-referrer" crossOrigin="anonymous" />
        </div>
      )}

      {/* Virtual Cursor for Hand Tracking */}
      {hands.length > 0 && (
        <div 
          id="virtual-cursor"
          className="fixed z-[1000] pointer-events-none flex items-center justify-center transition-opacity duration-75"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {dwellProgress > 0 && (
            <svg className="absolute w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="black"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 20}
                strokeDashoffset={2 * Math.PI * 20 * (1 - dwellProgress)}
                className="transition-all duration-75 opacity-40"
              />
            </svg>
          )}
          <div className={`w-4 h-4 rounded-full backdrop-blur-sm transition-all duration-200 ${cursor.isPinching ? 'bg-black scale-125 shadow-[0_0_15px_rgba(0,0,0,0.5)]' : 'bg-black/40 scale-100'}`} />
          {cursor.isPinching && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              className="absolute inset-[-8px] border-2 border-black/30 rounded-full" 
            />
          )}
          {cursor.isPinching && (
            <div className="absolute inset-[-4px] border border-black/50 rounded-full animate-ping" />
          )}
        </div>
      )}

      {/* SVG Filters */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id="wireframe">
            <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 1 0" result="gray" />
            <feConvolveMatrix order="3" kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1" in="gray" result="edges" preserveAlpha="true" />
            <feColorMatrix type="matrix" values="4 0 0 0 0  0 4 0 0 0  0 0 4 0 0  0 0 0 1 0" in="edges" result="whiteEdges" />
            <feOffset dx="2" dy="2" in="whiteEdges" result="offset1" />
            <feOffset dx="-2" dy="-1" in="whiteEdges" result="offset2" />
            <feComponentTransfer in="offset1" result="offset1Alpha">
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feComponentTransfer in="offset2" result="offset2Alpha">
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="offset1Alpha" />
              <feMergeNode in="offset2Alpha" />
              <feMergeNode in="whiteEdges" />
            </feMerge>
          </filter>
          <filter id="fuzzy">
            <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Capture Overlay */}
      <AnimatePresence>
        {isCaptured && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <button 
              data-close-capture-btn="true"
              onClick={() => setIsCaptured(false)}
              className="absolute top-8 right-8 w-16 h-16 flex items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/30 hover:text-white hover:scale-110 transition-all backdrop-blur-md shadow-2xl border border-white/20 z-[600] group"
            >
              <X size={32} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
            
            {/* Printer Slot */}
            <div className="absolute bottom-0 w-[480px] h-6 bg-zinc-900 rounded-t-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.8)] z-20 border-t border-white/10 flex justify-center">
              <div className="w-[380px] h-1 bg-black mt-2 rounded-full opacity-50" />
            </div>
            
            {/* The Card */}
            <motion.div
              ref={cardRef}
              initial={{ y: '100vh', opacity: 0, scale: 0.3 }}
              animate={{ y: 0, opacity: 1, scale: 0.7 }}
              exit={{ y: '100vh', opacity: 0, scale: 0.3 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120, delay: 0.1 }}
              className="relative w-[320px] bg-white p-5 pb-8 shadow-2xl rounded-sm z-10 flex flex-col items-center"
              style={{ filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.5))' }}
            >
              {/* Replicate the Stamp */}
              <div className="relative w-[280px] h-[360px] bg-[#FDFDFD] overflow-hidden border border-black/5 shrink-0 shadow-inner">
                {/* Stamp Background with perforated edges */}
                <div 
                  className="absolute inset-0 bg-[#FDFDFD]"
                  style={{
                    maskImage: 'radial-gradient(circle at 10px 10px, transparent 4px, black 4.5px)',
                    maskSize: '20px 20px',
                    maskPosition: '-10px -10px',
                    WebkitMaskImage: 'radial-gradient(circle at 10px 10px, transparent 4px, black 4.5px)',
                    WebkitMaskSize: '20px 20px',
                    WebkitMaskPosition: '-10px -10px',
                  }}
                />
                <div className="absolute inset-[8px] bg-[#FDFDFD]" />
                <div className="absolute inset-[12px] border border-black/10 pointer-events-none z-10" />

                {/* Vase in Capture Card */}
                <div className="absolute inset-0 flex items-end justify-center z-0 pb-5 pointer-events-none">
                  <div className="relative w-full h-[80%] flex items-center justify-center overflow-hidden">
                    <img
                      src={ASSETS.vases[vaseIndex]}
                      className="h-full w-auto object-contain"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>

                {/* Placed Items */}
                {placedItems.map(item => (
                  <div
                    key={item.id}
                    className="absolute"
                    style={{
                      left: item.x * (280 / 336), // Scale coordinates to fit the card
                      top: item.y * (360 / 432),
                      transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale * (280 / 336)})`,
                      zIndex: item.zIndex
                    }}
                  >
                    <img src={item.src} className="w-48 h-48 object-contain" style={getStyleProps(activeStyle)} crossOrigin="anonymous" />
                  </div>
                ))}
              </div>

              {/* Footer / Branding */}
              <div className="w-full mt-6 flex items-end justify-between px-1">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] tracking-[0.3em] text-black/40 uppercase font-bold">Aesthetic ID</span>
                  <span className="text-xl font-serif italic tracking-tighter text-black/80">#{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}</span>
                  <div className="flex gap-2 mt-2">
                    <button 
                      data-share-btn="true"
                      onClick={handleShare}
                      className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors group relative"
                    >
                      {isCopied ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Share2 size={16} className="text-black/60 group-hover:text-black transition-colors" />
                      )}
                      {isCopied && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] px-2 py-1 rounded whitespace-nowrap">
                          Link Copied
                        </span>
                      )}
                    </button>
                    <button 
                      data-download-btn="true"
                      onClick={handleDownload}
                      className="p-2 bg-black/5 rounded-full hover:bg-black/10 transition-colors group"
                    >
                      <Download size={16} className="text-black/60 group-hover:text-black transition-colors" />
                    </button>
                  </div>
                </div>
                <div className="p-1.5 bg-white border border-black/10 shadow-sm rounded-md">
                  <QRCodeSVG value={window.location.href} size={56} fgColor="#27272a" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
