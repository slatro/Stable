import { useAccount as useWagmiAccount, useWriteContract as useWagmiWriteContract, useDisconnect as useWagmiDisconnect } from 'wagmi';
import { useState, useEffect } from 'react';

export function useAccount() {
  const wagmiAcc = useWagmiAccount();
  const [socialAddress, setSocialAddress] = useState<string | null>(localStorage.getItem('stablr_social_address'));

  useEffect(() => {
    const handleUpdate = () => {
      setSocialAddress(localStorage.getItem('stablr_social_address'));
    };
    window.addEventListener('stablr-social-login-success', handleUpdate);
    window.addEventListener('stablr-social-logout', handleUpdate);
    return () => {
      window.removeEventListener('stablr-social-login-success', handleUpdate);
      window.removeEventListener('stablr-social-logout', handleUpdate);
    };
  }, []);

  if (socialAddress) {
    return {
      address: socialAddress as `0x${string}`,
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      status: 'connected' as const,
      connector: { id: 'stablr-social', name: 'Social Login' },
      isSocial: true
    };
  }

  return { ...wagmiAcc, isSocial: false };
}

export function useDisconnect() {
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect();

  const disconnect = () => {
    const isSocial = !!localStorage.getItem('stablr_social_address');
    if (isSocial) {
      localStorage.removeItem('stablr_social_address');
      localStorage.removeItem('stablr_social_provider');
      window.dispatchEvent(new CustomEvent('stablr-social-logout'));
    } else {
      wagmiDisconnect();
    }
  };

  return { disconnect };
}

export function useWriteContract() {
  const wagmiWrite = useWagmiWriteContract();
  const socialAddress = localStorage.getItem('stablr_social_address');

  if (socialAddress) {
    return {
      ...wagmiWrite,
      writeContract: (args: any, options: any = {}) => {
        const randHash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        
        window.dispatchEvent(new CustomEvent('stablr-open-gasless-tx', {
          detail: { tx: args }
        }));
        
        const successHandler = () => {
          window.removeEventListener('stablr-gasless-tx-success', successHandler);
          if (options.onSuccess) {
            options.onSuccess(randHash);
          }
        };
        window.addEventListener('stablr-gasless-tx-success', successHandler);
      }
    };
  }

  return wagmiWrite;
}
