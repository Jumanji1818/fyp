import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Clock, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const StillThereModal: React.FC = () => {
  const { inactivityModalOpen, staySignedIn, logout } = useApp();
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (inactivityModalOpen) {
      setCountdown(60);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [inactivityModalOpen, logout]);

  if (!inactivityModalOpen) return null;

  return (
    <Modal
      isOpen={inactivityModalOpen}
      onClose={staySignedIn}
      title="Session Timeout Warning"
      subtitle="Security policy auto-lock"
      maxWidth="max-w-md"
    >
      <div className="py-4 text-center space-y-4 text-xs">
        <div className="w-16 h-16 rounded-full mx-auto bg-[#E0A93B]/20 border-2 border-[#E0A93B] flex items-center justify-center text-[#E0A93B] animate-pulse">
          <Clock className="w-8 h-8" />
        </div>

        <div>
          <h4 className="text-xl font-bold font-serif-heading text-[#F2EFE6]">Still there?</h4>
          <p className="text-[#A8B5AB] mt-1 max-w-xs mx-auto">
            You have been inactive. For your organization&apos;s security, you will be signed out in{' '}
            <strong className="text-[#E0A93B] text-sm">{countdown} seconds</strong>.
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-[10px] border border-[#1F3A2D] text-[#A8B5AB] hover:text-[#D9534F] hover:bg-[#132A20]"
          >
            Sign Out Now
          </button>
          <button
            onClick={staySignedIn}
            className="px-6 py-2.5 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold hover:brightness-110 shadow-lg"
          >
            Stay Signed In
          </button>
        </div>
      </div>
    </Modal>
  );
};
