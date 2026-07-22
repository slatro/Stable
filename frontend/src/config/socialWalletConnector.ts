import { createConnector } from 'wagmi';

export function socialWalletConnector() {
  let activeAddress = localStorage.getItem('stablr_social_address') || null;
  const activeChainId = 254; // Arc Testnet
  
  return createConnector((config) => ({
    id: 'stablr-social',
    name: 'Social Login',
    type: 'social',
    
    async connect({ chainId } = {}) {
      if (activeAddress) {
        return {
          accounts: [activeAddress as `0x${string}`],
          chainId: chainId || activeChainId,
        };
      }
      
      return new Promise((resolve, reject) => {
        const successHandler = (e: any) => {
          const { address } = e.detail;
          activeAddress = address;
          localStorage.setItem('stablr_social_address', address);
          window.removeEventListener('stablr-social-login-success', successHandler);
          window.removeEventListener('stablr-social-login-cancelled', cancelHandler);
          resolve({
            accounts: [address as `0x${string}`],
            chainId: chainId || activeChainId,
          });
        };

        const cancelHandler = () => {
          window.removeEventListener('stablr-social-login-success', successHandler);
          window.removeEventListener('stablr-social-login-cancelled', cancelHandler);
          reject(new Error('User cancelled social login'));
        };

        window.addEventListener('stablr-social-login-success', successHandler);
        window.addEventListener('stablr-social-login-cancelled', cancelHandler);
        
        // Dispatch event to open the React modal
        window.dispatchEvent(new CustomEvent('stablr-open-social-login'));
      });
    },
    
    async disconnect() {
      activeAddress = null;
      localStorage.removeItem('stablr_social_address');
      localStorage.removeItem('stablr_social_provider');
    },
    
    async getAccounts() {
      return activeAddress ? [activeAddress as `0x${string}`] : [];
    },
    
    async getChainId() {
      return activeChainId;
    },
    
    async getProvider() {
      return {};
    },
    
    async isAuthorized() {
      return !!activeAddress;
    },
    
    async sendTransaction(tx: any) {
      return new Promise((resolve, reject) => {
        const successHandler = (e: any) => {
          const { hash } = e.detail;
          window.removeEventListener('stablr-gasless-tx-success', successHandler);
          window.removeEventListener('stablr-gasless-tx-cancelled', cancelHandler);
          resolve(hash as `0x${string}`);
        };

        const cancelHandler = () => {
          window.removeEventListener('stablr-gasless-tx-success', successHandler);
          window.removeEventListener('stablr-gasless-tx-cancelled', cancelHandler);
          reject(new Error('User rejected gasless transaction'));
        };

        window.addEventListener('stablr-gasless-tx-success', successHandler);
        window.addEventListener('stablr-gasless-tx-cancelled', cancelHandler);
        
        window.dispatchEvent(new CustomEvent('stablr-open-gasless-tx', {
          detail: { tx }
        }));
      });
    },
    
    onAccountsChanged(accounts) {},
    onChainChanged(chainId) {},
    onDisconnect(error) {},
  }));
}
