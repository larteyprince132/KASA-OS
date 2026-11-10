import React, { useState } from 'react';
import { UserCheck, Plus, Shield, User, Building, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole, UserProfile } from '../../types';

export const EmployeesView: React.FC = () => {
  const { data } = useApp();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [branchId, setBranchId] = useState(data.org.branches[0]?.id || '');

  const ROLE_BADGES: Record<UserRole, { label: string; color: string }> = {
    owner: { label: 'Business Owner', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    admin: { label: 'Administrator', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    accountant: { label: 'Chartered Accountant', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    manager: { label: 'Branch Manager', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    cashier: { label: 'Sales Cashier', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  };

  const PERMISSION_MATRIX = [
    { module: 'Overview & Analytics', owner: true, admin: true, accountant: true, manager: true, cashier: false },
    { module: 'Record Customer Sales', owner: true, admin: true, accountant: true, manager: true, cashier: true },
    { module: 'Receive Supplier Bills', owner: true, admin: true, accountant: true, manager: true, cashier: false },
    { module: 'Double-Entry General Ledger', owner: true, admin: true, accountant: true, manager: false, cashier: false },
    { module: 'Operating Expenses', owner: true, admin: true, accountant: true, manager: false, cashier: false },
    { module: 'Stock Reconciliations', owner: true, admin: true, accountant: false, manager: true, cashier: false },
    { module: 'Debt & AP Settlements', owner: true, admin: true, accountant: true, manager: false, cashier: false },
    { module: 'KASA AI CFO Queries', owner: true, admin: true, accountant: true, manager: true, cashier: false },
    { module: 'Organization Settings', owner: true, admin: true, accountant: false, manager: false, cashier: false },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Staff Members & Role-Based Access (RBAC)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure multi-user permissions segregated across management, branch operations, and accounting.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Employee</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Active Organization Users ({data.users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Assigned Branch</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {data.users.map((user) => {
                const branch = data.org.branches.find((b) => b.id === user.branchId);
                const roleBadge = ROLE_BADGES[user.role] || { label: user.role, color: 'bg-slate-100' };

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs uppercase">
                        {user.name.charAt(0)}
                      </div>
                      <span>{user.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{branch?.name || 'All Branches'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold uppercase">
                        Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Permission Matrix */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-700" />
          <h3 className="font-bold text-slate-900 text-sm">Role-Based Security Matrix</h3>
        </div>
        <p className="text-slate-500 text-xs">
          Enforced server-side and in Firestore rules to guarantee complete tenant and operational segregation.
        </p>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border border-slate-200 rounded">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Operational Capability</th>
                <th className="p-2.5 text-center">Owner</th>
                <th className="p-2.5 text-center">Admin</th>
                <th className="p-2.5 text-center">Accountant</th>
                <th className="p-2.5 text-center">Manager</th>
                <th className="p-2.5 text-center">Cashier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PERMISSION_MATRIX.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2.5 font-medium text-slate-800">{row.module}</td>
                  <td className="p-2.5 text-center">
                    {row.owner ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="p-2.5 text-center">
                    {row.admin ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="p-2.5 text-center">
                    {row.accountant ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="p-2.5 text-center">
                    {row.manager ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="p-2.5 text-center">
                    {row.cashier ? <Check className="w-4 h-4 text-emerald-600 mx-auto" /> : <X className="w-4 h-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl p-5 text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Team Member</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim() || !email.trim()) return;
                const updated = structuredClone(data);
                updated.users.push({
                  id: `usr-${Date.now()}`,
                  orgId: data.org.id,
                  name: name.trim(),
                  email: email.trim(),
                  role,
                  branchId,
                  status: 'active',
                });
                data.users = updated.users;
                setIsAddOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kwame Boateng"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corporate Email</label>
                <input
                  type="email"
                  placeholder="employee@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden cursor-pointer"
                  >
                    <option value="cashier">Sales Cashier</option>
                    <option value="manager">Branch Manager</option>
                    <option value="accountant">Accountant</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branch</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden cursor-pointer"
                  >
                    {data.org.branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
