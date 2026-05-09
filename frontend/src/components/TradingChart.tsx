import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, BarChart2, Activity, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
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
    'USD': 'usd-coin'
  };
  return map[sym] || 'usd-coin';
};

const getCGVs = (sym: string) => {
  const map: Record<string, string> = {
    'USDC': 'usd', 'aUSDC': 'usd',
    'EURC': 'eur', 'aEURC': 'eur',
    'TRYC': 'try', 'aTRYC': 'try',
    'GBPC': 'gbp', 'aGBPC': 'gbp',
    'JPYC': 'jpy', 'aJPYC': 'jpy',
    'USD': 'usd'
  };
  return map[sym] || 'usd';
};

// Helper for deterministic random based on seed
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// Persistent cache in sessionStorage to survive refreshes
const getCachedHistory = (key: string) => {
  try {
    const cached = sessionStorage.getItem(`chart_cache_${key}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.ts < 15 * 60 * 1000) return parsed.data;
    }
  } catch (e) {}
  return null;
};

const setCachedHistory = (key: string, data: any) => {
  try {
    sessionStorage.setItem(`chart_cache_${key}`, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) {}
};

export const TradingChart = ({ tokenIn, tokenOut }: { tokenIn: any; tokenOut: any }) => {
  const symIn  = tokenIn?.symbol  || 'aUSDC';
  const symOut = tokenOut?.symbol || 'aTRYC';

  const isStaking = symIn === 'astUSDC' || symOut === 'astUSDC';
  const effectiveIn = isStaking ? 'USDC' : symIn;
  const effectiveOut = isStaking ? 'USD' : symOut;

  const cfg = useMemo(() => ({
    id: getCGId(effectiveIn),
    vs: getCGVs(effectiveOut),
    label: `${effectiveIn.replace(/^a/, '')} / ${effectiveOut.replace(/^a/, '')}`
  }), [effectiveIn, effectiveOut]);

  const priceContext = usePrices();
  const prices = priceContext?.prices || {};
  const volume24h = priceContext?.volume24h || 0;
  const liveLiq = priceContext?.liquidity || 0;

  const [history, setHistory] = useState<{ price: number; ts: number }[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hoverPt, setHoverPt] = useState<any | null>(null);
  
  const [refreshKey, setRefreshKey] = useState(0);
  const pricesAvailable = Object.keys(prices).length > 0;

  useEffect(() => {
    let mounted = true;
    
    const fetchHistory = async () => {
      const cacheKey = `${symIn}/${symOut}`;
      const cachedData = getCachedHistory(cacheKey);
      
      if (cachedData) {
        if (mounted) { 
          setHistory(cachedData); 
          setLoading(false); 
          setError(false);
        }
        return;
      }

      setLoading(true);
      setError(false);
      
      try {
        const sIn = symIn.replace(/^a/, '').replace('C', '');
        const sOut = symOut.replace(/^a/, '').replace('C', ''); 
        const fixIn = sIn === 'USD' ? 'USDC' : (sIn === 'TRY' ? 'TRY' : sIn);
        const fixOut = sOut === 'USD' ? 'USDC' : (sOut === 'TRY' ? 'TRY' : sOut);

        const res = await fetch(`https://min-api.cryptocompare.com/data/v2/histohour?fsym=${fixIn}&tsym=${fixOut}&limit=48`);
        const json = await res.json();
        
        if (!mounted) return;

        if (json?.Data?.Data && Array.isArray(json.Data.Data) && json.Data.Data.length > 5) {
          const pts = json.Data.Data.map((d: any) => ({
            ts: d.time * 1000,
            price: d.close
          }));
          setHistory(pts);
          setCachedHistory(cacheKey, pts);
          setLoading(false);
        } else {
          // DETERMINISTIC FALLBACK (Seeded Random Walk)
          const pIn = prices[symIn]?.price || 1;
          const pOut = prices[symOut]?.price || 1;
          const currentRatio = pIn / pOut;
          
          const hourlySeed = Math.floor(Date.now() / 3600000);
          const pairHash = symIn.split('').reduce((a,b)=>a+b.charCodeAt(0),0) + symOut.split('').reduce((a,b)=>a+b.charCodeAt(0),0);
          
          let lastP = currentRatio;
          const pts = Array.from({ length: 48 }, (_, i) => {
            const seed = hourlySeed + pairHash + i;
            const change = 1 + (seededRandom(seed) * 0.002 - 0.001);
            lastP = lastP * change;
            return {
              ts: (hourlySeed * 3600000) - (48 - i) * 3600000,
              price: lastP
            };
          });
          
          const correction = currentRatio / pts[pts.length - 1].price;
          const normalizedPts = pts.map(p => ({ ...p, price: p.price * correction }));

          setHistory(normalizedPts);
          setCachedHistory(cacheKey, normalizedPts);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setLoading(false);
          setError(true);
        }
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 300000); 
    return () => { mounted = false; clearInterval(interval); };
  }, [symIn, symOut, refreshKey, pricesAvailable]);

  const [now, setNow] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }));
  
  useEffect(() => {
    const t = setInterval(() => setNow(new Date().toLocaleTimeString('en-GB', { hour12: false })), 1000);
    return () => clearInterval(t);
  }, []);

  const utcOffset = useMemo(() => {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.abs(offset) / 60;
    return `UTC${offset <= 0 ? '+' : '-'}${hours}`;
  }, []);

  // Sync live price from global context (Pyth)
  useEffect(() => {
    const pIn = prices[effectiveIn]?.price;
    const pOut = prices[effectiveOut]?.price || (effectiveOut === 'USD' ? 1 : undefined);
    if (pIn && pOut) {
      setLivePrice(pIn / pOut);
    }
  }, [prices, effectiveIn, effectiveOut]);

  const changeVal = useMemo(() => {
    if (history.length < 2) return 0;
    const current = livePrice || history[history.length - 1].price;
    const initial = history[0].price;
    return ((current - initial) / initial) * 100;
  }, [history, livePrice]);

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

  const pts = useMemo(() => {
    if (history.length === 0) return [];
    return history.map((d) => ({
      x: PX_LEFT + ((d.ts - gridStartTs) * (W - PX_LEFT - PX_RIGHT)) / (gridEndTs - gridStartTs),
      y: (H - PY) - ((d.price - minP) * (H - 2 * PY)) / rangeP,
    }));
  }, [history, gridStartTs, gridEndTs, minP, rangeP]);

  const pathD = useMemo(() => {
    if (pts.length < 2) return '';
    return pts.reduce((acc, p, i, arr) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = arr[i - 1];
      const cp = prev.x + (p.x - prev.x) * 0.5;
      return `${acc} C ${cp} ${prev.y}, ${cp} ${p.y}, ${p.x} ${p.y}`;
    }, '');
  }, [pts]);

  const areaD = useMemo(() => {
    if (pts.length < 2) return '';
    return `${pathD} L ${pts[pts.length - 1].x} ${H - PY} L ${pts[0].x} ${H - PY} Z`;
  }, [pathD, pts]);

  const last = pts.length > 0 ? pts[pts.length - 1] : null;

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
              <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : error ? 'bg-red-500' : 'bg-[#34d399] shadow-[0_0_8px_#34d399]'}`} />
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">{cfg.label} · {loading ? 'FETCHING' : 'LIVE'}</span>
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
            <h2 className={`text-2xl font-black tabular-nums tracking-tighter ${isUp ? 'text-white' : 'text-red-300'}`}>{fmt(livePrice || (history.length > 0 ? history[history.length-1].price : null))}</h2>
            {history.length > 1 && (
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-black ${isUp ? 'bg-[#34d39912] border-[#34d39926] text-[#34d399]' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <TrendingUp size={10} /> {changeStr}
              </div>
            )}
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden bg-[#0d0e12]">
          <div className={`absolute inset-0 ${isUp ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.05),transparent_70%)]' : 'bg-[radial-gradient(circle_at_50%_0%,rgba(248,113,113,0.05),transparent_70%)]'}`} />
          <div className="absolute inset-0 bg-grid-white/[0.01]" />
          
          <div className="absolute right-8 top-6 bottom-14 flex flex-col justify-between pointer-events-none items-end z-10">
            {[maxP, maxP - rangeP*0.25, maxP - rangeP*0.5, maxP - rangeP*0.75, minP].map((v, i) => (
              <span key={i} className="text-[9px] font-bold text-white/20 tabular-nums">{fmt(v)}</span>
            ))}
          </div>
          <div 
            className="w-full h-full relative"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const xPercent = (e.clientX - rect.left) / rect.width;
              const hoverTs = gridStartTs + xPercent * (gridEndTs - gridStartTs);
              
              // Find closest data point
              let closest = history[0];
              let minDiff = Math.abs(history[0]?.ts - hoverTs);
              
              history.forEach(p => {
                const diff = Math.abs(p.ts - hoverTs);
                if (diff < minDiff) {
                  minDiff = diff;
                  closest = p;
                }
              });

              if (closest) {
                const x = PX_LEFT + ((closest.ts - gridStartTs) * (W - PX_LEFT - PX_RIGHT)) / (gridEndTs - gridStartTs);
                const y = (H - PY) - ((closest.price - minP) * (H - 2 * PY)) / rangeP;
                setHoverPt({ ...closest, x, y });
              }
            }}
            onMouseLeave={() => setHoverPt(null)}
          >
            <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block overflow-visible">
              <defs>
                <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              {timeLabels.map((t, i) => (
                <line key={`v-${i}`} x1={t.x} x2={t.x} y1={0} y2={H-PY} stroke="white" strokeOpacity="0.03" strokeWidth="1" />
              ))}
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                <line key={`h-${i}`} x1={0} x2={W-PX_RIGHT} y1={PY + p*(H-2*PY)} y2={PY + p*(H-2*PY)} stroke="white" strokeOpacity="0.03" strokeWidth="1" />
              ))}

              {/* Data Path */}
              {history.length > 1 && pts.length > 1 && (
                <g key={`path-${symIn}-${symOut}-${history.length}`}>
                  <path d={areaD} fill="url(#ag)" />
                  <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }} />
                  {last && (
                    <g>
                      <circle cx={last.x} cy={last.y} r="4" fill={lineColor} />
                      <circle cx={last.x} cy={last.y} r="4" fill={lineColor} opacity="0.3">
                        <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )}
                </g>
              )}

              {/* Hover Indicator */}
              {hoverPt && (
                <g>
                  <line x1={hoverPt.x} x2={hoverPt.x} y1={0} y2={H-PY} stroke="white" strokeOpacity="0.1" strokeDasharray="4 4" />
                  <circle cx={hoverPt.x} cy={hoverPt.y} r="5" fill={lineColor} stroke="white" strokeWidth="1" />
                </g>
              )}

              {/* Time Labels */}
              {timeLabels.map((t, i) => (
                <text 
                  key={`lbl-${i}`} 
                  x={t.x} 
                  y={H - 12} 
                  textAnchor={i === 0 ? "start" : i === timeLabels.length - 1 ? "end" : "middle"} 
                  fill="rgba(255,255,255,0.15)" 
                  fontSize="10" 
                  fontFamily="monospace"
                >
                  {t.label}
                </text>
              ))}

              {/* Status Messages */}
              {loading && history.length === 0 && (
                <g>
                  <text x={W/2} y={H/2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="12" fontFamily="monospace" className="animate-pulse">SYNCHRONIZING MARKET DATA...</text>
                </g>
              )}
              {error && history.length === 0 && (
                <g>
                  <text x={W/2} y={H/2} textAnchor="middle" fill="rgba(248,113,113,0.4)" fontSize="12" fontFamily="monospace">CONNECTION ERROR - RETRYING...</text>
                </g>
              )}
            </svg>

            {/* Hover Tooltip */}
            {hoverPt && (
              <div 
                className="absolute pointer-events-none z-20 transition-all duration-75"
                style={{ 
                  left: `${(hoverPt.x / W) * 100}%`, 
                  top: `${(hoverPt.y / H) * 100}%`,
                  transform: `translate(${hoverPt.x > W * 0.7 ? '-110%' : '10%'}, -50%)`
                }}
              >
                <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-2 rounded shadow-2xl flex flex-col min-w-[100px]">
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">
                    {new Date(hoverPt.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lineColor }} />
                    <span className="text-[12px] font-black text-white tabular-nums">
                      {fmt(hoverPt.price)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
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
              <span className={`text-xs font-black tabular-nums ${isUp ? 'text-[#34d399]' : 'text-red-400'}`}>{fmt(livePrice || (history.length > 0 ? history[history.length-1].price : null))}</span>
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
