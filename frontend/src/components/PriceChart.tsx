import React, { useMemo } from 'react';

interface PricePoint {
  time: number;
  value: number;
}

export const PriceChart = ({ symbol }: { symbol: string }) => {
  const data = useMemo(() => {
    const points: PricePoint[] = [];
    const now = Math.floor(Date.now() / 1000);
    let lastPrice = 1.0;
    
    // Low-noise price generation with slight upward trend
    for (let i = 0; i < 48; i++) {
      const noise = (Math.random() - 0.48) * 0.001; // Slight upward bias
      lastPrice = lastPrice * (1 + noise);
      points.push({
        time: now - (48 - i) * 3600,
        value: lastPrice
      });
    }
    return points;
  }, [symbol]);

  const min = Math.min(...data.map(d => d.value));
  const max = Math.max(...data.map(d => d.value));
  const range = max - min;
  const padding = range * 0.1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - (min - padding)) / (range + padding * 2)) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full h-full relative group">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path
          d={`M 0,100 L ${points} L 100,100 Z`}
          fill="url(#chartGradient)"
          className="transition-all duration-1000"
        />
        
        {/* Line */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          points={points}
          className="transition-all duration-1000"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Interactive hover line placeholder */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute top-0 bottom-0 w-px bg-white/10 left-1/2" />
      </div>
    </div>
  );
};
