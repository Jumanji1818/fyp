import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { settings } = useApp();
  const [phase, setPhase] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    // If animations are turned off, finish instantly
    if (settings.animationLevel === 'Off') {
      onComplete();
      return;
    }

    // Phase 1: 0.0s - 0.8s logo draw & fill
    const t1 = setTimeout(() => setPhase(1), 100);
    // Phase 2: 0.8s - 1.4s PROCURA wordmark
    const t2 = setTimeout(() => setPhase(2), 800);
    // Phase 3: 1.4s - 1.9s Tagline
    const t3 = setTimeout(() => setPhase(3), 1400);
    // Phase 4: 1.9s - 2.6s Progress line fills
    const t4 = setTimeout(() => setPhase(4), 1900);
    // Phase 5: 2.6s - 2.8s fade out & scale
    const t5 = setTimeout(() => setPhase(5), 2600);
    // Complete at 2.85s
    const t6 = setTimeout(() => onComplete(), 2850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
    };
  }, [onComplete, settings.animationLevel]);

  // Progress bar fill animation
  useEffect(() => {
    if (phase >= 4) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 15;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div
      onClick={onComplete}
      title="Click to enter"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0F3D2A] via-[#07130E] to-[#07130E] transition-all duration-300 overflow-hidden cursor-pointer ${
        phase >= 5 ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Radial gold glow in center */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-radial from-[#D4AF37]/15 via-[#1F6F4A]/10 to-transparent blur-3xl pointer-events-none" />

      {/* Floating gold dust particles drifting */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#D4AF37] opacity-40 animate-pulse"
            style={{
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              top: `${(i * 19) % 100}%`,
              left: `${(i * 27) % 100}%`,
              animationDuration: `${2 + (i % 3)}s`,
              animationDelay: `${(i * 0.2) % 2}s`,
            }}
          />
        ))}
      </div>

      {/* Center Brand Identity Container */}
      <div className="flex flex-col items-center text-center z-10">
        {/* Shield-P Logo */}
        <div
          className={`w-24 h-24 mb-6 relative transition-all duration-700 transform ${
            phase >= 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}
        >
          {/* Shield outline and gold check inside */}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E8CF7A" />
                <stop offset="50%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#997A15" />
              </linearGradient>
            </defs>

            {/* Shield Body */}
            <path
              d="M50 10 L82 22 C82 55 50 85 50 88 C50 85 18 55 18 22 Z"
              fill="url(#goldGradient)"
              fillOpacity={phase >= 1 ? '0.25' : '0'}
              stroke="url(#goldGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-700"
            />

            {/* Inner check inside shield bowl forming the stylized P */}
            <path
              d="M38 46 L46 54 L62 36"
              fill="none"
              stroke="url(#goldGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-all duration-500 delay-300 ${
                phase >= 1 ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </svg>
        </div>

        {/* PROCURA Wordmark (Fraunces, gold, letter spacing animating) */}
        <h1
          className={`text-4xl md:text-5xl font-black font-serif-heading text-transparent bg-clip-text bg-gradient-to-r from-[#E8CF7A] via-[#D4AF37] to-[#B8941F] tracking-wide transition-all duration-600 transform ${
            phase >= 2 ? 'opacity-100 translate-y-0 tracking-widest' : 'opacity-0 translate-y-4 tracking-[0.4em]'
          }`}
        >
          PROCURA
        </h1>

        {/* Tagline (Manrope, soft cream) */}
        <p
          className={`mt-3 text-sm md:text-base font-normal text-[#F2EFE6]/80 transition-all duration-500 font-sans ${
            phase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          Smart procurement, from request to payment.
        </p>
      </div>

      {/* Thin Gold Progress Line at Bottom */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 md:w-80 h-1 bg-[#132A20] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#B8941F] via-[#D4AF37] to-[#E8CF7A] transition-all duration-300 shadow-[0_0_8px_#D4AF37]"
          style={{ width: `${phase >= 4 ? progress : 0}%` }}
        />
      </div>

      {/* Skip button for user convenience */}
      <button
        onClick={onComplete}
        className="absolute bottom-3 right-4 text-[11px] text-[#A8B5AB]/60 hover:text-[#D4AF37] transition-colors"
      >
        Skip intro
      </button>
    </div>
  );
};
