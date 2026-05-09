import React, { useMemo, useState, useRef } from 'react';

interface PricePoint {
  time: number;
  value: number;
}

export const PriceChart = ({ symbol }: { symbol: string }) => {
  const [hoverData, setHoverData] = useState<{ x: number; y: number; value: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    const points: PricePoint[] = [];
    const now = Math.floor(Date.now() / 1000);
    let lastPrice = symbol === 'EURC' ? 0.84 : 1.0;
    
    for (let i = 0; i < 48; i++) {
      const noise = (Math.random() - 0.48) * 0.001;
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Find closest point
    const index = Math.min(
      data.length - 1,
      Math.max(0, Math.round((xPercent / 100) * (data.length - 1)))
    );
    
    const point = data[index];
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.value - (min - padding)) / (range + padding * 2)) * 100;
    
    setHoverData({ x, y, value: point.value });
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative group cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverData(null)}
    >
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <path
          d={`M 0,100 L ${points} L 100,100 Z`}
          fill="url(#chartGradient)"
          className="transition-all duration-1000"
        />
        
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          points={points}
          className="transition-all duration-1000"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {hoverData && (
          <g>
            <line 
              x1={hoverData.x} y1="0" x2={hoverData.x} y2="100" 
              stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" 
            />
            <circle 
              cx={hoverData.x} cy={hoverData.y} r="1.5" 
              fill="#3b82f6" stroke="white" strokeWidth="0.5"
              className="drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]"
            />
          </g>
        )}
      </svg>
      
      {hoverData && (
        <div 
          className="absolute pointer-events-none transition-all duration-75"
          style={{ 
            left: `${hoverData.x}%`, 
            top: `${hoverData.y}%`,
            transform: `translate(${hoverData.x > 80 ? '-110%' : '10%'}, -50%)`
          }}
        >
          <div className="bg-black/90 backdrop-blur-md border border-white/10 px-2 py-1 rounded flex flex-col gap-0.5 shadow-2xl">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none">Price</span>
            <span className="text-[11px] font-black text-blue-400 tabular-nums leading-none">
              {hoverData.value.toLocaleString(undefined, { minimumFractionDigits: 6 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
