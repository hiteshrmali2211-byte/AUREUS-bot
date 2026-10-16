import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  Settings2,
  Sliders,
  Database,
  ExternalLink,
  ShieldAlert,
  Play,
  RotateCcw,
} from 'lucide-react';
import { FLAGSHIP_MQL5_CODE } from '../data/flagshipReport.ts';
import { User } from 'firebase/auth';

interface Mql5StudioViewProps {
  currentCode: string;
  strategyTitle: string;
  onCodeChange: (newCode: string) => void;
  onSendToSimulator: (params: any) => void;
  user: User | null;
  onSaveStrategyToCloud: (title: string, category: string, timeframe: string, mql5Snippet: string) => Promise<void>;
}

export const Mql5StudioView: React.FC<Mql5StudioViewProps> = ({
  currentCode,
  strategyTitle,
  onCodeChange,
  onSendToSimulator,
  user,
  onSaveStrategyToCloud,
}) => {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick inputs
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [atrSlMultiplier, setAtrSlMultiplier] = useState(1.5);
  const [atrTpMultiplier, setAtrTpMultiplier] = useState(2.8);
  const [maxSpreadPips, setMaxSpreadPips] = useState(2.2);
  const [trailingStopPips, setTrailingStopPips] = useState(18.0);
  const [breakEvenPips, setBreakEvenPips] = useState(15.0);

  const activeCode = currentCode || FLAGSHIP_MQL5_CODE;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Aureus_XAUUSD_Scalp.mq5';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyParameters = () => {
    let updated = activeCode;
    updated = updated.replace(/InpRiskPercent\s*=\s*[\d.]+;/g, `InpRiskPercent       = ${riskPercent.toFixed(1)};`);
    updated = updated.replace(/InpATR_SL_Multiplier\s*=\s*[\d.]+;/g, `InpATR_SL_Multiplier = ${atrSlMultiplier.toFixed(1)};`);
    updated = updated.replace(/InpATR_TP_Multiplier\s*=\s*[\d.]+;/g, `InpATR_TP_Multiplier = ${atrTpMultiplier.toFixed(1)};`);
    updated = updated.replace(/InpMaxSpreadPips\s*=\s*[\d.]+;/g, `InpMaxSpreadPips     = ${maxSpreadPips.toFixed(1)};`);
    updated = updated.replace(/InpTrailingStopPips\s*=\s*[\d.]+;/g, `InpTrailingStopPips  = ${trailingStopPips.toFixed(1)};`);
    updated = updated.replace(/InpBreakEvenTrigger\s*=\s*[\d.]+;/g, `InpBreakEvenTrigger  = ${breakEvenPips.toFixed(1)};`);

    onCodeChange(updated);
  };

  const handleResetDefault = () => {
    onCodeChange(FLAGSHIP_MQL5_CODE);
    setRiskPercent(1.0);
    setAtrSlMultiplier(1.5);
    setAtrTpMultiplier(2.8);
    setMaxSpreadPips(2.2);
    setTrailingStopPips(18.0);
    setBreakEvenPips(15.0);
  };

  const [cloudNotice, setCloudNotice] = useState<{ type: 'error' | 'warning' | 'success'; text: string } | null>(null);

  const handleSaveToFirestore = async () => {
    if (!user) {
      setCloudNotice({ type: 'warning', text: 'Please sign in with Google in the top bar to save MQL5 strategies.' });
      setTimeout(() => setCloudNotice(null), 4000);
      return;
    }
    setSaving(true);
    try {
      await onSaveStrategyToCloud(
        strategyTitle || 'Aureus XAUUSD Scalp EA',
        'Scalping',
        'M1',
        activeCode
      );
      setSaveSuccess(true);
      setCloudNotice({ type: 'success', text: 'MQL5 Strategy successfully saved to Firestore.' });
      setTimeout(() => {
        setSaveSuccess(false);
        setCloudNotice(null);
      }, 3500);
    } catch (e: any) {
      setCloudNotice({ type: 'error', text: 'Failed to save to Firestore: ' + (e?.message || 'Permission denied') });
      setTimeout(() => setCloudNotice(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-cyan-500/30 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-mono mb-1">
            <Terminal className="w-3.5 h-3.5" />
            <span>MQL5 Source Code &bull; MT5 Build 4000+ Ready</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {strategyTitle || 'Aureus XAUUSD High-Frequency Scalper (MQL5 EA)'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Object-oriented CTrade architecture with dynamic ATR brackets, spread filters, and trailing stops.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSaveToFirestore}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-md shadow-amber-500/10"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent animate-spin rounded-full" />
            ) : saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved to Cloud</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>Save to Firestore</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .mq5</span>
          </button>
        </div>
      </div>

      {cloudNotice && (
        <div
          className={`p-3 rounded-xl border text-xs font-mono animate-fade-in ${
            cloudNotice.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : cloudNotice.type === 'warning'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : 'bg-red-950/40 border-red-500/40 text-red-300'
          }`}
        >
          {cloudNotice.text}
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Code Viewer */}
        <div className="lg:col-span-2 bg-[#080d1a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              <span className="text-xs font-mono text-slate-400 ml-2">Aureus_XAUUSD_Scalp.mq5</span>
            </div>
            <span className="text-[11px] font-mono text-cyan-400">Pure MQL5 Standard Library</span>
          </div>

          <div className="p-4 overflow-x-auto max-h-[640px] font-mono text-xs leading-relaxed text-slate-300">
            <pre>
              <code>{activeCode}</code>
            </pre>
          </div>
        </div>

        {/* Right: Interactive Parameter Tuner & MT5 Setup Guide */}
        <div className="space-y-6">
          {/* Parameter Tuner Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>EA Input Parameters</span>
              </h3>
              <button
                onClick={handleResetDefault}
                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Risk Per Trade:</span>
                  <span className="font-mono font-bold text-amber-400">{riskPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="3.0"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>SL ATR Multiplier:</span>
                  <span className="font-mono font-bold text-cyan-400">{atrSlMultiplier}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={atrSlMultiplier}
                  onChange={(e) => setAtrSlMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>TP ATR Multiplier:</span>
                  <span className="font-mono font-bold text-emerald-400">{atrTpMultiplier}x</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="5.0"
                  step="0.1"
                  value={atrTpMultiplier}
                  onChange={(e) => setAtrTpMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Max Spread Filter:</span>
                  <span className="font-mono font-bold text-purple-400">{maxSpreadPips} pips</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="4.0"
                  step="0.1"
                  value={maxSpreadPips}
                  onChange={(e) => setMaxSpreadPips(parseFloat(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Trailing Stop:</span>
                  <span className="font-mono font-bold text-slate-200">{trailingStopPips} pips</span>
                </div>
                <input
                  type="range"
                  min="8.0"
                  max="35.0"
                  step="1.0"
                  value={trailingStopPips}
                  onChange={(e) => setTrailingStopPips(parseFloat(e.target.value))}
                  className="w-full accent-slate-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Break-Even Lock:</span>
                  <span className="font-mono font-bold text-slate-200">{breakEvenPips} pips</span>
                </div>
                <input
                  type="range"
                  min="5.0"
                  max="30.0"
                  step="1.0"
                  value={breakEvenPips}
                  onChange={(e) => setBreakEvenPips(parseFloat(e.target.value))}
                  className="w-full accent-slate-400"
                />
              </div>

              <button
                onClick={handleApplyParameters}
                className="w-full py-2 rounded-xl font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Inject Parameters into Code</span>
              </button>

              <button
                onClick={() =>
                  onSendToSimulator({
                    riskPercent,
                    atrSlMultiplier,
                    atrTpMultiplier,
                    maxSpreadPips,
                    trailingStopPips,
                  })
                }
                className="w-full py-2 rounded-xl font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulate Parameters</span>
              </button>
            </div>
          </div>

          {/* MT5 Compilation Guide */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs text-slate-300 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>MT5 Deployment Checklist</span>
            </h3>
            <ol className="space-y-2 list-decimal list-inside text-slate-400">
              <li>
                In MetaTrader 5, press <kbd className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono">F4</kbd> to launch MetaEditor.
              </li>
              <li>
                Click <strong className="text-slate-200">New &rarr; Expert Advisor (template)</strong>, name it <code className="text-amber-300 font-mono">Aureus_XAUUSD_Scalp</code>.
              </li>
              <li>Replace all template contents with this code and press <kbd className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono">F7</kbd> to compile.</li>
              <li>Attach EA to <strong className="text-slate-200">XAUUSD M1</strong> chart.</li>
              <li>Enable <span className="text-emerald-400 font-medium">"Allow Algo Trading"</span> in MT5 toolbar.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
