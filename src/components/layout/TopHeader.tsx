import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Calendar,
  RotateCcw,
  ShoppingCart,
  Truck,
  Receipt,
  UserPlus,
  PackagePlus,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useApp, DateFilter } from '../../context/AppContext';

interface TopHeaderProps {
  setMobileOpen: (open: boolean) => void;
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewExpense: () => void;
  onOpenNewProduct: () => void;
  onOpenNewCustomer: () => void;
}

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: {
    title: 'Business Overview',
    subtitle: 'Real-time performance, cash position, working capital, and operational pulse',
  },
  sales: {
    title: 'Sales & Invoicing',
    subtitle: 'Manage client sales, invoices, partial payments, and receipts',
  },
  purchases: {
    title: 'Purchases & Supplier Bills',
    subtitle: 'Procure merchandise, manage vendor liabilities, and track stock receipts',
  },
  transactions: {
    title: 'Double-Entry General Ledger',
    subtitle: 'Immutable debit & credit transaction history and chart of accounts',
  },
  expenses: {
    title: 'Operating Expenses',
    subtitle: 'Track operational overheads, rent, utilities, logistics, and payroll',
  },
  inventory: {
    title: 'Inventory & Stock Valuation',
    subtitle: 'Stock levels, weighted average costing, branch transfers, and reorder points',
  },
  customers: {
    title: 'Customers & Accounts Receivable',
    subtitle: 'Customer ledgers, credit limits, payment history, and debt settlement',
  },
  suppliers: {
    title: 'Suppliers & Accounts Payable',
    subtitle: 'Vendor relationships, trade credit, payment terms, and bill payments',
  },
  invoices: {
    title: 'Invoices & Commercial Documents',
    subtitle: 'Generate, filter, print, and audit customer invoices and receipts',
  },
  reports: {
    title: 'Financial Statements & Reports',
    subtitle: 'Profit & Loss (Accrual vs Cash), Cash Flow, and Inventory reports',
  },
  intelligence: {
    title: 'KASA Intelligence (AI CFO)',
    subtitle: 'Executive Q&A grounded strictly in your real transactional records',
  },
  entry: {
    title: 'Conversational Data Entry',
    subtitle: 'Natural language and OCR document interpreter for rapid bookkeeping',
  },
  employees: {
    title: 'Staff & Role-Based Access',
    subtitle: 'Manage team permissions across branch operations and accounting',
  },
  settings: {
    title: 'Organization Settings',
    subtitle: 'Configure currency, tax rates, branches, backup exports, and industries',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  setMobileOpen,
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenNewExpense,
  onOpenNewProduct,
  onOpenNewCustomer,
}) => {
  const { data, activeView, dateFilter, setDateFilter, isDemoOrg, resetToDemo } = useApp();
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const viewInfo = VIEW_TITLES[activeView] || {
    title: 'KASA OS',
    subtitle: 'Universal Business Operating System',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + View Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base lg:text-lg font-bold text-slate-900 tracking-tight truncate">
              {viewInfo.title}
            </h1>
            <p className="hidden sm:block text-xs text-slate-500 truncate mt-0.5">{viewInfo.subtitle}</p>
          </div>
        </div>

        {/* Right: Controls & Quick Actions */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Date Filter selector */}
          <div className="flex items-center bg-slate-100/90 border border-slate-200 rounded-md p-0.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1 hidden sm:block" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="bg-transparent text-slate-700 font-medium px-2 py-1 text-xs focus:outline-hidden cursor-pointer"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Currency indicator */}
          <div className="hidden md:flex items-center px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-md text-xs font-mono font-semibold text-emerald-800">
            {data.org.currency} ({data.org.currencySymbol})
          </div>

          {/* Demo reset button if in demo */}
          {isDemoOrg && (
            <button
              onClick={resetToDemo}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-md text-xs font-medium cursor-pointer transition-colors"
              title="Reset sample business records to initial state"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Demo</span>
            </button>
          )}

          {/* Quick Action Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setQuickMenuOpen(!quickMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Action</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${quickMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {quickMenuOpen && (
              <div
                className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-1 text-xs"
                onClick={() => setQuickMenuOpen(false)}
              >
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase text-slate-400">Quick Record</div>
                <button
                  onClick={onOpenNewSale}
                  className="w-full text-left px-2.5 py-2 hover:bg-slate-50 text-slate-700 rounded flex items-center gap-2 cursor-pointer font-medium"
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <span>Record Sale / Invoice</span>
                </button>
                <button
                  onClick={onOpenNewPurchase}
                  className="w-full text-left px-2.5 py-2 hover:bg-slate-50 text-slate-700 rounded flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>Receive Supplier Bill</span>
                </button>
                <button
                  onClick={onOpenNewExpense}
                  className="w-full text-left px-2.5 py-2 hover:bg-slate-50 text-slate-700 rounded flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Receipt className="w-4 h-4 text-amber-600" />
                  <span>Record Expense</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={onOpenNewCustomer}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-slate-700 rounded flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-slate-500" />
                  <span>Add New Customer</span>
                </button>
                <button
                  onClick={onOpenNewProduct}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 text-slate-700 rounded flex items-center gap-2 cursor-pointer"
                >
                  <PackagePlus className="w-4 h-4 text-slate-500" />
                  <span>Add New Product</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
