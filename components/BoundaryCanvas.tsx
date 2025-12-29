
import React, { useRef, useState, useEffect } from 'react';
import { 
  Pencil, Eraser, Trash2, Undo, Square, Minus, 
  Maximize2, X, Check, Grid3X3, Type, Sofa, DoorOpen, 
  Layout, MousePointer2, Ruler, Zap, Bath, Wind, 
  Move, Target, Hash, Info
} from 'lucide-react';

interface BoundaryCanvasProps {
  onExport: (base64: string) => void;
  initialImage?: string | null;
  className?: string;
}

type DrawMode = 'pen' | 'line' | 'rect' | 'eraser' | 'stamp' | 'label' | 'dimension';

interface CanvasLabel {
  x: number;
  y: number;
  text: string;
}

const STAMP_GROUPS = {
  STRUCTURAL: [
    { id: 'door', icon: <DoorOpen size={16}/>, label: 'Door' },
    { id: 'window', icon: <Layout size={16}/>, label: 'Window' },
  ],
  TECHNICAL: [
    { id: 'outlet', icon: <Zap size={14}/>, label: 'Electrical Outlet' },
    { id: 'vent', icon: <Wind size={14}/>, label: 'HVAC Vent' },
    { id: 'sink', icon: <Bath size={14}/>, label: 'Plumbing Sink' },
  ],
  FURNITURE: [
    { id: 'bed', icon: <span className="text-[9px] font-bold">BED</span>, label: 'Bed' },
    { id: 'sofa', icon: <Sofa size={16}/>, label: 'Sofa' },
    { id: 'toilet', icon: <span className="text-[9px] font-bold">WC</span>, label: 'Toilet' },
  ]
};

const ROOM_NAMES = ['Living', 'Kitchen', 'Bedroom', 'Dining', 'Bath', 'Office', 'Entry', 'Garage', 'Balcony', 'Storage'];

