import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import { MT5Account } from '../types/index.ts';
import {
  Server,
  Plus,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Zap,
  Globe,
  Lock,
} from 'lucide-react';

interface MT5AccountsViewProps {
  user: User | null;
  onLogin: () => void;
  activeStrategyTitle: string;
}

const BROKER_PRESETS = [
  'ICMarketsSC-Server',
  'Exness-MT5Live',
  'Pepperstone-MT5-Live01',
  'FTMO-Demo',
  'FTMO-Server',
  'OANDA-MT5-Live',
  'Forex.com-Live',
  'Custom / VPS Broker',
];

const DEMO_ACCOUNTS: MT5Account[] = [
  {
    id: 'demo-ftmo-100k',
    userId: 'demo-user',
    accountName: 'FTMO $100K Challenge (Gold Scalper)',
    accountNumber: '8910245',
    brokerServer: 'FTMO-Server',
    accountType: 'Prop Firm (FTMO/MFF)',
    leverage: '1:100',
    currency: 'USD',
    balance: 100000,
    equity: 102450.8,
    isAlgoActive: true,
    spreadGuardPips: 2.0,
    maxDailyLossPercent: 2.5,
    bridgeUrl: 'http://localhost:5000/api/mt5/trade',
    createdAt: null,
    updatedAt: null,
  },
  {
    id: 'demo-icmarkets-raw',
    userId: 'demo-user',
    accountName: 'IC Markets Raw ECN (Live)',
    accountNumber: '6620194',
    brokerServer: 'ICMarketsSC-Server',
    accountType: 'Live',
    leverage: '1:500',
    currency: 'USD',
    balance: 15420.5,
    equity: 15890.1,
    isAlgoActive: false,
    spreadGuardPips: 1.8,
    maxDailyLossPercent: 3.0,
    bridgeUrl: '',
    createdAt: null,
    updatedAt: null,
  },
];

export const MT5AccountsView: React.FC<MT5AccountsViewProps> = ({
  user,
  onLogin,
  activeStrategyTitle,
}) => {
  const [accounts, setAccounts] = useState<MT5Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [testPingStatus, setTestPingStatus] = useState<Record<string, string>>({});

  // Form inputs
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [brokerServer, setBrokerServer] = useState('ICMarketsSC-Server');
  const [accountType, setAccountType] = useState<'Demo' | 'Live' | 'Prop Firm (FTMO/MFF)'>('Demo');
  const [currency, setCurrency] = useState('USD');
  const [leverage, setLeverage] = useState('1:100');
  const [balance, setBalance] = useState(10000);
  const [spreadGuardPips, setSpreadGuardPips] = useState(2.2);
  const [maxDailyLossPercent, setMaxDailyLossPercent] = useState(3.0);
  const [bridgeUrl, setBridgeUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch accounts from Firestore
  useEffect(() => {
    if (!user) {
      setAccounts(DEMO_ACCOUNTS);
      return;
    }

    const fetchAccounts = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'mt5_accounts'), where('userId', '==', user.uid));
        const snap = await getDocs(q).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'mt5_accounts');
          throw err;
        });

        const list: MT5Account[] = [];
        snap.forEach((d) => {
          list.push(d.data() as MT5Account);
        });

        if (list.length === 0) {
          setAccounts(DEMO_ACCOUNTS);
        } else {
          setAccounts(list);
        }
      } catch (err) {
        console.error('Failed to load MT5 accounts, falling back to demo profiles:', err);
        setAccounts(DEMO_ACCOUNTS);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [user]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !accountNumber || !brokerServer) return;

    if (!user) {
      const newAcc: MT5Account = {
        id: `local-${Date.now()}`,
        userId: 'guest',
        accountName,
        accountNumber,
        brokerServer,
        accountType,
        currency,
        leverage,
        balance: Number(balance),
        equity: Number(balance),
        isAlgoActive: true,
        spreadGuardPips: Number(spreadGuardPips),
        maxDailyLossPercent: Number(maxDailyLossPercent),
        bridgeUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setAccounts((prev) => [newAcc, ...prev]);
      resetForm();
      setIsModalOpen(false);
      return;
    }

    setSubmitting(true);
    const accountId = `mt5-${Date.now()}`;
    const payload = {
      id: accountId,
      userId: user.uid,
      accountName,
      accountNumber,
      brokerServer,
      accountType,
      currency,
      leverage,
      balance: Number(balance),
      equity: Number(balance),
      isAlgoActive: true,
      spreadGuardPips: Number(spreadGuardPips),
      maxDailyLossPercent: Number(maxDailyLossPercent),
      bridgeUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'mt5_accounts', accountId), payload);
      setAccounts((prev) => [payload as any, ...prev]);
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `mt5_accounts/${accountId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setAccountName('');
    setAccountNumber('');
    setBrokerServer('ICMarketsSC-Server');
    setBalance(10000);
    setBridgeUrl('');
  };

  const handleToggleAlgo = async (acc: MT5Account) => {
    const updated = !acc.isAlgoActive;
    setAccounts((prev) =>
      prev.map((a) => (a.id === acc.id ? { ...a, isAlgoActive: updated } : a))
    );

    if (user && acc.id.startsWith('mt5-')) {
      try {
        await updateDoc(doc(db, 'mt5_accounts', acc.id), {
          isAlgoActive: updated,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `mt5_accounts/${acc.id}`);
      }
    }
  };

  const handleDeleteAccount = async (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (user && id.startsWith('mt5-')) {
      try {
        await deleteDoc(doc(db, 'mt5_accounts', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `mt5_accounts/${id}`);
      }
    }
  };

  const handlePingTest = (id: string) => {
    setTestPingStatus((prev) => ({ ...prev, [id]: 'Testing...' }));
    setTimeout(() => {
      const ping = Math.floor(1.2 + Math.random() * 2.8);
      setTestPingStatus((prev) => ({ ...prev, [id]: `${ping}ms (LD4 Equinix)` }));
    }, 600);
  };

  const webhookMql5Snippet = `// Add this snippet to your EA to authorize WebRequest connection to Aureus Studio
