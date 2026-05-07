import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoryPoint {
  time: string;
  value: number;
}

export const PortfolioHistory = ({ totalValue }: { totalValue: number }) => {
  const [timeframe, setTimeframe] = React.useState('1D');

  // Generate realistic historical data based on current totalValue and selected timeframe
  const data = useMemo(() => {
    const points: HistoryPoint[] = [];
    const now = new Date();
    
    const count = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : 30;
    const interval = timeframe === '1D' ? 'hour' : 'day';

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date();
      if (interval === 'hour') date.setHours(now.getHours() - i);
      else date.setDate(now.getDate() - i);
      
      let historicalValue;
      if (i === 0) {
        // EXACT match for current value
        historicalValue = totalValue;
      } else {
        // Realistic growth: slightly upward trend with small noise
        const baseGrowth = 1 - (i * (interval === 'hour' ? 0.001 : 0.01)); 
        const randomFactor = 0.998 + (Math.random() * 0.004); 
        historicalValue = totalValue * baseGrowth * randomFactor;
      }
      
      points.push({
        time: interval === 'hour' 
          ? `${date.getHours()}:00` 
          : date.toLocaleDateString(undefined, { weekday: 'short' }),
        value: historicalValue
      });
    }
    return points;
  }, [totalValue, timeframe]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end gap-2 px-2">
        {['1D', '1W', '1M', 'ALL'].map(t => (
          <button 
            key={t} 
            onClick={() => setTimeframe(t)}
            className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest transition-all ${timeframe === t ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-white/20 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>
      
      <div className="w-full h-[120px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 9, fontWeight: 'bold' }}
              interval={timeframe === '1D' ? 3 : 0}
              dy={10}
            />
            <YAxis 
              hide={true} 
              domain={['dataMin - 10', 'dataMax + 10']}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#0f172a] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{payload[0].payload.time}</p>
                      <p className="text-sm font-black text-white">${payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorVal)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
