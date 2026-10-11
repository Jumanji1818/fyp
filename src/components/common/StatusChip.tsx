import React from 'react';

interface StatusChipProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, className = '', size = 'md' }) => {
  const normalized = status.toLowerCase();

  let colorClasses = 'bg-[#4F9DBF]/15 text-[#4F9DBF] border-[#4F9DBF]/30'; // default info

  if (
    normalized.includes('approved') ||
    normalized.includes('delivered') ||
    normalized.includes('paid') ||
    normalized.includes('awarded') ||
    normalized.includes('active') ||
    normalized.includes('passed') ||
    normalized.includes('closed') && !normalized.includes('cancelled')
  ) {
    colorClasses = 'bg-[#3FB67A]/15 text-[#3FB67A] border-[#3FB67A]/30';
  } else if (
    normalized.includes('pending') ||
    normalized.includes('submitted') ||
    normalized.includes('due') ||
    normalized.includes('evaluation') ||
    normalized.includes('returned') ||
    normalized.includes('partially') ||
    normalized.includes('waiting')
  ) {
    colorClasses = 'bg-[#E0A93B]/15 text-[#E0A93B] border-[#E0A93B]/30';
  } else if (
    normalized.includes('rejected') ||
    normalized.includes('overdue') ||
    normalized.includes('error') ||
    normalized.includes('disqualified') ||
    normalized.includes('cancelled') ||
    normalized.includes('suspended') ||
    normalized.includes('blacklisted')
  ) {
    colorClasses = 'bg-[#D9534F]/15 text-[#D9534F] border-[#D9534F]/30';
  } else if (normalized.includes('draft') || normalized.includes('inactive')) {
    colorClasses = 'bg-[#A8B5AB]/15 text-[#A8B5AB] border-[#A8B5AB]/30';
  } else if (normalized.includes('open')) {
    colorClasses = 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border transition-colors ${sizeClasses} ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {status}
    </span>
  );
};
