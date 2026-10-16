import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart as ChartIcon,
  Play,
  RotateCcw,
  Sliders,
  TrendingUp,
  Percent,
  ShieldCheck,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Shield,
  DollarSign,
  Gauge,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Maximize2,
  Clock,
  Timer,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  calculateXAUUSDPositionSize,
  calculateAtrBrackets,
  calculateExecutionFriction,
  calculateBacktestMetrics,
} from '../utils/algoCalculations.ts';
import { DEFAULT_PRESETS, StrategyPreset } from '../data/flagshipReport.ts';
import { D3AtrHeatmap } from './D3AtrHeatmap.tsx';

interface BacktestSimulatorViewProps {
  initialRiskPercent?: number;
  initialAtrSl?: number;
  initialAtrTp?: number;
  strategyTitle?: string;
}

interface SimulatedTrade {
  id: number;
  time: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  slPrice: number;
  tpPrice: number;
  exitPrice: number;
  outcome: 'TP' | 'SL';
  pnl: number;
  lots: number;
  pips: number;
}

export const BacktestSimulatorView: React.FC<BacktestSimulatorViewProps> = ({
  initialRiskPercent = 1.0,
  initialAtrSl = 1.5,
  initialAtrTp = 2.8,
  strategyTitle,
}) => {
  // Active Strategy selection
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(DEFAULT_PRESETS[0].id);

  // Simulation Parameters
  const [accountBalance, setAccountBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(initialRiskPercent);
  const [atrSlMultiplier, setAtrSlMultiplier] = useState(initialAtrSl);
  const [atrTpMultiplier, setAtrTpMultiplier] = useState(initialAtrTp);
  const [spreadPips, setSpreadPips] = useState(1.8);
  const [slippagePips, setSlippagePips] = useState(0.4);
  const [seed, setSeed] = useState(42);

  // Sync when strategy dropdown changes
  const handleStrategyChange = (stratId: string) => {
    setSelectedStrategyId(stratId);
    const found = DEFAULT_PRESETS.find((p) => p.id === stratId);
    if (found) {
      setRiskPercent(found.parameters.riskPercent);
      setAtrSlMultiplier(found.parameters.atrSlMultiplier);
      setAtrTpMultiplier(found.parameters.atrTpMultiplier);
      setSpreadPips(found.parameters.maxSpreadPips);
    }
  };

  const currentPreset = DEFAULT_PRESETS.find((p) => p.id === selectedStrategyId) || DEFAULT_PRESETS[0];

  // Generate deterministic simulated trade sequence based on parameters
  const { trades, equityCurve, metrics } = useMemo(() => {
    const tradeList: SimulatedTrade[] = [];
    const equity: number[] = [accountBalance];
    let currentEquity = accountBalance;

    // Deterministic pseudo-random sequence generator
    let rngState = seed;
    const nextRandom = () => {
      rngState = (rngState * 9301 + 49297) % 233280;
      return rngState / 233280;
    };

    let basePrice = 2640.0;
    const totalSimulatedTrades = 36;

    for (let i = 1; i <= totalSimulatedTrades; i++) {
      const isBuy = nextRandom() > 0.47;
      const type: 'BUY' | 'SELL' = isBuy ? 'BUY' : 'SELL';
      const atr = 1.5 + nextRandom() * 0.9; // ATR between $1.50 and $2.40

      basePrice += (nextRandom() - 0.47) * 4.2;
      const entryPrice = Math.round(basePrice * 100) / 100;

      const brackets = calculateAtrBrackets(entryPrice, atr, type, atrSlMultiplier, atrTpMultiplier);
      const lots = calculateXAUUSDPositionSize({
        accountBalance: currentEquity,
        riskPercent,
        stopLossPips: brackets.slPips,
      });

      // Natural win rate driven by Risk/Reward ratio and spread friction
      const naturalWinRate = 0.74 - (atrTpMultiplier / atrSlMultiplier) * 0.085 - (spreadPips * 0.025);
      const isWin = nextRandom() < naturalWinRate;

      const outcome: 'TP' | 'SL' = isWin ? 'TP' : 'SL';
      const exitPrice = isWin ? brackets.tpPrice : brackets.slPrice;
      const grossPips = isWin ? brackets.tpPips : -brackets.slPips;

      const friction = calculateExecutionFriction(Math.abs(grossPips), spreadPips, slippagePips, lots);
      const netPnl = isWin
        ? Math.round((grossPips * 10 * lots - friction.frictionCost) * 100) / 100
        : Math.round((-brackets.slPips * 10 * lots - friction.frictionCost) * 100) / 100;

      currentEquity += netPnl;
      equity.push(Math.round(currentEquity * 100) / 100);

      const hour = 13 + Math.floor(i / 8);
      const minute = (i * 7) % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

      tradeList.push({
        id: i,
        time: timeStr,
        type,
        entryPrice,
        slPrice: brackets.slPrice,
        tpPrice: brackets.tpPrice,
        exitPrice,
        outcome,
        pnl: netPnl,
        lots,
        pips: isWin ? brackets.tpPips : -brackets.slPips,
      });
    }

    const tradeReturns = tradeList.map((t) => t.pnl);
    const summaryMetrics = calculateBacktestMetrics(tradeReturns, accountBalance);

    return { trades: tradeList, equityCurve: equity, metrics: summaryMetrics };
  }, [accountBalance, riskPercent, atrSlMultiplier, atrTpMultiplier, spreadPips, slippagePips, seed]);

  const handleRerun = () => {
    setSeed((prev) => prev + 1);
  };

  const handleReset = () => {
    setAccountBalance(10000);
    setRiskPercent(currentPreset.parameters.riskPercent);
    setAtrSlMultiplier(currentPreset.parameters.atrSlMultiplier);
    setAtrTpMultiplier(currentPreset.parameters.atrTpMultiplier);
    setSpreadPips(currentPreset.parameters.maxSpreadPips);
    setSlippagePips(0.4);
    setSeed(42);
  };

  const [chartDisplayMode, setChartDisplayMode] = useState<'equity' | 'drawdown'>('equity');

  // Recharts interactive equity curve data formatting
  const rechartsData = useMemo(() => {
    let peak = accountBalance;
    const initialPoint = {
      index: 0,
      tradeNum: 0,
      name: 'Start',
      time: '00:00',
      equity: accountBalance,
      pnl: 0,
      type: 'BASE',
      lots: 0,
      pips: 0,
      outcome: 'START',
      drawdownPct: 0,
    };

    const points = [initialPoint];

    trades.forEach((t, idx) => {
      const eq = equityCurve[idx + 1] ?? accountBalance;
      if (eq > peak) peak = eq;
      const dd = peak > 0 ? Math.round(((peak - eq) / peak) * 1000) / 10 : 0;
      points.push({
        index: t.id,
        tradeNum: t.id,
        name: `T#${t.id}`,
        time: t.time,
        equity: Math.round(eq * 100) / 100,
        pnl: t.pnl,
        type: t.type,
        lots: t.lots,
        pips: t.pips,
        outcome: t.outcome,
        drawdownPct: -dd,
      });
    });

    return points;
  }, [trades, equityCurve, accountBalance]);

  // Quality badge for recovery factor
  const isHealthyRecovery = metrics.recoveryFactor >= 3.0;
  const isModerateRecovery = metrics.recoveryFactor >= 1.5 && metrics.recoveryFactor < 3.0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Simulator Banner with Strategy Selector */}
      <div className="bg-slate-900/80 rounded-2xl border border-emerald-500/30 p-6 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-Time Quantitative KPI Engine Active &bull; Zero Latency</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            XAU/USD Real-Time Performance & Metrics Dashboard
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Live evaluation of Win/Loss Ratio, Recovery Factor, and Profit-Per-Trade expectancy. Modify parameters or switch strategies to stress-test your high-frequency edge.
          </p>
        </div>

        {/* Strategy Switcher Dropdown & Seed buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10 shrink-0">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 block font-mono">Selected Strategy:</label>
            <select
              value={selectedStrategyId}
              onChange={(e) => handleStrategyChange(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl text-xs text-slate-100 font-medium outline-none cursor-pointer max-w-[260px]"
            >
              {DEFAULT_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pt-4 sm:pt-0">
            <button
              onClick={handleRerun}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              title="Resample tick sequences with random market conditions"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Re-Sample</span>
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Reset parameters to strategy defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CORE REQUESTED REAL-TIME METRICS DASHBOARD (Win/Loss Ratio, Recovery Factor, Profit Per Trade) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1: Win/Loss Ratio Card */}
        <div className="bg-gradient-to-br from-slate-900/90 via-[#0e1726] to-slate-900/80 border border-cyan-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Win / Loss Ratio</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/20">
              Payoff {metrics.payoffRatio}x
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-300">
              {metrics.winLossRatio.toFixed(2)} : 1
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({metrics.winRate}%)
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300 font-mono">
              <span className="text-slate-400">Winning Trades:</span>
              <span className="text-emerald-400 font-bold">{metrics.winningTrades} trades (Avg +${metrics.avgWinAmount})</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 font-mono">
              <span className="text-slate-400">Losing Trades:</span>
              <span className="text-red-400 font-bold">{metrics.losingTrades} trades (Avg -${metrics.avgLossAmount})</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Recovery Factor Card */}
        <div className="bg-gradient-to-br from-slate-900/90 via-[#0e1726] to-slate-900/80 border border-emerald-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Recovery Factor</span>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                isHealthyRecovery
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : isModerateRecovery
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-red-500/10 text-red-300 border-red-500/30'
              }`}
            >
              {isHealthyRecovery ? 'Robust Resilient (>3x)' : isModerateRecovery ? 'Moderate' : 'Fragile'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400">
              {metrics.recoveryFactor.toFixed(2)}x
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Net Profit / Max DD
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300 font-mono">
              <span className="text-slate-400">Total Net Profit:</span>
              <span className="text-emerald-400 font-bold">+${metrics.totalNetProfit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 font-mono">
              <span className="text-slate-400">Max Dollar Drawdown:</span>
              <span className="text-purple-400 font-bold">-${metrics.maxDrawdownCurrency} ({metrics.maxDrawdownPercent}%)</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Profit-Per-Trade (Expectancy) Card */}
        <div className="bg-gradient-to-br from-slate-900/90 via-[#0e1726] to-slate-900/80 border border-amber-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <span>Profit Per Trade</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
              Expectancy
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-3xl sm:text-4xl font-extrabold font-mono ${
                metrics.profitPerTrade >= 0 ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {metrics.profitPerTrade >= 0 ? `+$${metrics.profitPerTrade.toFixed(2)}` : `-$${Math.abs(metrics.profitPerTrade).toFixed(2)}`}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / trade
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300 font-mono">
              <span className="text-slate-400">Total Trades Evaluated:</span>
              <span className="text-slate-100 font-bold">{metrics.totalTrades} scalps</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 font-mono">
              <span className="text-slate-400">Cumulative Return:</span>
              <span className="text-emerald-400 font-bold">
                +{((metrics.totalNetProfit / accountBalance) * 100).toFixed(1)}% on Equity
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center font-mono text-xs">
          <span className="text-[10px] text-slate-400 block">Profit Factor</span>
          <span className="text-base font-bold text-emerald-400">{metrics.profitFactor}</span>
          <span className="text-[9px] text-slate-500 block">Gross Profit/Loss</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center font-mono text-xs">
          <span className="text-[10px] text-slate-400 block">Sharpe Ratio</span>
          <span className="text-base font-bold text-amber-400">{metrics.sharpeRatio}</span>
          <span className="text-[9px] text-slate-500 block">Annualized</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center font-mono text-xs">
          <span className="text-[10px] text-slate-400 block">Max Consec Wins</span>
          <span className="text-base font-bold text-cyan-400">{metrics.maxConsecutiveWins} in a row</span>
          <span className="text-[9px] text-slate-500 block">Peak Winning Streak</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center font-mono text-xs">
          <span className="text-[10px] text-slate-400 block">Max Consec Losses</span>
          <span className="text-base font-bold text-purple-400">{metrics.maxConsecutiveLosses} in a row</span>
          <span className="text-[9px] text-slate-500 block">Drawdown Sequence</span>
        </div>
      </div>

      {/* Main Two-Panel: Parameters vs Equity Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Parameter Sliders */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Interactive Risk & Friction Controls</span>
          </h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Account Balance:</span>
                <span className="font-mono font-bold text-slate-100">${accountBalance.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="100000"
                step="1000"
                value={accountBalance}
                onChange={(e) => setAccountBalance(parseFloat(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

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
                <span>Stop Loss (ATR Multiple):</span>
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
                <span>Take Profit (ATR Multiple):</span>
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
                <span>Broker Spread:</span>
                <span className="font-mono font-bold text-purple-400">{spreadPips} pips (${(spreadPips * 0.1).toFixed(2)})</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3.5"
                step="0.1"
                value={spreadPips}
                onChange={(e) => setSpreadPips(parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Execution Slippage:</span>
                <span className="font-mono font-bold text-slate-300">{slippagePips} pips</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.1"
                value={slippagePips}
                onChange={(e) => setSlippagePips(parseFloat(e.target.value))}
                className="w-full accent-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Right: Recharts Interactive Equity Curve Chart */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <ChartIcon className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  {chartDisplayMode === 'equity' ? 'Cumulative Equity Curve' : 'Drawdown Depth (%)'}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono border border-emerald-500/20">
                  Recharts Dynamic Stream
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle Mode */}
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                  <button
                    onClick={() => setChartDisplayMode('equity')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      chartDisplayMode === 'equity'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Equity ($)
                  </button>
                  <button
                    onClick={() => setChartDisplayMode('drawdown')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      chartDisplayMode === 'drawdown'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Drawdown (%)
                  </button>
                </div>

                <span className="text-xs font-mono text-emerald-400 font-bold hidden sm:inline">
                  Peak: ${Math.round(Math.max(...equityCurve)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Key Performance Metrics Summary Dashboard accompanying the Equity Curve Chart */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 p-3 bg-slate-950/90 rounded-xl border border-slate-800/90 shadow-md">
              {/* Metric 1: Profit Factor */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>Profit Factor</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                    {metrics.profitFactor}x
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {metrics.profitFactor >= 2.0 ? 'Elite' : metrics.profitFactor >= 1.4 ? 'Viable' : 'Sub-par'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono block">Gross Win/Loss</span>
              </div>

              {/* Metric 2: Sharpe Ratio */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  <Gauge className="w-3 h-3 text-amber-400" />
                  <span>Sharpe Ratio</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-bold font-mono text-amber-300">
                    {metrics.sharpeRatio}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Ann.</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono block">Risk-Adjusted Alpha</span>
              </div>

              {/* Metric 3: Win Rate */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  <Target className="w-3 h-3 text-cyan-400" />
                  <span>Win Rate</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-bold font-mono text-cyan-300">
                    {metrics.winRate}%
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">({metrics.winningTrades}W/{metrics.losingTrades}L)</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono block">Outcome Ratio</span>
              </div>

              {/* Metric 4: Average Trade Duration */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span>Avg Duration</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-bold font-mono text-purple-300">
                    {metrics.avgTradeDurationFormatted}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">hold</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono block">W: {metrics.avgWinDurationFormatted} &bull; L: {metrics.avgLossDurationFormatted}</span>
              </div>
            </div>

            {/* Recharts Chart Container */}
            <div className="w-full min-h-[250px] bg-slate-950/80 rounded-xl p-2 border border-slate-800">
              <ResponsiveContainer width="100%" height={240} minWidth={200}>
                <AreaChart data={rechartsData} margin={{ top: 10, right: 15, left: 15, bottom: 5 }}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val, i) => (i % 6 === 0 ? val : '')}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    orientation="right"
                    domain={chartDisplayMode === 'equity' ? ['auto', 'auto'] : [-15, 0]}
                    tickFormatter={(v) =>
                      chartDisplayMode === 'equity' ? `$${Math.round(v).toLocaleString()}` : `${v}%`
                    }
                  />
                  <ReferenceLine
                    y={chartDisplayMode === 'equity' ? accountBalance : 0}
                    stroke="#475569"
                    strokeDasharray="4 4"
                    label={
                      chartDisplayMode === 'equity'
                        ? { value: 'Baseline $10k', fill: '#64748b', fontSize: 10, position: 'insideTopLeft' }
                        : undefined
                    }
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0b0f19',
                      borderColor: chartDisplayMode === 'equity' ? '#10b981' : '#a855f7',
                      borderRadius: '0.75rem',
                      fontSize: '11px',
                      fontFamily: 'ui-monospace, monospace',
                      color: '#f8fafc',
                    }}
                    formatter={(value: any, name: any, item: any) => {
                      if (chartDisplayMode === 'equity') {
                        return [
                          `$${Number(value).toLocaleString()} (${item.payload.pnl >= 0 ? '+' : ''}$${item.payload.pnl} / ${item.payload.pips} pips)`,
                          'Account Equity',
                        ];
                      }
                      return [`${value}%`, 'Peak Drawdown'];
                    }}
                    labelFormatter={(_label, payload) => {
                      const data = payload?.[0]?.payload;
                      return data ? `${data.name} (${data.time}) - ${data.type} ${data.lots} lots [${data.outcome}]` : '';
                    }}
                  />
                  {chartDisplayMode === 'equity' ? (
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#equityGrad)"
                      activeDot={{ r: 6, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
                    />
                  ) : (
                    <Area
                      type="monotone"
                      dataKey="drawdownPct"
                      stroke="#a855f7"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#drawdownGrad)"
                      activeDot={{ r: 6, fill: '#c084fc', stroke: '#581c87', strokeWidth: 2 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 font-mono">
            <span>Trade #1 (Start: ${accountBalance.toLocaleString()})</span>
            <span>
              Final Equity:{' '}
              <span className="text-emerald-400 font-bold">
                ${Math.round(equityCurve[equityCurve.length - 1]).toLocaleString()}
              </span>{' '}
              ({(((equityCurve[equityCurve.length - 1] - accountBalance) / accountBalance) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* D3-based Heat-Map for Win/Loss outcome density vs ATR multiplier settings */}
      <D3AtrHeatmap
        currentSlMultiplier={atrSlMultiplier}
        currentTpMultiplier={atrTpMultiplier}
        spreadPips={spreadPips}
        onSelectAtrParams={(sl, tp) => {
          setAtrSlMultiplier(sl);
          setAtrTpMultiplier(tp);
        }}
      />

      {/* Simulated Trade Execution Log Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Execution Log (Simulated Live Trades)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Net Result: {metrics.winningTrades}W / {metrics.losingTrades}L &bull; Recovery Factor: {metrics.recoveryFactor.toFixed(2)}x
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Entry</th>
                <th className="py-2 px-3">Stop Loss</th>
                <th className="py-2 px-3">Take Profit</th>
                <th className="py-2 px-3">Lots</th>
                <th className="py-2 px-3">Pips</th>
                <th className="py-2 px-3 text-right">Net PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {trades.slice(0, 15).map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 text-slate-500">{t.id}</td>
                  <td className="py-2 px-3 text-slate-400">{t.time}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.type === 'BUY' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
                      }`}
                    >
                      {t.type === 'BUY' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {t.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-200">${t.entryPrice.toFixed(2)}</td>
                  <td className="py-2 px-3 text-slate-400">${t.slPrice.toFixed(2)}</td>
                  <td className="py-2 px-3 text-slate-400">${t.tpPrice.toFixed(2)}</td>
                  <td className="py-2 px-3 text-slate-300">{t.lots.toFixed(2)}</td>
                  <td className="py-2 px-3 text-slate-300">
                    {t.pips > 0 ? `+${t.pips.toFixed(1)}` : t.pips.toFixed(1)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {t.pnl >= 0 ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
