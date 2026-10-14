import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: string;
  variant?: 'default' | 'registration';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
  variant = 'default',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex justify-center overflow-y-auto ${variant === "registration" ? "items-start p-2 sm:p-4" : "items-center p-4 sm:p-6"}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#07130E]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog (20px corner radius = rounded-[20px]) */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} bg-[#0D1F17] border border-[#1F3A2D] rounded-[20px] shadow-2xl overflow-hidden transform transition-all duration-200 animate-in fade-in zoom-in-95 ${variant === "registration" ? "my-1 sm:my-2 max-h-[calc(100dvh-1rem)] rounded-xl sm:rounded-2xl" : "my-8 max-h-[90vh]"} z-10 flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`border-b border-[#1F3A2D] flex items-center justify-between shrink-0 bg-[#132A20]/50 ${variant === "registration" ? "px-4 py-3 sm:px-5 sm:py-3.5" : "px-6 py-4"}`}>
          <div>
            <h3 className="text-lg font-bold font-serif-heading text-[#F2EFE6] tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-[#A8B5AB] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A8B5AB] hover:text-[#F2EFE6] hover:bg-[#1F3A2D] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className={`overflow-y-auto flex-1 text-sm text-[#F2EFE6] ${variant === "registration" ? "p-3 sm:p-5" : "p-6"}`}>{children}</div>
      </div>
    </div>
  );
};
