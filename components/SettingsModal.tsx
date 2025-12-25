
import React, { useState, useEffect } from 'react';
import { X, Save, HardDrive } from 'lucide-react';
import { getUserTier, setUserTier, getStorageUsage } from '../services/storage';
import { UserTier } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, userId }) => {
  const [tier, setTierState] = useState<UserTier>(UserTier.FREE);
  const [storageUsed, setStorageUsed] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setTierState(getUserTier());
      setStorageUsed(getStorageUsage());
    }
  }, [isOpen, userId]);

  const handleSave = () => {
    setUserTier(tier);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-[95%] max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Settings</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
        </div>

        <div className="space-y-6">
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
