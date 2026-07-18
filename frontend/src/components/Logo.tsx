import React from 'react';

interface LogoProps {
  size?: number;
  hideText?: boolean;
}

export const Logo = ({ size, hideText = false }: LogoProps) => (
  <div className="flex items-center gap-2 md:gap-2.5 group cursor-pointer shrink-0">
    <div 
      className="relative flex items-center justify-center shrink-0"
      style={{ 
        width: size ? `${size * 6}px` : '72px', 
        height: size ? `${size * 6}px` : '72px'
      }}
    >
      <img 
        src="/logo.png" 
        alt="Stable Logo"
        className="w-full h-full object-contain"
      />
    </div>

    {!hideText && (
      <div className="flex items-baseline gap-1 pt-1 whitespace-nowrap">
        <span 
          className="text-xl md:text-2xl font-black tracking-[0.3em] uppercase font-sans leading-none"
          style={{
            background: 'linear-gradient(to bottom, #ffffff, #94a3b8, #64748b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          STABLE
        </span>
      </div>
    )}
  </div>
);
