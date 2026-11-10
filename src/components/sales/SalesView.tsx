import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Printer,
  X,
  CreditCard,
  Building,
  User,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { formatCurrency } from '../../utils/accounting';

interface SalesViewProps {
  onOpenNewSale: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onOpenNewSale }) => {
  const { data } = useApp();
  const symbol = data.org.currencySymbol;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);

  const filteredSales = data.sales.filter((sale) => {
    const matchesSearch =
      sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sale.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Top action and filter bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by invoice # or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid in Full</option>
            <option value="partial">Partial Payment</option>
            <option value="unpaid">Unpaid / Credit</option>
          </select>
        </div>

        <button
          onClick={onOpenNewSale}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Sale / Invoice</span>
        </button>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Paid Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{sale.invoiceNumber}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{sale.customerName}</td>
                  <td className="py-3 px-4 text-slate-500">{sale.date}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(sale.totalAmount, symbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700">
                    {formatCurrency(sale.paidAmount, symbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    {sale.balanceAmount > 0 ? (
                      <span className="text-amber-700">{formatCurrency(sale.balanceAmount, symbol)}</span>
                    ) : (
                      <span className="text-slate-400">{symbol} 0.00</span>
                    )}
                  </td>
                  <td className="py-3 px-4 uppercase font-mono text-[11px] text-slate-600">
                    {sale.paymentMethod}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        sale.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sale.paymentStatus === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {sale.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setSelectedInvoice(sale)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-500">
                    No sales found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Document Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden text-xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">Tax Invoice & Receipt — {selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 bg-white text-slate-800">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{data.org.name}</h3>
                  <p className="text-slate-500 text-[11px] mt-0.5">{data.org.description}</p>
                  <p className="text-slate-500 text-[11px]">
                    TIN: {data.org.taxIdentificationNumber || 'GH-TIN-AVAILABLE'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-emerald-700">{selectedInvoice.invoiceNumber}</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">Date: {selectedInvoice.date}</p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedInvoice.paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedInvoice.paymentStatus === 'partial'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Status: {selectedInvoice.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Billed To */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Billed To Customer:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedInvoice.customerName}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Payment Method: {selectedInvoice.paymentMethod.toUpperCase()}</p>
                {selectedInvoice.notes && (
                  <p className="text-slate-500 text-[11px] mt-0.5 italic">Note: {selectedInvoice.notes}</p>
                )}
              </div>

              {/* Line Items */}
              <table className="w-full text-left text-xs border border-slate-200 rounded">
                <thead className="bg-slate-100 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-2">Description</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Unit Price</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{it.productName}</td>
                      <td className="p-2 text-center">{it.quantity}</td>
                      <td className="p-2 text-right font-mono">{formatCurrency(it.unitPrice, symbol)}</td>
                      <td className="p-2 text-right font-mono font-bold">{formatCurrency(it.total, symbol)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Totals */}
              <div className="border-t border-slate-200 pt-3 space-y-1 text-right text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.subtotal, symbol)}</span>
                </div>
                {selectedInvoice.taxTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tax / VAT:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.taxTotal, symbol)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Amount:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.totalAmount, symbol)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Amount Paid:</span>
                  <span className="font-mono">{formatCurrency(selectedInvoice.paidAmount, symbol)}</span>
                </div>
                {selectedInvoice.balanceAmount > 0 && (
                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>Balance Owed:</span>
                    <span className="font-mono">{formatCurrency(selectedInvoice.balanceAmount, symbol)}</span>
                  </div>
                )}
              </div>

              <div className="p-2.5 bg-emerald-50 rounded text-[11px] text-emerald-800 border border-emerald-200">
                Generated via KASA OS • Authorized Business Operating Record
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
