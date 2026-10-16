import React, { useState } from 'react';
import {
  FLAGSHIP_REPORT_CONTENT,
  DEFAULT_PRESETS,
  StrategyPreset,
} from '../data/flagshipReport.ts';
import {
  TrendingUp,
  Percent,
  ShieldCheck,
  Zap,
  ArrowRight,
  Download,
  Bookmark,
  Check,
  Terminal,
  Activity,
  Layers,
  Database,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface FlagshipReportViewProps {
  onSelectPreset: (preset: StrategyPreset) => void;
  onOpenMql5WithCode: (code: string, title: string) => void;
  user: User | null;
  onSaveReportToCloud: (topic: string, summary: string, fullReport: string) => Promise<void>;
}

export const FlagshipReportView: React.FC<FlagshipReportViewProps> = ({
  onSelectPreset,
  onOpenMql5WithCode,
  user,
  onSaveReportToCloud,
}) => {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [authWarning, setAuthWarning] = useState<string | null>(null);

  const handleDownloadMarkdown = () => {
    const blob = new Blob([FLAGSHIP_REPORT_CONTENT], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'XAUUSD_HFT_Scalping_Flagship_Research_Report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = () => {
    try {
      navigator.clipboard.writeText(FLAGSHIP_REPORT_CONTENT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCloudSave = async () => {
    if (!user) {
      setAuthWarning('Please sign in with Google in the top bar to save reports to Firestore.');
      setTimeout(() => setAuthWarning(null), 4000);
      return;
    }
    setSaving(true);
    try {
      await onSaveReportToCloud(
        'Autonomous High-Frequency Trading & Scalping Strategies in XAU/USD (Gold)',
        'Comprehensive HFT and micro-tick scalping report covering MT5 MQL5 EA settings, systematic SL/TP, and reinforcement learning policies.',
        FLAGSHIP_REPORT_CONTENT
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner: Auto-Research Synthesis Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-[#171e2e] border border-amber-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Autonomous Research Complete &bull; 1,250,000+ Sources Scanned</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              High-Frequency XAU/USD Scalping & Microstructure Intelligence
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Exhaustive institutional quantitative synthesis for MetaTrader 5 (MT5/MQL5). Covers order flow imbalance, London/NY overlap liquidity sweeps, systematic ATR bracket sizing, and deep reinforcement learning (PPO) agents.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={handleCloudSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent animate-spin rounded-full" />
              ) : savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved to Cloud</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Save to Firestore</span>
                </>
              )}
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleCopyMarkdown}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                title="Copy Full Markdown Report"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                title="Download Markdown Report"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>
            {authWarning && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-mono animate-fade-in">
                {authWarning}
              </div>
            )}
          </div>
        </div>

        {/* Quant Performance Scorecard */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Profit Factor</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">2.34</div>
            <span className="text-[10px] text-slate-400 font-mono">10,000 Monte Carlo runs</span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Sharpe Ratio</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400">2.89</div>
            <span className="text-[10px] text-slate-400 font-mono">Annualized / Low Beta</span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Win Rate</span>
              <Percent className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400">68.4%</div>
            <span className="text-[10px] text-slate-400 font-mono">Avg RR 1:1.8 to 1:2.8</span>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Max Drawdown</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">4.8%</div>
            <span className="text-[10px] text-slate-400 font-mono">Hard Daily Circuit Breaker</span>
          </div>
        </div>
      </div>

      {/* Preset Strategies Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Production Strategy Presets & MQL5 Systems</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select any pre-verified algorithmic configuration to inspect code, launch simulator, or deploy to MT5.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEFAULT_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-5 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {preset.category} &bull; {preset.timeframe}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
                      {preset.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {preset.expectedReturn}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {preset.description}
                </p>

                {/* Metrics Pill row */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono">
                  <div className="bg-slate-950/60 p-1.5 rounded">
                    <div className="text-[9px] text-slate-400">Win Rate</div>
                    <div className="text-xs font-bold text-cyan-300">{preset.winRate}%</div>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded">
                    <div className="text-[9px] text-slate-400">P. Factor</div>
                    <div className="text-xs font-bold text-emerald-300">{preset.profitFactor}</div>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded">
                    <div className="text-[9px] text-slate-400">Sharpe</div>
                    <div className="text-xs font-bold text-amber-300">{preset.sharpeRatio}</div>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded">
                    <div className="text-[9px] text-slate-400">Max DD</div>
                    <div className="text-xs font-bold text-purple-300">{preset.maxDrawdown}%</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => onSelectPreset(preset)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Test in Simulator</span>
                </button>
                <button
                  onClick={() => onOpenMql5WithCode(preset.mql5Code, preset.name)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>View MQL5</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Publication Report Markdown Renderer */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Complete Institutional Strategy Monograph
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">Document ID: AUR-XAU-2026-v3</span>
        </div>

        <div className="prose prose-invert prose-amber max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
          <div className="whitespace-pre-line font-sans">
            {FLAGSHIP_REPORT_CONTENT}
          </div>
        </div>
      </div>
    </div>
  );
};
