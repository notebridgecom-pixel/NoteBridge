import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  inverted?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
  inverted = false,
}) => {
  const iconWidth = size === 'sm' ? 36 : size === 'lg' ? 56 : 46;
  const iconHeight = size === 'sm' ? 24 : size === 'lg' ? 38 : 30;
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl';
  const taglineSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-xs' : 'text-[10px]';

  return (
    <div id="notebridge-brand-logo" className={`flex items-center gap-3 select-none ${className}`}>
      {/* Open Book + Bridge Foundation Icon exactly matching official branding */}
      <svg
        width={iconWidth}
        height={iconHeight}
        viewBox="0 0 100 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Open Book Pages Outline */}
        <path
          d="M6 13C6 13 22 6 47 18V50C22 38 6 43 6 43V13Z"
          fill={inverted ? '#1E293B' : '#EFF6FF'}
          stroke={inverted ? '#60A5FA' : '#2563EB'}
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        <path
          d="M94 13C94 13 78 6 53 18V50C78 38 94 43 94 43V13Z"
          fill={inverted ? '#1E293B' : '#EFF6FF'}
          stroke={inverted ? '#60A5FA' : '#2563EB'}
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        
        {/* Bridge Support Pillars underneath */}
        <path
          d="M12 46V56"
          stroke={inverted ? '#60A5FA' : '#2563EB'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M20 44V60"
          stroke={inverted ? '#60A5FA' : '#2563EB'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M28 43V60"
          stroke={inverted ? '#60A5FA' : '#2563EB'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M36 44V56"
          stroke={inverted ? '#60A5FA' : '#2563EB'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        <path
          d="M64 44V56"
          stroke={inverted ? '#60A5FA' : '#2563EB'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M72 43V60"
          stroke={inverted ? '#60A5FA' : '#2563EB'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M80 44V60"
          stroke={inverted ? '#60A5FA' : '#2563EB'}
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M88 46V56"
          stroke={inverted ? '#60A5FA' : '#2563EB'}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      {/* Brand Text */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-black tracking-tight font-heading ${textSize} ${inverted ? 'text-white' : 'text-slate-900'}`}>
            Note
          </span>
          <span className={`font-black tracking-tight font-heading ${textSize} ${inverted ? 'text-blue-400' : 'text-blue-600'}`}>
            Bridge
          </span>
        </div>
        {showTagline && (
          <span className={`font-bold tracking-[0.16em] uppercase font-sans mt-0.5 ${taglineSize} ${inverted ? 'text-slate-400' : 'text-slate-500'}`}>
            STUDY SMART. EARN SMART.
          </span>
        )}
      </div>
    </div>
  );
};
