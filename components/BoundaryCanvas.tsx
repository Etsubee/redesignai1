
import React, { useRef, useState, useEffect } from 'react';
import { 
  Pencil, Eraser, Trash2, Undo, RefreshCw, Square, Minus, 
  Maximize2, X, Check, Grid3X3, Type, Sofa, DoorOpen, 
  Layout, MousePointer2 
} from 'lucide-react';

interface BoundaryCanvasProps {
  onExport: (base64: string) => void;
  initialImage?: string | null;
  className?: string;
}

type DrawMode = 'pen' | 'line' | 'rect' | 'eraser' | 'stamp' | 'label';

interface CanvasLabel {
  x: number;
  y: number;
  text: string;
}

const STAMPS = [
  { id: 'door', icon: <DoorOpen size={16}/>, label: 'Door' },
  { id: 'window', icon: <Layout size={16}/>, label: 'Window' },
  { id: 'bed', icon: <span className="text-[10px] font-bold">BED</span>, label: 'Bed' },
  { id: 'sofa', icon: <Sofa size={16}/>, label: 'Sofa' },
  { id: 'toilet', icon: <span className="text-[10px] font-bold">WC</span>, label: 'Toilet' },
];

const ROOM_NAMES = ['Living', 'Kitchen', 'Bedroom', 'Dining', 'Bath', 'Office', 'Entry', 'Garage'];

