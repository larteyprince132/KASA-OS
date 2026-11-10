import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  BookOpen,
  Receipt,
  Boxes,
  Users,
  Building2,
  FileText,
  BarChart3,
  Bot,
  MessageSquarePlus,
  UserCheck,
  Settings,
  ChevronDown,
  Sparkles,
  MapPin,
  X,
} from 'lucide-react';
import { useApp, NavView } from '../../context/AppContext';
import { IndustryType } from '../../types';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const INDUSTRY_LABELS: Record<IndustryType, string> = {
  distribution: 'Distribution & Wholesale',
  retail: 'Retail & Commerce',
  hospitality: 'Hospitality & Dining',
  automotive: 'Automotive Workshop',
  professional_services: 'Professional Services',
  manufacturing: 'Manufacturing & Assembly',
  general: 'General Enterprise',
};

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const { data, activeView, setActiveView, isDemoOrg, knownOrgs, switchOrg, activeBranchId, setActiveBranchId } =
    useApp();
  const [orgDropdownOpen, setOrgDropdownOpen] = React.useState(false);

  const navItems: { id: NavView; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'overview', label: 'Business Overview', icon: LayoutDashboard },
    { id: 'sales', label: 'Sales & Invoicing', icon: ShoppingCart },
    { id: 'purchases', label: 'Purchases & Bills', icon: Truck },
    { id: 'transactions', label: 'Ledger & Accounts', icon: BookOpen },
    { id: 'expenses', label: 'Operating Expenses', icon: Receipt },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: Boxes,
      badge: data.products.filter((p) => !p.isService && p.stockQuantity <= p.minReorderPoint).length > 0 ? 'Alert' : undefined,
    },
    {
      id: 'customers',
      label: 'Customers & Receivables',
      icon: Users,
      badge: data.customers.filter((c) => c.outstandingBalance > 0).length > 0 ? `${data.customers.filter((c) => c.outstandingBalance > 0).length}` : undefined,
    },
    { id: 'suppliers', label: 'Suppliers & Payables', icon: Building2 },
    { id: 'invoices', label: 'Invoices & Receipts', icon: FileText },
    { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
    { id: 'intelligence', label: 'KASA Intelligence', icon: Bot, badge: 'AI' },
    { id: 'entry', label: 'Conversational Entry', icon: MessageSquarePlus, badge: 'New' },
    { id: 'employees', label: 'Staff & Roles', icon: UserCheck },
    { id: 'settings', label: 'Organization Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-68 bg-slate-950 text-slate-200 border-r border-slate-800/80 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand & Organization Header */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-md bg-emerald-600 flex items-center justify-center text-white font-black text-lg tracking-wider shadow-xs shadow-emerald-900/50">
                K
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-white tracking-tight">KASA OS</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded">
                    Enterprise
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Business Operating System</p>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Organization Switcher */}
          <div className="relative">
            <button
              onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
              className="w-full text-left p-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800/90 flex items-center justify-between gap-2 transition-colors cursor-pointer"
            >
              <div className="truncate min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{data.org.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-400 truncate">
                    {INDUSTRY_LABELS[data.org.industry] || data.org.industry}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${orgDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown popup */}
            {orgDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl z-50 p-1.5 text-xs">
                <div className="px-2 py-1 text-[10px] uppercase font-mono text-slate-400">Switch Organization</div>
                {knownOrgs.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      switchOrg(o.id);
                      setOrgDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded text-xs flex items-center justify-between hover:bg-slate-800 cursor-pointer ${
                      o.id === data.org.id ? 'bg-emerald-950/60 text-emerald-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <span className="truncate">{o.name}</span>
                    {o.id === data.org.id && <span className="text-[10px] text-emerald-400">Active</span>}
                  </button>
                ))}
                <div className="border-t border-slate-800 my-1"></div>
                <button
                  onClick={() => {
                    setActiveView('settings');
                    setOrgDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-emerald-400 hover:bg-slate-800 rounded text-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  + Register New Business
                </button>
              </div>
            )}
          </div>

          {/* Branch Switcher */}
          {data.org.branches && data.org.branches.length > 1 && (
            <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-slate-900/60 rounded text-[11px] text-slate-400 border border-slate-800/60">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="shrink-0 text-slate-400">Branch:</span>
              <select
                value={activeBranchId}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="bg-transparent text-slate-300 font-medium truncate focus:outline-hidden cursor-pointer"
              >
                {data.org.branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Demo Mode Badge */}
        {isDemoOrg && (
          <div className="mx-3 mt-2.5 px-2.5 py-1.5 bg-emerald-950/40 border border-emerald-800/40 rounded-md flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-medium">Demo Mode (Ghana SME)</span>
            <span className="font-mono text-[10px] text-emerald-300 bg-emerald-900/80 px-1 rounded">Active</span>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5 text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors cursor-pointer group ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs shadow-emerald-950'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : item.badge === 'Alert'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : item.badge === 'AI'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User status */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs uppercase">
              {data.users[0]?.name ? data.users[0].name.charAt(0) : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-slate-200 font-medium truncate text-[11px]">{data.users[0]?.name || 'Admin'}</p>
              <p className="text-slate-400 text-[10px] capitalize font-mono">{data.users[0]?.role || 'Owner'}</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="System Online & Syncing"></span>
        </div>
      </aside>
    </>
  );
};
