import React, { useState } from 'react';
import { X, Receipt, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory } from '../../types';
import { round2 } from '../../utils/accounting';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string }[] = [
  { id: 'rent', label: 'Rent & Facility Premises' },
  { id: 'utilities', label: 'Utilities, Power & Water' },
  { id: 'salaries', label: 'Staff Wages & Casual Labour' },
  { id: 'transport_logistics', label: 'Transport, Delivery & Fuel' },
  { id: 'repairs_maintenance', label: 'Repairs & Yard Maintenance' },
  { id: 'marketing', label: 'Marketing, Signage & Promotion' },
  { id: 'licenses_permits', label: 'District Assembly & Regulatory Fees' },
  { id: 'office_supplies', label: 'Office Supplies & Stationery' },
  { id: 'financial_fees', label: 'Bank & Mobile Money Charges' },
  { id: 'other', label: 'Other General Expenses' },
];

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({ isOpen, onClose }) => {
  const { data, recordExpense } = useApp();
  const symbol = data.org.currencySymbol;

  const [category, setCategory] = useState<ExpenseCategory>('utilities');
  const [amount, setAmount] = useState<string>('');
  const [payee, setPayee] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState(`EXP-${Date.now().toString().slice(-6)}`);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo' | 'bank_transfer' | 'cheque'>('momo');
  const [taxDeductible, setTaxDeductible] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = round2(parseFloat(amount) || 0);

    if (parsedAmount <= 0) {
      alert('Please enter a valid expense amount');
      return;
    }
    if (!payee.trim()) {
      alert('Please specify the payee / vendor');
      return;
    }

    const categoryObj = EXPENSE_CATEGORIES.find((c) => c.id === category);

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      orgId: data.org.id,
      branchId: data.org.activeBranchId,
      reference,
      category,
      categoryLabel: categoryObj?.label || 'General Expense',
      amount: parsedAmount,
      paymentMethod,
      date: new Date().toISOString().split('T')[0],
      payee: payee.trim(),
      description: description.trim() || categoryObj?.label || 'Operating overhead',
      taxDeductible,
      createdAt: new Date().toISOString(),
    };

    recordExpense(newExpense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl my-8 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-rose-600 rounded">
              <Receipt className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Record Operating Expense</h2>
              <p className="text-xs text-slate-400">Post operating overheads & deduct cash in till/bank</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:border-rose-600 focus:outline-hidden cursor-pointer"
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 font-mono text-slate-400">{symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xs p-2 pl-9 bg-slate-50 border border-slate-300 rounded font-mono font-bold focus:border-rose-600 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:border-rose-600 focus:outline-hidden cursor-pointer"
              >
                <option value="momo">MTN / Telecel MoMo</option>
                <option value="cash">Cash on Hand</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payee / Recipient</label>
            <input
              type="text"
              placeholder="e.g. Electricity Company of Ghana (ECG), Landlord..."
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:border-rose-600 focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Memo</label>
            <input
              type="text"
              placeholder="e.g. November power credit recharge..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded focus:border-rose-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reference / Receipt #</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-300 rounded font-mono focus:border-rose-600 focus:outline-hidden"
                required
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={taxDeductible}
                  onChange={(e) => setTaxDeductible(e.target.checked)}
                  className="rounded text-rose-600 cursor-pointer"
                />
                <span>Tax Deductible Expense</span>
              </label>
            </div>
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
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Record Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