export const BoundaryCanvas: React.FC<BoundaryCanvasProps> = ({ onExport, initialImage, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<DrawMode>('pen');
  const [history, setHistory] = useState<string[]>([]);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedStamp, setSelectedStamp] = useState<string>('door');
  const [selectedLabel, setSelectedLabel] = useState<string>('Living');

  const GRID_SIZE = 20;

  useEffect(() => {
    initCanvas();
  }, [isFullscreen]);

  useEffect(() => {
    if (initialImage) {
      loadImageToCanvas(initialImage);
    }
  }, [initialImage, isFullscreen]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        if (history.length === 0) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = history[history.length - 1];
        }
      }
    }
  };

  const snapToGrid = (val: number) => {
    if (!showGrid) return val;
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
  };

  const loadImageToCanvas = (imgSrc: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.min(hRatio, vRatio);
      const centerShift_x = (canvas.width - img.width * ratio) / 2;
      const centerShift_y = (canvas.height - img.height * ratio) / 2;
      
      ctx.drawImage(img, 0, 0, img.width, img.height,
        centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
      
      saveToHistory();
    };
    img.src = imgSrc;
  };

  const saveToHistory = () => {
    if (canvasRef.current) {
      const data = canvasRef.current.toDataURL('image/png');
      setHistory(prev => [...prev.slice(-15), data]);
      onExport(data);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    let x = (clientX - rect.left) * (canvas.width / rect.width);
    let y = (clientY - rect.top) * (canvas.height / rect.height);

    if (mode === 'line' || mode === 'rect' || mode === 'stamp' || mode === 'label') {
        x = snapToGrid(x);
        y = snapToGrid(y);
    }

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    setStartPoint(coords);
    setIsDrawing(true);

    if (mode === 'pen' || mode === 'eraser') {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
      }
    } else if (mode === 'stamp') {
      drawStamp(canvasRef.current!, coords.x, coords.y, selectedStamp);
      saveToHistory();
      setIsDrawing(false);
    } else if (mode === 'label') {
      drawLabel(canvasRef.current!, coords.x, coords.y, selectedLabel);
      saveToHistory();
      setIsDrawing(false);
    }
  };

  const drawStamp = (canvas: HTMLCanvasElement, x: number, y: number, stampType: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    
    if (stampType === 'door') {
      ctx.beginPath();
      ctx.rect(x - 10, y - 2, 20, 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x - 10, y - 2, 20, 0, -Math.PI/2, true);
      ctx.stroke();
    } else if (stampType === 'window') {
      ctx.beginPath();
      ctx.rect(x - 20, y - 4, 40, 8);
      ctx.stroke();
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x + 20, y);
      ctx.stroke();
    } else if (stampType === 'bed') {
      ctx.beginPath();
      ctx.rect(x - 20, y - 30, 40, 60);
      ctx.stroke();
      ctx.rect(x - 15, y - 25, 30, 10);
      ctx.stroke();
    } else if (stampType === 'sofa') {
      ctx.beginPath();
      ctx.rect(x - 30, y - 15, 60, 30);
      ctx.stroke();
      ctx.rect(x - 30, y - 15, 10, 30);
      ctx.stroke();
      ctx.rect(x + 20, y - 15, 10, 30);
      ctx.stroke();
    } else if (stampType === 'toilet') {
      ctx.beginPath();
      ctx.ellipse(x, y + 10, 10, 15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rect(x - 12, y - 15, 24, 10);
      ctx.stroke();
    }
  };

  const drawLabel = (canvas: HTMLCanvasElement, x: number, y: number, text: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#6366f1';
    ctx.textAlign = 'center';
    ctx.fillText(text.toUpperCase(), x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    const mainCanvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    if (!mainCanvas || !tempCanvas) return;
    
    const mainCtx = mainCanvas.getContext('2d');
    const tempCtx = tempCanvas.getContext('2d');
    if (!mainCtx || !tempCtx) return;

    if (mode === 'pen' || mode === 'eraser') {
      mainCtx.lineCap = 'round';
      mainCtx.lineJoin = 'round';
      if (mode === 'eraser') {
        mainCtx.strokeStyle = 'white';
        mainCtx.lineWidth = isFullscreen ? 40 : 20;
      } else {
        mainCtx.strokeStyle = '#6366f1';
        mainCtx.lineWidth = isFullscreen ? 6 : 3;
      }
      mainCtx.lineTo(coords.x, coords.y);
      mainCtx.stroke();
    } else if (mode === 'line' || mode === 'rect') {
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.strokeStyle = '#6366f1';
      tempCtx.lineWidth = isFullscreen ? 6 : 3;
      tempCtx.setLineDash([5, 5]);
      tempCtx.beginPath();
      
      if (mode === 'line') {
        tempCtx.moveTo(startPoint.x, startPoint.y);
        tempCtx.lineTo(coords.x, coords.y);
      } else if (mode === 'rect') {
        tempCtx.rect(startPoint.x, startPoint.y, coords.x - startPoint.x, coords.y - startPoint.y);
      }
      tempCtx.stroke();
    }
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const mainCanvas = canvasRef.current;
    const tempCanvas = tempCanvasRef.current;
    if (!mainCanvas || !tempCanvas) return;
    
    const mainCtx = mainCanvas.getContext('2d');
    const tempCtx = tempCanvas.getContext('2d');
    if (!mainCtx || !tempCtx) return;

    if (mode === 'line' || mode === 'rect') {
      const coords = getCoordinates(e);
      mainCtx.strokeStyle = '#6366f1';
      mainCtx.lineWidth = isFullscreen ? 6 : 3;
      mainCtx.setLineDash([]);
      mainCtx.beginPath();
      if (mode === 'line') {
        mainCtx.moveTo(startPoint.x, startPoint.y);
        mainCtx.lineTo(coords.x, coords.y);
      } else if (mode === 'rect') {
        mainCtx.rect(startPoint.x, startPoint.y, coords.x - startPoint.x, coords.y - startPoint.y);
      }
      mainCtx.stroke();
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      saveToHistory();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
      }
    }
  };

  const undo = () => {
    if (history.length > 1) {
      const prev = history[history.length - 2];
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const newHistory = history.slice(0, -1);
            setHistory(newHistory);
            onExport(canvas.toDataURL('image/png'));
          }
        }
      };
      img.src = prev;
    } else if (history.length === 1) {
      clear();
      setHistory([]);
    }
  };

  const renderToolbar = () => (
    <div className="flex flex-wrap items-center justify-between bg-slate-800 p-2 rounded-t-lg border border-slate-700 shadow-xl gap-2">
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg">
        <button onClick={() => setMode('pen')} className={`p-1.5 rounded transition-all ${mode === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Freehand"><Pencil size={14}/></button>
        <button onClick={() => setMode('line')} className={`p-1.5 rounded transition-all ${mode === 'line' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Wall Line"><Minus size={14} className="rotate-45"/></button>
        <button onClick={() => setMode('rect')} className={`p-1.5 rounded transition-all ${mode === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Room Box"><Square size={14}/></button>
        <button onClick={() => setMode('eraser')} className={`p-1.5 rounded transition-all ${mode === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Eraser"><Eraser size={14}/></button>
      </div>

      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg">
        <div className="flex items-center gap-1 border-r border-slate-700 pr-1 mr-1">
          <button onClick={() => setMode('stamp')} className={`p-1.5 rounded transition-all ${mode === 'stamp' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Furniture Stamps"><Sofa size={14}/></button>
          {mode === 'stamp' && (
            <div className="flex gap-0.5 ml-1 overflow-x-auto max-w-[100px] scrollbar-hide">
              {STAMPS.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setSelectedStamp(s.id)}
                  className={`w-6 h-6 flex items-center justify-center rounded shrink-0 border transition-all ${selectedStamp === s.id ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                  {s.icon}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMode('label')} className={`p-1.5 rounded transition-all ${mode === 'label' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Label Rooms"><Type size={14}/></button>
          {mode === 'label' && (
            <select 
              value={selectedLabel} 
              onChange={(e) => setSelectedLabel(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded px-1 outline-none max-w-[80px]"
            >
              {ROOM_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="flex gap-1 items-center ml-auto">
        <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded transition-all ${showGrid ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'}`} title="Toggle Snapping Grid"><Grid3X3 size={14}/></button>
        <button onClick={undo} className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700" title="Undo"><Undo size={14}/></button>
        <button onClick={clear} className="p-1.5 text-slate-400 hover:text-red-400 transition-colors hover:bg-slate-700 rounded" title="Clear Canvas"><Trash2 size={14}/></button>
        <div className="w-px h-6 bg-slate-700 mx-1"></div>
        {!isFullscreen ? (
          <button onClick={() => setIsFullscreen(true)} className="p-1.5 text-slate-400 hover:text-indigo-400 transition-colors hover:bg-slate-700 rounded" title="Maximize Workspace">
            <Maximize2 size={14}/>
          </button>
        ) : (
          <button onClick={() => setIsFullscreen(false)} className="p-1.5 bg-indigo-600 text-white rounded-lg flex items-center gap-2 px-3 font-bold text-[10px] uppercase transition-all hover:bg-indigo-500" title="Apply Changes">
            <Check size={14}/> Done
          </button>
        )}
      </div>
    </div>
  );

  const canvasContent = (
    <div className={`flex flex-col gap-2 ${isFullscreen ? 'h-full w-full max-w-7xl mx-auto p-8' : ''}`}>
      {renderToolbar()}
      <div className={`relative bg-white rounded-b-lg border-x border-b border-slate-700 overflow-hidden shadow-2xl ${isFullscreen ? 'flex-1' : 'aspect-[3/2]'}`}>
        {/* Grid Overlay */}
        {showGrid && (
           <div 
             className="absolute inset-0 pointer-events-none opacity-[0.05]" 
             style={{ 
               backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, 
               backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` 
             }} 
           />
        )}
        <canvas
          ref={canvasRef}
          width={isFullscreen ? 1600 : 600}
          height={isFullscreen ? 1000 : 400}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
        />
        <canvas
          ref={tempCanvasRef}
          width={isFullscreen ? 1600 : 600}
          height={isFullscreen ? 1000 : 400}
          className="absolute inset-0 w-full h-full pointer-events-auto touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Interaction Info */}
        <div className="absolute bottom-2 left-2 flex gap-2 pointer-events-none opacity-50">
           <div className="bg-slate-900 text-[8px] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
             <MousePointer2 size={8}/> {mode.toUpperCase()} MODE
           </div>
           {showGrid && (
             <div className="bg-indigo-900 text-[8px] text-indigo-200 px-2 py-0.5 rounded-full">
               SNAPPING ON
             </div>
           )}
        </div>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-lg flex items-center justify-center animate-in fade-in duration-300">
        <button onClick={() => setIsFullscreen(false)} className="absolute top-6 right-6 p-3 bg-slate-800 text-slate-400 hover:text-white rounded-full border border-slate-700 shadow-2xl z-[110] transition-transform hover:scale-110">
          <X size={24}/>
        </button>
        {canvasContent}
      </div>
    );
  }

  return <div className={className}>{canvasContent}</div>;
};
