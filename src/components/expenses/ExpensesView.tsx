import React, { useState } from 'react';
import { Plus, Search, Receipt, Tag, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/accounting';

interface ExpensesViewProps {
  onOpenNewExpense: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onOpenNewExpense }) => {
  const { data, metrics } = useApp();
  const symbol = data.org.currencySymbol;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredExpenses = data.expenses.filter((exp) => {
    const matchesSearch =
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || exp.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4">
      {/* Category Summary Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Total Operating Overhead</span>
          <p className="text-xl font-bold font-mono text-rose-700 mt-1">
            {formatCurrency(metrics.totalExpenses, symbol)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{data.expenses.length} expense disbursements</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Tax Deductible Portion</span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatCurrency(
              data.expenses.filter((e) => e.taxDeductible).reduce((acc, e) => acc + e.amount, 0),
              symbol
            )}
          </p>
          <p className="text-xs text-slate-400 mt-1">Eligible for corporate tax allowance</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Overhead Action</span>
            <p className="text-xs font-semibold text-slate-800 mt-1">Log New Disbursement</p>
          </div>
          <button
            onClick={onOpenNewExpense}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md flex items-center gap-1.5 text-xs shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by payee, description, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-rose-600 focus:outline-hidden"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 focus:outline-hidden cursor-pointer"
        >
          <option value="all">All Expense Categories</option>
          <option value="rent">Rent & Facility</option>
          <option value="utilities">Utilities & Power</option>
          <option value="salaries">Staff Wages</option>
          <option value="transport_logistics">Transport & Fuel</option>
          <option value="repairs_maintenance">Repairs & Maintenance</option>
          <option value="marketing">Marketing & Promotion</option>
          <option value="office_supplies">Office & General</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payee</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Tax Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{exp.reference}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-slate-800 font-medium text-[11px]">
                      {exp.categoryLabel}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{exp.payee}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{exp.description}</td>
                  <td className="py-3 px-4 text-slate-500">{exp.date}</td>
                  <td className="py-3 px-4 uppercase font-mono text-[11px] text-slate-600">
                    {exp.paymentMethod}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                    {formatCurrency(exp.amount, symbol)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {exp.taxDeductible ? (
                      <span className="text-emerald-700 font-mono text-[10px] font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                        Deductible
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[10px]">Standard</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No operating expenses found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
