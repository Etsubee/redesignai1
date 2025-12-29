
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, MapPin, Search, Navigation, CheckCircle, Globe, Satellite, 
  ZoomIn, ZoomOut, Crosshair, Move, Layers, Map as MapIcon, 
  ChevronRight, History, Info
} from 'lucide-react';
import { LocationData } from '../types';

interface MapLocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
}

const RECENT_SEARCHES = [
  { name: 'Addis Ababa City Center', lat: 9.0300, lng: 38.7400 },
  { name: 'Dubai Marina District', lat: 25.0685, lng: 55.1312 },
  { name: 'Manhattan West Side', lat: 40.7589, lng: -73.9851 },
];

export const MapLocationSelector: React.FC<MapLocationSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [coords, setCoords] = useState<LocationData>({ lat: 9.0192, lng: 38.7525 });
  const [zoom, setZoom] = useState(13); // Using standard map zoom levels (1-20)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [mapType, setMapType] = useState<'satellite' | 'roadmap'>('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMapOffset({ x: 0, y: 0 });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setMapOffset({ x: newX, y: newY });

    // Simulate coordinate changes based on pan
    const scale = Math.pow(2, 20 - zoom) / 5000;
    setCoords(prev => ({
      lat: prev.lat + (e.movementY * scale),
      lng: prev.lng - (e.movementX * scale)
    }));
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleGetCurrentLocation = () => {
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMapOffset({ x: 0, y: 0 });
        setZoom(16);
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );
  };

  const quickJump = (target: { lat: number, lng: number }) => {
    setCoords(target);
    setMapOffset({ x: 0, y: 0 });
    setZoom(15);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-6 animate-in fade-in duration-300">
      <div className="bg-[#1e1e1e] w-full h-full md:max-w-6xl md:h-[85vh] md:rounded-2xl overflow-hidden shadow-2xl flex flex-col relative border border-white/5">
        
        {/* Google Maps Style Search Bar */}
        <div className="absolute top-4 left-4 right-4 md:right-auto md:w-[380px] z-50 animate-in slide-in-from-left-4 duration-500 delay-150">
          <div className="bg-white rounded-lg shadow-xl flex items-center p-1 overflow-hidden border border-gray-200">
            <button className="p-2 text-gray-500 hover:text-indigo-600 transition-colors">
              <MapIcon size={20} />
            </button>
            <input 
              type="text" 
              placeholder="Search Google Maps"
              className="flex-1 px-2 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex items-center gap-1 border-l border-gray-100 pl-1">
              <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-md">
                <Search size={18} />
              </button>
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              <button onClick={onClose} className="p-2 text-gray-500 hover:bg-red-50 rounded-md">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick Suggestions (Simulated) */}
          {searchQuery.length === 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {RECENT_SEARCHES.map(s => (
                <button 
                  key={s.name}
                  onClick={() => quickJump(s)}
                  className="bg-white/95 backdrop-blur px-3 py-1.5 rounded-full shadow-md text-[11px] font-bold text-gray-700 whitespace-nowrap border border-gray-200 flex items-center gap-1.5 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95"
                >
                  <History size={12} className="text-gray-400" />
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Interface Area */}
        <div 
          className="relative flex-1 bg-[#0a0a0a] overflow-hidden cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Tile Layer (Simulated) */}
          <div 
            className="absolute inset-0 transition-transform duration-100 ease-out"
            style={{ 
              transform: `translate(${mapOffset.x}px, ${mapOffset.y}px)`,
              backgroundImage: mapType === 'satellite' 
                ? 'url("https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2000&auto=format&fit=crop")'
                : 'linear-gradient(rgba(200,200,200,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(200,200,200,0.1) 1px, transparent 1px)',
              backgroundSize: mapType === 'satellite' ? 'cover' : '40px 40px',
              backgroundPosition: 'center',
              width: '400%',
              height: '400%',
              left: '-150%',
              top: '-150%',
              opacity: mapType === 'satellite' ? 0.35 : 1,
              backgroundColor: mapType === 'roadmap' ? '#f5f5f5' : '#0a0a0a'
            }}
          />

          {/* Central Pin & Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="relative group/pin">
              {/* Pulsing ring */}
              <div className="absolute -inset-10 border-2 border-indigo-500/30 rounded-full animate-ping opacity-20" />
              
              {/* Map Pin Icon with shadow */}
              <div className="relative -top-8 flex flex-col items-center animate-bounce-short">
                <div className="bg-indigo-600 p-2 rounded-full shadow-[0_10px_20px_rgba(79,70,229,0.5)] border-2 border-white">
                  <MapPin size={28} className="text-white" fill="white" />
                </div>
                <div className="w-1.5 h-1.5 bg-black/40 rounded-full blur-[1px] mt-1"></div>
              </div>
              
              {/* Dynamic Coordinate Badge */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-xl border border-gray-200 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-mono text-gray-800 font-bold tracking-tight">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
              </div>
            </div>
          </div>

          {/* Map Controls (Right Side) */}
          <div className="absolute bottom-28 md:bottom-auto md:top-4 right-4 flex flex-col gap-3 z-50">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 flex flex-col">
              <button 
                onClick={() => setZoom(z => Math.min(z + 1, 20))}
                className="p-3 hover:bg-gray-50 rounded-t-lg text-gray-600 transition-all active:scale-90"
              >
                <ZoomIn size={20} />
              </button>
              <div className="h-px bg-gray-100 mx-2"></div>
              <button 
                onClick={() => setZoom(z => Math.max(z - 1, 1))}
                className="p-3 hover:bg-gray-50 rounded-b-lg text-gray-600 transition-all active:scale-90"
              >
                <ZoomOut size={20} />
              </button>
            </div>

            <button 
              onClick={handleGetCurrentLocation}
              className={`bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-gray-600 hover:text-indigo-600 transition-all active:scale-90 ${isLoading ? 'animate-pulse' : ''}`}
            >
              <Navigation size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>

            <button 
              onClick={() => setMapType(t => t === 'satellite' ? 'roadmap' : 'satellite')}
              className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 text-gray-600 hover:text-indigo-600 transition-all active:scale-90 overflow-hidden relative"
            >
              <Layers size={20} />
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
            </button>
          </div>

          {/* Bottom Confirmation Sheet (Mobile Responsive) */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-4 md:p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] border-t border-gray-200 z-50 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                   <Globe size={24} />
                </div>
                <div>
                   <h4 className="text-sm font-bold text-gray-900 leading-none mb-1">Target Development Sector</h4>
                   <p className="text-[11px] text-gray-500 font-medium">Coordinate precision locked for generative architectural grounding</p>
                </div>
             </div>

             <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={onClose}
                  className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { onSelect(coords); onClose(); }}
                  className="flex-1 md:flex-none px-8 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                  <CheckCircle size={18} /> Confirm Location
                </button>
             </div>
          </div>

          {/* Decorative Scale Indicator */}
          <div className="absolute bottom-24 left-6 pointer-events-none opacity-40">
             <div className="flex items-end gap-1 mb-1">
                <div className="w-px h-2 bg-white"></div>
                <div className="w-16 h-px bg-white"></div>
                <div className="w-px h-2 bg-white"></div>
             </div>
             <span className="text-[9px] font-mono text-white">500 m</span>
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-short {
          animation: bounce-short 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
