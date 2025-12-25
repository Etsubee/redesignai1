
import React, { useState, useRef, useEffect } from 'react';
import { Box, MousePointer2, RotateCw } from 'lucide-react';

interface ModelViewerProps {
  image: string;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({ image }) => {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const totalFrames = 4; // We asked Gemini for 4 cardinal views
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = clientX - startX;
      
      // Sensitivity: Dragging a certain amount of pixels swaps a frame
      // We'll say dragging 1/4 of the container width cycles through all frames
      const sensitivity = rect.width / totalFrames;
      
      if (Math.abs(deltaX) > sensitivity) {
        const direction = deltaX > 0 ? -1 : 1;
        setFrameIndex((prev) => (prev + direction + totalFrames) % totalFrames);
        setStartX(clientX);
      }
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);
    
    const onEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchend', onEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, startX]);

  // Frame Position Mapping
  // Since Gemini generates a single horizontal image with 4 views:
  // frame 0: 0% position
  // frame 1: 33.33% position (1/3 of the way if using background-position %)
  // frame 2: 66.66% position
  // frame 3: 100% position
  const backgroundPositionX = `${(frameIndex / (totalFrames - 1)) * 100}%`;

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-white flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/10 text-slate-800 px-3 py-1.5 rounded-full border border-slate-900/5 text-xs font-bold backdrop-blur-sm">
          <Box size={14} className="text-indigo-600" /> 360° Object Immersive
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium pl-1">
          <MousePointer2 size={10} /> Drag horizontally to rotate and see the back
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
        <div className="bg-white/80 border border-slate-200 text-slate-400 text-[10px] px-2 py-1 rounded flex items-center gap-2">
           <RotateCw size={10} /> View Angle: {frameIndex * 90}°
        </div>
      </div>

      {/* The Sprite Strip Viewer */}
      <div className="relative w-[90%] h-[80%] max-w-4xl max-h-4xl flex items-center justify-center">
        {/* Shadow floor for realism */}
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[60%] h-[10%] bg-black/5 blur-xl rounded-[100%] pointer-events-none" />
        
        <div 
          className="w-full h-full transition-[background-position] duration-200 ease-out"
          style={{
            backgroundImage: `url(${image})`,
            backgroundSize: `${totalFrames * 100}% 100%`,
            backgroundPositionX: backgroundPositionX,
            backgroundRepeat: 'no-repeat',
            backgroundPositionY: 'center'
          }}
        />
      </div>

      {/* Decorative corners for that 'immersive app' feel */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-slate-200 rounded-tl-xl pointer-events-none m-4" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-slate-200 rounded-tr-xl pointer-events-none m-4" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-slate-200 rounded-bl-xl pointer-events-none m-4" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-slate-200 rounded-br-xl pointer-events-none m-4" />
    </div>
  );
};
