import React, { useState } from 'react';
import { X, Wallet, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, round2 } from '../../utils/accounting';

interface DebtSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'customer' | 'supplier';
  targetId?: string;
}

export const DebtSettlementModal: React.FC<DebtSettlementModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
}) => {
  const { data, settleCustomerDebt, settleSupplierPayable } = useApp();
  const symbol = data.org.currencySymbol;

  const defaultId =
    targetId ||
    (targetType === 'customer'
      ? data.customers.find((c) => c.outstandingBalance > 0)?.id || data.customers[0]?.id || ''
      : data.suppliers.find((s) => s.outstandingBalance > 0)?.id || data.suppliers[0]?.id || '');

  const [selectedEntityId, setSelectedEntityId] = useState<string>(defaultId);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo' | 'bank_transfer' | 'cheque'>('momo');
  const [reference, setReference] = useState(`PMT-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const selectedCustomer = targetType === 'customer' ? data.customers.find((c) => c.id === selectedEntityId) : null;
  const selectedSupplier = targetType === 'supplier' ? data.suppliers.find((s) => s.id === selectedEntityId) : null;

  const currentOutstanding = targetType === 'customer'
    ? selectedCustomer?.outstandingBalance || 0
    : selectedSupplier?.outstandingBalance || 0;

  const handlePayFull = () => {
    setAmount(currentOutstanding.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = round2(parseFloat(amount) || 0);

    if (parsedAmount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (targetType === 'customer') {
      settleCustomerDebt(
        selectedEntityId,
        parsedAmount,
        paymentMethod,
        reference,
        notes || 'Customer debt payment'
      );
    } else {
      settleSupplierPayable(
        selectedEntityId,
        parsedAmount,
        paymentMethod,
        reference,
        notes || 'Supplier bill payment'
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl my-8 overflow-hidden text-xs">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded ${targetType === 'customer' ? 'bg-emerald-600' : 'bg-purple-600'}`}>
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {targetType === 'customer' ? 'Record Customer Debt Payment' : 'Disburse Supplier Bill Payment'}
              </h2>
              <p className="text-slate-400">
                {targetType === 'customer'
                  ? 'Reduces Accounts Receivable & credits customer balance'
                  : 'Reduces Accounts Payable & disburses cash/bank funds'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {targetType === 'customer' ? 'Select Debtor Customer' : 'Select Creditor Supplier'}
            </label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden cursor-pointer"
              required
            >
              {targetType === 'customer'
                ? data.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Owed: {formatCurrency(c.outstandingBalance, symbol)})
                    </option>
                  ))
                : data.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Payable: {formatCurrency(s.outstandingBalance, symbol)})
                    </option>
                  ))}
            </select>
          </div>

          <div className="p-3 bg-slate-100 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium">Current Outstanding Balance:</span>
              <p className="font-mono font-bold text-base text-slate-900 mt-0.5">
                {formatCurrency(currentOutstanding, symbol)}
              </p>
            </div>
            {currentOutstanding > 0 && (
              <button
                type="button"
                onClick={handlePayFull}
                className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded text-[11px] font-semibold cursor-pointer shadow-2xs"
              >
                Pay in Full
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Amount</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 font-mono text-slate-400">{symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 pl-9 bg-slate-50 border border-slate-300 rounded font-mono font-bold focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Channel</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden cursor-pointer"
              >
                <option value="momo">MTN / Telecel MoMo</option>
                <option value="cash">Cash on Hand</option>
                <option value="bank_transfer">Bank Wire</option>
                <option value="cheque">Bank Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transaction Reference / Receipt #</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono focus:border-emerald-600 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Narration</label>
            <input
              type="text"
              placeholder="e.g. Cleared invoice balance via MoMo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white rounded text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 ${
                targetType === 'customer' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Post Settlement Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
