import React, { useEffect, useRef, useState } from 'react';

export const NetworkSphere: React.FC<{ active: boolean }> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    const particles: any[] = [];
    const numParticles = 200;
    const radius = 180;

    for (let i = 0; i < numParticles; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);
      particles.push({
        theta,
        phi,
        speedTheta: (Math.random() - 0.5) * 0.015,
        speedPhi: (Math.random() - 0.5) * 0.015,
      });
    }

    let rotationY = 0;
    let rotationX = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      rotationY += 0.003;
      rotationX += 0.001;

      const points3d = particles.map(p => {
        p.theta += p.speedTheta * (active ? 3 : 0.5);
        p.phi += p.speedPhi * (active ? 3 : 0.5);

        const x = radius * Math.sin(p.phi) * Math.cos(p.theta);
        const y = radius * Math.sin(p.phi) * Math.sin(p.theta);
        const z = radius * Math.cos(p.phi);

        // Rotate around Y
        const x1 = x * Math.cos(rotationY) - z * Math.sin(rotationY);
        const z1 = x * Math.sin(rotationY) + z * Math.cos(rotationY);

        // Rotate around X
        const y2 = y * Math.cos(rotationX) - z1 * Math.sin(rotationX);
        const z2 = y * Math.sin(rotationX) + z1 * Math.cos(rotationX);

        return { x: x1, y: y2, z: z2 };
      });

      // Draw lines
      ctx.lineWidth = 1;
      for (let i = 0; i < points3d.length; i++) {
        for (let j = i + 1; j < points3d.length; j++) {
          const p1 = points3d[i];
          const p2 = points3d[j];
          const dist = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2);
          
          if (dist < 60) {
            const alpha = (1 - dist / 60) * (active ? 0.9 : 0.3);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x + canvas.width/2, p1.y + canvas.height/2);
            ctx.lineTo(p2.x + canvas.width/2, p2.y + canvas.height/2);
            ctx.stroke();
          }
        }
      }

      // Draw points
      points3d.forEach(p => {
        const scale = (p.z + radius) / (2 * radius); // 0 to 1
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + scale * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x + canvas.width/2, p.y + canvas.height/2, 2 * scale + 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [active]);

  return <canvas ref={canvasRef} width={500} height={500} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

export const OrbitParticles: React.FC<{ indexTip: {x: number, y: number}, imageSrc: string, dimensions: {width: number, height: number} }> = ({ indexTip, imageSrc, dimensions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.crossOrigin = "anonymous";
    img.onload = () => { imgRef.current = img; };
  }, [imageSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let time = 0;
    
    let targetX = dimensions.width / 2;
    let targetY = dimensions.height / 2;
    let currentX = targetX;
    let currentY = targetY;

    const numStrands = 5;
    const pointsPerStrand = 300;
    
    // Pre-generate dust particles
    const dust = Array.from({length: 500}).map((_, i) => ({
      y: (Math.random() - 0.5) * 1200,
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 350 + 20,
      speed: Math.random() * 0.02 + 0.005,
      size: Math.random() * 1.2 + 0.3,
      verticalSpeed: (Math.random() - 0.5) * 1.5,
      phase: Math.random() * Math.PI * 2
    }));

    const animate = () => {
      time += 0.006;
      
      if (indexTip.x !== 0 && indexTip.y !== 0) {
        targetX = indexTip.x;
        targetY = indexTip.y;
      } else {
        targetX = dimensions.width / 2;
        targetY = dimensions.height / 2;
      }
      // Smooth follow
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const renderQueue: any[] = [];

      // Update and queue dust
      dust.forEach(p => {
        p.angle += p.speed;
        p.y += p.verticalSpeed;
        if (p.y < -600) p.y = 600;
        if (p.y > 600) p.y = -600;

        const x = Math.cos(p.angle) * p.radius;
        const z = Math.sin(p.angle) * p.radius;
        renderQueue.push({
          type: 'dust',
          x: currentX + x,
          y: currentY + p.y + Math.sin(time * 5 + p.phase) * 15,
          z: z,
          size: p.size
        });
      });

      // Generate and queue vortex strands
      for (let s = 0; s < numStrands; s++) {
        const strandOffset = (s / numStrands) * Math.PI * 2;
        const isWild = s % 2 === 0; // Some strands are wider
        let prevPoint: any = null;

        for (let i = 0; i < pointsPerStrand; i++) {
          const t = i / pointsPerStrand;
          const y = (t - 0.5) * 900; // Vertical spread
          
          // Complex organic radius (hourglass / tornado shape)
          let r = 50 + 140 * Math.sin(t * Math.PI);
          r += 50 * Math.sin(t * Math.PI * 5 + time * 3); // Ripples
          
          if (isWild) {
            r *= 1.4; 
          }
          
          const angle = y * 0.01 + time * 2 + strandOffset;

          const x = Math.cos(angle) * r;
          const z = Math.sin(angle) * r;

          const screenX = currentX + x;
          const screenY = currentY + y;

          // Determine nodes (beads)
          const isMajorNode = i % 25 === 0 && i > 15 && i < pointsPerStrand - 15;
          const isMinorNode = i % 6 === 0;
          
          let size = 0;
          if (isMajorNode) {
            // Deterministic pseudo-random size based on index
            size = 3.5 + Math.abs(Math.sin(i * 123)) * 3.5;
            if (isWild) size *= 1.2;
          } else if (isMinorNode) {
            size = 1.2;
          }

          const point = { x: screenX, y: screenY, z };

          if (prevPoint) {
            renderQueue.push({
              type: 'line',
              p1: prevPoint,
              p2: point,
              z: (prevPoint.z + point.z) / 2
            });
          }

          if (size > 0) {
            renderQueue.push({
              type: 'node',
              x: screenX,
              y: screenY,
              z: z,
              size: size
            });
          }

          prevPoint = point;
        }
      }

      // Queue the central stylized image
      if (imgRef.current) {
        renderQueue.push({
          type: 'image',
          x: currentX,
          y: currentY,
          z: 0, // Center depth so particles wrap around it
          img: imgRef.current
        });
      }

      // Sort by Z for proper 3D depth rendering (Painter's Algorithm)
      renderQueue.sort((a, b) => a.z - b.z);

      // Render queue
      renderQueue.forEach(item => {
        // Normalize Z from approx -300..300 to 0..1
        const zNormalized = (item.z + 400) / 800; 
        const scale = Math.max(0.3, 0.4 + zNormalized * 0.9);
        const alpha = Math.max(0.05, Math.min(1, zNormalized * 1.5));

        if (item.type === 'dust') {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.size * scale, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'line') {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.35})`;
          ctx.lineWidth = 1.2 * scale;
          ctx.beginPath();
          ctx.moveTo(item.p1.x, item.p1.y);
          ctx.lineTo(item.p2.x, item.p2.y);
          ctx.stroke();
        } else if (item.type === 'node') {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.size * scale, 0, Math.PI * 2);
          ctx.fill();
          
          // Add glow to large foreground nodes
          if (scale > 0.8 && item.size > 3) {
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 15 * scale;
            ctx.fill();
            ctx.shadowBlur = 0; // Reset
          }
        } else if (item.type === 'image') {
          ctx.save();
          ctx.translate(item.x, item.y);
          
          // Subtle breathing effect
          const floatScale = 1 + Math.sin(time * 2) * 0.03;
          ctx.scale(floatScale, floatScale);
          
          // Stylize the material to match the B&W 3D particle aesthetic but keep it recognizable
          ctx.globalAlpha = 0.95;
          ctx.filter = 'grayscale(100%) contrast(150%) brightness(120%) drop-shadow(0 0 30px rgba(255,255,255,0.4))';
          
          // Draw image centered and large enough to be clearly seen
          const imgSize = 280; 
          ctx.drawImage(item.img, -imgSize/2, -imgSize/2, imgSize, imgSize);
          ctx.restore();
        }
      });

      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [indexTip, dimensions]);

  return <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="fixed inset-0 pointer-events-none z-50" />;
};

export const PixelEffect: React.FC<{ amount: number, imageSrc: string }> = ({ amount, imageSrc }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imgData, setImgData] = useState<ImageData | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";
    image.onload = () => { 
      setImg(image);
      const hiddenCanvas = document.createElement('canvas');
      hiddenCanvas.width = 400; 
      hiddenCanvas.height = 400;
      const hCtx = hiddenCanvas.getContext('2d');
      if (hCtx) {
        try {
          const scale = Math.min(400 / image.width, 400 / image.height);
          const w = image.width * scale;
          const h = image.height * scale;
          const x = (400 - w) / 2;
          const y = (400 - h) / 2;
          hCtx.drawImage(image, x, y, w, h);
          setImgData(hCtx.getImageData(0, 0, 400, 400));
        } catch (e) {
          console.error("Failed to extract image data:", e);
        }
      }
    };
  }, [imageSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      time += 0.05;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Pure black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!img || !imgData) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(time * 5) * 0.5})`;
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AWAITING SIGNAL DATA...', canvas.width/2, canvas.height/2);
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      // Resolution changes based on pinch amount
      const pixelSize = Math.max(6, Math.floor(10 + amount * 40)); 
      const cols = Math.floor(canvas.width / pixelSize);
      const rows = Math.floor(canvas.height / pixelSize);

      const pixels = imgData.data;
      const sampleW = imgData.width;
      const sampleH = imgData.height;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const sx = Math.floor((x / cols) * sampleW);
          const sy = Math.floor((y / rows) * sampleH);
          const i = (sy * sampleW + sx) * 4;
          
          const r = pixels[i];
          const g = pixels[i+1];
          const b = pixels[i+2];
          const a = pixels[i+3];

          if (a > 20) {
            // Use alpha as the base brightness so even black images show up brightly
            const brightness = Math.max((r + g + b) / 3, a);
            
            // Posterize brightness to create distinct digital bands
            const levels = 6;
            const posterized = Math.floor((brightness / 255) * levels) * (255 / levels);

            // Add a digital glitch/flicker effect
            const isGlitch = Math.random() > 0.998;
            const glitchOffset = isGlitch ? Math.sin(time * 10) * 100 : 0;
            const finalBrightness = Math.min(255, Math.max(0, posterized + glitchOffset));

            // Digital color palette (White/Gray on Black)
            const tintR = finalBrightness;
            const tintG = finalBrightness;
            const tintB = finalBrightness;

            const gap = pixelSize > 10 ? 2 : 1;
            const drawX = x * pixelSize;
            const drawY = y * pixelSize;
            const drawSize = pixelSize - gap;

            // Outer pixel (dimmer)
            ctx.fillStyle = `rgb(${tintR * 0.4}, ${tintG * 0.4}, ${tintB * 0.4})`;
            ctx.fillRect(drawX, drawY, drawSize, drawSize);

            // Inner LED core (brighter)
            if (finalBrightness > 40) {
              ctx.fillStyle = `rgb(${tintR}, ${tintG}, ${tintB})`;
              const innerGap = Math.max(1, Math.floor(drawSize * 0.3));
              ctx.fillRect(drawX + innerGap, drawY + innerGap, drawSize - innerGap * 2, drawSize - innerGap * 2);
            }
          }
        }
      }

      // Scanlines
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      for (let i = 0; i < canvas.height; i += 4) {
        ctx.fillRect(0, i, canvas.width, 1);
      }

      // CRT Vignette/Glow
      const gradient = ctx.createRadialGradient(
        canvas.width/2, canvas.height/2, canvas.width/4,
        canvas.width/2, canvas.height/2, canvas.width/1.2
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [amount, img, imgData]);

  return <canvas ref={canvasRef} width={800} height={800} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />;
};
