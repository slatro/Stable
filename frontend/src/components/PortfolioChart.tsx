import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { TrendingUp, Wallet, ArrowUpRight, Circle } from 'lucide-react';

interface PortfolioChartProps {
  totalValue: number;
  assets: {
    symbol: string;
    amount: string;
    value: number;
    color: string;
  }[];
}

export const PortfolioChart = ({ totalValue, assets }: PortfolioChartProps) => {
  // Generate smooth session-based mock data that trends towards the current value
  const chartData = useMemo(() => {
    const base = totalValue || 12000;
    return Array.from({ length: 20 }, (_, i) => {
      const noise = (Math.random() - 0.5) * (base * 0.02);
      const trend = (i / 20) * (base * 0.05);
      return parseFloat((base - (base * 0.1) + trend + noise).toFixed(2));
    }).concat([totalValue]);
  }, [totalValue]);

  const options: any = {
    chart: {
      type: 'area',
      height: 120,
      sparkline: { enabled: true },
      animations: { enabled: true, easing: 'easeinout', speed: 800 },
      toolbar: { show: false },
    },
    stroke: { curve: 'smooth', width: 2, colors: ['#60a5fa'] },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100],
        colorStops: [
          { offset: 0, color: '#3b82f6', opacity: 0.4 },
          { offset: 100, color: '#3b82f6', opacity: 0 }
        ]
      },
    },
    tooltip: {
      theme: 'dark',
      x: { show: false },
      y: { formatter: (val: number) => `$${val.toLocaleString()}` }
    },
    colors: ['#3b82f6'],
  };

  return (
    <div className="w-full premium-card p-0 overflow-hidden bg-gradient-to-br from-blue-500/[0.03] to-transparent border-blue-500/10 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
      <div className="p-6 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
            <TrendingUp size={20} className="text-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Portfolio Value</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white tracking-tighter tabular-nums">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex items-center text-emerald-400 gap-0.5">
                <ArrowUpRight size={12} strokeWidth={3} />
                <span className="text-[10px] font-black tabular-nums">2.4%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
           {assets.slice(0, 3).map(asset => (
             <div key={asset.symbol} className="flex flex-col items-end">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{asset.symbol}</span>
                <span className="text-[11px] font-black text-white tabular-nums">{asset.amount}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="h-28 mt-2">
        <Chart
          options={options}
          series={[{ name: 'Portfolio', data: chartData }]}
          type="area"
          height="100%"
          width="100%"
        />
      </div>

      <div className="px-6 py-4 flex items-center gap-6 overflow-x-auto no-scrollbar">
        {assets.map((asset) => (
          <div key={asset.symbol} className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-all cursor-default group">
            <Circle size={6} fill={asset.color} className="text-transparent" />
            <span className="text-[9px] font-black text-white/40 group-hover:text-white/80 transition-colors uppercase tracking-widest">{asset.symbol}</span>
            <span className="text-[10px] font-black text-white tabular-nums tracking-tighter">{asset.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
