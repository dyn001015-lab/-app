import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Pose, Results } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { motion, AnimatePresence } from 'motion/react';
import { Hand } from 'lucide-react';

interface SkeletonManagerProps {
  assets: string[];
  onComplete?: () => void;
}

interface GrowingAsset {
  id: number;
  jointIndex: number;
  assetIndex: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
  life: number;
}

let globalPoseInstance: Pose | null = null;

export const SkeletonManager: React.FC<SkeletonManagerProps> = ({ assets, onComplete }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadedRef = useRef(false);
  const activeAssets = useRef<GrowingAsset[]>([]);
  const nextAssetId = useRef(0);
  const lastSpawnTime = useRef(0);
  const loadedImages = useRef<HTMLImageElement[]>([]);

  // Preload images
  useEffect(() => {
    const images = assets.map(src => {
      const img = new Image();
      img.src = src;
      return img;
    });
    loadedImages.current = images;
  }, [assets]);

  // Joints to track: shoulders (11, 12), elbows (13, 14), wrists (15, 16), index tips (19, 20)
  const trackedJoints = [11, 12, 13, 14, 15, 16, 19, 20];

  const onResults = useCallback((results: Results) => {
    if (!canvasRef.current) return;
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    const { width, height } = canvasRef.current;
    
    if (!isLoadedRef.current) {
      isLoadedRef.current = true;
      setIsLoaded(true);
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);

    // 1. Draw Silhouette (High contrast video)
    if (results.image) {
      canvasCtx.globalCompositeOperation = 'source-over';
      canvasCtx.filter = 'grayscale(1) contrast(20) brightness(0.8)';
      canvasCtx.drawImage(results.image, 0, 0, width, height);
    }

    // 2. Process Landmarks and Spawn Assets
    if (results.poseLandmarks) {
      const now = Date.now();
      
      trackedJoints.forEach((jointIdx) => {
        const landmark = results.poseLandmarks[jointIdx];
        if (landmark && landmark.visibility && landmark.visibility > 0.5) {
          const x = landmark.x * width;
          const y = landmark.y * height;

          // Spawn new asset based on movement and time
          if (now - lastSpawnTime.current > 150 && activeAssets.current.length < 40) {
            activeAssets.current.push({
              id: nextAssetId.current++,
              jointIndex: jointIdx,
              assetIndex: Math.floor(Math.random() * assets.length),
              x,
              y,
              rotation: Math.random() * Math.PI * 2,
              scale: 0.1,
              opacity: 0,
              life: 1.0
            });
            lastSpawnTime.current = now;
          }
        }
      });

      // Update and Draw Assets
      canvasCtx.globalCompositeOperation = 'multiply'; 
      
      activeAssets.current.forEach((asset, index) => {
        const landmark = results.poseLandmarks[asset.jointIndex];
        if (landmark && landmark.visibility && landmark.visibility > 0.3) {
          // Follow joint
          asset.x += (landmark.x * width - asset.x) * 0.1;
          asset.y += (landmark.y * height - asset.y) * 0.1;
        }

        // Growth and life cycle
        asset.scale += (1.0 - asset.scale) * 0.05;
        asset.opacity += (1.0 - asset.opacity) * 0.1;
        asset.rotation += 0.01;
        asset.life -= 0.005;

        if (asset.life <= 0) {
          activeAssets.current.splice(index, 1);
          return;
        }

        const img = loadedImages.current[asset.assetIndex];
        if (img && img.complete) {
          canvasCtx.save();
          canvasCtx.translate(asset.x, asset.y);
          canvasCtx.rotate(asset.rotation);
          canvasCtx.globalAlpha = asset.opacity * asset.life;
          
          const size = 400 * asset.scale;
          canvasCtx.drawImage(img, -size / 2, -size / 2, size, size);
          canvasCtx.restore();
        }
      });
    }

    canvasCtx.restore();
  }, [assets]);

  const onResultsRef = useRef(onResults);
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  useEffect(() => {
    let isMounted = true;
    
    if (!globalPoseInstance) {
      globalPoseInstance = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });

      globalPoseInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    }

    globalPoseInstance.onResults((results) => {
      if (isMounted) {
        onResultsRef.current(results);
      }
    });

    let camera: Camera | null = null;

    if (webcamRef.current && webcamRef.current.video) {
      camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (isMounted && webcamRef.current?.video && globalPoseInstance) {
            try {
              await globalPoseInstance.send({ image: webcamRef.current.video });
            } catch (e) {
              console.error("Mediapipe Pose error:", e);
            }
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    }

    return () => {
      isMounted = false;
      if (camera) camera.stop();
      // globalPoseInstance.close(); // Do not close to prevent WASM crash
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
      <Webcam
        ref={webcamRef}
        className="hidden"
        mirrored
        audio={false}
        videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
        screenshotFormat="image/jpeg"
        disablePictureInPicture={true}
        forceScreenshotSourceSize={false}
        imageSmoothing={true}
        onUserMedia={() => {}}
        onUserMediaError={() => {}}
        screenshotQuality={0.92}
      />
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        width={1280}
        height={720}
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#E4E3E0] z-50">
          <div className="w-12 h-12 border-2 border-black/10 border-t-black rounded-full animate-spin mb-4" />
          <div className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-mono">
            Synchronizing Space...
          </div>
        </div>
      )}

      {/* Interaction Hint */}
      <AnimatePresence>
        {isLoaded && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 pointer-events-none"
          >
            <div className="w-[1px] h-16 bg-[#141414]" />
            <div className="text-[10px] uppercase tracking-[0.4em] opacity-40 text-[#141414] flex items-center gap-2">
              <Hand size={12} />
              Move your body to coexist
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
