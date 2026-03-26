import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface Chapter5Props {
  hands: any[];
  dimensions: { width: number; height: number };
}

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  vx: number;
  vy: number;
  isSettled: boolean;
  burstAlpha: number;
}

const IMAGE_SRC = 'https://raw.githubusercontent.com/dyn001015-lab/web/main/IMG_4005%202.png';
const ATTRACTION_RADIUS = 150;
const ATTRACTION_FORCE = 0.15;
const FRICTION = 0.85;

export const Chapter5: React.FC<Chapter5Props> = ({ hands, dimensions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const mousePos = useRef({ x: -1000, y: -1000 });
  const isInteracting = useRef(false);

  // Load image and initialize particles
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = IMAGE_SRC;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate scaled dimensions to fit nicely on screen
      const maxSize = Math.min(dimensions.width, dimensions.height) * 0.6;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;

      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

      const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
      const data = imageData.data;
      const particles: Particle[] = [];

      const offsetX = (dimensions.width - scaledWidth) / 2;
      const offsetY = (dimensions.height - scaledHeight) / 2;

      const targetParticleCount = 4000;
      const totalPixels = scaledWidth * scaledHeight;
      const spacing = Math.max(4, Math.floor(Math.sqrt(totalPixels / targetParticleCount)));

      for (let y = 0; y < scaledHeight; y += spacing) {
        for (let x = 0; x < scaledWidth; x += spacing) {
          const index = (y * Math.floor(scaledWidth) + x) * 4;
          const alpha = data[index + 3];
          
          if (alpha > 50) { // Only create particles for non-transparent pixels
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            
            // Filter out pure white or very light pixels to avoid drawing a solid background
            if (r > 240 && g > 240 && b > 240) continue;
            
            particles.push({
              x: Math.random() * dimensions.width,
              y: Math.random() * dimensions.height,
              targetX: x + offsetX,
              targetY: y + offsetY,
              color: `rgb(${r},${g},${b})`,
              vx: 0,
              vy: 0,
              isSettled: false,
              burstAlpha: 0
            });
          }
        }
      }

      particlesRef.current = particles;
      setIsLoaded(true);
    };
  }, [dimensions]);

  // Animation Loop
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      // Trail effect: draw semi-transparent black over the canvas
      ctx.fillStyle = 'rgba(20, 20, 20, 0.15)';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      let settledCount = 0;
      const totalParticles = particlesRef.current.length;

      particlesRef.current.forEach(p => {
        if (p.isSettled) {
          settledCount++;
          // Draw settled particle with slight continuous glow
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.targetX, p.targetY, 1.5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.globalAlpha = 0.2;
          ctx.beginPath();
          ctx.arc(p.targetX, p.targetY, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;

          // Draw burst effect
          if (p.burstAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.burstAlpha})`;
            ctx.beginPath();
            ctx.arc(p.targetX, p.targetY, 6, 0, Math.PI * 2);
            ctx.fill();
            p.burstAlpha -= 0.05;
          }
          return;
        }

        // Calculate distance to interaction point (mouse or hand)
        const dx = mousePos.current.x - p.x;
        const dy = mousePos.current.y - p.y;
        const distToInteraction = Math.hypot(dx, dy);

        if (isInteracting.current && distToInteraction < ATTRACTION_RADIUS) {
          // Pull towards target position
          const targetDx = p.targetX - p.x;
          const targetDy = p.targetY - p.y;
          const distToTarget = Math.hypot(targetDx, targetDy);

          if (distToTarget < 5) {
            p.isSettled = true;
            p.burstAlpha = 1;
            p.x = p.targetX;
            p.y = p.targetY;
            p.vx = 0;
            p.vy = 0;
          } else {
            // Force is stronger when closer to the brush center
            const force = (1 - distToInteraction / ATTRACTION_RADIUS) * ATTRACTION_FORCE;
            // Pull towards target
            p.vx += (targetDx / distToTarget) * force * 20;
            p.vy += (targetDy / distToTarget) * force * 20;
          }
        } else {
          // Add some random noise to unsettled particles when not interacting
          p.vx += (Math.random() - 0.5) * 0.2;
          p.vy += (Math.random() - 0.5) * 0.2;
        }

        // Apply friction
        p.vx *= FRICTION;
        p.vy *= FRICTION;

        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off walls
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > dimensions.width) { p.x = dimensions.width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > dimensions.height) { p.y = dimensions.height; p.vy *= -1; }

        // Draw unsettled particle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      if (totalParticles > 0) {
        setProgress(settledCount / totalParticles);
      }

      // Draw interaction brush
      if (isInteracting.current) {
        ctx.beginPath();
        ctx.arc(mousePos.current.x, mousePos.current.y, ATTRACTION_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(mousePos.current.x, mousePos.current.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isLoaded, dimensions]);

  // Hand tracking integration
  useEffect(() => {
    if (hands.length > 0) {
      const hand = hands[0];
      const indexTip = hand[8];
      if (indexTip) {
        mousePos.current = {
          x: (1 - indexTip.x) * dimensions.width,
          y: indexTip.y * dimensions.height
        };
        isInteracting.current = true;
      }
    } else {
      isInteracting.current = false;
    }
  }, [hands, dimensions]);

  // Mouse fallback
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (hands.length === 0) {
        mousePos.current = { x: e.clientX, y: e.clientY };
        isInteracting.current = true;
      }
    };
    const handleMouseLeave = () => {
      if (hands.length === 0) {
        isInteracting.current = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hands.length]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#141414] z-40 overflow-hidden">
      {/* Background Halos */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.15, 0.1],
            rotate: [0, -90, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"
        />
      </div>

      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 w-full h-full"
      />

      {/* Progress Bar Container */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 h-1/2 flex items-center gap-4">
        {/* Progress Text */}
        <div className="flex flex-col justify-between h-full text-white/50 text-[10px] tracking-[0.2em] uppercase py-2">
          <span>Order</span>
          <span className="text-white font-mono">{Math.round(progress * 100)}%</span>
          <span>Chaos</span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-full w-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="absolute bottom-0 w-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            initial={{ height: 0 }}
            animate={{ height: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          />
        </div>
      </div>

      {/* Title and Hint */}
      <div className="absolute top-12 left-12 z-50 pointer-events-none">
        <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase opacity-40 text-white mb-2">
          <span>Chapter 05</span>
        </div>
        <h1 className="text-2xl font-light italic serif tracking-tighter text-white mb-4">熵·减</h1>
        <p className="text-white/50 text-xs tracking-widest uppercase max-w-xs leading-relaxed">
          Sweep your hand across the void to restore order from chaos.
        </p>
      </div>

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm tracking-widest uppercase">
          Initializing Particles...
        </div>
      )}
    </div>
  );
};
