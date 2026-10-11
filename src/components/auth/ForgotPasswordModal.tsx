import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { KeyRound, Check, AlertCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const { users, addAuditLog } = useApp();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'verify' | 'new_password' | 'done'>('verify');
  const [matchedUser, setMatchedUser] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      setError('No account found with this email address.');
      return;
    }
    setMatchedUser(user);
    setStep('new_password');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (matchedUser?.securityAnswer && answer.toLowerCase().trim() !== matchedUser.securityAnswer.toLowerCase().trim()) {
      setError('Incorrect answer to security question.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    addAuditLog('Offline Password Reset', matchedUser.email, undefined, 'Password Updated', 'Reset via security question.');
    setStep('done');
  };

  const handleClose = () => {
    setStep('verify');
    setEmail('');
    setAnswer('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Password"
      subtitle="Offline secure reset via verified security question"
      maxWidth="max-w-md"
    >
      {step === 'verify' && (
        <form onSubmit={handleVerify} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-[#D9534F]/15 border border-[#D9534F]/40 text-[#D9534F]">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Registered Account Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@company.ng"
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-[10px] border border-[#1F3A2D] text-[#A8B5AB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold hover:brightness-110"
            >
              Verify Security Question
            </button>
          </div>
        </form>
      )}

      {step === 'new_password' && (
        <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-[#D9534F]/15 border border-[#D9534F]/40 text-[#D9534F]">
              {error}
            </div>
          )}

          <div className="p-3 rounded-xl bg-[#07130E] border border-[#1F3A2D]">
            <span className="text-[11px] font-bold text-[#D4AF37] block mb-1">Security Question:</span>
            <div className="text-[#F2EFE6]">{matchedUser?.securityQuestion || "What is your primary school's name?"}</div>
          </div>

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Your Answer</label>
            <input
              type="text"
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter answer provided at registration"
              className="w-full px-3.5 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-[10px] border border-[#1F3A2D] text-[#A8B5AB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold hover:brightness-110"
            >
              Update Password
            </button>
          </div>
        </form>
      )}

      {step === 'done' && (
        <div className="py-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full mx-auto bg-[#3FB67A]/20 border border-[#3FB67A] flex items-center justify-center text-[#3FB67A]">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <h4 className="font-bold text-sm text-[#F2EFE6]">Password Reset Successfully</h4>
          <p className="text-xs text-[#A8B5AB]">
            Your password has been securely updated. You can now sign in using your new credentials.
          </p>
          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-[10px] bg-[#1F6F4A] text-white font-semibold text-xs"
          >
            Back to Sign In
          </button>
        </div>
      )}
    </Modal>
  );
};
