import React, { useState } from 'react';
import { X, PackagePlus, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { round2 } from '../../utils/accounting';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProductModal: React.FC<NewProductModalProps> = ({ isOpen, onClose }) => {
  const { data, addProduct } = useApp();
  const symbol = data.org.currencySymbol;

  const [name, setName] = useState('');
  const [sku, setSku] = useState(`SKU-${Date.now().toString().slice(-5)}`);
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('General Merchandise');
  const [unit, setUnit] = useState('pcs');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [initialStock, setInitialStock] = useState('10');
  const [minReorderPoint, setMinReorderPoint] = useState('5');
  const [isService, setIsService] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Product name is required');
      return;
    }

    const cost = round2(parseFloat(purchaseCost) || 0);
    const price = round2(parseFloat(sellingPrice) || 0);
    const stock = parseInt(initialStock) || 0;
    const reorder = parseInt(minReorderPoint) || 5;

    addProduct({
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim() || undefined,
      category: category.trim(),
      unit: unit.trim(),
      purchaseCost: cost,
      sellingPrice: price,
      stockQuantity: isService ? 9999 : stock,
      minReorderPoint: isService ? 0 : reorder,
      branchStock: {
        [data.org.activeBranchId]: isService ? 9999 : stock,
      },
      isService,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl my-8 overflow-hidden text-xs">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 rounded">
              <PackagePlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Add Catalog Product / Service</h2>
              <p className="text-slate-400">Define pricing, unit, SKU, and reorder levels</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Product or Service Name</label>
            <input
              type="text"
              placeholder="e.g. Steel Rebar 12mm or Site Inspection Service..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU Code</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono focus:border-emerald-600 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Barcode / EAN (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 6034110091..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <input
                type="text"
                placeholder="e.g. Building Materials, Plumbing..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
              <input
                type="text"
                placeholder="pcs, bag, kg, pack, trip, hrs..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Purchase Cost</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 font-mono text-slate-400">{symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value)}
                  className="w-full p-2 pl-9 bg-slate-50 border border-slate-300 rounded font-mono focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Selling Price</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 font-mono text-slate-400">{symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full p-2 pl-9 bg-slate-50 border border-slate-300 rounded font-mono font-bold focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={isService}
                onChange={(e) => setIsService(e.target.checked)}
                className="rounded text-emerald-600 cursor-pointer"
              />
              <span>This is a non-inventory Service or Labour item</span>
            </label>
          </div>

          {!isService && (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Opening Stock</label>
                <input
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono text-center focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Min Reorder Alert</label>
                <input
                  type="number"
                  min="0"
                  value={minReorderPoint}
                  onChange={(e) => setMinReorderPoint(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono text-center focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>
            </div>
          )}

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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
