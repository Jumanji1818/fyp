import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Hourglass, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { User } from '../../types';

interface StaffRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffRegisterModal: React.FC<StaffRegisterModalProps> = ({ isOpen, onClose }) => {
  const { departments, users, currentOrganization } = useApp();
  const orgDepts = departments.filter((d) =>
    d.organizationId ? d.organizationId === currentOrganization.id : currentOrganization.id === 'org-emerald'
  );
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deptId, setDeptId] = useState(orgDepts[0]?.id || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState("What was your primary school's name?");
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      setError('An account with this email address already exists.');
      return;
    }

    const newUser: User = {
      id: 'user-' + Date.now(),
      organizationId: currentOrganization.id,
      fullName,
      email,
      phone,
      role: 'Pending',
      departmentId: deptId || orgDepts[0]?.id,
      status: 'Pending',
      securityQuestion,
      securityAnswer,
      createdAt: new Date().toISOString(),
    };

    // Save into users in memory / AppContext
    users.push(newUser);
    setIsPending(true);
  };

  const handleReset = () => {
    setIsPending(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={isPending ? 'Approval Pending' : 'Staff Account Registration'}
      subtitle={
        isPending
          ? 'Your profile is awaiting Organization Admin verification'
          : 'Create your staff profile. An administrator will assign your system role.'
      }
      maxWidth="max-w-lg"
    >
      {isPending ? (
        <div className="py-8 text-center space-y-5 animate-in zoom-in-95">
          {/* Animated Gold Hourglass */}
          <div className="w-20 h-20 rounded-full mx-auto bg-[#132A20] border-2 border-[#D4AF37] flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.3)] animate-pulse-gold">
            <Hourglass className="w-10 h-10 text-[#D4AF37] animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          <div className="space-y-2">
            <h4 className="text-xl font-bold font-serif-heading text-[#D4AF37]">Waiting for Approval</h4>
            <p className="text-xs text-[#A8B5AB] max-w-sm mx-auto leading-relaxed">
              Your registration as <strong>{fullName}</strong> has been logged in the system as <strong>Pending</strong>.
              For compliance and strict separation of duties, staff cannot self-assign roles. The Organization Admin must authorize your requisition or approval permissions.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleReset}
              className="py-2.5 px-6 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] text-xs font-semibold hover:brightness-110 shadow-lg"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-[#D9534F]/15 border border-[#D9534F]/40 text-[#D9534F] text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Full Official Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Amina Bello"
              className="w-full px-3.5 py-2.5 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Work Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="a.bello@company.ng"
                className="w-full px-3 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
              />
            </div>
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="w-full px-3 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#A8B5AB] font-medium mb-1">Primary Department</label>
            <select
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full px-3 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
            >
              {orgDepts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
              />
            </div>
            <div>
              <label className="block text-[#A8B5AB] font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] bg-[#132A20] border border-[#1F3A2D] focus:border-[#D4AF37] text-[#F2EFE6] outline-none"
              />
            </div>
          </div>

          {/* Security Question for Offline Password Reset */}
          <div className="p-3 rounded-xl bg-[#07130E] border border-[#1F3A2D] space-y-2">
            <span className="text-[#D4AF37] font-semibold text-[11px] block">
              Offline Security Question (for password recovery)
            </span>
            <select
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] text-xs outline-none"
            >
              <option>What was your primary school&apos;s name?</option>
              <option>What city were you born in?</option>
              <option>What is your mother&apos;s maiden name?</option>
              <option>What was your first car model?</option>
            </select>
            <input
              type="text"
              required
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              placeholder="Your answer (case insensitive)"
              className="w-full px-3 py-1.5 rounded-lg bg-[#132A20] border border-[#1F3A2D] text-[#F2EFE6] text-xs outline-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] text-xs font-semibold border border-[#1F3A2D] text-[#A8B5AB] hover:text-[#F2EFE6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-[10px] bg-gradient-to-r from-[#1F6F4A] to-[#0F3D2A] border border-[#D4AF37]/50 text-[#F2EFE6] font-semibold text-xs hover:brightness-110 shadow-lg"
            >
              Submit for Approval
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
