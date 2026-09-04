import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';

interface WatermarkBadgeProps {
  buyerEmail?: string;
  orderNumber?: string;
  className?: string;
  fullOverlay?: boolean;
}

export const WatermarkBadge: React.FC<WatermarkBadgeProps> = ({
  buyerEmail = 'student@college.edu',
  orderNumber = 'NB-SAMPLE-DEMO',
  className = '',
  fullOverlay = false,
}) => {
  if (fullOverlay) {
    return (
      <div 
        id="pdf-watermark-overlay" 
        className={`pointer-events-none select-none absolute inset-0 z-20 flex flex-col justify-between p-6 opacity-35 overflow-hidden ${className}`}
      >
        <div className="flex justify-between items-center text-[10px] font-mono font-semibold text-blue-900/60 uppercase tracking-wider">
          <span>NoteBridge Verified Academic Copy</span>
          <span>{orderNumber}</span>
        </div>

        {/* Diagonal Repeated Watermarks */}
        <div className="absolute inset-0 flex items-center justify-center -rotate-25">
          <div className="text-center space-y-1">
            <div className="text-xl md:text-2xl font-black tracking-widest text-slate-400/50 uppercase font-mono">
              LICENSED TO: {buyerEmail}
            </div>
            <div className="text-xs font-mono text-slate-400/40">
              ORDER #{orderNumber} • STRICTLY FOR PERSONAL EXAM PREPARATION
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono font-semibold text-blue-900/60 uppercase tracking-wider">
          <span>Watermarked for Anti-Piracy Protection</span>
          <span>Do Not Resell</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="watermark-pill-badge" 
      className={`inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-blue-800 text-xs font-medium ${className}`}
    >
      <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
      <span className="truncate">
        Anti-Leak Watermark: <strong className="font-mono">{buyerEmail}</strong>
      </span>
      <span className="hidden sm:inline text-blue-400">•</span>
      <span className="hidden sm:inline font-mono text-blue-700">#{orderNumber}</span>
    </div>
  );
};
