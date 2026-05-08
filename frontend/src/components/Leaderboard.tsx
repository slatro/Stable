import React, { useMemo } from 'react';
import { Trophy, Medal, Star, ChevronRight, User, Search, Target, Zap, ShieldCheck } from 'lucide-react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import POINTS_ABI from '../abis/ArcPoints.json';

interface LeaderboardEntry {
  address: string;
  points: number;
  rank: number;
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze';
  isUser?: boolean;
}

const TIER_COLORS = {
  Diamond: 'from-cyan-400 to-blue-500 shadow-blue-500/20',
  Gold: 'from-amber-300 to-amber-500 shadow-amber-500/20',
  Silver: 'from-slate-300 to-slate-400 shadow-slate-400/20',
  Bronze: 'from-orange-400 to-orange-600 shadow-orange-600/20'
};

const TIER_ICONS = {
  Diamond: ShieldCheck,
  Gold: Trophy,
  Silver: Medal,
  Bronze: Star
};

export const Leaderboard = () => {
  const { address } = useAccount();

  // Fetch leaderboard data from contract
  const { data: rawLeaderboard } = useReadContract({
    address: CONTRACT_ADDRESSES.ARC_POINTS as `0x${string}`,
    abi: POINTS_ABI.abi as any,
    functionName: 'getLeaderboard',
    query: { refetchInterval: 10000 }
  });

  const leaderboardData = useMemo(() => {
    if (!rawLeaderboard) return [];
    
    const [addresses, points] = rawLeaderboard as [string[], bigint[]];
    const entries = addresses.map((addr, i) => ({
      address: addr,
      points: Number(points[i])
    }));

    return entries
      .sort((a, b) => b.points - a.points)
      .map((user, index) => {
        const rank = index + 1;
        let tier: any = 'Bronze';
        if (user.points >= 5000) tier = 'Diamond';
        else if (user.points >= 1000) tier = 'Gold';
        else if (user.points >= 250) tier = 'Silver';
        
        return {
          ...user,
          rank,
          tier,
          isUser: address && user.address.toLowerCase() === address.toLowerCase()
        };
      });
  }, [address, rawLeaderboard]);

  const userRank = leaderboardData.find(u => u.isUser);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 animate-fade-in py-4 px-2">
      {/* TOP CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="premium-card p-5 flex flex-col gap-2 bg-gradient-to-br from-blue-500/10 to-transparent relative overflow-hidden group border border-blue-500/10 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[60px]" />
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                 <Trophy className="text-blue-400" size={16} />
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Your Rank</span>
           </div>
           <div className="flex flex-col">
              <span className="text-3xl font-black text-white tracking-tighter tabular-nums">
                {userRank ? `#${userRank.rank}` : 'N/A'}
              </span>
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">
                {leaderboardData.length > 0 ? `Top ${Math.round(((userRank?.rank || 100) / (leaderboardData.length)) * 100)}% of users` : 'No data yet'}
              </span>
           </div>
        </div>

        <div className="premium-card p-5 flex flex-col gap-2 bg-gradient-to-br from-purple-500/10 to-transparent relative overflow-hidden group border border-purple-500/10 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
           <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[60px]" />
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                 <Target className="text-purple-400" size={16} />
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Current Tier</span>
           </div>
           <div className="flex flex-col">
              <span className="text-3xl font-black text-white tracking-tighter tabular-nums uppercase">
                {userRank?.tier || 'Bronze'}
              </span>
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mt-0.5">
                {userRank?.tier === 'Diamond' ? 'Max Rank Achieved' : `Keep active to reach next tier`}
              </span>
           </div>
        </div>

        <div className="premium-card p-5 flex flex-col gap-2 bg-gradient-to-br from-emerald-500/10 to-transparent relative overflow-hidden group border border-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[60px]" />
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                 <Zap className="text-emerald-400" size={16} />
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Reward Rate</span>
           </div>
           <div className="flex flex-col">
              <span className="text-3xl font-black text-white tracking-tighter tabular-nums">
                {userRank?.tier === 'Diamond' ? '2.5x' : userRank?.tier === 'Gold' ? '1.8x' : userRank?.tier === 'Silver' ? '1.4x' : '1.0x'}
              </span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">Points Multiplier Active</span>
           </div>
        </div>
      </div>

      {/* LEADERBOARD TABLE */}
      <div className="premium-card overflow-hidden border border-white/5">
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
            <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Global Rankings</h3>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input 
              type="text" 
              placeholder="Search wallet..." 
              className="bg-black/20 border border-white/5 rounded-xl pl-9 pr-3 py-2 text-[10px] text-white placeholder:text-white/10 focus:outline-none focus:border-blue-500/30 w-48 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] border-b border-white/5">
                <th className="px-8 py-5">Rank</th>
                <th className="px-8 py-5">Wallet Address</th>
                <th className="px-8 py-5">Tier</th>
                <th className="px-8 py-5 text-right">Arc Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {leaderboardData.length > 0 ? leaderboardData.map((user) => {
                const TierIcon = (TIER_ICONS as any)[user.tier];
                return (
                  <tr key={user.address} className={`group transition-all duration-300 ${user.isUser ? 'bg-blue-500/[0.04]' : 'hover:bg-white/[0.02]'}`}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-black tabular-nums ${user.rank <= 3 ? 'text-white' : 'text-white/20'}`}>
                          {user.rank.toString().padStart(2, '0')}
                        </span>
                        {user.rank <= 3 && (
                          <div className={`w-1 h-4 rounded-full bg-gradient-to-b ${(TIER_COLORS as any)[user.tier]}`} />
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-500 ${user.isUser ? 'bg-blue-500/20 border-blue-500/40' : 'bg-white/5 border-white/5 group-hover:bg-white/10'}`}>
                          <User size={14} className={user.isUser ? 'text-blue-400' : 'text-white/20'} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-black tracking-widest uppercase ${user.isUser ? 'text-white' : 'text-white/60'}`}>
                            {user.isUser ? 'You (Current)' : `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                          </span>
                          {user.isUser && <span className="text-[8px] font-bold text-blue-400/60 uppercase tracking-tighter">Your Connected Wallet</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md bg-gradient-to-br ${(TIER_COLORS as any)[user.tier]} shadow-lg opacity-80`}>
                          <TierIcon size={12} className="text-white" />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          user.tier === 'Diamond' ? 'text-cyan-400' : 
                          user.tier === 'Gold' ? 'text-amber-400' : 
                          user.tier === 'Silver' ? 'text-slate-400' : 'text-orange-400'
                        }`}>
                          {user.tier}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-white tabular-nums">
                          {user.points.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                          <span className="text-[8px] font-bold text-white/10 uppercase tracking-tighter">Live Points</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-white/10 text-xs font-black uppercase tracking-widest">No rankings found on-chain yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
