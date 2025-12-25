
import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, Rotate3d, Move, Eye, EyeOff, Maximize2, Minimize2, MousePointer2 } from 'lucide-react';

interface MapZoomViewerProps {
  image: string;
  originalImage?: string | null;
}

export const MapZoomViewer: React.FC<MapZoomViewerProps> = ({ image, originalImage }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [is3d, setIs3d] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showOriginal, setShowOriginal] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(1, prev + delta), 10)); 
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    handleZoom(delta);
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIs3d(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale === 1 && !is3d) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
    resetView();
  };

  // Keyboard support for expansion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) setIsExpanded(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const viewerClasses = isExpanded 
    ? "fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-in fade-in zoom-in duration-300"
    : "relative w-full h-full bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing group select-none rounded-xl";

  return (
    <div 
      ref={containerRef}
      className={viewerClasses}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={resetView}
    >
      {/* Transformation Layer */}
      <div 
        className="w-full h-full transition-transform duration-500 ease-out flex items-center justify-center"
        style={{
          transform: `
            perspective(1500px) 
            ${is3d ? 'rotateX(40deg) translateY(-10%) scale(1.1)' : 'rotateX(0deg)'}
            scale(${scale})
            translate(${position.x / scale}px, ${position.y / scale}px)
          `,
          transformOrigin: 'center center'
        }}
      >
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img 
            src={image} 
            className="max-w-full max-h-full object-contain shadow-2xl" 
            alt="Aerial Design"
            draggable={false}
          />
          
          {originalImage && showOriginal && (
            <img 
              src={originalImage} 
              className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 p-4"
              style={{ opacity: overlayOpacity }}
              alt="Original"
            />
          )}
        </div>
      </div>

      {/* Top Expansion Button */}
      {!isExpanded && (
        <button 
          onClick={toggleExpansion}
          className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur rounded-lg border border-white/10 text-white hover:bg-black/80 transition-all z-40 opacity-0 group-hover:opacity-100"
          title="Landscape Mode"
        >
          <Maximize2 size={18} />
        </button>
      )}

      {/* Control Overlay */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl p-3 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[110] transition-all ${isExpanded ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100 scale-100'}`}>
        {isExpanded && (
          <button 
            onClick={toggleExpansion}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mr-2"
            title="Close Landscape Mode"
          >
            <Minimize2 size={18} />
          </button>
        )}

        <div className="flex items-center bg-slate-800/50 rounded-xl p-1">
          <button 
            onClick={() => handleZoom(0.5)} 
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <button 
            onClick={() => handleZoom(-0.5)} 
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
        </div>

        <div className="w-px h-6 bg-slate-700"></div>

        <button 
          onClick={() => setIs3d(!is3d)} 
          className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter ${is3d ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          title="Toggle 3D Perspective"
        >
          <Rotate3d size={20} />
          {is3d ? '3D Active' : 'Tilt 3D'}
        </button>

        {originalImage && (
          <>
            <div className="w-px h-6 bg-slate-700"></div>
            <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-3 py-2">
              <button 
                onClick={() => setShowOriginal(!showOriginal)}
                className={`p-1.5 rounded-lg transition-all ${showOriginal ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-400 hover:text-white'}`}
                title="Overlay Original Photo"
              >
                {showOriginal ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              {showOriginal && (
                <div className="flex flex-col gap-1 w-20">
                  <input 
                    type="range" 
                    min="0.1" 
                    max="0.9" 
                    step="0.1" 
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <span className="text-[8px] text-slate-500 font-bold uppercase">Opacity</span>
                </div>
              )}
            </div>
          </>
        )}

        <div className="w-px h-6 bg-slate-700"></div>
        
        <button 
          onClick={resetView} 
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Reset Camera"
        >
          <Maximize size={20} />
        </button>
      </div>

      {/* Mode Indicators */}
      <div className="absolute top-6 left-6 flex flex-col gap-2 z-40">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur px-4 py-2 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 shadow-xl">
          <Move size={14} /> Interactive Aerial Canvas
        </div>
        {scale > 1 && (
          <div className="bg-indigo-600/20 backdrop-blur px-3 py-1 rounded-full border border-indigo-500/30 text-[9px] font-black text-indigo-300 w-fit animate-pulse">
            Inspection Zoom: {scale.toFixed(1)}x
          </div>
        )}
        <div className="flex items-center gap-2 text-[9px] text-slate-500 font-bold bg-slate-900/40 px-3 py-1 rounded-full backdrop-blur">
          <MousePointer2 size={10} /> Scroll to Zoom • Double Click to Center
        </div>
      </div>
    </div>
  );
};
