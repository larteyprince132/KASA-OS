import React from 'react';
import {
  TrendingUp,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Receipt,
  Boxes,
  Building2,
  Users,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/accounting';

interface OverviewViewProps {
  onOpenNewSale: () => void;
  onOpenNewPurchase: () => void;
  onOpenNewExpense: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  onOpenNewSale,
  onOpenNewPurchase,
  onOpenNewExpense,
}) => {
  const { data, metrics, setActiveView } = useApp();
  const symbol = data.org.currencySymbol;

  // Compute trend data from actual posted sales and expenses
  const trendData = React.useMemo(() => {
    const daysMap: Record<string, { date: string; sales: number; collected: number; expenses: number }> = {};

    // Group sales by date
    for (const s of data.sales) {
      const d = s.date;
      if (!daysMap[d]) {
        daysMap[d] = { date: d.substring(5), sales: 0, collected: 0, expenses: 0 };
      }
      daysMap[d].sales += s.totalAmount;
      daysMap[d].collected += s.paidAmount;
    }

    // Group expenses by date
    for (const e of data.expenses) {
      const d = e.date;
      if (!daysMap[d]) {
        daysMap[d] = { date: d.substring(5), sales: 0, collected: 0, expenses: 0 };
      }
      daysMap[d].expenses += e.amount;
    }

    const sorted = Object.values(daysMap).sort((a, b) => a.date.localeCompare(b.date));
    return sorted.length > 0
      ? sorted
      : [
          { date: 'Day 1', sales: 0, collected: 0, expenses: 0 },
          { date: 'Day 2', sales: 0, collected: 0, expenses: 0 },
        ];
  }, [data.sales, data.expenses]);

  // Identify low stock items
  const lowStockItems = data.products.filter(
    (p) => !p.isService && p.stockQuantity <= p.minReorderPoint
  );

  // Identify outstanding invoices
  const outstandingSales = data.sales.filter((s) => s.balanceAmount > 0);

  return (
    <div className="space-y-6">
      {/* Low stock alert banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/90 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-md shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">
                {lowStockItems.length} inventory product{lowStockItems.length > 1 ? 's' : ''} at or below minimum reorder threshold
              </p>
              <p className="text-amber-700 mt-0.5">
                {lowStockItems.map((p) => `${p.name} (${p.stockQuantity} ${p.unit} left)`).slice(0, 2).join(', ')}
                {lowStockItems.length > 2 ? ` and ${lowStockItems.length - 2} more` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveView('inventory')}
            className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded font-medium shrink-0 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <span>Review Inventory</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 9 Core Financial & Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {/* 1. Total Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Total Sales Revenue</span>
            <span className="p-1 bg-slate-100 text-slate-700 rounded font-mono text-[10px]">Accrual</span>
          </div>
          <div className="text-xl lg:text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatCurrency(metrics.totalSales, symbol)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>{metrics.totalSalesCount} recorded sales</span>
            <span className="text-emerald-700 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Active
            </span>
          </div>
        </div>

        {/* 2. Collected Cash */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Cash Inflows (Collected)</span>
            <span className="p-1 bg-emerald-50 text-emerald-700 rounded font-mono text-[10px]">Realized</span>
          </div>
          <div className="text-xl lg:text-2xl font-bold font-mono text-emerald-800 tracking-tight">
            {formatCurrency(metrics.collectedPayments, symbol)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Collected from sales</span>
            <span className="text-slate-600 font-mono">
              {metrics.totalSales > 0
                ? `${Math.round((metrics.collectedPayments / metrics.totalSales) * 100)}% realized`
                : '100%'}
            </span>
          </div>
        </div>

        {/* 3. Accounts Receivable (Owed by Customers) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Accounts Receivable (Debtors)</span>
            <span className="p-1 bg-amber-50 text-amber-700 rounded font-mono text-[10px]">Customer Debt</span>
          </div>
          <div className="text-xl lg:text-2xl font-bold font-mono text-amber-700 tracking-tight">
            {formatCurrency(metrics.outstandingReceivables, symbol)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Pending collection</span>
            <button
              onClick={() => setActiveView('customers')}
              className="text-amber-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Manage Debtors
            </button>
          </div>
        </div>

        {/* 4. Total Operating Expenses */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Operating Expenses (OPEX)</span>
            <span className="p-1 bg-rose-50 text-rose-700 rounded font-mono text-[10px]">Overheads</span>
          </div>
          <div className="text-xl lg:text-2xl font-bold font-mono text-rose-700 tracking-tight">
            {formatCurrency(metrics.totalExpenses, symbol)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Rent, utilities, fuel, staff</span>
            <button
              onClick={() => setActiveView('expenses')}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Breakdown
            </button>
          </div>
        </div>

        {/* 5. Gross Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Gross Profit (Revenue - COGS)</span>
            <span className="p-1 bg-slate-100 text-slate-700 rounded font-mono text-[10px]">Margin</span>
          </div>
          <div className="text-xl lg:text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatCurrency(metrics.grossProfit, symbol)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Product markup spread</span>
            <span className="text-slate-700 font-mono font-medium">
              {metrics.totalSales > 0 ? `${Math.round((metrics.grossProfit / metrics.totalSales) * 100)}% margin` : '0%'}
            </span>
          </div>
        </div>

        {/* 6. Net Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Net Operating Profit</span>
            <span className={`p-1 rounded font-mono text-[10px] ${metrics.netProfit >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              Bottom Line
            </span>
          </div>
          <div
            className={`text-xl lg:text-2xl font-bold font-mono tracking-tight ${
              metrics.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
            }`}
          >
            {formatCurrency(metrics.netProfit, symbol)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>After operating overheads</span>
            <span className="font-mono text-slate-700">
              {metrics.totalSales > 0 ? `${Math.round((metrics.netProfit / metrics.totalSales) * 100)}% net` : '0%'}
            </span>
          </div>
        </div>

        {/* 7. Cash Position */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Cash Position (Liquidity)</span>
            <span className="p-1 bg-slate-100 text-slate-700 rounded font-mono text-[10px]">Net Cash</span>
          </div>
          <div
            className={`text-xl lg:text-2xl font-bold font-mono tracking-tight ${
              metrics.cashPosition >= 0 ? 'text-slate-900' : 'text-rose-700'
            }`}
          >
            {formatCurrency(metrics.cashPosition, symbol)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Bank, MoMo & Cash in till</span>
            <span className="text-slate-600 font-medium">Working capital</span>
          </div>
        </div>

        {/* 8. Inventory Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Merchandise Inventory Value</span>
            <span className="p-1 bg-slate-100 text-slate-700 rounded font-mono text-[10px]">WAC Method</span>
          </div>
          <div className="text-xl lg:text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatCurrency(metrics.inventoryValue, symbol)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>{data.products.length} catalog items</span>
            <button
              onClick={() => setActiveView('inventory')}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              View Stock
            </button>
          </div>
        </div>

        {/* 9. Accounts Payable (Owed to Suppliers) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span>Accounts Payable (Creditors)</span>
            <span className="p-1 bg-purple-50 text-purple-700 rounded font-mono text-[10px]">Vendor Debt</span>
          </div>
          <div className="text-xl lg:text-2xl font-bold font-mono text-purple-800 tracking-tight">
            {formatCurrency(metrics.outstandingPayables, symbol)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Supplier liability</span>
            <button
              onClick={() => setActiveView('suppliers')}
              className="text-purple-700 font-semibold hover:underline cursor-pointer"
            >
              Pay Vendors
            </button>
          </div>
        </div>
      </div>

      {/* Visual Charts: Sales vs Cash Inflow vs Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue & Cash Trend */}
        <div className="bg-white p-4 lg:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue & Cash Collection Velocity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tracking invoiced sales vs immediate cash collections</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0, symbol), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="sales" name="Invoiced Sales" stroke="#15803d" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="collected" name="Cash Realized" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#cashGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Revenue vs Expenses */}
        <div className="bg-white p-4 lg:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue vs Operating Overheads</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assessing operational burn against commercial turnover</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0, symbol), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="sales" name="Sales Revenue" fill="#15803d" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Operating Expenses" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Sales & Outstanding Receivables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoiced Sales */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Customer Sales</h3>
              <p className="text-xs text-slate-500">Latest trade transactions</p>
            </div>
            <button
              onClick={() => setActiveView('sales')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
            {data.sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{sale.invoiceNumber}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        sale.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sale.paymentStatus === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {sale.paymentStatus === 'paid' ? 'Paid in Full' : sale.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                    </span>
                  </div>
                  <p className="text-slate-600 truncate mt-0.5">{sale.customerName}</p>
                  <p className="text-slate-400 text-[10px]">{sale.date} • {sale.paymentMethod.toUpperCase()}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-slate-900">
                    {formatCurrency(sale.totalAmount, symbol)}
                  </div>
                  {sale.balanceAmount > 0 && (
                    <p className="text-amber-700 text-[11px] font-mono mt-0.5">
                      Bal: {formatCurrency(sale.balanceAmount, symbol)}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {data.sales.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <p>No sales recorded yet.</p>
                <button
                  onClick={onOpenNewSale}
                  className="mt-2 text-emerald-600 font-semibold hover:underline"
                >
                  + Record first sale
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Outstanding Invoices & Debt Recovery */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Outstanding Customer Balances</h3>
              <p className="text-xs text-slate-500">Receivables requiring collection</p>
            </div>
            <button
              onClick={() => setActiveView('customers')}
              className="text-xs text-amber-800 hover:text-amber-900 font-semibold cursor-pointer flex items-center gap-1"
            >
              <span>Manage Debtors</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
            {outstandingSales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{sale.customerName}</p>
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] mt-0.5">
                    <span>{sale.invoiceNumber}</span>
                    <span>•</span>
                    <span>Due: {sale.dueDate}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-amber-800">
                    {formatCurrency(sale.balanceAmount, symbol)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Total: {formatCurrency(sale.totalAmount, symbol)}
                  </span>
                </div>
              </div>
            ))}

            {outstandingSales.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p>All sales are fully collected. Zero delinquent debts!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log / Business Activity Feed */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-4 lg:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Recent Business Audit Log</h3>
          <span className="text-xs text-slate-400 font-mono">Immutable System Activity</span>
        </div>
        <div className="space-y-2 text-xs">
          {data.auditLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="p-2.5 bg-slate-50 rounded-lg flex items-start justify-between gap-3 border border-slate-100">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[10px] text-emerald-800 bg-emerald-100 px-1 rounded uppercase">
                    {log.action}
                  </span>
                  <span className="font-medium text-slate-800">{log.userName}</span>
                </div>
                <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">{log.details}</p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
