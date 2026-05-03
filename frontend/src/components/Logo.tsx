import React from 'react';

export const Logo = () => (
  <div className="flex items-center gap-3 group cursor-pointer">
    {/* The Original Metallic Logo with Background Removal Effect */}
    <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
      <img 
        src="/assets/logo-raw.png" 
        alt="ArcFX Logo"
        className="w-full h-full object-contain mix-blend-screen brightness-110 contrast-110 transition-transform duration-500 group-hover:scale-110"
        style={{ 
          imageRendering: 'crisp-edges',
          filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.4))'
        }}
      />
    </div>

    {/* Perfectly Aligned Text */}
    <div className="flex items-baseline gap-1 pt-1">
      <span className="text-2xl font-light tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-300 to-slate-500 uppercase font-sans leading-none">
        ARC
      </span>
      <span className="text-2xl font-bold tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-b from-blue-300 via-blue-500 to-blue-800 uppercase font-sans leading-none">
        FX
      </span>
    </div>
  </div>
);
