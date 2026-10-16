import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateXAUUSDPositionSize,
  calculateAtrBrackets,
  calculateExecutionFriction,
  calculateBacktestMetrics,
} from './algoCalculations.ts';

test('calculateXAUUSDPositionSize: correctly computes lot size based on 100oz contract pip valuation', () => {
  // $10,000 account, 1% risk = $100 risk.
  // 20 pips stop loss on Gold. 1 pip = $10 per 1.0 standard lot.
  // Risk per lot = 20 * $10 = $200.
  // Expected lots = 100 / 200 = 0.50 lots.
  const lots = calculateXAUUSDPositionSize({
    accountBalance: 10000,
    riskPercent: 1.0,
    stopLossPips: 20,
  });
  assert.equal(lots, 0.5);
});

test('calculateXAUUSDPositionSize: respects minimum lot size threshold', () => {
  const lots = calculateXAUUSDPositionSize({
    accountBalance: 500,
    riskPercent: 0.1, // $0.50 risk
    stopLossPips: 100, // $1000 per lot
  });
  assert.equal(lots, 0.01);
});

test('calculateAtrBrackets: generates accurate SL, TP and Risk-Reward levels for BUY', () => {
  // Current Gold price 2650.00, ATR = 2.0 ($2.00)
  // SL multiplier 1.5 -> SL distance $3.00 (30 pips) -> SL = 2647.00
  // TP multiplier 3.0 -> TP distance $6.00 (60 pips) -> TP = 2656.00
  // R:R = 3.0 / 1.5 = 2.0
  const brackets = calculateAtrBrackets(2650.0, 2.0, 'BUY', 1.5, 3.0);
  assert.equal(brackets.slPrice, 2647.0);
  assert.equal(brackets.tpPrice, 2656.0);
  assert.equal(brackets.slPips, 30);
  assert.equal(brackets.tpPips, 60);
  assert.equal(brackets.riskRewardRatio, 2.0);
});

test('calculateAtrBrackets: generates accurate SL and TP for SELL', () => {
  const brackets = calculateAtrBrackets(2650.0, 1.0, 'SELL', 1.0, 2.0);
  assert.equal(brackets.slPrice, 2651.0);
  assert.equal(brackets.tpPrice, 2648.0);
  assert.equal(brackets.riskRewardRatio, 2.0);
});

test('calculateExecutionFriction: calculates spread and slippage drag on scalping', () => {
  // 10 pips gross profit on 1.0 standard lot = $100.
  // 1.5 pips spread + 0.5 pips slippage = 2.0 pips friction = $20.
  // Net profit = $80. Friction percentage = 20%.
  const friction = calculateExecutionFriction(10, 1.5, 0.5, 1.0);
  assert.equal(friction.grossProfit, 100);
  assert.equal(friction.frictionCost, 20);
  assert.equal(friction.netProfit, 80);
  assert.equal(friction.frictionPercent, 20);
});

test('calculateBacktestMetrics: evaluates win rate, profit factor, max drawdown, and expectancy', () => {
  const trades = [120, -50, 180, -60, 210, -50, 150]; // 5 wins, 2 losses
  // totalWin = 120 + 180 + 210 + 150 = 660
  // totalLoss = 50 + 60 + 50 = 160
  // profitFactor = 660 / 160 = 4.125 -> 4.13
  // totalNet = 500
  // winRate = 5/7 = 71.4%
  const summary = calculateBacktestMetrics(trades, 10000);
  assert.equal(summary.totalTrades, 7);
  assert.equal(summary.winningTrades, 4);
  assert.equal(summary.losingTrades, 3);
  assert.equal(summary.winRate, 57.1);
  assert.equal(summary.totalNetProfit, 500);
  assert.equal(summary.profitFactor, 4.13);
  assert.ok(summary.expectancy > 0);
  assert.ok(summary.maxDrawdownPercent >= 0);
});

test('calculateBacktestMetrics: evaluates win/loss ratio, recovery factor, and profit-per-trade', () => {
  // 2 wins of 100 and 150 (total 250, avg 125)
  // 2 losses of -50 and -50 (total 100, avg 50)
  // winLossRatio: 2/2 = 1.0
  // totalNetProfit: 150
  // maxDrawdownCurrency: 50
  // recoveryFactor: 150 / 50 = 3.0
  // profitPerTrade: 150 / 4 = 37.5
  const summary = calculateBacktestMetrics([100, -50, 150, -50], 10000);
  assert.equal(summary.winLossRatio, 1.0);
  assert.equal(summary.recoveryFactor, 3.0);
  assert.equal(summary.profitPerTrade, 37.5);
  assert.equal(summary.avgWinAmount, 125);
  assert.equal(summary.avgLossAmount, 50);
});
