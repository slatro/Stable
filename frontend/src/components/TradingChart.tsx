import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, BarChart2, Activity, ShieldCheck, RefreshCw } from 'lucide-react';
import { usePrices } from '../context/PriceContext';

const CG = 'https://api.coingecko.com/api/v3';

// Configuration: id = coingecko coin id, vs = currency, invert = if true, price = 1 / fetched_price
const getCGId = (sym: string) => {
  const map: Record<string, string> = {
    'USDC': 'usd-coin', 'aUSDC': 'usd-coin',
    'EURC': 'euro-coin', 'aEURC': 'euro-coin',
    'TRYC': 'tether-try', 'aTRYC': 'tether-try',
    'GBPC': 'british-pound-sterling', 'aGBPC': 'british-pound-sterling',
    'JPYC': 'japanese-yen', 'aJPYC': 'japanese-yen',
    'astUSDC': 'usd-coin'
  };
  return map[sym] || 'usd-coin';
};

const getCGVs = (sym: string) => {
  const map: Record<string, string> = {
    'USDC': 'usd', 'aUSDC': 'usd',
    'EURC': 'eur', 'aEURC': 'eur',
    'TRYC': 'try', 'aTRYC': 'try',
    'GBPC': 'gbp', 'aGBPC': 'gbp',
    'JPYC': 'jpy', 'aJPYC': 'jpy'
  };
  return map[sym] || 'usd';
};

// Global cache to prevent redundant fetches and rate limits
const CHART_HISTORY_CACHE: Record<string, { ts: number, data: any }> = {};

