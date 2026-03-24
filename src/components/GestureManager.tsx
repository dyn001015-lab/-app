import React, { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

interface GestureManagerProps {
  onGesture: (type: 'swipe' | 'clench' | 'open' | 'swipeLeft' | 'swipeRight' | 'navClickLeft' | 'navClickRight', value: number) => void;
  onSwipeUpdate?: (offset: number) => void;
  onHandsUpdate?: (hands: any[]) => void;
  debug?: boolean;
}

export const GestureManager: React.FC<GestureManagerProps> = ({ onGesture, onSwipeUpdate, onHandsUpdate, debug = false }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadedRef = useRef(false);

  // Tracking state for swipe
  const lastX = useRef<number | null>(null);
  const swipeAccumulator = useRef(0);
  const wasClicking = useRef(false);

  const onResults = useCallback((results: Results) => {
    if (!canvasRef.current) return;
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (!isLoadedRef.current) {
      isLoadedRef.current = true;
      setIsLoaded(true);
    }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      
      if (onHandsUpdate) {
        onHandsUpdate(results.multiHandLandmarks);
      }

      const landmarks = results.multiHandLandmarks[0];

      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];
      
      // Navigation Zones: Left and Right 5% edges (User's perspective)
      // Vertically centered to match the icons (y between 0.35 and 0.65)
      // Since camera is mirrored, x=1 is user's left, x=0 is user's right.
      const NAV_ZONE_WIDTH = 0.08;
      const NAV_ZONE_Y_MIN = 0.35;
      const NAV_ZONE_Y_MAX = 0.65;
      const isAtLeftEdge = indexTip.x > (1 - NAV_ZONE_WIDTH) && indexTip.y > NAV_ZONE_Y_MIN && indexTip.y < NAV_ZONE_Y_MAX;
      const isAtRightEdge = indexTip.x < NAV_ZONE_WIDTH && indexTip.y > NAV_ZONE_Y_MIN && indexTip.y < NAV_ZONE_Y_MAX;

      const distance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) + 
        Math.pow(thumbTip.y - indexTip.y, 2)
      );

      const isClicking = distance < 0.05;

      // Trigger click only once per pinch
      if (isClicking && !wasClicking.current) {
        if (isAtLeftEdge) {
          onGesture('navClickLeft', 1);
        } else if (isAtRightEdge) {
          onGesture('navClickRight', 1);
        }
      }
      wasClicking.current = isClicking;

      // 2. Detect Clench vs Open (Distance between thumb tip and index tip)
      // Interaction gestures are allowed everywhere, but the Chapters will restrict 
      // their effect to the Interaction Zone (middle).
      // Thresholds for clench (pinch) and open
      if (distance < 0.05) {
        onGesture('clench', 1 - (distance / 0.05));
      } else if (distance > 0.15) {
        onGesture('open', Math.min((distance - 0.15) / 0.2, 1));
      } else {
        onGesture('clench', 0);
      }

      if (debug) {
        // Draw landmarks for debugging (mirrored to match webcam)
        canvasCtx.fillStyle = '#00FF00';
        results.multiHandLandmarks.forEach(hand => {
          hand.forEach((point) => {
            canvasCtx.beginPath();
            // Mirror the x coordinate for drawing: (1 - point.x)
            canvasCtx.arc((1 - point.x) * canvasRef.current!.width, point.y * canvasRef.current!.height, 3, 0, 2 * Math.PI);
            canvasCtx.fill();
          });
        });

        // Draw Navigation Zones (Edges) - Mirrored perspective
        canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        // Left Edge (User's perspective, which is x > 0.9 in raw frame, drawn at (1-x) < 0.1)
        canvasCtx.fillRect(0, NAV_ZONE_Y_MIN * canvasRef.current!.height, NAV_ZONE_WIDTH * canvasRef.current!.width, (NAV_ZONE_Y_MAX - NAV_ZONE_Y_MIN) * canvasRef.current!.height);
        // Right Edge (User's perspective, which is x < 0.1 in raw frame, drawn at (1-x) > 0.9)
        canvasCtx.fillRect((1 - NAV_ZONE_WIDTH) * canvasRef.current!.width, NAV_ZONE_Y_MIN * canvasRef.current!.height, NAV_ZONE_WIDTH * canvasRef.current!.width, (NAV_ZONE_Y_MAX - NAV_ZONE_Y_MIN) * canvasRef.current!.height);
        
        // Draw Zone Dividers
        canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        canvasCtx.setLineDash([5, 5]);
        canvasCtx.beginPath();
        canvasCtx.moveTo(NAV_ZONE_WIDTH * canvasRef.current!.width, NAV_ZONE_Y_MIN * canvasRef.current!.height);
        canvasCtx.lineTo(NAV_ZONE_WIDTH * canvasRef.current!.width, NAV_ZONE_Y_MAX * canvasRef.current!.height);
        canvasCtx.moveTo((1 - NAV_ZONE_WIDTH) * canvasRef.current!.width, NAV_ZONE_Y_MIN * canvasRef.current!.height);
        canvasCtx.lineTo((1 - NAV_ZONE_WIDTH) * canvasRef.current!.width, NAV_ZONE_Y_MAX * canvasRef.current!.height);
        canvasCtx.stroke();
        canvasCtx.setLineDash([]);

        // Label Zones
        canvasCtx.fillStyle = 'white';
        canvasCtx.font = '10px Arial';
        canvasCtx.fillText('NAV', 5, 20);
        canvasCtx.fillText('NAV', canvasRef.current!.width - 30, 20);
        canvasCtx.fillText('INTERACTION', canvasRef.current!.width / 2 - 35, 20);
      }
    } else {
      if (onHandsUpdate) {
        onHandsUpdate([]);
      }
      onGesture('clench', 0);
    }
    canvasCtx.restore();
  }, [onGesture, onHandsUpdate, debug]);

  const handsRef = useRef<Hands | null>(null);
  const cameraRef = useRef<Camera | null>(null);

  const onResultsRef = useRef(onResults);
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      onResultsRef.current(results);
    });

    handsRef.current = hands;

    return () => {
      hands.close();
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  const handleUserMedia = useCallback(() => {
    if (webcamRef.current && webcamRef.current.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current?.video && handsRef.current) {
            try {
              await handsRef.current.send({ image: webcamRef.current.video });
            } catch (e) {
              console.error("Mediapipe send error:", e);
            }
          }
        },
        width: 640,
        height: 480,
      });
      camera.start();
      cameraRef.current = camera;
    }
  }, []);

  return (
    <div className="fixed bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-50 bg-black/20 backdrop-blur-md">
      <Webcam
        ref={webcamRef}
        className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
        mirrored
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
        disablePictureInPicture={true}
        forceScreenshotSourceSize={false}
        imageSmoothing={true}
        onUserMedia={handleUserMedia}
        onUserMediaError={() => {}}
        screenshotQuality={0.92}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-10"
        width={640}
        height={480}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/50 font-mono uppercase tracking-widest">
          Initializing...
        </div>
      )}
    </div>
  );
};
