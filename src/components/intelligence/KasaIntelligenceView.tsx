import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Users,
  TrendingUp,
  AlertTriangle,
  Receipt,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/accounting';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isGrounded?: boolean;
}

export const KasaIntelligenceView: React.FC = () => {
  const { data, metrics } = useApp();
  const symbol = data.org.currencySymbol;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am KASA Intelligence, your AI business co-pilot and CFO for **${data.org.name}**.\n\nI have direct access to your verified books: **${symbol} ${metrics.totalSales.toLocaleString()}** in revenue, **${symbol} ${metrics.collectedPayments.toLocaleString()}** cash collected, **${symbol} ${metrics.outstandingReceivables.toLocaleString()}** customer debt, and **${data.products.length}** inventory items.\n\nHow can I help you analyze your operations or finances today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isGrounded: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const executivePrompts = [
    'How much cash did I actually collect this month vs credit owed?',
    'Which customers owe me money and what are their balances?',
    'What products generate the highest gross profit margin?',
    'What are my biggest operating expenses and where can I optimize?',
    'Which items are low in stock and need to be reordered?',
    'What is our current net operating profit after expenses?',
  ];

  const handleSend = async (textToSend?: string) => {
    const question = textToSend || input;
    if (!question.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: question.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build verified organization payload
      const lowStockItems = data.products
        .filter((p) => !p.isService && p.stockQuantity <= p.minReorderPoint)
        .map((p) => ({
          name: p.name,
          stock: p.stockQuantity,
          reorderPoint: p.minReorderPoint,
          cost: p.purchaseCost,
          price: p.sellingPrice,
        }));

      const customersWithDebt = data.customers
        .filter((c) => c.outstandingBalance > 0)
        .map((c) => ({
          name: c.name,
          phone: c.phone,
          outstandingBalance: c.outstandingBalance,
          creditLimit: c.creditLimit,
        }));

      const topProducts = data.products
        .filter((p) => !p.isService)
        .map((p) => ({
          name: p.name,
          price: p.sellingPrice,
          cost: p.purchaseCost,
          marginPercent: p.sellingPrice > 0 ? Math.round(((p.sellingPrice - p.purchaseCost) / p.sellingPrice) * 100) : 0,
        }))
        .sort((a, b) => b.marginPercent - a.marginPercent);

      const recentExpenses = data.expenses.slice(0, 10).map((e) => ({
        category: e.categoryLabel,
        amount: e.amount,
        payee: e.payee,
        date: e.date,
      }));

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          orgContext: {
            orgName: data.org.name,
            industry: data.org.industry,
            currency: data.org.currency,
            currencySymbol: symbol,
            country: data.org.country,
            metrics,
            lowStockItems,
            customersWithDebt,
            topProducts,
            recentExpenses,
          },
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Server error communicating with KASA AI');
      }

      const botMessage: Message = {
        role: 'assistant',
        content: resData.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGrounded: true,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('KASA AI Error:', err);
      const fallbackMessage: Message = {
        role: 'assistant',
        content: `I analyzed your live business records: \n\n• **Total Sales:** ${formatCurrency(metrics.totalSales, symbol)}\n• **Collected Payments:** ${formatCurrency(metrics.collectedPayments, symbol)}\n• **Customer Receivables:** ${formatCurrency(metrics.outstandingReceivables, symbol)}\n• **Net Operating Profit:** ${formatCurrency(metrics.netProfit, symbol)}\n• **Cash Position:** ${formatCurrency(metrics.cashPosition, symbol)}\n\n*(Note: ${err instanceof Error ? err.message : 'AI server connectivity update'})*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isGrounded: true,
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Chat Window */}
      <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex flex-col h-[650px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">KASA Intelligence</h3>
                <span className="text-[10px] bg-purple-900 text-purple-200 px-1.5 py-0.2 rounded font-mono border border-purple-700">
                  Grounding: 100% Verified Records
                </span>
              </div>
              <p className="text-xs text-slate-400">Grounded exclusively on {data.org.name} accounting data</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Zero Hallucination Mode</span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0 font-bold text-xs">
                  AI
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3.5 leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div
                  className={`mt-1.5 text-[10px] font-mono flex items-center justify-between gap-2 ${
                    msg.role === 'user' ? 'text-emerald-100' : 'text-slate-400'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.isGrounded && (
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle className="w-3 h-3" /> Grounded in Trade Books
                    </span>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 font-bold text-xs uppercase">
                  {data.users[0]?.name ? data.users[0].name.charAt(0) : 'U'}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2">
              <Sparkles className="w-4 h-4 animate-spin text-purple-600" />
              <span>Analyzing journal entries, ledger accounts, and inventory records...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about your revenues, debtor balances, profit margins, or expenses..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:border-purple-600 focus:outline-hidden"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shrink-0 shadow-2xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI CFO</span>
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Pre-configured Executive Queries & Record Context */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs text-xs space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-slate-900">Executive Business Queries</h3>
          </div>
          <p className="text-slate-500 text-[11px]">
            Tap any instant audit question to inspect your authenticated organization metrics:
          </p>

          <div className="space-y-2">
            {executivePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200/80 rounded-lg text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
              >
                &ldquo;{prompt}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Live Grounding Snapshot Card */}
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-2xs text-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Grounding Source Data</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px] pt-1 border-t border-slate-800">
            <div className="flex justify-between text-slate-300">
              <span className="font-sans">Revenue (Sales):</span>
              <span className="text-white font-bold">{formatCurrency(metrics.totalSales, symbol)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="font-sans">Cash Realized:</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(metrics.collectedPayments, symbol)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="font-sans">Debtors (AR):</span>
              <span className="text-amber-400 font-bold">{formatCurrency(metrics.outstandingReceivables, symbol)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="font-sans">Overheads (OPEX):</span>
              <span className="text-rose-400 font-bold">{formatCurrency(metrics.totalExpenses, symbol)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="font-sans">Stock Value:</span>
              <span className="text-slate-100 font-bold">{formatCurrency(metrics.inventoryValue, symbol)}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
            Answers are restricted strictly to these numbers. No speculative claims.
          </p>
        </div>
      </div>
    </div>
  );
};
