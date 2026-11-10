import React, { useState } from 'react';
import { X, Plus, Trash2, ShoppingCart, AlertCircle, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sale, SaleItem } from '../../types';
import { formatCurrency, round2 } from '../../utils/accounting';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose }) => {
  const { data, recordSale } = useApp();
  const symbol = data.org.currencySymbol;

  const [customerId, setCustomerId] = useState<string>(data.customers[0]?.id || '');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [isQuickCustomer, setIsQuickCustomer] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'momo' | 'bank_transfer' | 'cheque'>('momo');
  const [notes, setNotes] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(data.org.taxRatePercent || 0);

  // Line items
  const [items, setItems] = useState<Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>>([
    {
      productId: data.products[0]?.id || '',
      quantity: 1,
      unitPrice: data.products[0]?.sellingPrice || 0,
    },
  ]);

  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [isFullPayment, setIsFullPayment] = useState(true);

  if (!isOpen) return null;

  const handleProductChange = (index: number, productId: string) => {
    const prod = data.products.find((p) => p.id === productId);
    const updated = [...items];
    updated[index] = {
      productId,
      quantity: updated[index].quantity,
      unitPrice: prod ? prod.sellingPrice : 0,
    };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, quantity);
    setItems(updated);
  };

  const handlePriceChange = (index: number, unitPrice: number) => {
    const updated = [...items];
    updated[index].unitPrice = Math.max(0, unitPrice);
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        productId: data.products[0]?.id || '',
        quantity: 1,
        unitPrice: data.products[0]?.sellingPrice || 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  let subtotal = 0;
  const processedItems: SaleItem[] = [];

  for (const it of items) {
    const prod = data.products.find((p) => p.id === it.productId);
    const lineSubtotal = round2(it.quantity * it.unitPrice);
    subtotal += lineSubtotal;

    processedItems.push({
      productId: it.productId,
      productName: prod ? prod.name : 'Custom Item',
      sku: prod ? prod.sku : 'CUSTOM',
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      unitCost: prod ? prod.purchaseCost : 0,
      discountPercent: 0,
      taxRatePercent: taxPercent,
      subtotal: lineSubtotal,
      total: lineSubtotal,
    });
  }

  const discountTotal = round2(subtotal * (discountPercent / 100));
  const afterDiscount = round2(subtotal - discountTotal);
  const taxTotal = round2(afterDiscount * (taxPercent / 100));
  const totalAmount = round2(afterDiscount + taxTotal);

  const parsedPaid = isFullPayment
    ? totalAmount
    : Math.min(totalAmount, Math.max(0, parseFloat(paidAmountInput) || 0));
  const balanceAmount = round2(Math.max(0, totalAmount - parsedPaid));

  const selectedCustomer = data.customers.find((c) => c.id === customerId);
  const customerName = isQuickCustomer
    ? newCustomerName || 'Walk-in Client'
    : selectedCustomer?.name || 'Walk-in Client';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isQuickCustomer && !customerId) {
      alert('Please select or specify a customer');
      return;
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(data.sales.length + 101).padStart(4, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      orgId: data.org.id,
      branchId: data.org.activeBranchId,
      invoiceNumber,
      customerId: isQuickCustomer ? `cust-quick-${Date.now()}` : customerId,
      customerName,
      date: today,
      dueDate: today,
      items: processedItems,
      subtotal,
      discountTotal,
      taxTotal,
      totalAmount,
      paidAmount: parsedPaid,
      balanceAmount,
      paymentStatus: balanceAmount <= 0 ? 'paid' : parsedPaid > 0 ? 'partial' : 'unpaid',
      paymentMethod,
      status: 'posted',
      notes,
      createdBy: data.users[0]?.id || 'usr-1',
      createdAt: new Date().toISOString(),
    };

    recordSale(newSale);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 rounded">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Record Customer Sale</h2>
              <p className="text-xs text-slate-400">Generate invoice, update inventory & post to ledger</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Customer Selection */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-800">Customer / Client</label>
              <button
                type="button"
                onClick={() => setIsQuickCustomer(!isQuickCustomer)}
                className="text-[11px] text-emerald-700 hover:underline cursor-pointer font-medium"
              >
                {isQuickCustomer ? 'Choose from existing' : '+ Walk-in / New Customer'}
              </button>
            </div>

            {isQuickCustomer ? (
              <input
                type="text"
                placeholder="Enter customer name or phone number..."
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-emerald-600 focus:outline-hidden"
                required
              />
            ) : (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-md focus:border-emerald-600 focus:outline-hidden cursor-pointer"
                required
              >
                {data.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Balance: {formatCurrency(c.outstandingBalance, symbol)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Product Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800">Products & Services</label>
              <button
                type="button"
                onClick={addItemRow}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((it, idx) => {
                const prod = data.products.find((p) => p.id === it.productId);
                return (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="flex-1 min-w-0">
                      <select
                        value={it.productId}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
                      >
                        {data.products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.isService ? 'Service' : `${p.stockQuantity} in stock`})
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
                        className="w-full text-xs p-1.5 bg-white border border-slate-300 rounded text-center focus:border-emerald-600 focus:outline-hidden"
                        title="Quantity"
                      />
                    </div>

                    <div className="w-28">
                      <div className="relative">
                        <span className="absolute left-1.5 top-1.5 text-[10px] text-slate-400 font-mono">{symbol}</span>
                        <input
                          type="number"
                          step="0.01"
                          value={it.unitPrice}
                          onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-full text-xs p-1.5 pl-6 bg-white border border-slate-300 rounded font-mono text-right focus:border-emerald-600 focus:outline-hidden"
                          title="Unit Price"
                        />
                      </div>
                    </div>

                    <div className="w-24 text-right font-mono font-bold text-xs text-slate-900 shrink-0">
                      {formatCurrency(round2(it.quantity * it.unitPrice), symbol)}
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
                );
              })}
            </div>
          </div>

          {/* Payment Details & Split */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden cursor-pointer"
              >
                <option value="momo">MTN / Telecel Mobile Money</option>
                <option value="cash">Cash on Hand</option>
                <option value="bank_transfer">Bank Wire / Transfer</option>
                <option value="cheque">Bank Cheque</option>
              </select>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Delivered to site, MoMo ref #99812..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal, symbol)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Tax / VAT ({taxPercent}%)</span>
                <span className="font-mono">{formatCurrency(taxTotal, symbol)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Amount</span>
                <span className="font-mono">{formatCurrency(totalAmount, symbol)}</span>
              </div>

              {/* Payment Split */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">Customer Payment</label>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFullPayment}
                      onChange={(e) => setIsFullPayment(e.target.checked)}
                      className="rounded text-emerald-600 cursor-pointer"
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
                        className="w-full text-xs p-1.5 pl-8 bg-white border border-slate-300 rounded font-mono focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>
                    <div className="mt-1 flex justify-between font-mono font-semibold text-amber-700 text-xs">
                      <span>Debt Owed (AR):</span>
                      <span>{formatCurrency(balanceAmount, symbol)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Post Sale & Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