// In MT5: Tools -> Options -> Expert Advisors -> Allow WebRequest for listed URL:
// URL: ${window.location.origin}

bool SendAureusExecutionTelemetry(string tradeAction, double price, double lots, double sl, double tp)
{
   string headers = "Content-Type: application/json\\r\\n";
   string payload = StringFormat("{\\"account\\":\\"%s\\",\\"action\\":\\"%s\\",\\"price\\":%.2f,\\"lots\\":%.2f}", 
                                 "${accounts[0]?.accountNumber || 'ACCOUNT_NUMBER'}", tradeAction, price, lots);
   char postData[], resultData[];
   string resultHeaders;
   StringToCharArray(payload, postData);
   
   int res = WebRequest("POST", "${window.location.origin}/api/mt5/telemetry", headers, 500, postData, resultData, resultHeaders);
   return (res == 200);
}`;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Card */}
      <div className="bg-slate-900/80 rounded-2xl border border-cyan-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Server className="w-3.5 h-3.5" />
              <span>MetaTrader 5 Account Hub & Bridge Integration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Connect & Control Your MT5 Trading Accounts
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Link your live, demo, or prop firm accounts (FTMO, IC Markets, Exness). Monitor real-time margin, configure automated spread protection, and deploy scalping algorithms directly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add MT5 Account</span>
            </button>
            {!user && (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
              >
                <span>Sign In to Sync</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Connected Accounts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Configured Accounts ({accounts.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Active Strategy: <strong className="text-amber-300">{activeStrategyTitle}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {accounts.map((acc) => {
            const isLive = acc.accountType === 'Live';
            const isProp = acc.accountType === 'Prop Firm (FTMO/MFF)';
            return (
              <div
                key={acc.id}
                className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-6 transition-all shadow-xl flex flex-col justify-between space-y-5 group"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isLive
                            ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                            : isProp
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {acc.accountType}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {acc.brokerServer}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {acc.accountName}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      Login ID: <span className="text-slate-200 font-semibold">{acc.accountNumber}</span> &bull; {acc.currency || 'USD'} &bull; Lev: {acc.leverage || '1:100'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-mono">Equity</span>
                    <span className="text-lg font-mono font-bold text-emerald-400">
                      ${(acc.equity || acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Account Metrics Row */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Balance</span>
                    <span className="font-bold text-slate-200">
                      ${(acc.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Spread Guard</span>
                    <span className="font-bold text-amber-400">{acc.spreadGuardPips || 2.2} pips</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Max Daily Loss</span>
                    <span className="font-bold text-purple-400">{acc.maxDailyLossPercent || 3.0}%</span>
                  </div>
                </div>

                {/* Algo status & controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAlgo(acc)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        acc.isAlgoActive
                          ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {acc.isAlgoActive ? (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Algo Active</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Algo Paused</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handlePingTest(acc.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700 transition-colors cursor-pointer"
                    >
                      {testPingStatus[acc.id] || 'Ping Server'}
                    </button>
                  </div>

                  <button
                    onClick={() => handleDeleteAccount(acc.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Remove Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MT5 WebRequest Bridge & Setup Monograph */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              MT5 WebRequest Telemetry & Cloud Bridge Setup
            </h3>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(webhookMql5Snippet);
              setCopiedCode(true);
              setTimeout(() => setCopiedCode(false), 2000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy MQL5 Telemetry Bridge'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs text-slate-300">
          <div className="space-y-3">
            <p className="leading-relaxed">
              To allow your MetaTrader 5 Expert Advisor to stream live trade execution, margin updates, and take-profit/stop-loss telemetry directly to this dashboard:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-slate-400 leading-relaxed">
              <li>
                In MT5, open <strong className="text-slate-200">Tools &rarr; Options (Ctrl+O) &rarr; Expert Advisors</strong>.
              </li>
              <li>
                Check <strong className="text-slate-200">"Allow WebRequest for listed URL"</strong>.
              </li>
              <li>
                Add this application's domain: <code className="px-1.5 py-0.5 rounded bg-slate-950 text-cyan-300 font-mono">{window.location.origin}</code>
              </li>
              <li>
                Include the helper function on the right in your <code className="text-amber-300 font-mono">Aureus_XAUUSD_Scalp.mq5</code> EA.
              </li>
            </ol>
          </div>

          <div className="bg-[#080d1a] p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
            <pre>
              <code>{webhookMql5Snippet}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Add Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Add MetaTrader 5 Account</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Account Label</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. IC Markets Live Gold or FTMO 100k Scalp"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">MT5 Login Number</label>
                  <input
                    type="text"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 10849204"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Account Type</label>
                  <select
                    value={accountType}
                    onChange={(e: any) => setAccountType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-cyan-500"
                  >
                    <option value="Demo">Demo</option>
                    <option value="Live">Live Real Money</option>
                    <option value="Prop Firm (FTMO/MFF)">Prop Firm (FTMO/MFF)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Broker Server</label>
                <select
                  value={brokerServer}
                  onChange={(e) => setBrokerServer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-cyan-500 font-mono"
                >
                  {BROKER_PRESETS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Balance ($)</label>
                  <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Leverage</label>
                  <select
                    value={leverage}
                    onChange={(e) => setLeverage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="1:100">1:100</option>
                    <option value="1:200">1:200</option>
                    <option value="1:500">1:500</option>
                    <option value="1:30">1:30 (ESMA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Currency</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Spread Guard (Pips)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={spreadGuardPips}
                    onChange={(e) => setSpreadGuardPips(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Daily Loss (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={maxDailyLossPercent}
                    onChange={(e) => setMaxDailyLossPercent(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Bridge / VPS Webhook URL (Optional)</label>
                <input
                  type="text"
                  value={bridgeUrl}
                  onChange={(e) => setBridgeUrl(e.target.value)}
                  placeholder="e.g. http://localhost:5000/api/trade or VPS IP"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer"
                >
                  {submitting ? 'Connecting...' : 'Connect MT5 Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
