import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useNotifications } from './NotificationContext';

interface PointsContextType {
  localSwapCount: number;
  localPointsOffset: number;
  settlePoints: (points: number) => void;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const PointsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const [localSwapCount, setLocalSwapCount] = useState<number>(0);
  const [localPointsOffset, setLocalPointsOffset] = useState<number>(0);

  // Load points when address changes
  useEffect(() => {
    if (!address) return;
    
    // Load swap count
    const savedSwaps = localStorage.getItem(`arc_swap_count_${address}`);
    setLocalSwapCount(savedSwaps ? parseInt(savedSwaps) : 0);
    
    // Load points offset
    const savedOffset = localStorage.getItem(`arc_points_offset_${address}`);
    let val = savedOffset ? parseInt(savedOffset) : 0;
    
    // One-time compensation check
    if (!localStorage.getItem(`arc_bonus_v1_${address}`)) {
      localStorage.setItem(`arc_bonus_v1_${address}`, 'true');
      val += 27;
      localStorage.setItem(`arc_points_offset_${address}`, val.toString());
    }
    setLocalPointsOffset(val);
  }, [address]);

  const { notify } = useNotifications();
  const processedTxs = useRef<Set<string>>(new Set());

  // Global transaction listener
  useEffect(() => {
    const handleAction = (e: any) => {
      if (!address) return;
      const { state, type, txHash } = e.detail || {};
      
      // Award points on processing OR success to be fast
      // Accept multiple labels for swaps just in case
      const isSwap = ['Swap', 'Exchanged', 'Market Swap', 'Limit Order'].includes(type);
      const isLP = type === 'Add Liquidity';
      const isStake = ['Stake', 'Staked', 'Unstaked'].includes(type);

      if ((state === 'success' || state === 'processing') && (isSwap || isLP || isStake)) {
        const id = txHash || `temp-${Date.now()}`;
        if (processedTxs.current.has(id)) return;
        processedTxs.current.add(id);

        setLocalSwapCount(prev => {
          const next = prev + 1;
          localStorage.setItem(`arc_swap_count_${address}`, next.toString());
          
          let label = '+1 Arc Point Earned!';
          if (isLP) label = '+10 LP Points Earned!';
          if (isStake) label = '+5 Staking Points Earned!';
          
          notify('success', label, `${type} activity recorded.`);
          return next;
        });
      }
    };
    
    window.addEventListener('arc-transaction', handleAction);
    return () => window.removeEventListener('arc-transaction', handleAction);
  }, [address, notify]);

  const settlePoints = useCallback((points: number) => {
    if (!address) return;
    setLocalPointsOffset(prev => {
      const next = prev + points;
      localStorage.setItem(`arc_points_offset_${address}`, next.toString());
      return next;
    });
  }, [address]);

  return (
    <PointsContext.Provider value={{ localSwapCount, localPointsOffset, settlePoints }}>
      {children}
    </PointsContext.Provider>
  );
};

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (!context) throw new Error('usePoints must be used within a PointsProvider');
  return context;
};
