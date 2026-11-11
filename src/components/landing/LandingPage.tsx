import React, { useState } from 'react';
import {
  Building2,
  TrendingUp,
  Boxes,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  ChevronRight,
  Store,
  Layers,
  Wrench,
  Truck,
  HeartHandshake,
  Briefcase,
  Utensils,
  Tractor,
  ShoppingCart,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../auth/AuthModal';

export const LandingPage: React.FC = () => {
  const { isSuperAdmin, setCurrentView, loginAsSuperAdminOwner } = useAuth();
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot' | null>(null);

  const industries = [
    { name: 'Retail', icon: Store, desc: 'Point of sale, fast barcode lookup, customer credit tracking' },
    { name: 'Wholesale & Distribution', icon: Layers, desc: 'Bulk orders, tiered pricing, accounts receivable aging' },
    { name: 'Manufacturing', icon: Boxes, desc: 'Batch production, raw materials, bill of materials tracking' },
    { name: 'Agriculture', icon: Tractor, desc: 'Crop cycles, harvest yields, distributor sales, input costs' },
    { name: 'Hospitality', icon: Utensils, desc: 'Table service, kitchen inventory, supplier invoices' },
    { name: 'Professional Services', icon: Briefcase, desc: 'Retainers, service billing, client ledgers, expenses' },
    { name: 'Construction', icon: Building2, desc: 'Site materials, subcontractor payables, project drawdowns' },
    { name: 'Automotive', icon: Wrench, desc: 'Job cards, spare parts catalog, workshop work orders' },
    { name: 'E-commerce', icon: ShoppingCart, desc: 'Online order fulfillment, multi-channel stock sync' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              K
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-neutral-900">KASA OS</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Universal OS
                </span>
              </div>
              <p className="text-xs text-neutral-500">Business Operating System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAuthModalMode('login')}
              className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthModalMode('signup')}
              className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Universal Multi-Tenant Business Architecture</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 max-w-4xl mx-auto leading-tight">
          Know your business. Control your operations.{' '}
          <span className="text-emerald-700">Make better decisions.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto font-normal leading-relaxed">
          KASA OS is a universal business operating system built for modern enterprises. Manage sales, inventory,
          double-entry ledger financials, debtors, and suppliers in an isolated, high-performance workspace.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => setAuthModalMode('signup')}
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            Create Your Business Workspace <ArrowRight className="w-4.5 h-4.5 text-emerald-400" />
          </button>
          <button
            onClick={() => setAuthModalMode('login')}
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-xl transition-all"
          >
            Access Existing Workspace
          </button>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% Tenant Isolation
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Double-Entry General Ledger
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Weighted Average Cost (WAC)
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real-time Cloud Firestore
          </span>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-16 bg-white border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs uppercase font-bold tracking-widest text-emerald-700">Configurable By Industry</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-neutral-900">
              One common business engine, tailored workflows
            </p>
            <p className="mt-3 text-neutral-600 text-sm">
              Each registered business selects its industry during onboarding to activate specialized modules while maintaining a strict, auditable financial foundation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((ind) => {
              const Icon = ind.icon;
              return (
                <div
                  key={ind.name}
                  className="p-6 rounded-2xl border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-neutral-700 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="mt-4 font-bold text-neutral-900 text-base">{ind.name}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{ind.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Architecture & Security */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white border border-neutral-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Zero-Trust Isolation</h3>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              Every business record is stored in dedicated, cryptographically isolated collections. Business owners cannot see or access another organization's records under any circumstance.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-neutral-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center mb-5">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">Balanced Financial Engine</h3>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              Sales, collections, expenses, and supplier payments generate immutable double-entry journal entries. Accrual and cash accounting views ensure accurate bottom-line visibility.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-neutral-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-neutral-900">KASA AI Intelligence</h3>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
              An embedded AI CFO co-pilot powered by Gemini. Zero hallucination: answers are strictly grounded in verified inventory balances, aged debtors, and sales velocity.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-neutral-900 text-neutral-400 py-12 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              K
            </div>
            <span className="font-bold text-white tracking-tight">KASA OS Enterprise</span>
            <span className="text-xs text-neutral-500">| Universal Business Operating System</span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <span>Clean Multi-Tenant Architecture</span>
            <span>•</span>
            <span>Zero Seed State</span>
            <span>•</span>
            <button
              onClick={() => loginAsSuperAdminOwner()}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" /> Super Admin Portal (Platform Owner)
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {authModalMode && (
        <AuthModal initialMode={authModalMode} onClose={() => setAuthModalMode(null)} />
      )}
    </div>
  );
};
