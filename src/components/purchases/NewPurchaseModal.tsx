import React, { useState } from 'react';
import { X, Plus, Trash2, Truck, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Purchase, PurchaseItem } from '../../types';
import { formatCurrency, round2 } from '../../utils/accounting';

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({ isOpen, onClose }) => {
  const { data, recordPurchase } = useApp();
  const symbol = data.org.currencySymbol;

  const [supplierId, setSupplierId] = useState<string>(data.suppliers[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo' | 'bank_transfer' | 'cheque'>('bank_transfer');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<Array<{
    productId: string;
    quantity: number;
    unitCost: number;
  }>>([
    {
      productId: data.products[0]?.id || '',
      quantity: 10,
      unitCost: data.products[0]?.purchaseCost || 0,
    },
  ]);

  const [isFullPayment, setIsFullPayment] = useState(false);
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');

  if (!isOpen) return null;

  const handleProductChange = (index: number, productId: string) => {
    const prod = data.products.find((p) => p.id === productId);
    const updated = [...items];
    updated[index] = {
      productId,
      quantity: updated[index].quantity,
      unitCost: prod ? prod.purchaseCost : 0,
    };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, quantity);
    setItems(updated);
  };

  const handleCostChange = (index: number, unitCost: number) => {
    const updated = [...items];
    updated[index].unitCost = Math.max(0, unitCost);
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        productId: data.products[0]?.id || '',
        quantity: 10,
        unitCost: data.products[0]?.purchaseCost || 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  let totalAmount = 0;
  const processedItems: PurchaseItem[] = [];

  for (const it of items) {
    const prod = data.products.find((p) => p.id === it.productId);
    const lineTotal = round2(it.quantity * it.unitCost);
    totalAmount += lineTotal;

    processedItems.push({
      productId: it.productId,
      productName: prod ? prod.name : 'Procured Item',
      sku: prod ? prod.sku : 'PROC',
      quantity: it.quantity,
      unitCost: it.unitCost,
      total: lineTotal,
    });
  }

  const selectedSupplier = data.suppliers.find((s) => s.id === supplierId);
  const supplierName = selectedSupplier?.name || 'Trade Vendor';

  const parsedPaid = isFullPayment
    ? totalAmount
    : Math.min(totalAmount, Math.max(0, parseFloat(paidAmountInput) || 0));
  const balanceAmount = round2(Math.max(0, totalAmount - parsedPaid));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      alert('Please select a supplier');
      return;
    }

    const billNumber = `BILL-${new Date().getFullYear()}-${String(data.purchases.length + 101).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newPurchase: Purchase = {
      id: `purch-${Date.now()}`,
      orgId: data.org.id,
      branchId: data.org.activeBranchId,
      billNumber,
      supplierId,
      supplierName,
      date: today,
      dueDate: today,
      items: processedItems,
      totalAmount,
      paidAmount: parsedPaid,
      balanceAmount,
      paymentStatus: balanceAmount <= 0 ? 'paid' : parsedPaid > 0 ? 'partial' : 'unpaid',
      paymentMethod,
      status: 'received',
      notes,
      createdAt: new Date().toISOString(),
    };

    recordPurchase(newPurchase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Receive Supplier Purchase Bill</h2>
              <p className="text-xs text-slate-400">Restock inventory & recognize accounts payable liability</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Supplier Selector */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">Supplier / Vendor</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden cursor-pointer"
              required
            >
              {data.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Outstanding: {formatCurrency(s.outstandingBalance, symbol)})
                </option>
              ))}
            </select>
          </div>

          {/* Product Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">Merchandise Items</label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex-1 min-w-0">
                    <select
                      value={it.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                    >
                      {data.products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Current: {p.stockQuantity} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                      className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded text-center focus:border-blue-600 focus:outline-hidden"
                      title="Quantity"
                    />
                  </div>

                  <div className="w-28">
                    <div className="relative">
                      <span className="absolute left-1.5 top-1.5 text-[10px] text-slate-400 font-mono">{symbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={it.unitCost}
                        onChange={(e) => handleCostChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-1.5 pl-6 bg-white border border-slate-300 rounded font-mono text-right focus:border-blue-600 focus:outline-hidden"
                        title="Unit Cost"
                      />
                    </div>
                  </div>

                  <div className="w-24 text-right font-mono font-bold text-xs text-slate-900 shrink-0">
                    {formatCurrency(round2(it.quantity * it.unitCost), symbol)}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length <= 1}
                    className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Channel</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden cursor-pointer"
              >
                <option value="bank_transfer">Bank Wire / Transfer</option>
                <option value="momo">Mobile Money</option>
                <option value="cheque">Bank Cheque</option>
                <option value="cash">Cash Disbursement</option>
              </select>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Bill Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Waybill #1092, batch cert..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                <span>Total Bill Amount</span>
                <span className="font-mono">{formatCurrency(totalAmount, symbol)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">Initial Downpayment</label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFullPayment}
                      onChange={(e) => setIsFullPayment(e.target.checked)}
                      className="rounded text-blue-600 cursor-pointer"
                    />
                    <span>Paid in full</span>
                  </label>
                </div>

                {!isFullPayment && (
                  <div className="mt-1.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-xs font-mono text-slate-400">{symbol}</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount paid now"
                        value={paidAmountInput}
                        onChange={(e) => setPaidAmountInput(e.target.value)}
                        className="w-full text-xs p-1.5 pl-8 bg-white border border-slate-300 rounded font-mono focus:border-blue-600 focus:outline-hidden"
                      />
                    </div>
                    <div className="mt-1 flex justify-between font-mono font-semibold text-purple-800 text-xs">
                      <span>Accounts Payable (AP):</span>
                      <span>{formatCurrency(balanceAmount, symbol)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Post Bill & Restock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
