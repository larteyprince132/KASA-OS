import React, { useState } from 'react';
import { Plus, Search, Building2, Phone, Mail, Wallet, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/accounting';

interface SuppliersViewProps {
  onOpenPaySupplier: (supplierId: string) => void;
  onOpenNewSupplier?: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  onOpenPaySupplier,
  onOpenNewSupplier,
}) => {
  const { data, metrics, addSupplier } = useApp();
  const symbol = data.org.currencySymbol;

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Supplier form state
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('+233 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [terms, setTerms] = useState('30');

  const filteredSuppliers = data.suppliers.filter((s) => {
    return (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm)
    );
  });

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addSupplier({
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      paymentTermsDays: parseInt(terms) || 30,
    });

    setName('');
    setContactPerson('');
    setEmail('');
    setAddress('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top metrics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Total Accounts Payable (Creditors)</span>
          <p className="text-xl font-bold font-mono text-purple-800 mt-1">
            {formatCurrency(metrics.outstandingPayables, symbol)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Short-term vendor trade liabilities</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Key Supply Partners</span>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1">{data.suppliers.length}</p>
          <p className="text-xs text-slate-400 mt-1">Manufacturers & wholesale importers</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">Vendor Relations</span>
            <p className="text-xs font-semibold text-slate-800 mt-1">Onboard New Supplier</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md flex items-center gap-1.5 text-xs shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search suppliers by name, representative, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md focus:border-blue-600 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Supplier Entity</th>
                <th className="py-3 px-4">Account Representative</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Factory / Depot Location</th>
                <th className="py-3 px-4 text-center">Payment Terms</th>
                <th className="py-3 px-4 text-right">Lifetime Procured</th>
                <th className="py-3 px-4 text-right">Outstanding Payable</th>
                <th className="py-3 px-4 text-center">Disbursement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{s.contactPerson || '—'}</td>
                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-mono text-[11px]">{s.phone}</div>
                    {s.email && <div className="text-slate-400 text-[10px]">{s.email}</div>}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{s.address}</td>
                  <td className="py-3 px-4 text-center font-mono">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-[10px]">
                      Net {s.paymentTermsDays} days
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">
                    {formatCurrency(s.totalPurchased, symbol)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {s.outstandingBalance > 0 ? (
                      <span className="text-purple-800">{formatCurrency(s.outstandingBalance, symbol)}</span>
                    ) : (
                      <span className="text-slate-400">{symbol} 0.00</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {s.outstandingBalance > 0 ? (
                      <button
                        onClick={() => onOpenPaySupplier(s.id)}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded font-semibold text-[11px] cursor-pointer inline-flex items-center gap-1"
                      >
                        <Wallet className="w-3 h-3 text-purple-700" />
                        <span>Pay Bill</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Settled</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    No suppliers found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl p-5 text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Register Vendor / Supplier</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company / Factory Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ghacem Ghana Ltd..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Sales Rep Name"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono focus:border-blue-600 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="orders@supplier.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Factory Location</label>
                  <input
                    type="text"
                    placeholder="Tema, Accra..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Terms (Days)</label>
                  <input
                    type="number"
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono text-center focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
