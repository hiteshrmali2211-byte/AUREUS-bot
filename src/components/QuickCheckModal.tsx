import React, { useState } from 'react';
import { Zap, X, Clock, ArrowRight, Check } from 'lucide-react';

interface QuickCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_CHECKS = [
  'What is the maximum acceptable spread in pips for XAUUSD M1 scalping?',
  'Calculate lot size for $5,000 balance with 1% risk and 20 pips stop loss on Gold.',
  'What time does the London/New York session overlap start and end in GMT?',
  'What ATR multiplier is recommended for trailing stops in high-frequency scalping?',
];

export const QuickCheckModal: React.FC<QuickCheckModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleRunCheck = async (targetQuery?: string) => {
    const q = targetQuery || query;
    if (!q.trim() || loading) return;

    setLoading(true);
    setResponse('');
    setLatencyMs(null);

    const startTime = performance.now();
    try {
      const res = await fetch('/api/gemini/quick-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      const data = await res.json();
      const endTime = performance.now();
      setLatencyMs(Math.round(endTime - startTime));
      setResponse(data.result || 'No response returned.');
    } catch (e: any) {
      console.error(e);
      setResponse(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4 p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Low-Latency Tactical Verification</span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Gemini-3.1-Flash-Lite
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Sub-second quantitative rule and parameter checks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunCheck()}
              placeholder="Enter tactical query (e.g., maximum spread for London overlap)..."
              className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 outline-none"
            />
            <button
              onClick={() => handleRunCheck()}
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {loading ? 'Checking...' : 'Run Check'}
            </button>
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-mono">Instant Presets:</span>
            <div className="flex flex-col gap-1">
              {PRESET_CHECKS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(preset);
                    handleRunCheck(preset);
                  }}
                  className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800/80 transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <span className="truncate">{preset}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Response Box */}
        {loading && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs text-amber-300 font-mono">
            <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent animate-spin rounded-full" />
            <span>Streaming low-latency response from Gemini-3.1-Flash-Lite...</span>
          </div>
        )}

        {response && !loading && (
          <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="text-amber-300 font-bold uppercase tracking-wider">Tactical Analysis</span>
              {latencyMs !== null && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Clock className="w-3 h-3" />
                  <span>Latency: {latencyMs}ms</span>
                </span>
              )}
            </div>
            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
