import React from "react";
import { Header } from "./components/Header";
import { SwapCard } from "./components/SwapCard";
import { PoolCard } from "./components/PoolCard";
import { FaucetCard } from "./components/FaucetCard";
import { TransactionPanel } from "./components/TransactionPanel";
import { AlertCircle, ExternalLink, ArrowRight } from "lucide-react";

export default function App() {
  return (
    <div className="min-height-screen bg-[#0a0c14] text-white selection:bg-blue-500/30">
      <Header />

      <main className="pt-28 pb-20 px-6 max-w-7xl mx-auto space-y-12">
        {/* Warning Banner */}
        <section className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-start gap-4">
          <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
          <div className="text-sm space-y-1 text-yellow-500/80">
            <p className="font-bold text-yellow-500">Testnet only. Use a test wallet. Do not send real funds.</p>
            <p>mUSDC and mEURC are mock tokens created only for this demo. ArcFX is an experimental AMM demo and is not audited.</p>
          </div>
        </section>

        {/* Hero Section */}
        <section className="text-center py-10 space-y-6">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Stablecoin FX <br />
            <span className="text-blue-500">liquidity on Arc</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Experience high-performance, low-slippage stablecoin swapping for mock USDC and mock EURC on the Arc Testnet.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <button className="btn-primary flex items-center gap-2">
              Launch Swap <ArrowRight size={18} />
            </button>
            <a href="#" className="flex items-center gap-2 text-sm font-medium text-white/40 hover:text-white transition-colors">
              View Arc docs <ExternalLink size={16} />
            </a>
          </div>
        </section>

        {/* Main App Grid */}
        <section className="grid lg:grid-cols-2 gap-8 items-start">
          <SwapCard />
          <PoolCard />
        </section>

        {/* Lower Grid */}
        <section className="grid lg:grid-cols-2 gap-8 items-start">
          <FaucetCard />
          <TransactionPanel />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-sm font-semibold">Built for Arc Testnet</p>
            <p className="text-xs text-white/30">Not financial advice. No real funds.</p>
          </div>
          <div className="flex gap-8 text-sm text-white/40 font-medium">
            <a href="#" className="hover:text-white transition-colors">Arc Docs</a>
            <a href="#" className="hover:text-white transition-colors">Arcscan</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
