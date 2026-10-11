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
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] shadow-sm">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
            <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.2 14.5l-3.8-3.8 1.4-1.4 2.4 2.4 5.4-5.4 1.4 1.4-6.8 6.8z" />
          </svg>
        </div>
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
