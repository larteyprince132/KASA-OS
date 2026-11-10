import React, { useState } from 'react';
import { X, UserPlus, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { round2 } from '../../utils/accounting';

interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewCustomerModal: React.FC<NewCustomerModalProps> = ({ isOpen, onClose }) => {
  const { data, addCustomer } = useApp();
  const symbol = data.org.currencySymbol;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+233 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [creditLimit, setCreditLimit] = useState('5000');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Customer name is required');
      return;
    }

    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      taxNumber: taxNumber.trim() || undefined,
      creditLimit: round2(parseFloat(creditLimit) || 0),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl my-8 overflow-hidden text-xs">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-600 rounded">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Register Customer Account</h2>
              <p className="text-slate-400">Establish credit limits and contact profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company / Individual Name</label>
            <input
              type="text"
              placeholder="e.g. Adom Construction Ltd (Yaw Darko)..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+233 24 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono focus:border-emerald-600 focus:outline-hidden"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="client@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Physical Delivery / Site Address</label>
            <input
              type="text"
              placeholder="e.g. Spintex Road, Accra..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Authorized Credit Limit</label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 font-mono text-slate-400">{symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                  className="w-full p-2 pl-9 bg-slate-50 border border-slate-300 rounded font-mono focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">TIN / VAT (Optional)</label>
              <input
                type="text"
                placeholder="C000..."
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono focus:border-emerald-600 focus:outline-hidden"
              />
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Register Customer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
