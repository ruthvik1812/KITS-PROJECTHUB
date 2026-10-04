import React from 'react';

interface KitsLogoProps {
  variant?: 'full' | 'mark' | 'horizontal';
  theme?: 'default' | 'white';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
}

export const KitsLogo: React.FC<KitsLogoProps> = ({
  variant = 'full',
  theme = 'default',
  className = '',
  size = 'md',
  showBadge = false,
}) => {
  // Height sizing for the official emblem
  const sizeClasses = {
    sm: 'h-9 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-20 w-auto',
    xl: 'h-28 w-auto',
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;
  const isWhite = theme === 'white';

  if (variant === 'mark') {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        <img
          src="/kits-logo.png"
          alt="Kamala Institute of Technology & Science Seal"
          className={`${currentSizeClass} max-h-full object-contain shrink-0`}
          loading="eager"
        />
      </div>
    );
  }

  // Full / Horizontal Variant: Official emblem on left + typography on right
  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3.5 select-none ${className}`}>
      {/* Institutional Crest */}
      <img
        src="/kits-logo.png"
        alt="Kamala Institute of Technology & Science Seal"
        className={`${currentSizeClass} max-h-full object-contain shrink-0 drop-shadow-xs`}
        loading="eager"
      />

      {/* Brand Text Block */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span
            className={`font-heading font-black tracking-tight ${
              isWhite
                ? 'text-white'
                : 'bg-gradient-to-r from-[#00457C] via-[#0066B3] to-[#0095D9] bg-clip-text text-transparent'
            } ${
              size === 'sm'
                ? 'text-lg sm:text-xl'
                : size === 'lg'
                ? 'text-3xl sm:text-4xl'
                : size === 'xl'
                ? 'text-4xl sm:text-5xl'
                : 'text-2xl sm:text-3xl'
            }`}
          >
            KAMALA
          </span>

          {showBadge && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-[4px] bg-[#CA0765] text-white shadow-xs">
              ProjectHub
            </span>
          )}
        </div>

        <div
          className={`font-sans font-semibold tracking-tight truncate max-w-[135px] sm:max-w-none ${
            isWhite ? 'text-white/90' : 'text-[#00457C]'
          } ${
            size === 'sm'
              ? 'text-[9px] sm:text-[10px]'
              : size === 'lg'
              ? 'text-[13px] sm:text-[16px]'
              : size === 'xl'
              ? 'text-[15px] sm:text-[18px]'
              : 'text-[9.5px] sm:text-[12px]'
          }`}
        >
          Institute of Technology &amp; Science
        </div>
      </div>
    </div>
  );
};
