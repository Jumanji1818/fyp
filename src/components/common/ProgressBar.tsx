import React from 'react';
import { Check } from 'lucide-react';

export type LifecycleStage =
  | 'Request'
  | 'Dept Approval'
  | 'Procurement'
  | 'Bidding'
  | 'Evaluation'
  | 'Award'
  | 'Purchase Order'
  | 'Delivery'
  | 'Payment'
  | 'Completed';

const STAGES: LifecycleStage[] = [
  'Request',
  'Dept Approval',
  'Procurement',
  'Bidding',
  'Evaluation',
  'Award',
  'Purchase Order',
  'Delivery',
  'Payment',
  'Completed',
];

interface ProgressBarProps {
  currentStage: LifecycleStage;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStage, className = '' }) => {
  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <div className={`w-full overflow-x-auto py-3 px-2 bg-[#0D1F17] rounded-xl border border-[#1F3A2D] ${className}`}>
      <div className="flex items-center min-w-[760px] justify-between relative px-2">
        {/* Continuous connector line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#1F3A2D] -z-0" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-[#D4AF37] transition-all duration-500 -z-0"
          style={{
            width: `${(Math.max(0, currentIndex) / (STAGES.length - 1)) * 95}%`,
          }}
        />

        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={stage} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[#D4AF37] text-[#07130E] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                    : isCurrent
                    ? 'bg-gradient-to-br from-[#1F6F4A] to-[#0F3D2A] text-[#D4AF37] border-2 border-[#D4AF37] animate-pulse-gold scale-110'
                    : 'bg-[#132A20] text-[#A8B5AB]/60 border border-[#1F3A2D]'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] mt-1.5 font-medium tracking-tight text-center whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'text-[#D4AF37] font-bold'
                    : isCompleted
                    ? 'text-[#F2EFE6]'
                    : 'text-[#A8B5AB]/60'
                }`}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
