import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Modal } from '../common/Modal';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Password Recovery"
    subtitle="Secure account recovery"
    maxWidth="max-w-md"
  >
    <div className="space-y-4 text-sm">
      <div className="flex items-start gap-3 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" />
        <div>
          <h3 className="font-semibold text-[#F2EFE6]">Email recovery is not configured yet</h3>
          <p className="mt-2 text-xs leading-relaxed text-[#A8B5AB]">
            Procura will not reset an account using security answers stored in this browser. To protect your account, contact your Organization Administrator to request a secure password reset.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-[10px] bg-[#075B46] px-4 py-2.5 text-sm font-semibold text-white"
      >
        Back to Sign In
      </button>
    </div>
  </Modal>
);
