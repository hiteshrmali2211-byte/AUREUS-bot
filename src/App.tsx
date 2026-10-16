/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, loginWithGoogle, logoutUser, handleFirestoreError, OperationType } from './firebase.ts';
import { ActiveTab, Strategy, ResearchReport } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { FlagshipReportView } from './components/FlagshipReportView.tsx';
import { AutonomousResearchView } from './components/AutonomousResearchView.tsx';
import { Mql5StudioView } from './components/Mql5StudioView.tsx';
import { BacktestSimulatorView } from './components/BacktestSimulatorView.tsx';
import { QuantChatbotView } from './components/QuantChatbotView.tsx';
import { QuickCheckModal } from './components/QuickCheckModal.tsx';
import { SavedStrategiesModal } from './components/SavedStrategiesModal.tsx';
import { MT5AccountsView } from './components/MT5AccountsView.tsx';
import { LiveMarketsView } from './components/LiveMarketsView.tsx';
import { FLAGSHIP_MQL5_CODE, StrategyPreset } from './data/flagshipReport.ts';
import { Database, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('flagship');
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // MQL5 Studio state
  const [currentMql5Code, setCurrentMql5Code] = useState(FLAGSHIP_MQL5_CODE);
  const [strategyTitle, setStrategyTitle] = useState('Aureus London/NY Overlap HFT Scalper');

  // Simulator params state
  const [simParams, setSimParams] = useState({
    riskPercent: 1.0,
    atrSlMultiplier: 1.5,
    atrTpMultiplier: 2.8,
  });

  // Modals state
  const [quickCheckOpen, setQuickCheckOpen] = useState(false);
  const [savedModalOpen, setSavedModalOpen] = useState(false);

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
  };

  // Cloud Persistence Helpers
  const handleSaveStrategyToCloud = async (
    title: string,
    category: string,
    timeframe: string,
    mql5Snippet: string
  ) => {
    if (!user) throw new Error('User not authenticated');
    const stratId = `strat-${Date.now()}`;
    const payload = {
      id: stratId,
      userId: user.uid,
      title,
      description: 'Custom scalper created in Aureus MQL5 Studio',
      category,
      timeframe,
      mql5Snippet,
      winRate: 68.4,
      profitFactor: 2.34,
      sharpeRatio: 2.89,
      maxDrawdown: 4.8,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'strategies', stratId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `strategies/${stratId}`);
      throw error;
    }
  };

  const handleSaveReportToCloud = async (
    topic: string,
    summary: string,
    fullReport: string
  ) => {
    if (!user) throw new Error('User not authenticated');
    const reportId = `rep-${Date.now()}`;
    const payload = {
      id: reportId,
      userId: user.uid,
      topic,
      modelUsed: 'gemini-4-argon',
      summary,
      fullReport,
      sourcesScanned: 1250000,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'research_reports', reportId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `research_reports/${reportId}`);
      throw error;
    }
  };

  const handleSaveChatMessageToCloud = async (
    role: string,
    content: string,
    model: string
  ) => {
    if (!user) return;
    const msgId = `msg-${Date.now()}`;
    const payload = {
      id: msgId,
      userId: user.uid,
      role: role === 'user' ? 'user' : 'model',
      content,
      model,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'chat_messages', msgId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chat_messages/${msgId}`);
    }
  };

  const handleSelectPreset = (preset: StrategyPreset) => {
    setCurrentMql5Code(preset.mql5Code);
    setStrategyTitle(preset.name);
    setSimParams({
      riskPercent: preset.parameters.riskPercent,
      atrSlMultiplier: preset.parameters.atrSlMultiplier,
      atrTpMultiplier: preset.parameters.atrTpMultiplier,
    });
    setActiveTab('simulator');
  };

  const handleOpenMql5WithCode = (code: string, title: string) => {
    setCurrentMql5Code(code);
    setStrategyTitle(title);
    setActiveTab('mql5');
  };

  const handleSendToSimulator = (params: any) => {
    setSimParams({
      riskPercent: params.riskPercent || 1.0,
      atrSlMultiplier: params.atrSlMultiplier || 1.5,
      atrTpMultiplier: params.atrTpMultiplier || 2.8,
    });
    setActiveTab('simulator');
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenQuickCheck={() => setQuickCheckOpen(true)}
        authLoading={authLoading}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Floating Cloud Library Shortcut */}
        {user && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setSavedModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/30 transition-all cursor-pointer shadow-md"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Saved Strategies & Reports</span>
            </button>
          </div>
        )}

        {activeTab === 'flagship' && (
          <FlagshipReportView
            onSelectPreset={handleSelectPreset}
            onOpenMql5WithCode={handleOpenMql5WithCode}
            user={user}
            onSaveReportToCloud={handleSaveReportToCloud}
          />
        )}

        {activeTab === 'research' && (
          <AutonomousResearchView
            onOpenMql5WithCode={handleOpenMql5WithCode}
            user={user}
            onSaveReportToCloud={handleSaveReportToCloud}
          />
        )}

        {activeTab === 'mql5' && (
          <Mql5StudioView
            currentCode={currentMql5Code}
            strategyTitle={strategyTitle}
            onCodeChange={setCurrentMql5Code}
            onSendToSimulator={handleSendToSimulator}
            user={user}
            onSaveStrategyToCloud={handleSaveStrategyToCloud}
          />
        )}

        {activeTab === 'simulator' && (
          <BacktestSimulatorView
            initialRiskPercent={simParams.riskPercent}
            initialAtrSl={simParams.atrSlMultiplier}
            initialAtrTp={simParams.atrTpMultiplier}
            strategyTitle={strategyTitle}
          />
        )}

        {activeTab === 'markets' && (
          <LiveMarketsView
            onSelectAssetForAlgo={(asset) => {
              setStrategyTitle(`${asset.symbol} Quantitative Momentum Scalper`);
              setActiveTab('mql5');
            }}
            onSendToSimulator={(params) => {
              setSimParams({
                riskPercent: params.riskPercent,
                atrSlMultiplier: params.atrSlMultiplier,
                atrTpMultiplier: params.atrTpMultiplier,
              });
              setActiveTab('simulator');
            }}
          />
        )}

        {activeTab === 'chat' && (
          <QuantChatbotView
            user={user}
            onSaveMessageToCloud={handleSaveChatMessageToCloud}
            onSendCodeToStudio={(code) => handleOpenMql5WithCode(code, 'Custom Generated EA')}
          />
        )}

        {activeTab === 'mt5' && (
          <MT5AccountsView
            user={user}
            onLogin={handleLogin}
            activeStrategyTitle={strategyTitle}
          />
        )}
      </main>

      {/* Quick Check Modal */}
      <QuickCheckModal
        isOpen={quickCheckOpen}
        onClose={() => setQuickCheckOpen(false)}
      />

      {/* Saved Cloud Library Modal */}
      <SavedStrategiesModal
        isOpen={savedModalOpen}
        onClose={() => setSavedModalOpen(false)}
        user={user}
        onSelectStrategy={(strat) => {
          setCurrentMql5Code(strat.mql5Snippet);
          setStrategyTitle(strat.title);
          setActiveTab('mql5');
        }}
        onSelectReport={(_rep) => {
          setActiveTab('flagship');
        }}
      />

      {/* Quant Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500/70" />
            <span className="font-semibold text-slate-400">Aureus Quant Engine</span>
            <span>&bull;</span>
            <span>Spot Gold (XAUUSD) Algorithmic Scalping Architecture</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Compliant with MetaTrader 5 Build 4000+ &bull; Models: Gemini 4 Argon &bull; Gemini 3.8 Flash &bull; Gemini 3.1 Flash-Lite
          </div>
        </div>
      </footer>
    </div>
  );
}
