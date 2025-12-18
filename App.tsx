import React, { useState, useEffect, useCallback } from 'react';
import { 
  Menu, Upload, Image as ImageIcon, Layers, Zap, Settings, 
  LogOut, User, Check, AlertCircle, Loader2, Download, Video, 
  ChevronRight, ChevronLeft, Maximize2, Plus, Minus, Globe, ExternalLink,
  Rotate3D, ScanEye, FileCode, FileText, X
} from 'lucide-react';

import { DesignMode, DesignConfig, Project, UserProfile, UserTier, BlueprintParams } from './types';
import { MODE_CONFIG, DEFAULT_PROMPTS, APP_NAME, ROOM_TYPES, ALLOWED_EMAILS } from './constants';
import { getApiKey, getUserTier } from './services/storage';
import { generateDesigns, analyzeDesign } from './services/geminiService';
import { exportToHTML, exportToPDF } from './services/exportService';
import { ComparisonSlider } from './components/ComparisonSlider';
import { VideoGeneratorModal } from './components/VideoGeneratorModal';
import { SettingsModal } from './components/SettingsModal';
import { PannellumViewer } from './components/PannellumViewer';
import { StereoViewer } from './components/StereoViewer';
import { auth, signInWithGoogle, logoutUser, subscribeToAuthChanges } from './services/firebase';

