import React from 'react';

export const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path 
          d="M20 80 Q 50 10 80 80" 
          fill="none" 
          stroke="url(#logoGradient)" 
          strokeWidth="8" 
          strokeLinecap="round" 
        />
        <path 
          d="M35 60 Q 50 55 65 60" 
          fill="none" 
          stroke="white" 
          strokeWidth="6" 
          strokeLinecap="round" 
          opacity="0.8" 
        />
      </svg>
    </div>
    <span className="text-2xl font-bold tracking-tight text-white glow-text">
      Arc<span className="text-blue-500">FX</span>
    </span>
  </div>
);
