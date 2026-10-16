import React from 'react';
import { User } from 'firebase/auth';
import {
  FileText,
  Search,
  Code2,
  LineChart,
  MessageSquare,
  Zap,
  LogIn,
  LogOut,
  Shield,
  Activity,
  Server,
  Globe,
} from 'lucide-react';
import { ActiveTab } from '../types/index.ts';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenQuickCheck: () => void;
  authLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogin,
  onLogout,
  onOpenQuickCheck,
  authLoading,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-[#0d1322]/95 backdrop-blur-md border-b border-amber-500/20 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('flagship')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-[1px] shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-[#0b0f19] rounded-[7px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-wider text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-100">
                  AUREUS
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  XAU/USD
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
                HFT & Scalping Intelligence Studio
              </p>
            </div>
          </div>

          {/* Live Market Microstructure Pill */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400 font-mono">SPOT:</span>
              <span className="font-mono font-bold text-slate-100">$2,654.85</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="flex items-center gap-1 text-slate-400">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Spread:</span>
              <span className="font-mono text-amber-300 font-medium">1.8 pips ($0.18)</span>
            </div>
            <div className="h-3 w-px bg-slate-700" />
            <div className="text-[11px] text-emerald-400 font-mono">
              London/NY Overlap Active
            </div>
          </div>

          {/* Action buttons & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenQuickCheck}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
              title="Fast low-latency analysis using Gemini-3.1-Flash-Lite"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick Check</span>
            </button>

            {authLoading ? (
              <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-amber-500/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block text-left text-xs">
                  <p className="font-medium text-slate-200 truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-emerald-400">Firebase Synced</p>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Google Sign-In</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Row */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('flagship')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'flagship'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Flagship HFT Report</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">1.2M+ sources</span>
          </button>

          <button
            onClick={() => setActiveTab('research')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'research'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous AI Research</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">Argon High Thinking</span>
          </button>

          <button
            onClick={() => setActiveTab('mql5')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'mql5'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>MQL5 EA Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LineChart className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quant Backtest & Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('markets')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'markets'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Live Forex & Crypto</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono">12 Tickers</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span>Gemini Quant Chat</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('mt5')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'mt5'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>MT5 Accounts</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">Live Bridge</span>
          </button>
        </div>
      </div>
    </header>
  );
};