export const BoundaryCanvas: React.FC<BoundaryCanvasProps> = ({ onExport, initialImage, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<DrawMode>('line');
  const [history, setHistory] = useState<string[]>([]);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedStamp, setSelectedStamp] = useState<string>('door');
  const [selectedLabel, setSelectedLabel] = useState<string>('Living');
  const [scale, setScale] = useState(10); // Pixels per unit (e.g., 10px = 1m)

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
        ctx.lineCap = 'square';
        ctx.lineJoin = 'miter';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        if (history.length === 0) {
          ctx.fillStyle = '#1e293b'; // Technical Dark Background
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
      ctx.fillStyle = '#1e293b';
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

    if (mode !== 'pen' && mode !== 'eraser') {
        x = snapToGrid(x);
        y = snapToGrid(y);
    }

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    setStartPoint(coords);
    setIsDrawing(true);

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (mode === 'pen' || mode === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
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
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.fillStyle = 'transparent';
    ctx.lineWidth = 1.5;
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
      ctx.rect(x - 25, y - 3, 50, 6);
      ctx.stroke();
      ctx.moveTo(x - 25, y);
      ctx.lineTo(x + 25, y);
      ctx.stroke();
    } else if (stampType === 'bed') {
      ctx.beginPath();
      ctx.rect(x - 20, y - 30, 40, 60);
      ctx.stroke();
      ctx.rect(x - 15, y - 25, 30, 10);
      ctx.stroke();
    } else if (stampType === 'outlet') {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y);
      ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5);
      ctx.stroke();
    } else if (stampType === 'vent') {
      ctx.beginPath();
      ctx.rect(x - 8, y - 8, 16, 16);
      ctx.stroke();
      ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y + 8);
      ctx.moveTo(x + 8, y - 8); ctx.lineTo(x - 8, y + 8);
      ctx.stroke();
    } else if (stampType === 'sink') {
      ctx.beginPath();
      ctx.ellipse(x, y, 12, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - 4, 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (stampType === 'sofa') {
      ctx.beginPath();
      ctx.rect(x - 30, y - 15, 60, 30);
      ctx.stroke();
      ctx.rect(x - 25, y - 10, 50, 20);
      ctx.stroke();
    } else if (stampType === 'toilet') {
      ctx.beginPath();
      ctx.ellipse(x, y + 8, 10, 15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rect(x - 12, y - 15, 24, 10);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawLabel = (canvas: HTMLCanvasElement, x: number, y: number, text: string) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#818cf8';
    ctx.textAlign = 'center';
    ctx.fillText(text.toUpperCase(), x, y);
    ctx.restore();
  };

  const drawDimension = (ctx: CanvasRenderingContext2D, p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    ctx.save();
    ctx.strokeStyle = '#fbbf24';
    ctx.fillStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // Main line
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    
    // Ticks
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const tickLen = 6;
    
    const drawTick = (p: {x: number, y: number}) => {
      ctx.beginPath();
      ctx.moveTo(p.x - Math.cos(angle + Math.PI/2) * tickLen, p.y - Math.sin(angle + Math.PI/2) * tickLen);
      ctx.lineTo(p.x + Math.cos(angle + Math.PI/2) * tickLen, p.y + Math.sin(angle + Math.PI/2) * tickLen);
      ctx.stroke();
    };
    
    drawTick(p1);
    drawTick(p2);
    
    // Label
    const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const label = `${(dist / scale).toFixed(2)}m`;
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    
    ctx.font = '9px monospace';
    ctx.setLineDash([]);
    ctx.textAlign = 'center';
    ctx.fillText(label, midX, midY - 10);
    ctx.restore();
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    setCursorPos(coords);
    
    if (!isDrawing) return;
    
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
        mainCtx.strokeStyle = '#1e293b';
        mainCtx.lineWidth = isFullscreen ? 40 : 20;
      } else {
        mainCtx.strokeStyle = '#6366f1';
        mainCtx.lineWidth = isFullscreen ? 4 : 2;
      }
      mainCtx.lineTo(coords.x, coords.y);
      mainCtx.stroke();
    } else if (mode === 'line' || mode === 'rect' || mode === 'dimension') {
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.strokeStyle = mode === 'dimension' ? '#fbbf24' : '#6366f1';
      tempCtx.lineWidth = isFullscreen ? 4 : 2;
      tempCtx.setLineDash([5, 5]);
      
      if (mode === 'dimension') {
        drawDimension(tempCtx, startPoint, coords);
      } else {
        tempCtx.beginPath();
        if (mode === 'line') {
          tempCtx.moveTo(startPoint.x, startPoint.y);
          tempCtx.lineTo(coords.x, coords.y);
        } else if (mode === 'rect') {
          tempCtx.rect(startPoint.x, startPoint.y, coords.x - startPoint.x, coords.y - startPoint.y);
        }
        tempCtx.stroke();
      }
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

    if (mode === 'line' || mode === 'rect' || mode === 'dimension') {
      const coords = getCoordinates(e);
      if (mode === 'dimension') {
        drawDimension(mainCtx, startPoint, coords);
      } else {
        mainCtx.strokeStyle = '#cbd5e1'; // Finished walls are light gray
        mainCtx.lineWidth = isFullscreen ? 4 : 2;
        mainCtx.setLineDash([]);
        mainCtx.beginPath();
        if (mode === 'line') {
          mainCtx.moveTo(startPoint.x, startPoint.y);
          mainCtx.lineTo(coords.x, coords.y);
        } else if (mode === 'rect') {
          mainCtx.rect(startPoint.x, startPoint.y, coords.x - startPoint.x, coords.y - startPoint.y);
        }
        mainCtx.stroke();
      }
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      saveToHistory();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e293b';
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
    <div className="flex flex-wrap items-center bg-slate-800 p-2 rounded-t-xl border border-slate-700 shadow-2xl gap-3">
      {/* CAD Tool Groups */}
      <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg">
        <button onClick={() => setMode('line')} className={`p-1.5 rounded transition-all ${mode === 'line' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Wall Tool"><Minus size={14} className="rotate-45"/></button>
        <button onClick={() => setMode('rect')} className={`p-1.5 rounded transition-all ${mode === 'rect' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Room Box"><Square size={14}/></button>
        <button onClick={() => setMode('dimension')} className={`p-1.5 rounded transition-all ${mode === 'dimension' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Dimension Tool"><Ruler size={14}/></button>
        <button onClick={() => setMode('pen')} className={`p-1.5 rounded transition-all ${mode === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Freehand Sketch"><Pencil size={14}/></button>
        <button onClick={() => setMode('eraser')} className={`p-1.5 rounded transition-all ${mode === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Erase"><Eraser size={14}/></button>
      </div>

      <div className="flex gap-2 items-center bg-slate-900/50 p-1 rounded-lg">
        <button onClick={() => setMode('stamp')} className={`p-1.5 rounded transition-all ${mode === 'stamp' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Technical Stamps"><Target size={14}/></button>
        {mode === 'stamp' && (
          <div className="flex gap-2 ml-1">
             {Object.entries(STAMP_GROUPS).map(([key, stamps]) => (
               <div key={key} className="flex gap-1 border-r border-slate-700 pr-2 last:border-0 last:pr-0">
                 {stamps.map(s => (
                   <button 
                     key={s.id} 
                     onClick={() => setSelectedStamp(s.id)}
                     className={`w-6 h-6 flex items-center justify-center rounded border transition-all ${selectedStamp === s.id ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                     title={s.label}
                   >
                     {s.icon}
                   </button>
                 ))}
               </div>
             ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 bg-slate-900/50 p-1 rounded-lg">
        <button onClick={() => setMode('label')} className={`p-1.5 rounded transition-all ${mode === 'label' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Annotation Tool"><Type size={14}/></button>
        {mode === 'label' && (
          <select 
            value={selectedLabel} 
            onChange={(e) => setSelectedLabel(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-[10px] text-slate-300 rounded px-1 outline-none h-6"
          >
            {ROOM_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        )}
      </div>

      <div className="flex gap-1 items-center ml-auto">
        <div className="flex items-center gap-1 bg-slate-900/50 px-2 h-8 rounded-lg">
          <Hash size={12} className="text-slate-500" />
          <input 
            type="number" 
            value={scale} 
            onChange={(e) => setScale(Number(e.target.value))} 
            className="w-8 bg-transparent text-[10px] font-mono text-indigo-400 outline-none"
            title="Pixels Per Meter"
          />
        </div>
        <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded transition-all ${showGrid ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500'}`} title="Toggle Snap-to-Grid"><Grid3X3 size={14}/></button>
        <button onClick={undo} className="p-1.5 text-slate-400 hover:text-white rounded" title="Undo"><Undo size={14}/></button>
        <button onClick={clear} className="p-1.5 text-slate-500 hover:text-red-400 rounded" title="Hard Clear"><Trash2 size={14}/></button>
        {!isFullscreen && (
          <button onClick={() => setIsFullscreen(true)} className="p-1.5 text-slate-400 hover:text-indigo-400" title="Technical View">
            <Maximize2 size={14}/>
          </button>
        )}
      </div>
    </div>
  );

  const canvasContent = (
    <div className={`flex flex-col gap-0 ${isFullscreen ? 'h-full w-full max-w-7xl mx-auto p-4' : ''}`}>
      {renderToolbar()}
      <div className={`relative bg-[#1e293b] rounded-b-xl border-x border-b border-slate-700 overflow-hidden shadow-2xl ${isFullscreen ? 'flex-1' : 'aspect-[16/10]'}`}>
        {/* Pro Grid */}
        {showGrid && (
           <div 
             className="absolute inset-0 pointer-events-none opacity-[0.1]" 
             style={{ 
               backgroundImage: `linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)`, 
               backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` 
             }} 
           />
        )}
        
        {/* CAD Crosshair UI */}
        <div 
          className="absolute w-px bg-indigo-500/30 pointer-events-none" 
          style={{ left: cursorPos.x, top: 0, bottom: 0, opacity: isDrawing ? 0.5 : 0.2 }}
        />
        <div 
          className="absolute h-px bg-indigo-500/30 pointer-events-none" 
          style={{ top: cursorPos.y, left: 0, right: 0, opacity: isDrawing ? 0.5 : 0.2 }}
        />

        <canvas
          ref={canvasRef}
          width={isFullscreen ? 1600 : 800}
          height={isFullscreen ? 1000 : 500}
          className="absolute inset-0 w-full h-full cursor-none touch-none"
        />
        <canvas
          ref={tempCanvasRef}
          width={isFullscreen ? 1600 : 800}
          height={isFullscreen ? 1000 : 500}
          className="absolute inset-0 w-full h-full pointer-events-auto touch-none"
          onMouseDown={startDrawing}
          onMouseMove={handlePointerMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={handlePointerMove}
          onTouchEnd={stopDrawing}
        />

        {/* CAD Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-3 text-[9px] font-mono text-slate-500 border-t border-slate-700/50">
           <div className="flex gap-4">
             <span className="flex gap-1"><span className="text-slate-600">X:</span>{cursorPos.x.toFixed(0)}</span>
             <span className="flex gap-1"><span className="text-slate-600">Y:</span>{cursorPos.y.toFixed(0)}</span>
             <span className="flex gap-1 text-indigo-400"><Info size={10}/> {mode.toUpperCase()}</span>
           </div>
           <div className="flex gap-3">
             <span className="text-emerald-500">READY</span>
             <span className="text-slate-600">SNAP: {showGrid ? 'ON' : 'OFF'}</span>
           </div>
        </div>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center animate-in fade-in duration-300">
        <div className="absolute top-6 left-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Layout className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black text-white leading-none">REDESIGN CAD v1.0</h2>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Professional Drafting Environment</p>
          </div>
        </div>
        <button onClick={() => setIsFullscreen(false)} className="absolute top-6 right-6 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full border border-slate-700 shadow-2xl z-[110] transition-all hover:bg-indigo-600">
          <Check size={24}/>
        </button>
        {canvasContent}
      </div>
    );
  }

  return <div className={className}>{canvasContent}</div>;
};
