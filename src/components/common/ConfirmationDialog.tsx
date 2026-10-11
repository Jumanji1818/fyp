import React from 'react';
import { AlertTriangle, AlertOctagon } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  consequence: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  consequence,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#132A20] border border-[#1F3A2D]">
          {isDestructive ? (
            <AlertOctagon className="w-5 h-5 text-[#D9534F] shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-[#E0A93B] shrink-0 mt-0.5" />
          )}
          <div className="text-xs text-[#A8B5AB] leading-relaxed">
            <span className="font-semibold text-[#F2EFE6] block mb-1">Irreversible Consequence:</span>
            {consequence}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[10px] text-xs font-semibold border border-[#1F3A2D] bg-[#07130E] hover:bg-[#132A20] text-[#A8B5AB] hover:text-[#F2EFE6] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-[10px] text-xs font-semibold text-white transition-all shadow-md active:scale-95 ${
              isDestructive
                ? 'bg-[#D9534F] hover:bg-[#C0392B]'
                : 'bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 hover:brightness-110 text-[#F2EFE6]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
