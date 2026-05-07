import React from 'react';

interface LogoProps {
  size?: number;
  hideText?: boolean;
}

export const Logo = ({ size, hideText = false }: LogoProps) => (
  <div className="flex items-center gap-3 md:gap-4 group cursor-pointer shrink-0">
    <div 
      className="relative flex items-center justify-center shrink-0"
      style={{ 
        width: size ? `${size * 3}px` : undefined, 
        height: size ? `${size * 3}px` : undefined,
        maxWidth: !size ? '56px' : undefined,
        maxHeight: !size ? '56px' : undefined
      }}
    >
      <img 
        src="/logo.png" 
        alt="ArcFX Logo"
        className="w-full h-full object-contain"
      />
    </div>

    {!hideText && (
      <div className="flex items-baseline gap-1 pt-1 whitespace-nowrap">
        <span 
          className="text-xl md:text-2xl font-light tracking-[0.25em] uppercase font-sans leading-none"
          style={{
            background: 'linear-gradient(to bottom, #ffffff, #94a3b8, #64748b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          ARC
        </span>
        <span 
          className="text-xl md:text-2xl font-bold tracking-[0.15em] uppercase font-sans leading-none"
          style={{
            background: 'linear-gradient(to bottom, #93c5fd, #3b82f6, #1e40af)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          FX
        </span>
      </div>
    )}
  </div>
);
