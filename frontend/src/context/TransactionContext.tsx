import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type TransactionStatus = 'idle' | 'confirming' | 'executing' | 'success' | 'error';

interface TransactionStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

interface TransactionState {
  isOpen: boolean;
  status: TransactionStatus;
  title: string;
  steps: TransactionStep[];
  txHash?: string;
  error?: string;
}

interface TransactionContextType {
  state: TransactionState;
  startTransaction: (title: string, steps: TransactionStep[]) => void;
  updateStep: (id: string, status: TransactionStep['status']) => void;
  setTxHash: (hash: string) => void;
  setTransactionError: (error: string) => void;
  closeTransaction: () => void;
  setStatus: (status: TransactionStatus) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<TransactionState>({
    isOpen: false,
    status: 'idle',
    title: '',
    steps: [],
  });

  const startTransaction = useCallback((title: string, steps: TransactionStep[]) => {
    setState({
      isOpen: true,
      status: 'confirming',
      title,
      steps,
    });
  }, []);

  const updateStep = useCallback((id: string, status: TransactionStep['status']) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === id ? { ...s, status } : s),
      status: status === 'error' ? 'error' : (status === 'completed' && id === prev.steps[prev.steps.length-1].id ? 'success' : prev.status)
    }));
  }, []);

  const setStatus = useCallback((status: TransactionStatus) => {
    setState(prev => ({ ...prev, status }));
  }, []);

  const setTxHash = useCallback((hash: string) => {
    setState(prev => ({ ...prev, txHash: hash }));
  }, []);

  const setTransactionError = useCallback((error: string) => {
    setState(prev => ({ ...prev, status: 'error', error }));
  }, []);

  const closeTransaction = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
    // Reset state after animation
    setTimeout(() => {
      setState({
        isOpen: false,
        status: 'idle',
        title: '',
        steps: [],
      });
    }, 500);
  }, []);

  return (
    <TransactionContext.Provider value={{ state, startTransaction, updateStep, setTxHash, setTransactionError, closeTransaction, setStatus }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => {
  const context = useContext(TransactionContext);
  if (!context) throw new Error('useTransaction must be used within a TransactionProvider');
  return context;
};
