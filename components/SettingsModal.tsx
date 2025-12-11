import React, { useState, useEffect } from 'react';
import { X, Key, Save, Trash2, HardDrive } from 'lucide-react';
import { getApiKey, setApiKey, removeApiKey, getUserTier, setUserTier, getStorageUsage } from '../services/storage';
import { UserTier } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [key, setKey] = useState('');
  const [tier, setTierState] = useState<UserTier>(UserTier.FREE);
  const [storageUsed, setStorageUsed] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setKey(getApiKey() || '');
      setTierState(getUserTier());
      setStorageUsed(getStorageUsage());
    }
  }, [isOpen]);

  const handleSave = () => {
    if (key.trim()) setApiKey(key.trim());
    else removeApiKey();
    setUserTier(tier);
    onClose();
  };

  const handleClear = () => {
    removeApiKey();
    setKey('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Settings</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
        </div>

        <div className="space-y-6">
          {/* API Key Section */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Google Gemini API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Enter your API Key"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <button onClick={handleClear} className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 rounded-lg border border-slate-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Key is stored locally in your browser.</p>
          </div>

          {/* Tier Section */}
          <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
            <h4 className="text-sm font-medium text-white mb-3">Subscription Tier</h4>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={tier === UserTier.FREE} 
                  onChange={() => setTierState(UserTier.FREE)}
                  className="text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-slate-300">Free</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={tier === UserTier.PRO} 
                  onChange={() => setTierState(UserTier.PRO)}
                  className="text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-indigo-400 font-medium">Pro (Simulated)</span>
              </label>
            </div>
          </div>

          {/* Storage Stats */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span className="flex items-center gap-2"><HardDrive className="w-4 h-4" /> Local Storage Used</span>
            <span>{storageUsed.toFixed(2)} MB Used</span>
          </div>

          <button 
            onClick={handleSave} 
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};