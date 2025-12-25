
import React, { useState } from 'react';
import { X, Info, HelpCircle, BookOpen, Layers, Zap, MousePointer2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { DesignMode } from '../types';
import { MODE_CONFIG } from '../constants';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FAQ_ITEMS = [
  {
    question: "How do I use my own API Key?",
    answer: "You can obtain a Google Gemini API Key from Google AI Studio. Once you have it, go to 'Settings' in the sidebar of Redesign Ai and paste your key. This allows you to use your own quota of 1,500 free requests per day."
  },
  {
    question: "What is 'Mark Transformation Zones'?",
    answer: "This is our powerful inpainting feature. It allows you to draw specific boxes over an image (like a vacant lot in a city photo) and tell the AI to only change that specific area while keeping the rest of the photo intact. This is perfect for targeted architectural development."
  },
  {
    question: "Why do some generations take longer than others?",
    answer: "Complex modes like 'City Planning' or 'Aerial View' require more architectural reasoning from the AI. Additionally, requesting high-quality variations or 3D models increases processing time. Video generation can take up to several minutes as it renders frame-by-frame."
  },
  {
    question: "Can I export my designs for clients?",
    answer: "Yes! Use the 'Export Design Report' button after generating a design. It creates a professional, offline-capable HTML report featuring all 4 variations, your reference photo, and the AI's valuation analysis."
  }
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'modes' | 'faq'>('general');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
              <BookOpen className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none mb-1">Help & Documentation</h2>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Mastering the Architectural Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <X className="text-slate-400" size={24} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-2 bg-slate-900 border-b border-slate-800">
          {[
            { id: 'general', label: 'Overview', icon: Info },
            { id: 'modes', label: 'Modes & Features', icon: Layers },
            { id: 'faq', label: 'FAQ', icon: HelpCircle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-950/30">
          {activeTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="max-w-3xl mx-auto space-y-6">
                <section>
                  <h3 className="text-lg font-bold text-white mb-3">Welcome to Redesign Ai</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Redesign Ai is a cutting-edge architectural visualization platform powered by Google Gemini. 
                    It bridges the gap between raw concepts and photorealistic reality. Whether you're an interior designer, 
                    urban planner, or real estate agent, our suite provides professional tools to reimagine any space 
                    instantly.
                  </p>
                </section>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                      <Zap size={18} />
                      <span className="text-xs font-black uppercase tracking-widest">Performance</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Leveraging the latest Gemini models for multi-modal reasoning, allowing for complex 
                      architectural understanding beyond simple filters.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                      <MousePointer2 size={18} />
                      <span className="text-xs font-black uppercase tracking-widest">Interactivity</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Beyond static images: generate 360° panoramas, VR-ready stereo views, 
                      interactive aerial maps, and 2K cinematic videos.
                    </p>
                  </div>
                </div>

                <section className="bg-indigo-600/10 border border-indigo-500/20 p-5 rounded-xl">
                  <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">Pro Tip</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    For the best results, use high-resolution reference photos with clear perspective. 
                    The AI uses the vanishing points and lighting in your photo to calculate the new architecture.
                  </p>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'modes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {Object.entries(MODE_CONFIG).map(([mode, config]) => (
                <div key={mode} className="flex gap-4 p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:border-slate-600 transition-colors group">
                  <div className="shrink-0 w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {React.createElement(config.icon, { size: 20 })}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{mode}</h4>
                    <p className="text-[11px] text-slate-500 leading-tight mb-3">
                      {getModeDescription(mode as DesignMode)}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {config.styles.slice(0, 3).map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-slate-900 rounded text-[9px] text-slate-400 border border-slate-700">
                          {s}
                        </span>
                      ))}
                      <span className="text-[9px] text-slate-600 self-center">+{config.styles.length - 3} more</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="max-w-2xl mx-auto space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {FAQ_ITEMS.map((item, idx) => (
                <div key={idx} className="border border-slate-800 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800 transition-colors"
                  >
                    <span className="text-sm font-bold text-slate-200">{item.question}</span>
                    {expandedFaq === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expandedFaq === idx && (
                    <div className="p-4 bg-slate-800/30 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
                      {item.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <CheckCircle2 size={14} className="text-emerald-500" /> Professional Grade
          </div>
          <div className="w-px h-3 bg-slate-800"></div>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            <Zap size={14} className="text-indigo-500" /> Gemini Powered
          </div>
        </div>
      </div>
    </div>
  );
};

function getModeDescription(mode: DesignMode): string {
  // Fix: DesignMode.FLOOR_PLAN_3D was removed and replaced with correct valid enum members.
  switch (mode) {
    case DesignMode.INTERIOR: return "Transform rooms by swapping furniture, changing materials, and adjusting lighting while keeping structural walls.";
    case DesignMode.CITY: return "Urban development tool for adding buildings, corridors, and infrastructure to city photos using master-planning logic.";
    case DesignMode.AERIAL: return "Top-down visualization for large-scale landscaping and urban overhaul projects with map-style inspection.";
    case DesignMode.BLUEPRINT: return "Generate functional 2D architectural layouts from scratch based on area and room requirements.";
    case DesignMode.OUTDOOR: return "Reimagine gardens, pools, and exteriors with professional landscape architecture aesthetics.";
    case DesignMode.FURNITURE_EDIT: return "Add, remove, or replace specific objects and furniture within a scene using pinpoint AI accuracy.";
    case DesignMode.SKETCH_TO_RENDER: return "Turn rough hand-drawn architectural sketches into polished, photorealistic marketing renders.";
    case DesignMode.ARCHITECTURAL: return "Advanced spatial design focusing on flow optimization and high-level architectural aesthetics.";
    case DesignMode.UNDER_CONSTRUCTION: return "Visualize finished results for buildings currently in a skeletal or construction phase.";
    case DesignMode.ELECTRICAL: return "Technical planning for electrical systems, including smart home and solar integration.";
    case DesignMode.RENOVATION: return "Focus on historic restoration or modern facade upgrades for existing buildings.";
    default: return "Advanced architectural mode designed for professional structural and aesthetic transformation.";
  }
}
