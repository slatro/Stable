import React from 'react';

interface LogoProps {
  size?: number;
  hideText?: boolean;
  showSubtitle?: boolean;
}

export const Logo = ({ size, hideText = false, showSubtitle = false }: LogoProps) => (
  <div className="flex items-center gap-2 group cursor-pointer shrink-0 h-[56px] overflow-visible">
    <div 
      className="relative flex items-center justify-center shrink-0 overflow-visible"
      style={{ 
        width: size ? `${size * 8}px` : '96px', 
        height: size ? `${size * 8}px` : '96px',
        marginTop: '-12px',
        marginBottom: '-12px'
      }}
    >
      <img 
        src="/logo.png" 
        alt="Stablr Logo"
        className="w-full h-full object-contain animate-pulse"
      />
    </div>

    {!hideText && (
      <div className="flex flex-col items-center justify-center whitespace-nowrap select-none pt-0.5">
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
          <div className="flex flex-col items-center w-full mt-1.5">
            <span 
              className="text-[7.5px] md:text-[8px] font-black text-blue-400 tracking-[0.25em] uppercase leading-none pb-0.5"
              style={{ textShadow: '0 0 6px rgba(96, 165, 250, 0.4)' }}
            >
              Live on Arc
            </span>
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
          </div>
        )}
      </div>
    )}
  </div>
);