const App: React.FC = () => {
  // Global State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [apiKey, setApiKeyState] = useState<string | null>(getApiKey());
  
  // UI State
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

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

  // Visualization State
  const [isResultPanorama, setIsResultPanorama] = useState(false);
  const [isResultStereo, setIsResultStereo] = useState(false);
  const [is360Active, setIs360Active] = useState(false);

  // Form State
  const [style, setStyle] = useState(MODE_CONFIG[DesignMode.INTERIOR].styles[0]);
  const [roomType, setRoomType] = useState(ROOM_TYPES[0]);
  const [prompt, setPrompt] = useState('');
  const [subStyle, setSubStyle] = useState(''); 
  const [isStereo3D, setIsStereo3D] = useState(false);
  const [isPanorama, setIsPanorama] = useState(false);

  // Blueprint Specific State
  const [isBlueprintNew, setIsBlueprintNew] = useState(false);
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
    // Responsive init: Close sidebar on mobile by default
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Reload API Key when user changes or settings close
  useEffect(() => {
    // If a user is logged in, try to get their specific key, otherwise get the global one
    const key = getApiKey(user?.uid);
    setApiKeyState(key);
  }, [showSettings, user]);

  useEffect(() => {
    // Reset style when mode changes
    setStyle(MODE_CONFIG[currentMode].styles[0]);
    setPrompt(DEFAULT_PROMPTS[currentMode] || "");
    // Reset blueprint mode default
    if (currentMode !== DesignMode.BLUEPRINT) {
      setIsBlueprintNew(false);
    }
  }, [currentMode]);

  // Auth Listener
  useEffect(() => {
    if (!auth) {
      setError("Firebase Initialization Failed. Please check console for configuration errors.");
      return;
    }

    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
      if (currentUser) {
        // Double check on persistence load as well
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
          tier: getUserTier() // Retrieve tier from local storage for now
        });
        setError(null);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Handlers ---

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      
      // If result is null, it means we are redirecting (Mobile/WebView flow)
      // The actual login completion will happen after page reload in the auth listener
      if (!result) return;

      // Desktop Popup Flow continues here
      const userEmail = result.user.email;
      
      // Whitelist Check
      if (ALLOWED_EMAILS.length > 0 && userEmail && !ALLOWED_EMAILS.includes(userEmail)) {
        await logoutUser();
        setError("Access Denied: Your email address is not authorized for this app. Please contact the administrator.");
        return;
      }

      setError(null);
    } catch (e: any) {
      console.error("Login Error:", e);
      // Handle Firebase errors loosely to avoid type issues
      if (e.code === 'auth/configuration-not-found' || e.code === 'auth/api-key-not-valid') {
         setError("Authentication Configuration Error. Please verify your .env settings.");
      } else if (e.code === 'auth/unauthorized-domain') {
         setError("Domain not authorized. Go to Firebase Console > Authentication > Settings > Authorized Domains and add this website URL.");
      } else if (e.code === 'auth/popup-closed-by-user') {
         setError(null); // Ignore
      } else {
         setError("Login failed: " + (e.message || "Unknown error"));
      }
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
        setGeneratedImages([]); // Clear previous results
        setAnalysis(null);
        setIsResultPanorama(false); // Reset on new upload
        setIsResultStereo(false);
        setIs360Active(false);

        // Auto-detect Panorama Aspect Ratio (Approx 2:1)
        const img = new Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          // Standard Equirectangular is 2:1. Allow variance 1.8 - 2.2
          if (ratio >= 1.8 && ratio <= 2.2) {
             setIsPanorama(true);
          } else {
             setIsPanorama(false);
          }
        };
        img.src = result;

        // If uploading in blueprint mode, ensure we aren't in "New" mode
        if (currentMode === DesignMode.BLUEPRINT) setIsBlueprintNew(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    // STRICT REQUIREMENT: User must have their own API key.
    // If no key is set for the current context (user or guest), open settings.
    if (!apiKey) {
      setError("Please enter your Gemini API Key in Settings to generate designs.");
      setShowSettings(true);
      return;
    }
    
    if (!uploadedImage && !(currentMode === DesignMode.BLUEPRINT && isBlueprintNew)) {
      return;
    }

    // --- CLEAR OLD DATA ---
    setGeneratedImages([]); // Immediately clear old images to show loading state
    setAnalysis(null);
    setError(null);
    
    setIsGenerating(true);
    setLoadingText("Designing...");

    const config: DesignConfig = {
      mode: currentMode,
      style,
      subStyle,
      roomType: currentMode === DesignMode.INTERIOR ? roomType : undefined,
      prompt,
      isStereo3D,
      isPanorama,
      isGenerateNew: currentMode === DesignMode.BLUEPRINT && isBlueprintNew,
      blueprintParams: (currentMode === DesignMode.BLUEPRINT && isBlueprintNew) ? blueprintParams : undefined
    };

    try {
      const results = await generateDesigns(apiKey, uploadedImage, config);
      setGeneratedImages(results);
      setSelectedVariation(0);
      
      // Update Visualization State
      setIsResultPanorama(config.isPanorama);
      setIsResultStereo(config.isStereo3D);
      setIs360Active(config.isPanorama); // Auto-activate 360 view if pano generated

    } catch (err: any) {
      setError(err.message || "Generation failed. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
        setError("Please enter your Gemini API Key in Settings to use analysis.");
        setShowSettings(true);
        return;
    }

    if (!generatedImages[selectedVariation]) return;
    setIsAnalyzing(true);
    setError(null); // Clear previous errors
    
    try {
      const result = await analyzeDesign(apiKey, generatedImages[selectedVariation], marketContext);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportHTML = () => {
    // Export all variations
    if (generatedImages.length === 0) return;
    exportToHTML(uploadedImage, generatedImages, analysis, prompt, style);
  };

  const handleExportPDF = () => {
    // PDF currently only exports selected variation
    if (!generatedImages[selectedVariation]) return;
    exportToPDF(uploadedImage, generatedImages[selectedVariation], analysis, prompt, style);
  };

  const updateBlueprintParam = (key: keyof BlueprintParams, value: number) => {
    setBlueprintParams(prev => ({ ...prev, [key]: Math.max(0, value) }));
  };

  // --- Renders ---

  const renderBlueprintControls = () => (
    <div className="space-y-4">
      <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
        <button 
          onClick={() => setIsBlueprintNew(false)}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${!isBlueprintNew ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Improve Existing
        </button>
        <button 
          onClick={() => setIsBlueprintNew(true)}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${isBlueprintNew ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Generate New
        </button>
      </div>

      {isBlueprintNew && (
        <div className="space-y-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-300">Total Area (sq m)</span>
            <input 
              type="number" 
              value={blueprintParams.area}
              onChange={(e) => updateBlueprintParam('area', parseInt(e.target.value) || 0)}
              className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
             {[
               { label: 'Bedrooms', key: 'bedrooms' },
               { label: 'Bathrooms', key: 'bathrooms' },
               { label: 'Living', key: 'livingRooms' },
               { label: 'Kitchens', key: 'kitchens' },
               { label: 'Dining', key: 'diningRooms' },
               { label: 'Office', key: 'offices' },
               { label: 'Garage', key: 'garages' },
             ].map((item) => (
                <div key={item.key} className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateBlueprintParam(item.key as keyof BlueprintParams, blueprintParams[item.key as keyof BlueprintParams] - 1)} className="p-1 hover:bg-slate-700 rounded text-slate-400"><Minus size={12}/></button>
                    <span className="text-xs w-4 text-center">{blueprintParams[item.key as keyof BlueprintParams]}</span>
                    <button onClick={() => updateBlueprintParam(item.key as keyof BlueprintParams, blueprintParams[item.key as keyof BlueprintParams] + 1)} className="p-1 hover:bg-slate-700 rounded text-slate-400"><Plus size={12}/></button>
                  </div>
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSidebar = () => (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 z-40 transition-all duration-300 ease-in-out flex flex-col
        ${/* Mobile: Slide in/out */ ''}
        transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64
        ${/* Desktop: Always visible, just width changes */ ''}
        lg:transform-none lg:translate-x-0 ${isSidebarOpen ? 'lg:w-64' : 'lg:w-20'}
      `}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {(isSidebarOpen || window.innerWidth < 1024) && (
             <h1 className="text-xl font-bold text-white tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent truncate">
                Redesign Ai
             </h1>
          )}
          
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 ml-auto">
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
          {Object.entries(MODE_CONFIG).map(([mode, config]) => {
            const m = mode as DesignMode;
            const Icon = config.icon;
            const isLocked = config.isPro && user?.tier !== UserTier.PRO;

            return (
              <button
                key={mode}
                onClick={() => {
                  if(!isLocked) {
                    setCurrentMode(m);
                    if(window.innerWidth < 1024) setSidebarOpen(false); // Close on selection on mobile
                  }
                }}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-colors relative
                  ${currentMode === m ? 'bg-indigo-600/10 text-indigo-400 border-r-2 border-indigo-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Icon size={20} className="shrink-0" />
                {isSidebarOpen && (
                  <span className="text-sm font-medium flex-1 text-left truncate">{mode}</span>
                )}
                {isSidebarOpen && config.isPro && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold">PRO</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button onClick={() => { setShowSettings(true); if(window.innerWidth < 1024) setSidebarOpen(false); }} className="flex items-center gap-3 text-slate-400 hover:text-white w-full p-2 rounded-lg hover:bg-slate-800">
            <Settings size={20} className="shrink-0" />
            {isSidebarOpen && <span className="text-sm truncate">Settings</span>}
          </button>
          
          {/* Error message inside sidebar for visibility */}
          {error && isSidebarOpen && (
            <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-900/50 mb-2">
               {error}
            </div>
          )}

          {user ? (
            <div className="space-y-2">
              <div className={`flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 overflow-hidden ${!isSidebarOpen ? 'justify-center' : ''}`}>
                <img src={user.photoURL || ''} className="w-8 h-8 rounded-full shrink-0" alt="User" />
                {isSidebarOpen && (
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                    <p className="text-xs text-indigo-400 truncate">{user.tier}</p>
                  </div>
                )}
              </div>
              <button 
                onClick={handleLogout} 
                className={`flex items-center gap-3 text-slate-400 hover:text-red-400 w-full p-2 rounded-lg hover:bg-slate-800 border border-transparent hover:border-red-900/30 transition-all ${!isSidebarOpen ? 'justify-center' : ''}`} 
                title="Sign Out"
              >
                <LogOut size={20} className="shrink-0" />
                {isSidebarOpen && <span className="text-sm font-medium truncate">Sign Out</span>}
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-transform text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <User size={16} /> {isSidebarOpen && "Sign In with Google"}
            </button>
          )}
        </div>
      </aside>
    </>
  );

  const renderMainContent = () => (
    <main className={`
      min-h-screen bg-slate-950 p-4 lg:p-6 transition-all duration-300
      /* Mobile: Sidebar is overlay, so margin is 0 */
      ml-0
      /* Desktop: Sidebar pushes content */
      ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
    `}>
      
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:text-white border border-slate-700"
            >
              <Menu size={20} />
            </button>
            <span className="text-lg font-bold text-white tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
               Redesign Ai
            </span>
        </div>
        {user && (
           <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-slate-700" alt="User" />
        )}
      </div>

      {/* Desktop Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            {React.createElement(MODE_CONFIG[currentMode].icon, { className: "text-indigo-400" })}
            {currentMode}
          </h2>
          <p className="text-slate-400 text-sm mt-1 hidden md:block">Transform your space with AI.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[calc(100vh-140px)]">
        
        {/* Controls Column - Order 2 on mobile (below image), Order 1 on Desktop */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-visible lg:overflow-y-auto lg:pr-2 custom-scrollbar order-2 lg:order-1">
          
          {/* Upload */}
          {(!isBlueprintNew || currentMode !== DesignMode.BLUEPRINT) && (
            <div className="glass-panel p-4 rounded-xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><ImageIcon size={16}/> Input Image</h3>
              <div className="relative border-2 border-dashed border-slate-700 rounded-lg p-4 hover:border-indigo-500 transition-colors group">
                <input type="file" onChange={handleImageUpload} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="flex flex-col items-center justify-center text-slate-400 min-h-[100px] lg:min-h-[120px]">
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="Uploaded" className="max-h-[120px] rounded object-cover" />
                  ) : (
                    <>
                      <Upload className="mb-2 group-hover:text-indigo-400" />
                      <span className="text-xs text-center">Drag & Drop or Click</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Parameters */}
          <div className="glass-panel p-4 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><Layers size={16}/> Configuration</h3>
            
            {/* Blueprint Specifics */}
            {currentMode === DesignMode.BLUEPRINT && renderBlueprintControls()}

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Design Style</label>
              <select 
                value={style} 
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-md text-white text-sm p-2 focus:ring-1 focus:ring-indigo-500"
              >
                {MODE_CONFIG[currentMode].styles.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Room Type Selector (Only for Interior) */}
            {currentMode === DesignMode.INTERIOR && (
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Room Type</label>
                <select 
                  value={roomType} 
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md text-white text-sm p-2 focus:ring-1 focus:ring-indigo-500"
                >
                  {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 mb-1 block">Custom Instructions</label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-md text-white text-sm p-2 focus:ring-1 focus:ring-indigo-500"
                placeholder="Describe your vision..."
              />
            </div>

            {currentMode !== DesignMode.BLUEPRINT && (
              <div className="flex flex-col gap-2 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={isStereo3D} onChange={(e) => setIsStereo3D(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-indigo-500" />
                  Stereo 3D (SBS)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={isPanorama} onChange={(e) => setIsPanorama(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-indigo-500" />
                  360° Panorama
                </label>
              </div>
            )}

            <button 
              onClick={handleGenerate}
              disabled={isGenerating || (!uploadedImage && !(currentMode === DesignMode.BLUEPRINT && isBlueprintNew))}
              className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 mt-4 transition-all
                ${isGenerating || (!uploadedImage && !(currentMode === DesignMode.BLUEPRINT && isBlueprintNew)) ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/20'}
              `}
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
              {isGenerating ? 'Designing...' : 'Generate Design'}
            </button>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>

          {/* Post Processing Actions */}
          {generatedImages.length > 0 && (
            <div className="glass-panel p-4 rounded-xl space-y-3">
               <div className="space-y-2">
                 <label className="text-xs text-slate-400 font-medium">Market Analysis Context</label>
                 <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    <button 
                      onClick={() => setMarketContext('International')} 
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${marketContext === 'International' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Global
                    </button>
                    <button 
                      onClick={() => setMarketContext('Ethiopian')} 
                      className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${marketContext === 'Ethiopian' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Ethiopia
                    </button>
                 </div>
               </div>

               <button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
               >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />} Analyze Value
               </button>
               
               <button onClick={() => setShowVideoModal(true)} className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-400 rounded-lg text-sm flex items-center justify-center gap-2">
                  <Video className="w-4 h-4" /> Create Video
               </button>

               {/* Export Options */}
               <div className="flex gap-2">
                  <button onClick={handleExportHTML} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-orange-400 rounded-lg text-sm flex items-center justify-center gap-2">
                     <FileCode className="w-4 h-4" /> HTML
                  </button>
                  <button onClick={handleExportPDF} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-rose-400 rounded-lg text-sm flex items-center justify-center gap-2">
                     <FileText className="w-4 h-4" /> PDF
                  </button>
               </div>
            </div>
          )}

        </div>

        {/* Comparison & Output Column - Order 1 on mobile, Order 2 on desktop */}
        <div className="lg:col-span-9 flex flex-col gap-6 h-auto lg:h-full order-1 lg:order-2">
          
          {/* Main Viewer */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative shadow-2xl flex flex-col aspect-[4/3] lg:aspect-auto lg:flex-1 group">
            
            {/* Viewer Header / 360 Toggle (For Result) */}
            {isResultPanorama && generatedImages.length > 0 && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full p-1 shadow-xl w-max">
                 <button 
                   onClick={() => setIs360Active(false)}
                   className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!is360Active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                 >
                   <ScanEye size={14} /> Flat
                 </button>
                 <button 
                   onClick={() => setIs360Active(true)}
                   className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${is360Active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                 >
                   <Rotate3D size={14} /> 360°
                 </button>
              </div>
            )}

            {/* Maximize Button for Standard/Comparison Views */}
            {generatedImages.length > 0 && !isResultPanorama && !isResultStereo && (
              <button
                onClick={() => setIsFullscreenPreview(true)}
                className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100 shadow-xl"
                title="Fullscreen Preview"
              >
                <Maximize2 size={20} />
              </button>
            )}

            <div className="flex-1 relative w-full h-full">
              {uploadedImage && generatedImages[selectedVariation] ? (
                isResultPanorama && is360Active ? (
                  <PannellumViewer image={generatedImages[selectedVariation]} />
                ) : isResultStereo ? (
                  <StereoViewer image={generatedImages[selectedVariation]} />
                ) : (
                  <ComparisonSlider 
                    beforeImage={uploadedImage} 
                    afterImage={generatedImages[selectedVariation]} 
                  />
                )
              ) : isBlueprintNew && generatedImages[selectedVariation] ? (
                <img 
                   src={generatedImages[selectedVariation]} 
                   alt="Generated Blueprint" 
                   className="w-full h-full object-contain"
                />
              ) : uploadedImage ? (
                 <div className="w-full h-full flex items-center justify-center bg-slate-900 relative">
                    {/* Input Image 360 Toggle (If configured as Panorama) */}
                    {isPanorama && (
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full p-1 shadow-xl w-max">
                         <button 
                           onClick={() => setIs360Active(false)}
                           className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${!is360Active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                         >
                           <ScanEye size={14} /> Flat
                         </button>
                         <button 
                           onClick={() => setIs360Active(true)}
                           className={`flex items-center gap-2 px-3 lg:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${is360Active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                         >
                           <Rotate3D size={14} /> 360°
                         </button>
                      </div>
                    )}
                    
                    {isPanorama && is360Active ? (
                        <PannellumViewer image={uploadedImage} />
                    ) : (
                        <img src={uploadedImage} className="max-h-full max-w-full object-contain opacity-50" />
                    )}

                    {isGenerating && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm z-30">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                        <p className="text-indigo-200 animate-pulse">{loadingText}</p>
                      </div>
                    )}
                 </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                  {isGenerating ? (
                     <>
                       <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                       <p className="text-indigo-200 animate-pulse">{loadingText}</p>
                     </>
                  ) : (
                    <>
                      <ImageIcon size={48} className="mb-4 opacity-20" />
                      <p>{isBlueprintNew ? 'Configure blueprint specs and generate' : 'Upload an image to start designing'}</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Variations Gallery */}
            {generatedImages.length > 0 && (
              <div className="p-4 bg-slate-950/50 border-t border-slate-800 z-10 relative">
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  {generatedImages.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedVariation(idx)}
                      className={`relative flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 rounded-lg overflow-hidden border-2 transition-all ${selectedVariation === idx ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-slate-700 hover:border-slate-500'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt={`Variation ${idx + 1}`} />
                      <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1 rounded-tl">V{idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 animate-fade-in h-auto shrink-0 shadow-lg">
              
              {/* Header / Main Stats */}
              <div className="lg:col-span-12 flex flex-col sm:flex-row items-start justify-between border-b border-slate-700 pb-4 gap-4">
                 <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
                       <Globe size={16} className={analysis.marketContext === 'Ethiopian' ? "text-emerald-400" : "text-indigo-400"} />
                       Property Analysis 
                       <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-normal whitespace-nowrap">{analysis.marketContext} Market</span>
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">{analysis.description}</p>
                 </div>
                 <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-xs text-slate-400 uppercase font-bold">Est. Value Increase</p>
                    <p className="text-2xl text-emerald-400 font-bold">{analysis.estimatedValueIncrease}</p>
                 </div>
              </div>

              {/* Renovation Tips */}
              <div className="lg:col-span-4 space-y-2">
                <h4 className="text-slate-400 text-xs uppercase font-bold flex items-center gap-2"><Check size={12}/> Renovation Tips</h4>
                <ul className="space-y-2">
                  {analysis.renovationTips.map((tip: string, i: number) => (
                    <li key={i} className="bg-slate-900/50 p-2 rounded text-slate-300 text-xs border-l-2 border-emerald-500/50">
                       {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cost Breakdown */}
              <div className="lg:col-span-5 space-y-2">
                 <h4 className="text-slate-400 text-xs uppercase font-bold flex items-center gap-2"><Zap size={12}/> Cost Estimates ({analysis.costEstimate})</h4>
                 <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700/50 overflow-x-auto">
                    <table className="w-full text-xs">
                       <thead className="bg-slate-800 text-slate-400">
                          <tr>
                             <th className="px-3 py-2 text-left">Category</th>
                             <th className="px-3 py-2 text-right">Est. Cost</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800">
                          {analysis.costBreakdown?.map((item: any, i: number) => (
                             <tr key={i} className="hover:bg-slate-800/50">
                                <td className="px-3 py-2 text-slate-300 whitespace-nowrap">{item.category}</td>
                                <td className="px-3 py-2 text-right text-slate-300 font-mono whitespace-nowrap">{item.cost}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
              
              {/* Sources */}
              <div className="lg:col-span-3 space-y-2 border-l-0 border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-4">
                 <h4 className="text-slate-400 text-xs uppercase font-bold flex items-center gap-2"><ExternalLink size={12}/> Verified Sources</h4>
                 <div className="space-y-1">
                   {analysis.sources && analysis.sources.length > 0 ? (
                      analysis.sources.map((source: any, i: number) => (
                        <a 
                          key={i} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="block text-[10px] text-indigo-400 hover:text-indigo-300 hover:underline truncate"
                        >
                          {source.title}
                        </a>
                      ))
                   ) : (
                     <p className="text-[10px] text-slate-500 italic">No direct links returned.</p>
                   )}
                 </div>
              </div>

            </div>
          )}
        </div>
      </div>

      <VideoGeneratorModal 
        isOpen={showVideoModal} 
        onClose={() => setShowVideoModal(false)}
        beforeImage={uploadedImage || ''}
        afterImage={generatedImages[selectedVariation] || ''}
        allVariations={generatedImages}
      />

      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        userId={user?.uid}
      />
      
      {/* Fullscreen Image Preview Modal */}
      {isFullscreenPreview && generatedImages[selectedVariation] && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsFullscreenPreview(false)}>
           <button 
              onClick={() => setIsFullscreenPreview(false)}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
           >
              <X size={32} />
           </button>
           <img 
              src={generatedImages[selectedVariation]} 
              className="max-w-full max-h-full object-contain shadow-2xl" 
              alt="Fullscreen Preview"
              onClick={(e) => e.stopPropagation()} 
           />
        </div>
      )}

    </main>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30">
      {renderSidebar()}
      {renderMainContent()}
    </div>
  );
};

export default App;