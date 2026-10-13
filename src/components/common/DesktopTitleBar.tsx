import React, { useState } from 'react';
import { Minus, Square, Copy, X, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DesktopTitleBar: React.FC = () => {
  const { theme, toggleTheme, currentUser, settings, currentOrganization } = useApp();
  const [isMaximized, setIsMaximized] = useState(false);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <div className="hidden sm:flex h-10 border-b border-[#1F3A2D] bg-[#07130E] text-[#F2EFE6] items-center justify-between px-3 select-none text-xs z-50 shrink-0 font-sans">
      {/* Left: Brand & Icon */}
      <div className="flex items-center gap-2.5">
        <img
          src="/icon-square.png"
          alt="Procura"
          className="w-5 h-5 rounded-md object-cover border border-[#D4AF37]/50 shadow-sm"
        />
        <span className="font-bold tracking-wider text-[#D4AF37] font-display text-sm">PROCURA</span>
        <span className="text-[#A8B5AB]/60 hidden sm:inline">|</span>
        <span className="text-[#A8B5AB] truncate max-w-[220px] hidden md:inline">
          {currentOrganization.name || 'Smart Procurement System'}
        </span>
      </div>

      {/* Center: System Title */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-[#A8B5AB] font-medium tracking-wide">
          {currentUser ? `${currentUser.fullName} (${currentUser.role})` : 'Enterprise Procurement Ledger'}
        </span>
      </div>

      {/* Right: Theme Toggle & Native Window Controls */}
      <div className="flex items-center">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded hover:bg-[#132A20] text-[#A8B5AB] hover:text-[#D4AF37] transition-colors mr-2"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode (Ctrl+Shift+L)`}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Window Controls */}
        <div className="flex items-center">
          <button
            onClick={() => {}}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#132A20] text-[#A8B5AB] hover:text-[#F2EFE6] transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleMaximize}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#132A20] text-[#A8B5AB] hover:text-[#F2EFE6] transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Copy className="w-3 h-3 rotate-180" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={() => {}}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#D9534F] text-[#A8B5AB] hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
