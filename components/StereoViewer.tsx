import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2, Glasses } from 'lucide-react';

interface StereoViewerProps {
  image: string;
}

export const StereoViewer: React.FC<StereoViewerProps> = ({ image }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Listen for fullscreen change events (e.g. user presses Esc)
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black group flex items-center justify-center overflow-hidden">
      <img 
        src={image} 
        alt="Stereo 3D" 
        className={`object-contain ${isFullscreen ? 'w-full h-full' : 'max-w-full max-h-full'}`} 
      />
      
      {/* Overlay Controls */}
      <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur px-6 py-2 rounded-full border border-slate-700 transition-opacity ${isFullscreen ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'} z-20`}>
        <div className="flex items-center gap-2 text-indigo-400">
           <Glasses size={20} />
           <span className="text-sm font-bold">Stereo 3D View</span>
        </div>
        <div className="w-px h-6 bg-slate-700"></div>
        <button 
          onClick={toggleFullscreen}
          className="text-white hover:text-indigo-400 transition-colors flex items-center gap-2 text-sm"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          {isFullscreen ? 'Exit VR' : 'Enter VR Mode'}
        </button>
      </div>

      {/* Helper text if not fullscreen */}
      {!isFullscreen && (
        <div className="absolute top-4 left-4 bg-black/50 text-slate-300 text-xs px-3 py-1.5 rounded backdrop-blur border border-white/10 max-w-xs z-10 pointer-events-none">
           <p>Side-by-Side (SBS) format. Use a VR viewer or Cardboard for 3D effect.</p>
        </div>
      )}
    </div>
  );
};