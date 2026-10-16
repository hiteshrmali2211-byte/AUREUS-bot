import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  Zap,
  Brain,
  Layers,
  Copy,
  Check,
  RotateCcw,
  Terminal,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  model?: string;
  timestamp: string;
}

interface QuantChatbotViewProps {
  user: User | null;
  onSaveMessageToCloud?: (role: string, content: string, model: string) => Promise<void>;
  onSendCodeToStudio?: (code: string) => void;
}

const PRESET_QUESTIONS = [
  'How do I calculate optimal ATR trailing stop distance on Gold M1 charts?',
  'What PPO reward function prevents high-frequency agents from overtrading against broker spreads?',
  'Write an MQL5 function using CTrade to close 50% lot size at 1.5R and move SL to break-even.',
  'How do London/New York session overlap liquidity sweeps create false breakouts in XAUUSD?',
];

export const QuantChatbotView: React.FC<QuantChatbotViewProps> = ({
  user,
  onSaveMessageToCloud,
  onSendCodeToStudio,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      content: `Welcome to the Aureus Quant Engine. I am your specialized algorithmic trading and MQL5 systems architect for XAU/USD (Gold).

You can switch between **Gemini-4-Argon (High Thinking)** for complex mathematical or reinforcement learning formulations, **Gemini-3.8-Flash** for balanced systems, or **Gemini-3.1-Flash-Lite** for microsecond-fast parameter lookups.

How can I assist your gold scalping architecture today?`,
      model: 'gemini-3.8-flash',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelChoice, setModelChoice] = useState<'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-4-argon');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newThread = [...messages, userMsg];
    setMessages(newThread);
    setInput('');
    setLoading(true);

    if (user && onSaveMessageToCloud) {
      onSaveMessageToCloud('user', text, modelChoice).catch(console.error);
    }

    try {
      const payloadMessages = newThread.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          modelChoice,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const modelReply = data.reply || 'No response generated.';

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: modelReply,
        model: modelChoice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);

      if (user && onSaveMessageToCloud) {
        onSaveMessageToCloud('model', modelReply, modelChoice).catch(console.error);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Error communicating with Gemini: ${err.message || 'Please check API credentials in settings.'}`,
        model: modelChoice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'reset-msg',
        role: 'model',
        content: 'Conversation thread reset. Ready for new quantitative queries.',
        model: modelChoice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl flex flex-col h-[600px] mb-8">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Aureus Quant AI Assistant</h2>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Multi-Turn Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Specialized in XAUUSD scalping, MT5 MQL5 development, and Reinforcement Learning
            </p>
          </div>
        </div>

        {/* Model Switcher */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setModelChoice('gemini-4-argon')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                modelChoice === 'gemini-4-argon'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="gemini-4-argon with ThinkingLevel.HIGH"
            >
              <Brain className="w-3 h-3" />
              <span>Argon (High Thinking)</span>
            </button>
            <button
              onClick={() => setModelChoice('gemini-3.8-flash')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                modelChoice === 'gemini-3.8-flash'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="gemini-3.8-flash general tasks"
            >
              <Layers className="w-3 h-3" />
              <span>Flash 3.8</span>
            </button>
            <button
              onClick={() => setModelChoice('gemini-3.1-flash-lite')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                modelChoice === 'gemini-3.1-flash-lite'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="gemini-3.1-flash-lite fast low-latency"
            >
              <Zap className="w-3 h-3" />
              <span>Flash Lite</span>
            </button>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Clear Chat Thread"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scrollable Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-sm">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`group relative rounded-2xl p-4 leading-relaxed ${
                  isUser
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-50'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-800 text-[10px] text-slate-500 font-mono">
                    <span>Model: {m.model || modelChoice}</span>
                    <button
                      onClick={() => handleCopyMessage(m.id, m.content)}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}

                <div className="whitespace-pre-line text-xs sm:text-sm">
                  {m.content}
                </div>

                <div className="mt-1 text-[9px] text-slate-500 text-right font-mono">
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-xl">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-2 text-xs text-purple-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>
                {modelChoice === 'gemini-4-argon'
                  ? 'Argon High Thinking: Evaluating multi-step quant reasoning...'
                  : 'Synthesizing response...'}
              </span>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Preset prompt pills */}
      <div className="px-6 py-2 bg-slate-950/60 border-t border-slate-850 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <span className="text-[10px] text-slate-500 whitespace-nowrap">Suggested:</span>
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-purple-300 border border-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about XAUUSD scalping rules, MQL5 EA code, or RL reward functions..."
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
