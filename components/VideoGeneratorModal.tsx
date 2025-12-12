import React, { useRef, useState, useEffect } from 'react';
import { X, Play, Download, Loader2, MonitorPlay, Film } from 'lucide-react';

interface VideoGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  beforeImage: string;
  afterImage: string;
  allVariations: string[];
}

type VideoMode = 'REVEAL' | 'SHOWCASE';

export const VideoGeneratorModal: React.FC<VideoGeneratorModalProps> = ({ 
  isOpen, onClose, beforeImage, afterImage, allVariations 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<VideoMode>('REVEAL');

  // Reset video when mode or input changes
  useEffect(() => {
    setVideoUrl(null);
  }, [mode, beforeImage, afterImage, allVariations]);

  const loadImg = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

  const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, align: 'left' | 'right' | 'center' = 'left', fontSize: number = 24) => {
    ctx.save();
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'right';
    ctx.fillText("Redesign Ai", w - 30, h - 30);
    ctx.restore();
  };

  const generateRevealVideo = async (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    recorder: MediaRecorder,
    imgBefore: HTMLImageElement,
    imgAfter: HTMLImageElement
  ) => {
    const duration = 4000; // 4s
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing
      const ease = (t: number) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const sliderPos = ease(progress) * canvas.width;

      // 1. Draw Background (AFTER)
      ctx.drawImage(imgAfter, 0, 0, canvas.width, canvas.height);
      
      // Label: AFTER (Top Right)
      drawLabel(ctx, "AFTER", canvas.width - 40, 60, 'right');

      // 2. Draw Foreground (BEFORE) - Clipped
      ctx.save();
      ctx.beginPath();
      
      // Reveal: Slider moves from Right (Full Width) to Left (0 Width)
      const revealWidth = canvas.width - sliderPos; 
      
      ctx.rect(0, 0, revealWidth, canvas.height);
      ctx.clip();
      
      ctx.drawImage(imgBefore, 0, 0, canvas.width, canvas.height);
      
      // Label: BEFORE (Top Left)
      drawLabel(ctx, "BEFORE", 40, 60, 'left');
      
      ctx.restore();

      // 3. Draw Slider Line
      ctx.beginPath();
      ctx.moveTo(revealWidth, 0);
      ctx.lineTo(revealWidth, canvas.height);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 10;
      ctx.stroke();

      // 4. Branding
      drawWatermark(ctx, canvas.width, canvas.height);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (recorder.state === 'recording') {
            recorder.stop();
        } else {
            // Safety fallback if something weird happened to state
            console.warn("Recorder state not recording on finish:", recorder.state);
            setIsProcessing(false);
        }
      }
    };
    requestAnimationFrame(animate);
  };

  const generateShowcaseVideo = async (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    recorder: MediaRecorder,
    loadedImages: HTMLImageElement[]
  ) => {
    // Faster Settings
    const displayTime = 1000; 
    const transitionTime = 500; 
    const cycleTime = displayTime + transitionTime;
    
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      
      // Calculate current image index
      const totalCycleIndex = Math.floor(elapsed / cycleTime);
      const currentImgIndex = totalCycleIndex % loadedImages.length;
      const nextImgIndex = (currentImgIndex + 1) % loadedImages.length;
      
      // Stop condition
      if (totalCycleIndex >= loadedImages.length) {
         if (recorder.state === 'recording') {
            recorder.stop();
         } else {
             // Safety fallback
             console.warn("Recorder state not recording on finish:", recorder.state);
             setIsProcessing(false);
         }
         return; 
      }

      const cycleProgress = (elapsed % cycleTime) / cycleTime; // 0 to 1
      const inTransition = elapsed % cycleTime > displayTime; // True if in fade phase

      // Clear
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Safe index access
      const currentImg = loadedImages[Math.min(currentImgIndex, loadedImages.length - 1)];
      const nextImg = loadedImages[Math.min(nextImgIndex, loadedImages.length - 1)];

      // Draw Logic
      if (!inTransition) {
        // Static Phase
        ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);
      } else {
        // Transition Phase (Crossfade)
        const transitionProgress = (elapsed % cycleTime - displayTime) / transitionTime; // 0 to 1
        
        ctx.globalAlpha = 1;
        ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);
        
        ctx.globalAlpha = transitionProgress;
        ctx.drawImage(nextImg, 0, 0, canvas.width, canvas.height);
        
        ctx.globalAlpha = 1; // Reset
      }

      // Labels
      let label = "";
      // If we have a before image, assume first image in reveal sequence logic, 
      // but in showcase mode we usually just show variations. 
      // Simplification: Just label strictly based on index
      if (beforeImage && loadedImages.length > allVariations.length) {
          // If loadedImages includes the original (which is prepended in showcase logic)
          if (currentImgIndex === 0 && !inTransition) label = "ORIGINAL";
          else if (currentImgIndex > 0) label = `VARIATION ${currentImgIndex}`;
      } else {
          label = `VARIATION ${currentImgIndex + 1}`;
      }
      
      if (label) drawLabel(ctx, label, 40, 60, 'left');
      drawWatermark(ctx, canvas.width, canvas.height);

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const startGeneration = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    setVideoUrl(null);

    try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not get canvas context");

        // HD Resolution
        canvas.width = 1280;
        canvas.height = 720;

        // Preload images
        let images: HTMLImageElement[] = [];
        try {
            if (mode === 'REVEAL') {
                const [imgBefore, imgAfter] = await Promise.all([
                    loadImg(beforeImage), 
                    loadImg(afterImage)
                ]);
                images = [imgBefore, imgAfter];
            } else {
                // For showcase, include original if it exists
                const imagesToLoad = beforeImage ? [beforeImage, ...allVariations] : allVariations;
                // Limit to first 6 images to keep video short
                const subset = imagesToLoad.slice(0, 6);
                if (subset.length === 0) throw new Error("No images available for slideshow");
                images = await Promise.all(subset.map(src => loadImg(src)));
            }
        } catch (e) {
            console.error("Image load failed", e);
            throw new Error("Failed to load images. Please try again.");
        }

        const stream = canvas.captureStream(30); // 30 FPS
        
        // Robust MimeType Selection
        const supportedTypes = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4'
        ];
        const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type));
        
        if (!mimeType) {
             console.warn("No supported mimeType found, relying on browser default.");
        }

        const options = mimeType ? { mimeType } : undefined;
        let recorder: MediaRecorder;
        
        try {
            recorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.error("Failed to create MediaRecorder with options", options, e);
            // Fallback to default options
            recorder = new MediaRecorder(stream);
        }

        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onerror = (e) => {
            console.error("Recorder Error:", e);
            setIsProcessing(false);
        };

        recorder.onstop = () => {
          try {
              const type = mimeType || 'video/webm';
              const blob = new Blob(chunks, { type });
              const url = URL.createObjectURL(blob);
              setVideoUrl(url);
          } catch (e) {
              console.error("Blob creation failed", e);
          }
          setIsProcessing(false);
        };

        // Start recording
        recorder.start();

        // Start drawing loop
        if (mode === 'REVEAL') {
          generateRevealVideo(ctx, canvas, recorder, images[0], images[1]);
        } else {
          generateShowcaseVideo(ctx, canvas, recorder, images);
        }

    } catch (e) {
        console.error("Video Generation Error:", e);
        setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 md:p-6 w-full max-w-3xl flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="text-xl font-bold text-white">Cinematic Video Generator</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
        </div>

        {/* Mode Select */}
        <div className="flex flex-col sm:flex-row bg-slate-800 p-1 rounded-lg mb-6 w-full sm:w-fit mx-auto border border-slate-700 shrink-0">
          <button 
            onClick={() => setMode('REVEAL')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'REVEAL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <MonitorPlay className="w-4 h-4" /> Reveal Slider
          </button>
          <button 
             onClick={() => setMode('SHOWCASE')}
             className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'SHOWCASE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Film className="w-4 h-4" /> Showcase Slideshow
          </button>
        </div>

        {/* Canvas / Preview */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-6 border border-slate-800 shadow-2xl shrink-0">
           <canvas ref={canvasRef} className="w-full h-full object-contain" />
           {videoUrl && (
             <video src={videoUrl} controls autoPlay className="absolute inset-0 w-full h-full bg-black z-10" />
           )}
           {!videoUrl && !isProcessing && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-slate-500 text-sm">Preview Area</p>
             </div>
           )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            {mode === 'REVEAL' ? 'Generates a 4s before/after sliding reveal.' : `Generates a slideshow of all variations.`}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button 
              onClick={startGeneration} 
              disabled={isProcessing || (mode === 'REVEAL' && (!beforeImage || !afterImage))}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white w-full sm:w-auto"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isProcessing ? 'Rendering...' : 'Generate Video'}
            </button>
            
            {videoUrl && (
              <a 
                href={videoUrl} 
                download={`redesign-${mode.toLowerCase()}.webm`}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors text-white w-full sm:w-auto"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};