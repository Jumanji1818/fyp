import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed standalone app, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/60 text-[#F2EFE6] text-xs font-semibold shadow-lg hover:brightness-110 active:scale-95 transition-all animate-pulse-gold"
        title="Install Procura on your phone or computer"
      >
        <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#132A20] border border-[#1F3A2D] text-[#D4AF37] text-xs font-semibold hover:bg-[#1F6F4A]/30 transition-all"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[#0D1F17] border border-[#1F3A2D] p-6 shadow-2xl text-xs text-[#F2EFE6]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-base font-bold font-serif-heading text-[#F2EFE6]">
                    Install on iPhone / iPad
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-[#A8B5AB] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-[#A8B5AB] leading-relaxed">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#132A20]">
                  <span className="w-5 h-5 rounded-full bg-[#1F6F4A] text-[#F2EFE6] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                  <p>Tap the <strong>Share</strong> button <span className="text-[#D4AF37]">[⎙ / ⇮]</span> in the Safari browser toolbar.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#132A20]">
                  <span className="w-5 h-5 rounded-full bg-[#1F6F4A] text-[#F2EFE6] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                  <p>Scroll down and select <strong>Add to Home Screen</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[#132A20]">
                  <span className="w-5 h-5 rounded-full bg-[#1F6F4A] text-[#F2EFE6] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                  <p>Tap <strong>Add</strong> at top right to launch Procura as a standalone phone app.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-[#1F6F4A] text-white font-semibold hover:brightness-110 shadow"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Ambient install button when on desktop Chrome/Edge
  return (
    <button
      onClick={() => {
        // Provide friendly instruction if browser hasn't fired beforeinstallprompt yet
        if (window.matchMedia('(display-mode: browser)').matches) {
          install();
        }
      }}
      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#132A20] hover:bg-[#1F6F4A]/30 border border-[#1F3A2D] text-[#D4AF37] text-xs font-semibold transition-all"
      title="Install as native desktop or phone app"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Install App</span>
    </button>
  );
};
