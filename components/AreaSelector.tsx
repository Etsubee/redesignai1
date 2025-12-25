
import React, { useState, useRef, useEffect } from 'react';
import { X, Trash2, Edit3, CheckCircle2, Wand2, Type, Sparkles, Plus, Settings2 } from 'lucide-react';
import { MaskedArea, AreaGenerationMode } from '../types';

interface AreaSelectorProps {
  image: string;
  areas: MaskedArea[];
  onAreasChange: (areas: MaskedArea[]) => void;
  availableStyles: string[];
}

export const AreaSelector: React.FC<AreaSelectorProps> = ({ image, areas, onAreasChange, availableStyles }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    // If clicking on an existing area's controls, don't start new drawing
    const target = e.target as HTMLElement;
    if (target.closest('.area-controls')) return;
    
    if (editingId) return;
    const pos = getPos(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentRect) return;
    const pos = getPos(e);
    setCurrentRect({
      x: Math.min(startPos.x, pos.x),
      y: Math.min(startPos.y, pos.y),
      w: Math.abs(pos.x - startPos.x),
      h: Math.abs(pos.y - startPos.y)
    });
  };

  const handleEnd = () => {
    if (isDrawing && currentRect && currentRect.w > 2 && currentRect.h > 2) {
      const newArea: MaskedArea = {
        id: Math.random().toString(36).substr(2, 9),
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.w,
        height: currentRect.h,
        prompt: '',
        style: availableStyles[0],
        generationMode: 'both'
      };
      onAreasChange([...areas, newArea]);
      setEditingId(newArea.id);
    }
    setIsDrawing(false);
    setCurrentRect(null);
  };

  const deleteArea = (id: string) => {
    onAreasChange(areas.filter(a => a.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const updateArea = (id: string, updates: Partial<MaskedArea>) => {
    onAreasChange(areas.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const activeArea = areas.find(a => a.id === editingId);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden cursor-crosshair group select-none shadow-2xl border border-slate-800">
      <img src={image} className="w-full h-full object-contain pointer-events-none" alt="Base" />
      
      {/* Interaction Layer */}
      <div 
        ref={containerRef}
        className="absolute inset-0"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {/* Existing Areas */}
        {areas.map((area, index) => (
          <div 
            key={area.id}
            className={`absolute border-2 transition-all ${editingId === area.id ? 'border-indigo-500 bg-indigo-500/30 z-30 shadow-[0_0_20px_rgba(99,102,241,0.5)]' : 'border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 z-20'}`}
            style={{ left: `${area.x}%`, top: `${area.y}%`, width: `${area.width}%`, height: `${area.height}%` }}
          >
            {/* Area ID Label */}
            <div className="absolute -top-6 left-0 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded border border-slate-700 font-bold whitespace-nowrap">
              Zone {index + 1}
            </div>

            {/* Area Actions */}
            <div className="area-controls absolute top-1 right-1 flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingId(area.id); }}
                className="p-1 bg-indigo-600 text-white rounded hover:bg-indigo-500 shadow-lg"
                title="Configure Zone"
              >
                <Settings2 size={12} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); deleteArea(area.id); }}
                className="p-1 bg-red-600 text-white rounded hover:bg-red-500 shadow-lg"
                title="Remove Zone"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Area Info Banner */}
            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] text-white font-bold pointer-events-none truncate max-w-[90%] flex items-center gap-1.5 border border-white/10">
               {area.generationMode === 'style' ? <Wand2 size={10} className="text-emerald-400"/> : area.generationMode === 'prompt' ? <Type size={10} className="text-cyan-400"/> : <Sparkles size={10} className="text-indigo-400"/>}
               <span className="truncate">{area.prompt || area.style || 'Custom Transformation'}</span>
            </div>
          </div>
        ))}

        {/* Current Drawing Rect */}
        {currentRect && (
          <div 
            className="absolute border-2 border-dashed border-white bg-white/10 pointer-events-none z-40"
            style={{ left: `${currentRect.x}%`, top: `${currentRect.y}%`, width: `${currentRect.w}%`, height: `${currentRect.h}%` }}
          />
        )}
      </div>

      {/* Editor Modal Overlay */}
      {editingId && activeArea && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5">
            <div className="flex justify-between items-center">
               <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                 <Settings2 size={16} className="text-indigo-400" /> Zone Logic
               </h4>
               <button onClick={() => setEditingId(null)} className="p-1 hover:bg-slate-800 rounded-full transition-colors"><X size={18} className="text-slate-400 hover:text-white"/></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 mb-2 tracking-widest">Generation Mode</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'style', label: 'Main Design Style Only', icon: Wand2, color: 'text-emerald-400' },
                    { id: 'prompt', label: 'Custom Instruction Only', icon: Type, color: 'text-cyan-400' },
                    { id: 'both', label: 'Style & Instruction Combined', icon: Sparkles, color: 'text-indigo-400' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => updateArea(editingId, { generationMode: m.id as AreaGenerationMode })}
                      className={`px-4 py-3 rounded-xl border transition-all flex items-center gap-3 ${activeArea.generationMode === m.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}
                    >
                      <m.icon size={18} className={activeArea.generationMode === m.id ? 'text-white' : m.color}/>
                      <span className="text-[10px] font-black uppercase tracking-widest text-left leading-none">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {(activeArea.generationMode === 'style' || activeArea.generationMode === 'both') && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-2 tracking-widest">Local Style (Optional Override)</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
                    value={activeArea.style}
                    onChange={(e) => updateArea(editingId, { style: e.target.value })}
                  >
                    {availableStyles.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {(activeArea.generationMode === 'prompt' || activeArea.generationMode === 'both') && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-[10px] uppercase font-black text-slate-500 mb-2 tracking-widest">Custom instructions for Zone</label>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                    rows={4}
                    placeholder="e.g., Replace this building with a futuristic glass skyscraper with sky gardens..."
                    value={activeArea.prompt}
                    onChange={(e) => updateArea(editingId, { prompt: e.target.value })}
                  />
                </div>
              )}

              <button 
                onClick={() => setEditingId(null)}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 mt-2 shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
              >
                <CheckCircle2 size={18} /> Apply Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Overlay */}
      {!editingId && areas.length === 0 && !isDrawing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-white text-xs font-bold animate-pulse flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg">
              <Plus size={16} />
            </div>
            Drag on photo to mark transformation zones
          </div>
        </div>
      )}
    </div>
  );
};
