import React from 'react';

export const LogoIcon = ({ size = 48, glow = true }) => (
  <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
    <defs>
      <linearGradient id="iconSilver" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
      
      <linearGradient id="iconBlue" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#93C5FD" />
        <stop offset="100%" stopColor="#3B82F6" />
      </linearGradient>

      {glow && (
        <filter id="iconNeon" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
          <feFlood floodColor="#3B82F6" floodOpacity="0.5" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      )}
    </defs>

    <g filter={glow ? "url(#iconNeon)" : ""}>
      <path 
        d="M 22 82 C 22 15, 78 15, 78 82 L 68 82 C 68 35, 32 35, 32 82 Z" 
        fill="url(#iconSilver)" 
      />
      <path 
        d="M 32 58 L 54 58 L 54 52 L 32 52 Z" 
        fill="url(#iconSilver)" 
      />
      <path 
        d="M 46 82 L 56 68 L 66 82 L 76 82 L 62 62 L 78 62 L 78 70 L 68 82 Z" 
        fill="url(#iconSilver)" 
        opacity="0.3"
      />
      <path 
        d="M 45 82 L 58 64 L 71 82 H 58 L 52 74 L 46 82 Z" 
        fill="url(#iconBlue)" 
      />
    </g>
  </svg>
);
