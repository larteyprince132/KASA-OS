import React, { useState } from 'react';
import { Plus, Search, Truck, Wallet, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/accounting';

interface PurchasesViewProps {
  onOpenNewPurchase: () => void;
  onOpenPaySupplier: (supplierId: string) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  onOpenNewPurchase,
  onOpenPaySupplier,
}) => {
  const { data } = useApp();
  const symbol = data.org.currencySymbol;

  const [searchTerm, setSearchTerm] = useState('');

  const filteredPurchases = data.purchases.filter((p) => {
    return (
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.billNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      {/* Top action and filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by bill # or supplier name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-blue-600 focus:outline-hidden"
          />
        </div>

        <button
          onClick={onOpenNewPurchase}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Receive Supplier Bill</span>
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Bill #</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Total Bill</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Accounts Payable</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{purchase.billNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{purchase.supplierName}</td>
                  <td className="py-3 px-4 text-slate-500">{purchase.date}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {purchase.items.length} item{purchase.items.length > 1 ? 's' : ''}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(purchase.totalAmount, symbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700">
                    {formatCurrency(purchase.paidAmount, symbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    {purchase.balanceAmount > 0 ? (
                      <span className="text-purple-700">{formatCurrency(purchase.balanceAmount, symbol)}</span>
                    ) : (
                      <span className="text-slate-400">{symbol} 0.00</span>
                    )}
                  </td>
                  <td className="py-3 px-4 uppercase font-mono text-[11px] text-slate-600">
                    {purchase.paymentMethod}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        purchase.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : purchase.paymentStatus === 'partial'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {purchase.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {purchase.balanceAmount > 0 ? (
                      <button
                        onClick={() => onOpenPaySupplier(purchase.supplierId)}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded text-[11px] font-semibold cursor-pointer"
                      >
                        Settle AP
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px] flex items-center justify-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Settled
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredPurchases.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-500">
                    No supplier purchase bills recorded yet.
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
