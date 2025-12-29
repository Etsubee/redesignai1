
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Menu, Upload, Image as ImageIcon, Layers, Zap, Settings, 
  LogOut, User, Check, AlertCircle, Loader2, Download, Video, 
  ChevronRight, ChevronLeft, Maximize2, Plus, Minus, Globe, ExternalLink,
  Rotate3d, ScanEye, FileCode, FileText, X, Box, Crosshair, ListTodo,
  Info, Sparkles, Map as MapIcon, Home, Edit3, Monitor, Maximize,
  Layout, Film, Glasses, MapPin, BrainCircuit, Search
} from 'lucide-react';

import { DesignMode, DesignConfig, Project, UserProfile, UserTier, BlueprintParams, MaskedArea, RenderFormat, LocationData } from './types';
import { MODE_CONFIG, DEFAULT_PROMPTS, APP_NAME, ROOM_TYPES, ALLOWED_EMAILS } from './constants';
import { getUserTier } from './services/storage';
import { generateDesigns, analyzeDesign, getCityPlanningSuggestions } from './services/geminiService';
import { exportToHTML, exportToPDF } from './services/exportService';
import { ComparisonSlider } from './components/ComparisonSlider';
import { VideoGeneratorModal } from './components/VideoGeneratorModal';
import { SettingsModal } from './components/SettingsModal';
import { PannellumViewer } from './components/PannellumViewer';
import { StereoViewer } from './components/StereoViewer';
import { ModelViewer } from './components/ModelViewer';
import { AreaSelector } from './components/AreaSelector';
import { MapZoomViewer } from './components/MapZoomViewer';
import { BoundaryCanvas } from './components/BoundaryCanvas';
import { auth, signInWithGoogle, logoutUser, subscribeToAuthChanges } from './services/firebase';

const RENDER_FORMATS: RenderFormat[] = ['Landscape', 'Panoramic', 'A0 Poster', 'A1 Poster', 'A2 Poster', 'A3 Poster', 'Standard'];

