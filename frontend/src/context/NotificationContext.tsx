import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { ARC_TESTNET_CONFIG } from '../config/contracts';

export type NotificationType = 'success' | 'error' | 'loading' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  txHash?: string;
}

interface NotificationContextType {
  notify: (notification: Omit<Notification, 'id'>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const notify = useCallback((n: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { ...n, id }]);
    
    if (n.type !== 'loading') {
      setTimeout(() => dismiss(id), 6000);
    }
    
    return id;
  }, [dismiss]);

  return (
    <NotificationContext.Provider value={{ notify, dismiss, dismissAll }}>
      {children}
      
      {/* TOASTER OVERLAY */}
      <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
        {notifications.map((n) => (
          <div 
            key={n.id}
            className="pointer-events-auto animate-in slide-in-from-right-10 fade-in duration-300"
          >
            <div className={`relative overflow-hidden glass-frame backdrop-blur-xl border-l-4 p-4 shadow-2xl ${
              n.type === 'success' ? 'border-l-emerald-500 bg-emerald-500/10' :
              n.type === 'error' ? 'border-l-rose-500 bg-rose-500/10' :
              n.type === 'loading' ? 'border-l-blue-500 bg-blue-500/10' :
              'border-l-blue-400 bg-white/5'
            }`}>
              <div className="flex gap-3">
                <div className="shrink-0 mt-0.5">
                  {n.type === 'success' && <CheckCircle size={18} className="text-emerald-400" />}
                  {n.type === 'error' && <AlertCircle size={18} className="text-rose-400" />}
                  {n.type === 'loading' && <Loader2 size={18} className="text-blue-400 animate-spin" />}
                  {n.type === 'info' && <AlertCircle size={18} className="text-blue-400" />}
                </div>
                
                <div className="flex-1 flex flex-col gap-1">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{n.title}</h3>
                  {n.message && <p className="text-[10px] font-medium text-white/50 leading-relaxed">{n.message}</p>}
                  
                  {n.txHash && (
                    <a 
                      href={`${ARC_TESTNET_CONFIG.blockExplorerUrl}/tx/${n.txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[9px] font-black text-blue-400 hover:text-blue-300 transition-colors mt-1 uppercase tracking-tighter"
                    >
                      <span>View on Explorer</span>
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                <button 
                  onClick={() => dismiss(n.id)}
                  className="shrink-0 text-white/20 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              
              {/* PROGRESS BAR (Only for non-loading) */}
              {n.type !== 'loading' && (
                <div className="absolute bottom-0 left-0 h-[2px] bg-white/10 w-full overflow-hidden">
                  <div className={`h-full animate-toast-progress ${
                    n.type === 'success' ? 'bg-emerald-500' :
                    n.type === 'error' ? 'bg-rose-500' :
                    'bg-blue-400'
                  }`} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
