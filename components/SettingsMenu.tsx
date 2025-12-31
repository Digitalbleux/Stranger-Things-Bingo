import React, { useState, useEffect, useRef } from 'react';
import { WinMode, WIN_PATTERNS } from '../constants';
import { ChevronDown, RefreshCw, Settings, Check } from 'lucide-react';

interface SettingsMenuProps {
  currentMode: WinMode;
  onModeChange: (mode: WinMode) => void;
  onNewGame: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ currentMode, onModeChange, onNewGame }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative z-50 font-['Arial']" ref={menuRef}>
      {/* Trigger Button - Metallic Sleek Look */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300
          border border-gray-600/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_4px_10px_rgba(0,0,0,0.5)]
          bg-gradient-to-b from-gray-700 via-gray-800 to-black
          hover:brightness-110 active:scale-95 group
          ${isOpen ? 'ring-2 ring-red-500/30 border-red-500/50' : ''}
        `}
      >
        <div className={`p-1 rounded-full bg-black/30 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
           <Settings size={16} className="text-gray-200" />
        </div>
        <span className="text-xs md:text-sm font-bold text-gray-200 tracking-wide">OPTIONS</span>
        <ChevronDown 
          size={14} 
          className={`text-gray-400 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu - Smooth Transition State */}
      <div 
        className={`
          absolute right-0 mt-3 w-72 
          bg-gradient-to-b from-[#2a2a35] via-[#1a1a20] to-black
          border border-gray-600/30 rounded-2xl 
          shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)]
          backdrop-blur-xl overflow-hidden
          origin-top-right transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${isOpen 
            ? 'opacity-100 scale-100 translate-y-0 visible' 
            : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
          }
        `}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-700/50 bg-black/20">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Win Condition</h3>
        </div>

        {/* Options List */}
        <div className="p-2 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
          {(Object.keys(WIN_PATTERNS) as WinMode[]).map((mode) => {
            const isSelected = currentMode === mode;
            return (
              <button
                key={mode}
                onClick={() => {
                  onModeChange(mode);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200
                  flex items-center justify-between group
                  ${isSelected 
                    ? 'bg-gradient-to-r from-red-900/40 to-red-900/10 text-white border border-red-500/20 shadow-inner' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                <span className={isSelected ? 'font-bold' : 'font-medium'}>{WIN_PATTERNS[mode]}</span>
                {isSelected && <Check size={14} className="text-red-400 animate-in zoom-in duration-200" />}
              </button>
            );
          })}
        </div>
        
        {/* Actions Footer */}
        <div className="p-2 bg-black/40 border-t border-gray-700/50">
          <button
            onClick={() => {
              onNewGame();
              setIsOpen(false);
            }}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white py-2.5 rounded-xl transition-all shadow-lg shadow-red-900/20 border border-red-500/20 active:scale-95 group"
          >
            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
            <span className="font-bold text-xs tracking-wider">GENERATE NEW CARD</span>
          </button>
        </div>
      </div>
    </div>
  );
};