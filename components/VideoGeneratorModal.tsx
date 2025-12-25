
import React, { useRef, useState, useEffect } from 'react';
import { X, Play, Download, Loader2, MonitorPlay, Film, Sparkles } from 'lucide-react';

interface VideoGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  beforeImage: string | null;
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
  const [mode, setMode] = useState<VideoMode>(beforeImage ? 'REVEAL' : 'SHOWCASE');

  // Reset video when mode or input changes
  useEffect(() => {
    setVideoUrl(null);
    if (!beforeImage && mode === 'REVEAL') {
      setMode('SHOWCASE');
    }
  }, [mode, beforeImage, afterImage, allVariations]);

  // Optimized: Load and Pre-scale image to target resolution
  const loadAndProcessImg = (src: string, targetW: number, targetH: number) => new Promise<HTMLCanvasElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = targetW;
        offCanvas.height = targetH;
        const ctx = offCanvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Failed to get offscreen context"));
            return;
        }

        // Object-fit cover logic for canvas
        const imgAspect = img.width / img.height;
        const canvasAspect = targetW / targetH;
        let drawW, drawH, offsetX, offsetY;

        if (imgAspect > canvasAspect) {
          drawH = targetH;
          drawW = img.width * (targetH / img.height);
          offsetX = (targetW - drawW) / 2;
          offsetY = 0;
        } else {
          drawW = targetW;
          drawH = img.height * (targetW / img.width);
          offsetX = 0;
          offsetY = (targetH - drawH) / 2;
        }

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
        
        resolve(offCanvas);
    };
    img.onerror = () => reject(new Error(`Failed to load image`));
    img.src = src;
  });

  const drawLabel = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, align: 'left' | 'right' | 'center' = 'left', fontSize: number = 42) => {
    ctx.save();
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const drawWatermark = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'right';
    ctx.fillText("Redesign Ai", w - 60, h - 60);
    ctx.restore();
  };

  const generateRevealVideo = async (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    recorder: MediaRecorder,
    imgBefore: HTMLCanvasElement,
    imgAfter: HTMLCanvasElement
  ) => {
    const duration = 5000; // 5s total
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: Sine wave back and forth logic
      // 0 -> 1 -> 0 over 5 seconds
      const cycle = Math.sin((progress * Math.PI)); 
      const sliderPos = cycle * canvas.width;

      // 1. Draw Background (AFTER)
      ctx.drawImage(imgAfter, 0, 0);
      drawLabel(ctx, "DESIGNED VISION", canvas.width - 60, 100, 'right');

      // 2. Draw Foreground (BEFORE) - Clipped
      ctx.save();
      ctx.beginPath();
      const revealWidth = canvas.width - sliderPos; 
      ctx.rect(0, 0, revealWidth, canvas.height);
      ctx.clip();
      ctx.drawImage(imgBefore, 0, 0);
      drawLabel(ctx, "ORIGINAL STATE", 60, 100, 'left');
      ctx.restore();

      // 3. Draw Slider Line
      ctx.beginPath();
      ctx.moveTo(revealWidth, 0);
      ctx.lineTo(revealWidth, canvas.height);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      ctx.stroke();

      // 4. Branding
      drawWatermark(ctx, canvas.width, canvas.height);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (recorder.state === 'recording') recorder.stop();
      }
    };
    requestAnimationFrame(animate);
  };

  const generateShowcaseVideo = async (
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    recorder: MediaRecorder,
    loadedImages: HTMLCanvasElement[]
  ) => {
    const displayTime = 1500; 
    const transitionTime = 600; 
    const cycleTime = displayTime + transitionTime;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const totalCycleIndex = Math.floor(elapsed / cycleTime);
      const currentImgIndex = totalCycleIndex % loadedImages.length;
      const nextImgIndex = (currentImgIndex + 1) % loadedImages.length;
      
      if (totalCycleIndex >= loadedImages.length) {
         if (recorder.state === 'recording') recorder.stop();
         return; 
      }

      const cycleProgress = (elapsed % cycleTime) / cycleTime;
      const inTransition = elapsed % cycleTime > displayTime;

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentImg = loadedImages[currentImgIndex];
      const nextImg = loadedImages[nextImgIndex];

      if (!inTransition) {
        ctx.drawImage(currentImg, 0, 0);
      } else {
        const transitionProgress = (elapsed % cycleTime - displayTime) / transitionTime;
        ctx.globalAlpha = 1;
        ctx.drawImage(currentImg, 0, 0);
        ctx.globalAlpha = transitionProgress;
        ctx.drawImage(nextImg, 0, 0);
        ctx.globalAlpha = 1; 
      }

      let label = `ARCHITECTURAL VARIATION ${currentImgIndex + 1}`;
      if (beforeImage && currentImgIndex === 0) label = "ORIGINAL PERSPECTIVE";
      
      drawLabel(ctx, label, 60, 100, 'left');
      drawWatermark(ctx, canvas.width, canvas.height);

      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const startGeneration = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    setVideoUrl(null);

    const WIDTH = 2560; // 2K QHD
    const HEIGHT = 1440;

    try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error("Could not get canvas context");

        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        let images: HTMLCanvasElement[] = [];
        if (mode === 'REVEAL' && beforeImage) {
            const [imgBefore, imgAfter] = await Promise.all([
                loadAndProcessImg(beforeImage, WIDTH, HEIGHT), 
                loadAndProcessImg(afterImage, WIDTH, HEIGHT)
            ]);
            images = [imgBefore, imgAfter];
        } else {
            const imagesToLoad = beforeImage ? [beforeImage, ...allVariations] : allVariations;
            images = await Promise.all(imagesToLoad.map(src => loadAndProcessImg(src, WIDTH, HEIGHT)));
        }

        const stream = canvas.captureStream(30); 
        const recorder = new MediaRecorder(stream, { 
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 12000000 
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          setVideoUrl(URL.createObjectURL(blob));
          setIsProcessing(false);
        };

        recorder.start();

        if (mode === 'REVEAL' && images.length === 2) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-4xl flex flex-col max-h-[95vh] overflow-y-auto shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors z-20">
          <X size={24} />
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-indigo-600 rounded-xl mb-3 shadow-lg shadow-indigo-600/20">
            <Film className="text-white" size={24} />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-widest">Cinematic 2K Render</h3>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">AI-Powered Social Media Content Generator</p>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-slate-800/50 p-1.5 rounded-xl mb-8 w-fit mx-auto border border-slate-700/50">
          {beforeImage && (
            <button 
              onClick={() => setMode('REVEAL')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === 'REVEAL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <MonitorPlay size={16} /> Sliding Reveal
            </button>
          )}
          <button 
             onClick={() => setMode('SHOWCASE')}
             className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === 'SHOWCASE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Sparkles size={16} /> All-Variations Loop
          </button>
        </div>

        {/* Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
           <div className="lg:col-span-8 relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner group">
              <canvas ref={canvasRef} className="hidden" />
              {videoUrl ? (
                <video src={videoUrl} controls autoPlay loop className="w-full h-full bg-black animate-in fade-in duration-500" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950/50">
                   {isProcessing ? (
                     <div className="flex flex-col items-center animate-pulse">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Rendering Cinematic Sequence...</p>
                     </div>
                   ) : (
                     <>
                       <MonitorPlay size={48} className="opacity-20 mb-4" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Workspace Preview Ready</p>
                     </>
                   )}
                </div>
              )}
           </div>

           <div className="lg:col-span-4 space-y-6">
              <div className="p-4 bg-slate-800/30 border border-slate-700/30 rounded-xl">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Output Specs</h4>
                 <ul className="space-y-2">
                    <li className="flex justify-between text-xs"><span className="text-slate-500">Resolution:</span> <span className="text-white font-mono">2560 x 1440 (2K)</span></li>
                    <li className="flex justify-between text-xs"><span className="text-slate-500">Frame Rate:</span> <span className="text-white font-mono">30 FPS</span></li>
                    <li className="flex justify-between text-xs"><span className="text-slate-500">Bitrate:</span> <span className="text-white font-mono">12 Mbps</span></li>
                    <li className="flex justify-between text-xs"><span className="text-slate-500">Format:</span> <span className="text-white font-mono">WebM (VP9)</span></li>
                 </ul>
              </div>

              <div className="space-y-3">
                 <button 
                    onClick={startGeneration} 
                    disabled={isProcessing}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-30 transition-all shadow-xl shadow-indigo-600/20"
                 >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play size={20} fill="currentColor" />}
                    {isProcessing ? 'Generating...' : 'Start Render Engine'}
                 </button>
                 
                 {videoUrl && (
                   <a 
                     href={videoUrl} 
                     download={`Redesign-Ai-${mode.toLowerCase()}-${Date.now()}.webm`}
                     className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-600/20"
                   >
                     <Download size={20} /> Download MP4 File
                   </a>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
