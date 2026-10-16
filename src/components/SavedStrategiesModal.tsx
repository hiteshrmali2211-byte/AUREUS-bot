import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import { Strategy, ResearchReport } from '../types/index.ts';
import { Database, Trash2, ExternalLink, X, FileText, Code2, AlertCircle } from 'lucide-react';

interface SavedStrategiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSelectStrategy: (strat: Strategy) => void;
  onSelectReport: (report: ResearchReport) => void;
}

export const SavedStrategiesModal: React.FC<SavedStrategiesModalProps> = ({
  isOpen,
  onClose,
  user,
  onSelectStrategy,
  onSelectReport,
}) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'strategies' | 'reports'>('strategies');

  useEffect(() => {
    if (!isOpen || !user) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch strategies
        const stratQ = query(collection(db, 'strategies'), where('userId', '==', user.uid));
        const stratSnap = await getDocs(stratQ).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'strategies');
          throw err;
        });

        const strats: Strategy[] = [];
        stratSnap.forEach((doc) => {
          strats.push(doc.data() as Strategy);
        });
        setStrategies(strats);

        // Fetch reports
        const repQ = query(collection(db, 'research_reports'), where('userId', '==', user.uid));
        const repSnap = await getDocs(repQ).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'research_reports');
          throw err;
        });

        const reps: ResearchReport[] = [];
        repSnap.forEach((doc) => {
          reps.push(doc.data() as ResearchReport);
        });
        setReports(reps);
      } catch (err) {
        console.error('Failed to load user data from Firestore:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, user]);

  if (!isOpen) return null;

  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  const handleDeleteStrategy = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'strategies', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `strategies/${id}`);
        throw err;
      });
      setStrategies((prev) => prev.filter((s) => s.id !== id));
      setDeleteNotice(null);
    } catch (err: any) {
      setDeleteNotice('Delete failed: ' + (err?.message || 'Permission denied'));
      setTimeout(() => setDeleteNotice(null), 4000);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'research_reports', id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `research_reports/${id}`);
        throw err;
      });
      setReports((prev) => prev.filter((r) => r.id !== id));
      setDeleteNotice(null);
    } catch (err: any) {
      setDeleteNotice('Delete failed: ' + (err?.message || 'Permission denied'));
      setTimeout(() => setDeleteNotice(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Firestore Cloud Library</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab toggle */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('strategies')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'strategies'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>MQL5 Strategies ({strategies.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Research Reports ({reports.length})</span>
          </button>
        </div>

        {deleteNotice && (
          <div className="mx-5 mt-3 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 font-mono">
            {deleteNotice}
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!user ? (
            <div className="text-center py-8 space-y-2 text-slate-400">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-sm">Please sign in with Google to access your saved cloud items.</p>
            </div>
          ) : loading ? (
            <div className="text-center py-10 space-y-2 text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent animate-spin rounded-full mx-auto" />
              <span>Querying Firestore documents...</span>
            </div>
          ) : activeTab === 'strategies' ? (
            strategies.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                No custom strategies saved yet. Save one from the MQL5 Studio!
              </div>
            ) : (
              strategies.map((strat) => (
                <div
                  key={strat.id}
                  className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-amber-500/30 transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-amber-400 font-medium">
                      {strat.category} &bull; {strat.timeframe}
                    </span>
                    <h4 className="text-xs font-bold text-slate-200">{strat.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectStrategy(strat);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium cursor-pointer"
                    >
                      Load in Studio
                    </button>
                    <button
                      onClick={() => handleDeleteStrategy(strat.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : reports.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No research reports saved yet. Save a report from the Research Lab!
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 hover:border-indigo-500/30 transition-all"
              >
                <div className="space-y-0.5 max-w-md">
                  <span className="text-[10px] font-mono text-indigo-400">
                    Model: {rep.modelUsed}
                  </span>
                  <h4 className="text-xs font-bold text-slate-200 truncate">{rep.topic}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectReport(rep);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 font-medium cursor-pointer"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteReport(rep.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
