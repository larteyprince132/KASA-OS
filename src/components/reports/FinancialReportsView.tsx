import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  Boxes,
  Users,
  Building2,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateProfitAndLoss, formatCurrency, round2 } from '../../utils/accounting';

export const FinancialReportsView: React.FC = () => {
  const { data, metrics } = useApp();
  const symbol = data.org.currencySymbol;

  const [activeReport, setActiveReport] = useState<
    'pnl' | 'cashflow' | 'inventory_val' | 'debtors' | 'payables'
  >('pnl');

  const [pnlMode, setPnlMode] = useState<'accrual' | 'cash'>('accrual');

  // Profit & Loss calculation
  const pnl = generateProfitAndLoss(data.sales, data.expenses, pnlMode);

  // Cash Flow Calculation:
  // Operating Inflows = Cash received from sales + customer payments
  // Operating Outflows = Cash paid for purchases + operating expenses
  const cashInflow = metrics.collectedPayments;
  let purchaseCashOutflow = 0;
  for (const p of data.purchases) {
    purchaseCashOutflow += p.paidAmount;
  }
  const expenseCashOutflow = metrics.totalExpenses;
  const netCashFlow = round2(cashInflow - (purchaseCashOutflow + expenseCashOutflow));

  // CSV Export utility
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((c) => (typeof c === 'string' && c.includes(',') ? `"${c}"` : c)).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCurrent = () => {
    if (activeReport === 'pnl') {
      const headers = ['Financial Line Item', 'Amount', 'Accounting Basis'];
      const rows = [
        ['Operating Revenue (Sales)', pnl.revenue, pnlMode],
        ['Cost of Goods Sold (COGS)', pnl.cogs, pnlMode],
        ['Gross Operating Profit', pnl.grossProfit, pnlMode],
        ['Gross Margin %', `${pnl.grossMargin}%`, pnlMode],
        ['Operating Expenses (OPEX)', pnl.operatingExpenses, pnlMode],
        ...Object.values(pnl.expenseBreakdown).map((eb) => [`  ${eb.label}`, eb.amount, pnlMode]),
        ['Net Operating Profit / (Loss)', pnl.netProfit, pnlMode],
        ['Net Margin %', `${pnl.netMargin}%`, pnlMode],
      ];
      downloadCSV(`kasa_os_profit_loss_${pnlMode}`, headers, rows);
    } else if (activeReport === 'cashflow') {
      const headers = ['Cash Flow Activity', 'Amount'];
      const rows = [
        ['Cash Collected from Customer Sales', cashInflow],
        ['Cash Paid to Merchandise Suppliers', -purchaseCashOutflow],
        ['Cash Paid for Operating Expenses', -expenseCashOutflow],
        ['Net Operating Cash Flow', netCashFlow],
      ];
      downloadCSV(`kasa_os_cash_flow_statement`, headers, rows);
    } else if (activeReport === 'inventory_val') {
      const headers = ['SKU', 'Product Name', 'Category', 'Unit', 'WAC Cost', 'Stock Quantity', 'Inventory Valuation'];
      const rows = data.products
        .filter((p) => !p.isService)
        .map((p) => [
          p.sku,
          p.name,
          p.category,
          p.unit,
          p.purchaseCost,
          p.stockQuantity,
          round2(p.purchaseCost * p.stockQuantity),
        ]);
      downloadCSV(`kasa_os_inventory_valuation`, headers, rows);
    } else if (activeReport === 'debtors') {
      const headers = ['Customer Name', 'Phone', 'Credit Limit', 'Total Lifetime Turnover', 'Outstanding Debt'];
      const rows = data.customers.map((c) => [c.name, c.phone, c.creditLimit, c.totalPurchases, c.outstandingBalance]);
      downloadCSV(`kasa_os_customer_debt_aging`, headers, rows);
    } else if (activeReport === 'payables') {
      const headers = ['Supplier Name', 'Contact Person', 'Terms (Days)', 'Total Procured', 'Outstanding Payable'];
      const rows = data.suppliers.map((s) => [s.name, s.contactPerson, s.paymentTermsDays, s.totalPurchased, s.outstandingBalance]);
      downloadCSV(`kasa_os_supplier_payables`, headers, rows);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Report Navigator */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveReport('pnl')}
            className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
              activeReport === 'pnl' ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Profit & Loss Statement
          </button>
          <button
            onClick={() => setActiveReport('cashflow')}
            className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
              activeReport === 'cashflow' ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Cash Flow Statement
          </button>
          <button
            onClick={() => setActiveReport('inventory_val')}
            className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
              activeReport === 'inventory_val' ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Inventory Valuation (WAC)
          </button>
          <button
            onClick={() => setActiveReport('debtors')}
            className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
              activeReport === 'debtors' ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Customer Debtors Report
          </button>
          <button
            onClick={() => setActiveReport('payables')}
            className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer transition-colors ${
              activeReport === 'payables' ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            Supplier Payables Report
          </button>
        </div>

        <button
          onClick={handleExportCurrent}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download CSV Report</span>
        </button>
      </div>

      {/* REPORT CONTENT: 1. Profit & Loss */}
      {activeReport === 'pnl' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Profit & Loss Statement (Income Statement)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {data.org.name} • Certified Accounting Summary for {data.org.currency}
              </p>
            </div>

            {/* Accrual vs Cash Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setPnlMode('accrual')}
                className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                  pnlMode === 'accrual' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Accrual Basis (Invoiced)
              </button>
              <button
                onClick={() => setPnlMode('cash')}
                className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                  pnlMode === 'cash' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cash Basis (Collected Only)
              </button>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-4 text-xs font-mono">
            {/* Operating Revenue */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center text-slate-800 font-bold font-sans text-sm">
                <span>1. Operating Revenue</span>
                <span>{formatCurrency(pnl.revenue, symbol)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px] pl-3">
                <span>Gross Merchandise Sales (Net of Output Tax)</span>
                <span>{formatCurrency(pnl.revenue, symbol)}</span>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center text-rose-800 font-bold font-sans text-sm">
                <span>2. Cost of Goods Sold (COGS)</span>
                <span>({formatCurrency(pnl.cogs, symbol)})</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px] pl-3">
                <span>Direct procurement cost of inventory sold (WAC)</span>
                <span>({formatCurrency(pnl.cogs, symbol)})</span>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center font-sans">
              <div>
                <span className="font-bold text-emerald-950 text-sm">Gross Profit</span>
                <p className="text-[11px] text-emerald-800 font-mono mt-0.5">Gross Margin: {pnl.grossMargin}%</p>
              </div>
              <span className="font-mono font-bold text-base text-emerald-900">
                {formatCurrency(pnl.grossProfit, symbol)}
              </span>
            </div>

            {/* Operating Expenses Breakdown */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/80 space-y-2.5">
              <div className="flex justify-between items-center text-slate-800 font-bold font-sans text-sm">
                <span>3. Operating Overheads & Expenses (OPEX)</span>
                <span className="text-rose-700">({formatCurrency(pnl.operatingExpenses, symbol)})</span>
              </div>

              <div className="space-y-1.5 pl-3 border-l-2 border-slate-200 my-2">
                {Object.entries(pnl.expenseBreakdown).map(([key, item]) => (
                  <div key={key} className="flex justify-between text-slate-600 text-[11px]">
                    <span className="font-sans">{item.label}</span>
                    <span>{formatCurrency(item.amount, symbol)}</span>
                  </div>
                ))}
                {Object.keys(pnl.expenseBreakdown).length === 0 && (
                  <div className="text-slate-400 italic text-[11px]">No expenses recorded</div>
                )}
              </div>
            </div>

            {/* Net Operating Profit */}
            <div
              className={`p-5 rounded-xl border flex justify-between items-center font-sans ${
                pnl.netProfit >= 0
                  ? 'bg-emerald-900 text-white border-emerald-800 shadow-sm'
                  : 'bg-rose-900 text-white border-rose-800 shadow-sm'
              }`}
            >
              <div>
                <span className="font-bold text-base">Net Operating Profit / (Loss)</span>
                <p className="text-xs opacity-80 font-mono mt-0.5">Net Profit Margin: {pnl.netMargin}%</p>
              </div>
              <span className="font-mono font-black text-xl">
                {formatCurrency(pnl.netProfit, symbol)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 2. Cash Flow Statement */}
      {activeReport === 'cashflow' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Cash Flow Statement (Direct Method)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct tracking of real liquidity entering and leaving bank, cash till, and Mobile Money
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-4 text-xs font-mono">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between font-bold text-slate-900 font-sans text-sm">
                <span>Cash Inflows (Operating Activities)</span>
                <span className="text-emerald-700">+{formatCurrency(cashInflow, symbol)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px] pl-3">
                <span>Customer Sales Payments & Debt Collections</span>
                <span>+{formatCurrency(cashInflow, symbol)}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
              <div className="flex justify-between font-bold text-slate-900 font-sans text-sm">
                <span>Cash Outflows (Operating Activities)</span>
                <span className="text-rose-700">
                  -{formatCurrency(purchaseCashOutflow + expenseCashOutflow, symbol)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px] pl-3">
                <span>Disbursements to Merchandise Suppliers</span>
                <span>-{formatCurrency(purchaseCashOutflow, symbol)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px] pl-3">
                <span>Cash Disbursements for Operating Expenses</span>
                <span>-{formatCurrency(expenseCashOutflow, symbol)}</span>
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border flex justify-between items-center font-sans ${
                netCashFlow >= 0 ? 'bg-slate-900 text-white' : 'bg-rose-900 text-white'
              }`}
            >
              <div>
                <span className="font-bold text-sm">Net Operating Cash Flow</span>
                <p className="text-xs opacity-75 font-mono">Change in total liquidity</p>
              </div>
              <span className="font-mono font-bold text-lg">
                {netCashFlow >= 0 ? '+' : ''}
                {formatCurrency(netCashFlow, symbol)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 3. Inventory Valuation */}
      {activeReport === 'inventory_val' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Merchandise Inventory Valuation Report</h2>
              <p className="text-xs text-slate-500">Valued using Weighted Average Cost (WAC) methodology</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Stock Value</span>
              <p className="font-mono font-bold text-base text-slate-900">
                {formatCurrency(metrics.inventoryValue, symbol)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-right">WAC Cost</th>
                  <th className="py-3 px-4 text-right">In Stock</th>
                  <th className="py-3 px-4 text-right">Total Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {data.products
                  .filter((p) => !p.isService)
                  .map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-bold text-slate-800">{p.sku}</td>
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-900">{p.name}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-600">{p.category}</td>
                      <td className="py-2.5 px-4 text-center uppercase text-slate-500">{p.unit}</td>
                      <td className="py-2.5 px-4 text-right">{formatCurrency(p.purchaseCost, symbol)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">{p.stockQuantity}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        {formatCurrency(round2(p.purchaseCost * p.stockQuantity), symbol)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 4. Customer Debtors Aging */}
      {activeReport === 'debtors' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Customer Debtors Aging & Receivables Report</h2>
              <p className="text-xs text-slate-500">Uncollected customer credit extended on trade terms</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Receivables</span>
              <p className="font-mono font-bold text-base text-amber-800">
                {formatCurrency(metrics.outstandingReceivables, symbol)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4 text-right">Credit Limit</th>
                  <th className="py-3 px-4 text-right">Lifetime Sales</th>
                  <th className="py-3 px-4 text-right">Outstanding Debt</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {data.customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-4 text-slate-600">{c.phone}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(c.creditLimit, symbol)}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(c.totalPurchases, symbol)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-amber-800">
                      {formatCurrency(c.outstandingBalance, symbol)}
                    </td>
                    <td className="py-2.5 px-4 text-center font-sans">
                      {c.outstandingBalance > 0 ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-semibold text-[10px]">
                          Pending Collection
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                          Zero Balance
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: 5. Supplier Payables */}
      {activeReport === 'payables' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Supplier Payables (Trade Creditors) Report</h2>
              <p className="text-xs text-slate-500">Obligations owed to merchandise manufacturers & distributors</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Accounts Payable</span>
              <p className="font-mono font-bold text-base text-purple-800">
                {formatCurrency(metrics.outstandingPayables, symbol)}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Contact Representative</th>
                  <th className="py-3 px-4 text-center">Credit Terms</th>
                  <th className="py-3 px-4 text-right">Lifetime Procured</th>
                  <th className="py-3 px-4 text-right">Accounts Payable Owed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {data.suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{s.name}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-700">{s.contactPerson}</td>
                    <td className="py-2.5 px-4 text-center font-sans text-slate-600">Net {s.paymentTermsDays} days</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(s.totalPurchased, symbol)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-purple-800">
                      {formatCurrency(s.outstandingBalance, symbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
