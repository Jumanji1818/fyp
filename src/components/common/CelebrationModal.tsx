import React, { useEffect, useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  reference?: string;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  title = 'Procurement Lifecycle Completed',
  message = 'The purchase order has been fully delivered, verified, and settled with 100% payment.',
  reference,
}) => {
  const [particles, setParticles] = useState<Array<{ id: number; left: number; top: number; size: number; delay: number }>>([]);

  useEffect(() => {
    if (isOpen) {
      const generated = Array.from({ length: 32 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 6 + 3,
        delay: Math.random() * 0.8,
      }));
      setParticles(generated);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#07130E]/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#0D1F17] border-2 border-[#D4AF37]/60 rounded-[20px] shadow-[0_0_50px_rgba(212,175,55,0.25)] p-8 text-center overflow-hidden">
        {/* Confetti particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-[#D4AF37] pointer-events-none animate-ping opacity-60"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${1.5 + p.delay}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A8B5AB] hover:text-[#F2EFE6] p-1 rounded-lg hover:bg-[#132A20]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Gold Ring & Animated Check */}
        <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
          {/* Pulsing glow */}
          <div className="absolute inset-0 rounded-full bg-[#D4AF37]/20 blur-xl animate-pulse-gold" />

          {/* SVG Gold Ring */}
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="42"
              stroke="#1F3A2D"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="48"
              cy="48"
              r="42"
              stroke="#D4AF37"
              strokeWidth="5"
              fill="transparent"
              strokeDasharray="264"
              strokeDashoffset="0"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Inner gold checkmark */}
          <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] flex items-center justify-center shadow-inner border border-[#D4AF37]">
            <Check className="w-10 h-10 text-[#D4AF37] stroke-[3.5] animate-in zoom-in duration-500" />
          </div>
        </div>

        <h3 className="text-2xl font-bold font-serif-heading text-[#D4AF37] mb-2">{title}</h3>
        {reference && (
          <div className="inline-block px-3 py-1 rounded-full bg-[#132A20] border border-[#D4AF37]/30 text-xs font-mono text-[#E8CF7A] mb-3">
            {reference}
          </div>
        )}
        <p className="text-xs text-[#A8B5AB] leading-relaxed mb-6">{message}</p>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37] text-[#F2EFE6] font-semibold text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          Continue in Procura
        </button>
      </div>
    </div>
  );
};
