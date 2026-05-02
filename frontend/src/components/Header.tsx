import React, { useState } from 'react';
import { Logo } from './Logo';

export const Header = () => {
  const [address, setAddress] = useState("");
  const mockConnect = () => setAddress("0x71C...3912");

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs font-medium text-blue-400">Arc Testnet</span>
          </div>
          <button 
            onClick={mockConnect}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
              address ? "bg-white/5 text-white border border-white/10" : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20"
            }`}
          >
            {address || "Connect Wallet"}
          </button>
        </div>
      </div>
    </header>
  );
};