const App: React.FC = () => {
  // Global State
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // UI State
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isAreaSelectionMode, setIsAreaSelectionMode] = useState(false);

  // Design State
  const [currentMode, setCurrentMode] = useState<DesignMode>(DesignMode.INTERIOR);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('Designing...');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [marketContext, setMarketContext] = useState<'Ethiopian' | 'International'>('International');

  // City Planning Specific
  const [cityStrategy, setCityStrategy] = useState<'USER_INPUT' | 'AI_RECOMMENDED'>('USER_INPUT');
  const [aiSuggestions, setAiSuggestions] = useState<string>('');
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  // Visualization State
  const [isResultPanorama, setIsResultPanorama] = useState(false);
  const [isResultStereo, setIsResultStereo] = useState(false);
  const [isResult3DModel, setIsResult3DModel] = useState(false);
  const [is360Active, setIs360Active] = useState(false);
  const [isInteractiveAerial, setIsInteractiveAerial] = useState(false);

  // Form State
  const [style, setStyle] = useState(MODE_CONFIG[DesignMode.INTERIOR].styles[0]);
  const [roomType, setRoomType] = useState(ROOM_TYPES[0]);
  const [prompt, setPrompt] = useState('');
  const [subStyle, setSubStyle] = useState(''); 
  const [isStereo3D, setIsStereo3D] = useState(false);
  const [isPanorama, setIsPanorama] = useState(false);
  const [is3DModel, setIs3DModel] = useState(false);
  const [maskedAreas, setMaskedAreas] = useState<MaskedArea[]>([]);
  const [boundarySketch, setBoundarySketch] = useState<string | null>(null);
  const [canvasInitialImage, setCanvasInitialImage] = useState<string | null>(null);
  const [renderFormat, setRenderFormat] = useState<RenderFormat>('Standard');

  // Blueprint Specific State
  const [blueprintParams, setBlueprintParams] = useState<BlueprintParams>({
    area: 100,
    bedrooms: 2,
    bathrooms: 2,
    livingRooms: 1,
    kitchens: 1,
    diningRooms: 1,
    offices: 0,
    garages: 1
  });

  // --- Effects ---
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    setStyle(MODE_CONFIG[currentMode].styles[0]);
    setPrompt(DEFAULT_PROMPTS[currentMode as keyof typeof DEFAULT_PROMPTS] || "");
    setIsAreaSelectionMode(false);
    setMaskedAreas([]);
    setBoundarySketch(null);
    setCanvasInitialImage(null);
    setRenderFormat('Standard');
    setIsInteractiveAerial(currentMode === DesignMode.AERIAL || currentMode === DesignMode.CITY);
    
    // Reset modalities on mode change
    setIsPanorama(false);
    setIsStereo3D(false);
    setIs3DModel(false);
    
    // Reset city state
    if (currentMode !== DesignMode.CITY) {
      setAiSuggestions('');
    }
  }, [currentMode]);

  useEffect(() => {
    if (!auth) {
      setError("Firebase Initialization Failed. Please check console for configuration errors.");
      return;
    }

    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      if (currentUser) {
        if (ALLOWED_EMAILS.length > 0 && currentUser.email && !ALLOWED_EMAILS.includes(currentUser.email)) {
             await logoutUser();
             setUser(null);
             setError("Access Denied: You are not authorized to use this application.");
             return;
        }

        setUser({
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL,
          tier: getUserTier()
        });
        setError(null);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCityAnalysis = async () => {
    if (!uploadedImage) {
      setError("Please upload an urban perspective photo for AI analysis.");
      return;
    }
    setIsFetchingSuggestions(true);
    setAiSuggestions('');
    try {
      const suggestion = await getCityPlanningSuggestions(uploadedImage);
      setAiSuggestions(suggestion);
      setPrompt(suggestion);
    } catch (err: any) {
      setError("City analysis failed: " + err.message);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      if (!result) return;
      const userEmail = result.user.email;
      if (ALLOWED_EMAILS.length > 0 && userEmail && !ALLOWED_EMAILS.includes(userEmail)) {
        await logoutUser();
        setError("Access Denied: Your email address is not authorized for this app.");
        return;
      }
      setError(null);
    } catch (e: any) {
      setError("Login failed: " + (e.message || "Unknown error"));
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUploadedImage(null);
      setGeneratedImages([]);
    } catch (e: any) {
      console.error("Logout Error:", e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setUploadedImage(result);
        setGeneratedImages([]);
        setAnalysis(null);
        setIsResultPanorama(false);
        setIsResultStereo(false);
        setIsResult3DModel(false);
        setIs360Active(false);
        setMaskedAreas([]);
        setIsInteractiveAerial(currentMode === DesignMode.AERIAL || currentMode === DesignMode.CITY);

        const img = new Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          if (ratio >= 1.8 && ratio <= 2.2) setIsPanorama(true);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage && currentMode !== DesignMode.BLUEPRINT) {
      return;
    }

    setGeneratedImages([]);
    setAnalysis(null);
    setError(null);
    setIsGenerating(true);
    setLoadingText(currentMode === DesignMode.CITY ? "Optimizing Urban Grid..." : "Architectural Processing...");

    const config: DesignConfig = {
      mode: currentMode,
      style,
      subStyle,
      roomType: (currentMode === DesignMode.INTERIOR || currentMode === DesignMode.RENOVATION) ? roomType : undefined,
      prompt,
      isStereo3D,
      isPanorama,
      is3DModel,
      isGenerateNew: (currentMode === DesignMode.BLUEPRINT) ? true : false,
      blueprintParams: (currentMode === DesignMode.BLUEPRINT) ? blueprintParams : undefined,
      maskedAreas: maskedAreas.length > 0 ? maskedAreas : undefined,
      boundarySketch: (currentMode === DesignMode.BLUEPRINT) ? (boundarySketch || undefined) : undefined,
      renderFormat: (currentMode === DesignMode.SKETCH_TO_RENDER) ? renderFormat : undefined,
      cityPlanningStrategy: currentMode === DesignMode.CITY ? cityStrategy : undefined
    };

    try {
      const results = await generateDesigns(uploadedImage, config);
      setGeneratedImages(results);
      setSelectedVariation(0);
      setIsResultPanorama(config.isPanorama);
      setIsResultStereo(config.isStereo3D);
      setIsResult3DModel(config.is3DModel);
      setIs360Active(config.isPanorama); 
      setIsInteractiveAerial(currentMode === DesignMode.AERIAL || currentMode === DesignMode.CITY);
    } catch (err: any) {
      setError(err.message || "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!generatedImages[selectedVariation]) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeDesign(generatedImages[selectedVariation], marketContext);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || "Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = () => {
    if (generatedImages.length === 0) return;
    exportToHTML(uploadedImage, generatedImages, analysis, prompt, style);
  };

  const setModality = (mod: 'panorama' | 'stereo' | '3d') => {
    setIsPanorama(mod === 'panorama' ? !isPanorama : false);
    setIsStereo3D(mod === 'stereo' ? !isStereo3D : false);
    setIs3DModel(mod === '3d' ? !is3DModel : false);
  };

  const renderCityPlanningControls = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-4 shadow-inner">
        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <MapIcon size={14}/> Urban Strategy
        </h4>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-600 uppercase block tracking-widest">Planning Logic</label>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setCityStrategy('USER_INPUT')}
              className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${cityStrategy === 'USER_INPUT' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
            >
              Manual Input
            </button>
            <button 
              onClick={() => {
                setCityStrategy('AI_RECOMMENDED');
                if (uploadedImage) handleCityAnalysis();
              }}
              className={`py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${cityStrategy === 'AI_RECOMMENDED' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
            >
              AI Proposal
            </button>
          </div>
        </div>

        {cityStrategy === 'AI_RECOMMENDED' && (
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase">
                   {isFetchingSuggestions ? <Loader2 size={12} className="animate-spin" /> : <BrainCircuit size={12}/>}
                   Smart Urban Insight
                </div>
                {uploadedImage && !isFetchingSuggestions && (
                   <button 
                     onClick={handleCityAnalysis}
                     className="text-[8px] font-bold text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1"
                   >
                     <Search size={10} /> RE-ANALYZE PHOTO
                   </button>
                )}
             </div>
             
             {isFetchingSuggestions ? (
                <div className="py-4 flex flex-col items-center gap-2">
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                   </div>
                   <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Scanning Perspective...</span>
                </div>
             ) : (
                <div className="space-y-2">
                   <p className="text-[10px] text-slate-400 leading-relaxed italic border-l-2 border-indigo-500/30 pl-2">
                     {aiSuggestions || (uploadedImage ? "Click 'AI Proposal' to analyze your urban photo." : "Upload a photo to see AI-driven urban suggestions.")}
                   </p>
                   {aiSuggestions && (
                     <div className="flex flex-wrap gap-1 mt-2">
                        <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[8px] font-bold uppercase rounded border border-indigo-500/20">G+10 Potential</span>
                        <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 text-[8px] font-bold uppercase rounded border border-cyan-500/20">Transit Hub</span>
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase rounded border border-emerald-500/20">Mixed Use</span>
                     </div>
                   )}
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 transition-transform lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">{APP_NAME}</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white"><X size={20}/></button>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            {Object.entries(MODE_CONFIG).map(([mode, config]) => (
              <button
                key={mode}
                onClick={() => setCurrentMode(mode as DesignMode)}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${currentMode === mode ? 'bg-indigo-600/10 text-indigo-400 border-r-2 border-indigo-500 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                {React.createElement(config.icon, { size: 20 })}
                <span className="text-sm">{mode}</span>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-slate-800 space-y-2">
            <button onClick={() => setShowSettings(true)} className="flex items-center gap-3 text-slate-400 hover:text-white w-full p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <Settings size={20} /> <span className="text-sm">Settings</span>
            </button>
            {user ? (
              <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
                <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-indigo-500/50" alt="Avatar" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-white">{user.displayName || 'Architect'}</p>
                  <button onClick={handleLogout} className="text-[10px] text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
                    <LogOut size={10} /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={handleLogin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20">
                <User size={16} /> Sign In with Google
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="p-4 lg:px-6 border-b border-slate-800 flex items-center gap-4 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white"><Menu size={24}/></button>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold truncate leading-none mb-1">{currentMode}</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">AI Architectural Engine v2.0</p>
          </div>
          
          {isAreaSelectionMode && (
            <div className="ml-auto flex items-center gap-3 bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full border border-indigo-500/30 text-[10px] font-bold animate-pulse">
              <Crosshair size={14} /> MARKING TARGET ZONES
            </div>
          )}

          {!isAreaSelectionMode && error && (
            <div className="ml-auto flex items-center gap-2 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 text-xs">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1600px] mx-auto h-full">
            <div className="lg:col-span-3 space-y-4">
              {currentMode !== DesignMode.BLUEPRINT && (
                <div className="glass-panel p-4 rounded-xl">
                  <h3 className="text-[11px] font-black text-slate-500 uppercase mb-3 flex items-center gap-2 tracking-widest">
                    <ImageIcon size={14} className="text-indigo-500"/> Reference Visual
                  </h3>
                  <div className="relative border-2 border-dashed border-slate-700 rounded-lg p-4 hover:border-indigo-500 transition-all cursor-pointer group bg-slate-800/30">
                    <input type="file" onChange={handleImageUpload} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center justify-center text-slate-400 min-h-[100px]">
                      {uploadedImage ? (
                        <div className="relative">
                          <img src={uploadedImage} alt="Uploaded" className="max-h-32 rounded shadow-lg border border-slate-700" />
                          <div className="absolute -top-2 -right-2 bg-indigo-600 p-1 rounded-full shadow-lg">
                            <Check size={12} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform border border-slate-700 group-hover:border-indigo-500">
                             <Upload className="group-hover:text-indigo-400 transition-colors" size={20} />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest">Drop Perspective</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="glass-panel p-4 rounded-xl space-y-4">
                <h3 className="text-[11px] font-black text-slate-500 uppercase mb-3 flex items-center gap-2 tracking-widest">
                  <Layers size={14} className="text-indigo-500"/> Design Logic
                </h3>
                
                {currentMode === DesignMode.BLUEPRINT && (
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 space-y-4 shadow-inner">
                      <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                        <FileCode size={14}/> Technical Drafting
                      </h4>
                      <BoundaryCanvas onExport={setBoundarySketch} className="mb-2" />
                    </div>
                  </div>
                )}

                {currentMode === DesignMode.CITY && renderCityPlanningControls()}
                
                {(currentMode === DesignMode.INTERIOR || currentMode === DesignMode.RENOVATION) && (
                  <div className="animate-in slide-in-from-top-1 duration-300">
                    <label className="text-[10px] font-black text-slate-600 uppercase mb-2 block tracking-widest flex items-center gap-2">
                      <Layout size={12}/> Space Context
                    </label>
                    <select 
                      value={roomType} 
                      onChange={(e) => setRoomType(e.target.value)} 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-xs p-2.5 outline-none appearance-none cursor-pointer"
                    >
                      {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                {(currentMode === DesignMode.CITY || currentMode === DesignMode.AERIAL) && uploadedImage && (
                  <div className="space-y-3">
                    <button 
                      onClick={() => setIsAreaSelectionMode(!isAreaSelectionMode)}
                      className={`w-full py-2.5 rounded-lg text-[10px] font-black flex items-center justify-center gap-2 transition-all border uppercase tracking-widest shadow-lg ${isAreaSelectionMode ? 'bg-indigo-600 border-indigo-500 text-white animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500'}`}
                    >
                      <Crosshair size={14} /> {isAreaSelectionMode ? 'Lock Marking' : 'Mark Transformation Zones'}
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase mb-2 block tracking-widest">Global Aesthetic</label>
                    <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-xs p-2.5 outline-none appearance-none cursor-pointer">
                      {MODE_CONFIG[currentMode as DesignMode].styles.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase mb-2 block tracking-widest">Core Narrative</label>
                    <textarea 
                      value={prompt} 
                      onChange={(e) => setPrompt(e.target.value)} 
                      rows={4} 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg text-white text-xs p-3 focus:ring-1 focus:ring-indigo-500 outline-none resize-none" 
                      placeholder={currentMode === DesignMode.CITY ? "Describe what to build: e.g. G+10 condominiums, rail station, modern park..." : "Describe the atmosphere..."}
                    />
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-slate-800/50">
                   <label className="text-[10px] font-black text-slate-600 uppercase block tracking-widest">Technical Modality</label>
                   <div className="grid grid-cols-3 gap-2">
                     <button
                       onClick={() => setModality('panorama')}
                       className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${isPanorama ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                     >
                       <Globe size={18} />
                       <span className="text-[8px] font-black uppercase tracking-tighter">360° Pano</span>
                     </button>
                     <button
                       onClick={() => setModality('stereo')}
                       className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${isStereo3D ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                     >
                       <Glasses size={18} />
                       <span className="text-[8px] font-black uppercase tracking-tighter">Stereo 3D</span>
                     </button>
                     <button
                       onClick={() => setModality('3d')}
                       className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${is3DModel ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                     >
                       <Rotate3d size={18} />
                       <span className="text-[8px] font-black uppercase tracking-tighter">Cardinal</span>
                     </button>
                   </div>
                </div>

                <button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || (!uploadedImage && currentMode !== DesignMode.BLUEPRINT)}
                  className="w-full py-4 bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-30 transition-all shadow-2xl text-white mt-4"
                >
                  {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Zap size={20} fill="currentColor" />}
                  {isGenerating ? 'Synthesizing...' : 'Render Vision'}
                </button>
              </div>

              {generatedImages.length > 0 && (
                <div className="glass-panel p-4 rounded-xl space-y-3">
                  <button onClick={() => setShowVideoModal(true)} className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/50 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                    <Film size={14} /> Cinematic Video Maker
                  </button>
                  <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />} Calculate Valuation
                  </button>
                  <button onClick={handleExport} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" /> Export Design Report
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-9 flex flex-col gap-6">
              <div className="bg-slate-900 rounded-2xl border border-slate-800/50 overflow-hidden relative shadow-[0_35px_60px_-15px_rgba(0,0,0,0.8)] aspect-[4/3] lg:aspect-auto lg:flex-1 group">
                {isAreaSelectionMode ? (
                  <AreaSelector image={uploadedImage!} areas={maskedAreas} onAreasChange={setMaskedAreas} availableStyles={MODE_CONFIG[currentMode as DesignMode].styles} />
                ) : uploadedImage && generatedImages[selectedVariation] ? (
                  isInteractiveAerial ? (
                    <MapZoomViewer image={generatedImages[selectedVariation]} originalImage={uploadedImage} />
                  ) : isResultPanorama && is360Active ? (
                    <PannellumViewer image={generatedImages[selectedVariation]} />
                  ) : isResultStereo ? (
                    <StereoViewer image={generatedImages[selectedVariation]} />
                  ) : isResult3DModel ? (
                    <ModelViewer image={generatedImages[selectedVariation]} />
                  ) : (
                    <ComparisonSlider beforeImage={uploadedImage || ''} afterImage={generatedImages[selectedVariation]} />
                  )
                ) : (uploadedImage || currentMode === DesignMode.BLUEPRINT) ? (
                  <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                    {uploadedImage ? (
                      <div className="w-full h-full">
                        {isInteractiveAerial ? (
                          <MapZoomViewer image={uploadedImage} />
                        ) : (
                          <img src={uploadedImage} className="max-h-full max-w-full object-contain opacity-40 transition-all duration-700 blur-[2px] group-hover:blur-none mx-auto" />
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-600 gap-4 opacity-30">
                         {currentMode === DesignMode.CITY ? <Globe size={80} /> : <FileText size={80} />}
                         <p className="text-sm font-bold uppercase tracking-widest">{currentMode === DesignMode.CITY ? 'Global Urban Sector' : 'Generative Blueprint'}</p>
                      </div>
                    )}
                    {isGenerating && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-md z-[60] animate-in fade-in duration-700">
                        <div className="relative mb-8">
                          <div className="w-24 h-24 border-2 border-indigo-500/20 rounded-full animate-ping absolute inset-0"></div>
                          <div className="w-24 h-24 border-t-2 border-indigo-500 rounded-full animate-spin"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Zap size={32} className="text-indigo-400 animate-pulse" fill="currentColor" />
                          </div>
                        </div>
                        <p className="text-indigo-400 font-black tracking-[0.4em] uppercase text-xs animate-pulse mb-2">{loadingText}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Translating Spatial Data into Reality</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-12 text-center bg-slate-950">
                    <div className="relative mb-8 p-10 bg-slate-900 rounded-full border border-slate-800 shadow-inner group/icon">
                      <ImageIcon size={64} className="opacity-10 group-hover/icon:opacity-20 transition-opacity" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-300 mb-3 tracking-tight">VIRTUAL STUDIO IDLE</h3>
                    <p className="max-w-md text-sm text-slate-500 leading-relaxed font-medium">Please ingest a reference perspective or utilize the urban selector to initialize the AI synthesis cycle.</p>
                  </div>
                )}
              </div>

              {generatedImages.length > 0 && !isAreaSelectionMode && (
                <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar px-2">
                  {generatedImages.map((img, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedVariation(idx)}
                      className={`group relative shrink-0 w-28 h-20 lg:w-44 lg:h-28 rounded-xl overflow-hidden border-2 transition-all duration-300 ${selectedVariation === idx ? 'border-indigo-500 scale-105 shadow-2xl shadow-indigo-600/40 ring-4 ring-indigo-500/10' : 'border-slate-800 grayscale opacity-40 hover:grayscale-0 hover:opacity-100'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase border border-white/10 tracking-widest">v{idx + 1}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} userId={user?.uid} />
      {generatedImages.length > 0 && (
        <VideoGeneratorModal isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} beforeImage={uploadedImage || ''} afterImage={generatedImages[selectedVariation]} allVariations={generatedImages} />
      )}
    </div>
  );
};

export default App;
