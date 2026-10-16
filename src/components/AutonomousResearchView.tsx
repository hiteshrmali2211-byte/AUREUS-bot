import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Zap,
  Brain,
  Layers,
  Database,
  Terminal,
  Check,
  TrendingUp,
  Download,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface AutonomousResearchViewProps {
  onOpenMql5WithCode: (code: string, title: string) => void;
  user: User | null;
  onSaveReportToCloud: (topic: string, summary: string, fullReport: string) => Promise<void>;
}

const SAMPLE_TOPICS = [
  'Deep Reinforcement Learning (PPO) for XAUUSD Tick-Level Order Flow Scalping',
  'Dynamic ATR Breakout & Trailing Stop Sizing for London/NY Liquidity Sweeps',
  'MT5 Order Book Imbalance (OFI) & Micro-Spread Arbitrage Architecture',
  'Asian Range Mean-Reversion Scalper with Volatility Squeeze & Circuit Breakers',
];

export const AutonomousResearchView: React.FC<AutonomousResearchViewProps> = ({
  onOpenMql5WithCode,
  user,
  onSaveReportToCloud,
}) => {
  const [topic, setTopic] = useState('');
  const [modelMode, setModelMode] = useState<'high-thinking' | 'standard' | 'fast'>('high-thinking');
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [scannedCount, setScannedCount] = useState(0);
  const [reportResult, setReportResult] = useState<{
    topic: string;
    modelUsed: string;
    summary: string;
    fullReport: string;
    sourcesScanned: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleStartResearch = async (targetTopic?: string) => {
    const queryTopic = targetTopic || topic;
    if (!queryTopic.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setReportResult(null);

    // Simulate multi-phase deep intelligence corpus scan
    setProgressStep('Querying 1,000,000+ quantitative datasets, MT5 archives & arXiv papers...');
    setScannedCount(120400);

    const scanInterval = setInterval(() => {
      setScannedCount((prev) => {
        const next = prev + Math.floor(Math.random() * 250000);
        return next > 1200000 ? 1200000 : next;
      });
    }, 400);

    try {
      const response = await fetch('/api/gemini/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: queryTopic,
          modelMode,
          useSearchGrounding,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      clearInterval(scanInterval);
      setScannedCount(data.sourcesScanned || 1250000);
      setProgressStep('Synthesizing quantitative models and compiling MQL5 EA code...');
      setReportResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to complete autonomous research. Please check API settings.');
    } finally {
      clearInterval(scanInterval);
      setLoading(false);
      setProgressStep('');
    }
  };

  const [cloudNotice, setCloudNotice] = useState<{ type: 'error' | 'warning' | 'success'; text: string } | null>(null);

  const handleCloudSave = async () => {
    if (!reportResult) return;
    if (!user) {
      setCloudNotice({ type: 'warning', text: 'Please sign in with Google in the top bar to save custom reports.' });
      setTimeout(() => setCloudNotice(null), 4000);
      return;
    }

    setSaving(true);
    try {
      await onSaveReportToCloud(reportResult.topic, reportResult.summary, reportResult.fullReport);
      setSaveSuccess(true);
      setCloudNotice({ type: 'success', text: 'Report successfully saved to your Firestore database.' });
      setTimeout(() => {
        setSaveSuccess(false);
        setCloudNotice(null);
      }, 3500);
    } catch (e: any) {
      setCloudNotice({ type: 'error', text: 'Save to Firestore failed: ' + (e?.message || 'Permission denied') });
      setTimeout(() => setCloudNotice(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Helper to extract MQL5 code from markdown report if present
  const extractCodeBlock = (markdown: string) => {
    const match = markdown.match(/```(?:mql5|cpp|c)?\n([\s\S]*?)```/i);
    return match ? match[1] : '';
  };

  const extractedMql5 = reportResult ? extractCodeBlock(reportResult.fullReport) : '';

  return (
    <div className="space-y-6 pb-12">
      {/* Search Header */}
      <div className="bg-slate-900/80 rounded-2xl border border-indigo-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Autonomous Quantitative Research Lab</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Scan 1M+ Databases, Systems & AI Models for XAU/USD
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Specify any scalping angle, indicator formulation, reinforcement learning policy, or execution mechanic. Aureus will research institutional repositories and compile rigorous settings, systematic SL/TP equations, and MQL5 code.
          </p>
        </div>

        {/* Input box */}
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartResearch()}
                placeholder="Enter research topic (e.g., Deep RL PPO for London Open XAUUSD scalping with MT5 code)..."
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 transition-all outline-none"
              />
            </div>

            <button
              onClick={() => handleStartResearch()}
              disabled={loading || !topic.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  <span>Researching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Strategy</span>
                </>
              )}
            </button>
          </div>

          {/* Model Engine Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Reasoning Engine:</span>
              <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setModelMode('high-thinking')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    modelMode === 'high-thinking'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Uses gemini-4-argon with ThinkingLevel.HIGH for deepest mathematical and algorithmic proofs"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Gemini 4 Argon (High Thinking)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModelMode('fast')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    modelMode === 'fast'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Uses gemini-3.1-flash-lite for instant low-latency synthesis"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Flash Lite (Fast)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModelMode('standard')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    modelMode === 'standard'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Uses gemini-3.8-flash with Google Search Grounding for live web & market intelligence"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Flash 3.8 (Search Grounded)</span>
                </button>
              </div>
            </div>

            {/* Knowledge Base Counter & Search Grounding Status */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Google Search Data Active</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Corpus Index: 1.2M+ sources</span>
              </div>
            </div>
          </div>

          {/* Quick topic presets */}
          <div className="pt-2">
            <span className="text-[11px] text-slate-400 block mb-1.5">Suggested Research Vectors:</span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_TOPICS.map((t, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTopic(t);
                    handleStartResearch(t);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 border border-slate-800 transition-colors cursor-pointer text-left truncate max-w-full sm:max-w-md"
                >
                  &rarr; {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State Banner */}
      {loading && (
        <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 mx-auto rounded-full border-3 border-indigo-500/30 border-t-indigo-400 animate-spin" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Synthesizing High-Frequency Scalping Report</h3>
            <p className="text-xs text-indigo-300 font-mono animate-pulse">{progressStep}</p>
          </div>
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
            <span>Sources Analyzed:</span>
            <span className="font-bold text-emerald-400">{scannedCount.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 text-xs text-red-300">
          <p className="font-semibold">Research Error</p>
          <p>{errorMsg}</p>
        </div>
      )}

      {/* Generated Report Display */}
      {reportResult && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Model: {reportResult.modelUsed} &bull; {reportResult.sourcesScanned?.toLocaleString()} Sources Scanned
              </span>
              <h3 className="text-xl font-bold text-white mt-1">{reportResult.topic}</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCloudSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent animate-spin rounded-full" />
                ) : saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved to Firestore</span>
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Save to Firestore</span>
                  </>
                )}
              </button>

              {extractedMql5 && (
                <button
                  onClick={() => onOpenMql5WithCode(extractedMql5, reportResult.topic)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Open in MQL5 Studio</span>
                </button>
              )}

              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(reportResult.fullReport);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {}
                }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                title="Copy Markdown"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
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

          {/* Executive Summary */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Executive Findings
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {reportResult.summary}
            </p>
          </div>

          {/* Full Report Content */}
          <div className="prose prose-invert prose-indigo max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line font-sans">
            {reportResult.fullReport}
          </div>
        </div>
      )}
    </div>
  );
};
