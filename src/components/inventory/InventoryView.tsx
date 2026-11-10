import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Sliders,
  History,
  ArrowRightLeft,
  CheckCircle,
  X,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatCurrency, round2 } from '../../utils/accounting';

interface InventoryViewProps {
  onOpenNewProduct: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onOpenNewProduct }) => {
  const { data, adjustStock } = useApp();
  const symbol = data.org.currencySymbol;

  const [activeTab, setActiveTab] = useState<'catalog' | 'movements'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Adjustment Modal state
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('Physical Stock Count Discrepancy');

  const categories = Array.from(new Set(data.products.map((p) => p.category)));

  const filteredProducts = data.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchTerm));
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const newQty = parseInt(adjustmentQuantity);
    if (isNaN(newQty) || newQty < 0) {
      alert('Please enter a valid non-negative quantity');
      return;
    }

    adjustStock(adjustingProduct.id, newQty, adjustmentReason);
    setAdjustingProduct(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'catalog'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Merchandise Catalog & Valuation</span>
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'movements'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Stock Movement Ledger ({data.stockMovements.length})</span>
          </button>
        </div>

        {activeTab === 'catalog' && (
          <button
            onClick={onOpenNewProduct}
            className="mb-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Product / Service</span>
          </button>
        )}
      </div>

      {activeTab === 'catalog' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search products by SKU, name, barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="all">All Product Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">SKU / Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Unit</th>
                    <th className="py-3 px-4 text-right">Cost (WAC)</th>
                    <th className="py-3 px-4 text-right">Selling Price</th>
                    <th className="py-3 px-4 text-right">Gross Margin</th>
                    <th className="py-3 px-4 text-right">Current Stock</th>
                    <th className="py-3 px-4 text-right">Stock Valuation</th>
                    <th className="py-3 px-4 text-center">Stock Status</th>
                    <th className="py-3 px-4 text-center">Reconcile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProducts.map((p) => {
                    const isLowStock = !p.isService && p.stockQuantity <= p.minReorderPoint;
                    const margin = p.sellingPrice > 0 ? round2(((p.sellingPrice - p.purchaseCost) / p.sellingPrice) * 100) : 0;
                    const valuation = p.isService ? 0 : p.stockQuantity * p.purchaseCost;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-slate-400">
                            <span>SKU: {p.sku}</span>
                            {p.barcode && <span>• Barcode: {p.barcode}</span>}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.category}</td>
                        <td className="py-3 px-4 text-center font-mono uppercase text-slate-500">{p.unit}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {p.isService ? '—' : formatCurrency(p.purchaseCost, symbol)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(p.sellingPrice, symbol)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                          {p.isService ? '100%' : `${margin}%`}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {p.isService ? 'Service' : `${p.stockQuantity} ${p.unit}`}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {p.isService ? '—' : formatCurrency(valuation, symbol)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.isService ? (
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                              Unlimited
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                              <AlertTriangle className="w-3 h-3" /> Reorder Alert ({p.stockQuantity} &le; {p.minReorderPoint})
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                              Healthy Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {!p.isService && (
                            <button
                              onClick={() => {
                                setAdjustingProduct(p);
                                setAdjustmentQuantity(p.stockQuantity.toString());
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium cursor-pointer"
                            >
                              Adjust
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-500">
                        No merchandise products found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Stock Movement Ledger */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Stock Movement & Audit Trail</h3>
            <p className="text-xs text-slate-500">Every stock in, stock out, write-down, and delivery movement</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Quantity Change</th>
                  <th className="py-3 px-4 text-center">Stock Balance</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                {data.stockMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-sans text-slate-500">{mov.date}</td>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-900">{mov.productName}</td>
                    <td className="py-2.5 px-4 uppercase text-[10px] font-bold">
                      <span
                        className={`px-1.5 py-0.5 rounded ${
                          mov.type === 'purchase'
                            ? 'bg-blue-100 text-blue-800'
                            : mov.type === 'sale'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {mov.type}
                      </span>
                    </td>
                    <td
                      className={`py-2.5 px-4 text-center font-bold ${
                        mov.quantityChange > 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {mov.quantityChange > 0 ? `+${mov.quantityChange}` : mov.quantityChange}
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-900">{mov.balanceAfter}</td>
                    <td className="py-2.5 px-4 text-right">{formatCurrency(mov.unitCost, symbol)}</td>
                    <td className="py-2.5 px-4 text-slate-600">{mov.reference}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-500">{mov.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl p-5 text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Stock Level Adjustment</h3>
                <p className="text-slate-500">{adjustingProduct.name}</p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 flex justify-between">
                <span>Recorded System Count:</span>
                <span className="font-mono font-bold text-slate-900">
                  {adjustingProduct.stockQuantity} {adjustingProduct.unit}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Verified Physical Count</label>
                <input
                  type="number"
                  min="0"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-base focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Discrepancy</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="Physical Stock Count Discrepancy">Physical Stock Count Discrepancy</option>
                  <option value="Damaged / Broken in Transit">Damaged / Broken in Transit</option>
                  <option value="Spoilage or Weather Degradation">Spoilage or Weather Degradation</option>
                  <option value="Internal Yard Construction Usage">Internal Yard Construction Usage</option>
                  <option value="Supplier Over-Delivery Correction">Supplier Over-Delivery Correction</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Update Stock & Log Movement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