export const TradingChart = ({ tokenIn, tokenOut }: { tokenIn: any; tokenOut: any }) => {
  const symIn  = tokenIn?.symbol  || 'aUSDC';
  const symOut = tokenOut?.symbol || 'aTRYC';

  const cfg = useMemo(() => ({
    id: getCGId(symIn),
    vs: getCGVs(symOut),
    label: `${symIn.replace(/^a/, '')} / ${symOut.replace(/^a/, '')}`
  }), [symIn, symOut]);

  const priceContext = usePrices();
  const prices = priceContext?.prices || {};
  const volume24h = priceContext?.volume24h || 0;
  const liveLiq = priceContext?.liquidity || 0;

  const [history, setHistory] = useState<{ price: number; ts: number }[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  const pricesAvailable = Object.keys(prices).length > 0;
  const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
      let mounted = true;
      
      const fetchHistory = async () => {
        const cacheKey = `${symIn}/${symOut}`;
        const cached = CHART_HISTORY_CACHE[cacheKey];
        if (cached && (Date.now() - cached.ts < 15 * 60 * 1000)) {
          if (mounted) { setHistory(cached.data); setLoading(false); }
          return;
        }

        if (!pricesAvailable) return;
        
        try {
          const sIn = symIn.replace(/^a/, '').replace('C', ''); // aEURC -> EUR
          const sOut = symOut.replace(/^a/, '').replace('C', ''); 
          const fixIn = sIn === 'USD' ? 'USDC' : sIn;
          const fixOut = sOut === 'USD' ? 'USDC' : sOut;

          const res = await fetch(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${fixIn}&tsym=${fixOut}&limit=48`);
          const json = await res.json();
          
          if (!mounted) return;

          if (json?.Data?.Data) {
            const pts = (json.Data.Data as any[]).map(d => ({
              ts: d.time * 1000,
              price: d.close
            }));
            
            setHistory(pts);
            CHART_HISTORY_CACHE[cacheKey] = { ts: Date.now(), data: pts };
            if (pts.length && !livePrice) setLivePrice(pts[pts.length - 1].price);
          } else {
            const pythPrice = (prices[symIn]?.price || 1) / (prices[symOut]?.price || 1);
            const pts = Array.from({ length: 48 }, (_, i) => ({
              ts: Date.now() - (48 - i) * 3600000,
              price: pythPrice
            }));
            setHistory(pts);
          }
          setLoading(false);
        } catch (err) {
          if (mounted) setLoading(false);
        }
      };

      fetchHistory();
      timerRef.current = setInterval(fetchHistory, 300000); 
      return () => { mounted = false; if (timerRef.current) clearInterval(timerRef.current); };
    }, [symIn, symOut, refreshKey, pricesAvailable]);

  const [now, setNow] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const utcOffset = useMemo(() => {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.abs(offset) / 60;
    return `UTC${offset <= 0 ? '+' : '-'}${hours}`;
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleTimeString('en-GB', { hour12: false })), 1000);
    return () => clearInterval(t);
  }, []);

  // Sync live price from global context (Pyth) - ESSENTIAL FOR ACCURACY
  useEffect(() => {
    const pIn = prices[symIn]?.price;
    const pOut = prices[symOut]?.price;
    if (pIn && pOut) {
      setLivePrice(pIn / pOut);
    }
  }, [prices, symIn, symOut]);
  // Use 24h change for overall chart color
  const changeVal = history.length > 1 ? ((livePrice || history[history.length - 1].price) - history[0].price) / history[0].price * 100 : 0;
  const isUp = changeVal >= 0;
  const lineColor = isUp ? '#34d399' : '#f87171';
  const glowColor = isUp ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)';
  const changeStr = `${changeVal >= 0 ? '+' : ''}${changeVal.toFixed(3)}%`;

  const W = 800, H = 380, PX_LEFT = 0, PX_RIGHT = 80, PY = 40;
  
  const step = 3 * 3600 * 1000;
  const nowTs = Date.now();
  const nextBoundary = Math.ceil(nowTs / step) * step;
  const gridStartTs = nextBoundary - (24 * 3600 * 1000);
  const gridEndTs = nextBoundary;

  const displayPrices = history.map(d => d.price);
  const maxP = Math.max(...(displayPrices.length ? displayPrices : [1])) * 1.0003;
  const minP = Math.min(...(displayPrices.length ? displayPrices : [1])) * 0.9997;
  const rangeP = Math.max(maxP - minP, maxP * 0.00001);

  const pts = history.map((d) => ({
    x: PX_LEFT + ((d.ts - gridStartTs) * (W - PX_LEFT - PX_RIGHT)) / (gridEndTs - gridStartTs),
    y: (H - PY) - ((d.price - minP) * (H - 2 * PY)) / rangeP,
  }));

  const pathD = pts.reduce((acc, p, i, arr) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = arr[i - 1];
    const cp = prev.x + (p.x - prev.x) * 0.5;
    return `${acc} C ${cp} ${prev.y}, ${cp} ${p.y}, ${p.x} ${p.y}`;
  }, '');
  const areaD = pts.length > 0 ? `${pathD} L ${pts[pts.length - 1].x} ${H - PY} L ${pts[0].x} ${H - PY} Z` : '';
  const last = pts[pts.length - 1];

  const fmt = (p: number | null) => {
    if (p === null) return '···';
    if (p < 0.01) return p.toFixed(8);
    return p.toFixed(6);
  };

  const timeLabels = useMemo(() => {
    const labels = [];
    const use12h = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12;
    for (let t = gridStartTs; t <= gridEndTs; t += step) {
      const d = new Date(t);
      const isMidnight = d.getHours() === 0;
      const label = isMidnight 
        ? d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
        : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: use12h });
      labels.push({
        x: PX_LEFT + ((t - gridStartTs) * (W - PX_LEFT - PX_RIGHT)) / (gridEndTs - gridStartTs),
        label
      });
    }
    return labels;
  }, [gridStartTs, gridEndTs]);


  return (
    <div className="flex flex-col gap-6 font-sans tracking-tight">
      <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[12px] overflow-hidden shadow-2xl flex flex-col h-[519px]">
        <div className="bg-white/[0.03] backdrop-blur-md border-b border-white/5 px-8 py-3.5 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${!loading && history.length > 0 ? 'bg-[#34d399] shadow-[0_0_8px_#34d399]' : 'bg-yellow-400 animate-pulse'}`} />
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">{cfg.label} · LIVE</span>
            </div>
            <button 
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={loading}
              className="p-1 hover:bg-white/5 rounded-md transition-all group"
            >
              <RefreshCw 
                size={12} 
                className={`text-white/20 group-hover:text-white transition-all ${loading ? 'animate-spin text-blue-400' : ''}`} 
              />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <h2 className={`text-2xl font-black tabular-nums tracking-tighter ${isUp ? 'text-white' : 'text-red-300'}`}>{fmt(livePrice)}</h2>
            {history.length > 1 && (
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-black ${isUp ? 'bg-[#34d39912] border-[#34d39926] text-[#34d399]' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <TrendingUp size={10} /> {changeStr}
              </div>
            )}
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className={`absolute inset-0 ${isUp ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.05),transparent_70%)]' : 'bg-[radial-gradient(circle_at_50%_0%,rgba(248,113,113,0.05),transparent_70%)]'}`} />
          <div className="absolute right-8 top-6 bottom-14 flex flex-col justify-between pointer-events-none items-end">
            {[maxP, maxP - rangeP*0.25, maxP - rangeP*0.5, maxP - rangeP*0.75, minP].map((v, i) => (
              <span key={i} className="text-[9px] font-bold text-white/30 tabular-nums">{fmt(v)}</span>
            ))}
          </div>

          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            {timeLabels.map((t, i) => (
              <line key={i} x1={t.x} x2={t.x} y1={0} y2={H-PY} stroke="white" strokeOpacity="0.04" strokeWidth="1" />
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
              <line key={i} x1={0} x2={W-PX_RIGHT} y1={PY + p*(H-2*PY)} y2={PY + p*(H-2*PY)} stroke="white" strokeOpacity="0.04" strokeWidth="1" />
            ))}
            {pts.length > 1 && (
              <>
                <path d={areaD} fill="url(#ag)" />
                <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${glowColor})` }} />
                {last && (
                  <>
                    <circle cx={last.x} cy={last.y} r="4" fill={lineColor} />
                    <circle cx={last.x} cy={last.y} r="4" fill={lineColor} opacity="0.2">
                      <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </>
                )}
              </>
            )}
            {timeLabels.map((t, i) => (
              <text 
                key={i} 
                x={t.x} 
                y={H - 12} 
                textAnchor={i === 0 ? "start" : i === timeLabels.length - 1 ? "end" : "middle"} 
                fill="rgba(255,255,255,0.25)" 
                fontSize="10" 
                fontFamily="monospace"
              >
                {t.label}
              </text>
            ))}
            {loading && (
              <text x={W/2} y={H/2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="13" fontFamily="monospace">LOADING MARKET DATA...</text>
            )}
          </svg>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-md border-t border-white/5 px-8 py-3.5 shrink-0 flex items-center justify-between">
          <div className="flex flex-col gap-0.5 opacity-30">
            <span className="text-[7px] font-black text-white uppercase tracking-[0.3em]">PRICING CORE</span>
            <span className="text-[10px] font-black text-[#34d399] uppercase italic tracking-[0.4em]">LIVE REALTIME FEED</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-white/40 tabular-nums font-mono tracking-widest uppercase">
              {now} {utcOffset}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between -mt-1.5 px-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Activity size={12} className="text-blue-400" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest">PRICE</span>
              {history.length > 1 && <span className={`text-[7px] font-black tabular-nums ${isUp ? 'text-[#34d399]/70' : 'text-red-400/70'}`}>{changeStr}</span>}
            </div>
            <div className="flex items-center">
              <span className={`text-xs font-black tabular-nums ${isUp ? 'text-[#34d399]' : 'text-red-400'}`}>{fmt(livePrice)}</span>
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
            <BarChart2 size={12} className="text-orange-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest">24H VOLUME</span>
            <span className="text-xs font-black text-white tabular-nums">
              ${volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <TrendingUp size={12} className="text-purple-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest">LIQUIDITY</span>
            <span className="text-xs font-black text-white tabular-nums">
              ${liveLiq.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck size={12} className="text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest">NETWORK</span>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-[#34d399]" />
              <span className="text-[8px] font-black text-[#34d399]">CONNECTED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
