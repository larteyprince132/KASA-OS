import React, { useState } from 'react';
import { Plus, Search, Users, Phone, Mail, MapPin, Wallet, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/accounting';

interface CustomersViewProps {
  onOpenNewCustomer: () => void;
  onOpenSettleDebt: (customerId: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenNewCustomer,
  onOpenSettleDebt,
}) => {
  const { data, metrics } = useApp();
  const symbol = data.org.currencySymbol;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDebtOnly, setFilterDebtOnly] = useState(false);

  const filteredCustomers = data.customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDebt = !filterDebtOnly || c.outstandingBalance > 0;
    return matchesSearch && matchesDebt;
  });

  return (
    <div className="space-y-4">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Total Accounts Receivable</span>
          <p className="text-xl font-bold font-mono text-amber-700 mt-1">
            {formatCurrency(metrics.outstandingReceivables, symbol)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Across {data.customers.filter((c) => c.outstandingBalance > 0).length} active debtors
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Registered Client Accounts</span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{data.customers.length}</p>
          <p className="text-xs text-slate-400 mt-1">SME commercial partners & contractors</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Customer Operations</span>
            <p className="text-xs font-semibold text-slate-800 mt-1">Register New Client</p>
          </div>
          <button
            onClick={onOpenNewCustomer}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md flex items-center gap-1.5 text-xs shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, phone number, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-emerald-600 focus:outline-hidden"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium shrink-0">
          <input
            type="checkbox"
            checked={filterDebtOnly}
            onChange={(e) => setFilterDebtOnly(e.target.checked)}
            className="rounded text-amber-600 cursor-pointer"
          />
          <span>Show only clients with outstanding balances</span>
        </label>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Delivery Address</th>
                <th className="py-3 px-4 text-right">Credit Limit</th>
                <th className="py-3 px-4 text-right">Lifetime Turnover</th>
                <th className="py-3 px-4 text-right">Outstanding Debt</th>
                <th className="py-3 px-4 text-center">Collection Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-mono text-[11px]">{c.phone}</div>
                    {c.email && <div className="text-slate-400 text-[10px]">{c.email}</div>}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{c.address || '—'}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {formatCurrency(c.creditLimit, symbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {formatCurrency(c.totalPurchases, symbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {c.outstandingBalance > 0 ? (
                      <span className="text-amber-800">{formatCurrency(c.outstandingBalance, symbol)}</span>
                    ) : (
                      <span className="text-slate-400">{symbol} 0.00</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {c.outstandingBalance > 0 ? (
                      <button
                        onClick={() => onOpenSettleDebt(c.id)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1"
                      >
                        <Wallet className="w-3 h-3 text-amber-700" />
                        <span>Receive Payment</span>
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-mono text-[11px] font-semibold">Fully Paid</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    No customers found matching your criteria.
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
