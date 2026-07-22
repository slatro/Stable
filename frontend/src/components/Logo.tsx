import React from 'react';

interface LogoProps {
  size?: number;
  hideText?: boolean;
  showSubtitle?: boolean;
}

export const Logo = ({ size, hideText = false, showSubtitle = false }: LogoProps) => (
  <div className="flex items-center gap-2.5 md:gap-3 group cursor-pointer shrink-0">
    <div 
      className="relative flex items-center justify-center shrink-0"
      style={{ 
        width: size ? `${size * 3}px` : '42px', 
        height: size ? `${size * 3}px` : '42px'
      }}
    >
      <img 
        src="/logo.png" 
        alt="Stablr Logo"
        className="w-full h-full object-contain animate-pulse"
      />
    </div>

    {!hideText && (
      <div className="flex flex-col justify-center whitespace-nowrap select-none">
        <span 
          className="text-lg md:text-xl font-black tracking-[0.25em] uppercase font-sans leading-none"
          style={{
            background: 'linear-gradient(to bottom, #ffffff, #94a3b8, #64748b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          STABLR
        </span>
        {showSubtitle && (
          <div className="flex flex-col w-full mt-1">
            <span 
              className="text-[7.5px] md:text-[8px] font-black text-blue-400 tracking-[0.25em] uppercase leading-none"
              style={{ textShadow: '0 0 6px rgba(96, 165, 250, 0.4)' }}
            >
              Live on Arc
            </span>
          </div>
        )}
      </div>
    )}
  </div>
);
