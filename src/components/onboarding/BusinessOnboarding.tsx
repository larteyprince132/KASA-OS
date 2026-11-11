import React, { useState } from 'react';
import {
  Building2,
  Store,
  Layers,
  Boxes,
  Tractor,
  Utensils,
  Briefcase,
  Wrench,
  ShoppingCart,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Coins,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { IndustryType } from '../../types';

export const BusinessOnboarding: React.FC = () => {
  const { user, completeOnboarding, signOut } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [industry, setIndustry] = useState<IndustryType>('retail');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [country, setCountry] = useState<string>('Ghana');
  const [currency, setCurrency] = useState<string>('GHS');
  const [currencySymbol, setCurrencySymbol] = useState<string>('GH₵');

  const industries: { id: IndustryType; name: string; desc: string; icon: any }[] = [
    { id: 'retail', name: 'Retail', desc: 'Storefront sales, inventory & barcode POS', icon: Store },
    { id: 'wholesale', name: 'Wholesale & Distribution', desc: 'Bulk trade orders & debtor credit', icon: Layers },
    { id: 'manufacturing', name: 'Manufacturing', desc: 'Raw materials, batch costs & finished goods', icon: Boxes },
    { id: 'agriculture', name: 'Agriculture & Farming', desc: 'Crops, livestock, farm inputs & sales', icon: Tractor },
    { id: 'hospitality', name: 'Hospitality & Dining', desc: 'Food, beverages & supplier orders', icon: Utensils },
    { id: 'services', name: 'Professional Services', desc: 'Client retainers, services & invoices', icon: Briefcase },
    { id: 'construction', name: 'Construction & Works', desc: 'Materials, subcontractor payables & drawdowns', icon: Building2 },
    { id: 'automotive', name: 'Automotive & Workshop', desc: 'Parts inventory, repairs & job cards', icon: Wrench },
    { id: 'ecommerce', name: 'E-commerce', desc: 'Online sales catalog & shipping management', icon: ShoppingCart },
    { id: 'other', name: 'Other Business Type', desc: 'Standard trade, services & finance tracking', icon: Globe },
  ];

  const currencies = [
    { code: 'GHS', symbol: 'GH₵', name: 'Ghana Cedi (GHS)' },
    { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
    { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
    { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira (NGN)' },
    { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling (KES)' },
  ];

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    const found = currencies.find((c) => c.code === code);
    if (found) setCurrencySymbol(found.symbol);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding({
        name,
        industry,
        email: email || user?.email || '',
        phone,
        address,
        country,
        currency,
        currencySymbol,
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl w-full mx-auto">
        {/* Onboarding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              K
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-neutral-900">KASA OS</span>
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-900">Setup Your Business Workspace</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Complete this 4-step wizard to initialize your isolated business operating system.
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    step === s
                      ? 'bg-neutral-900 text-white ring-4 ring-neutral-200'
                      : step > s
                      ? 'bg-emerald-600 text-white'
                      : 'bg-neutral-200 text-neutral-500'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 4 && <div className={`w-8 h-0.5 ${step > s ? 'bg-emerald-600' : 'bg-neutral-300'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden">
          {/* STEP 1: Account Confirmation */}
          {step === 1 && (
            <div className="p-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                Step 1 of 4 • Account Confirmed
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Welcome, {user?.displayName || 'Business Owner'}!</h3>
              <p className="text-sm text-neutral-600 mt-1 mb-6">
                Your user profile is verified. Next, let&apos;s set up your business identity and workspace.
              </p>

              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 mb-8">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Authenticated Email:</span>
                  <span className="font-semibold text-neutral-900">{user?.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Account Type:</span>
                  <span className="font-semibold text-emerald-700">Business Workspace Owner</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Workspace Status:</span>
                  <span className="font-semibold text-neutral-600">Uninitialized (Clean Zero State)</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-xs font-semibold text-neutral-500 hover:text-neutral-800"
                >
                  Sign Out / Switch Account
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all flex items-center gap-2"
                >
                  Continue to Business Name <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Business Name */}
          {step === 2 && (
            <div className="p-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                Step 2 of 4 • Business Identity
              </div>
              <h3 className="text-xl font-bold text-neutral-900">What is your business called?</h3>
              <p className="text-sm text-neutral-600 mt-1 mb-6">
                Enter your registered enterprise name or brand. This will appear on all your invoices, tax receipts, and financial statements.
              </p>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Business Name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Apex Global Logistics Ltd or Blue Ribbon Bakery"
                      className="w-full pl-10 pr-4 py-3 text-base rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Your business will be provisioned in an isolated workspace with its own dedicated ledger, products, customers, and financial reports.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={!name.trim()}
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  Select Industry <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Industry Selection */}
          {step === 3 && (
            <div className="p-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                Step 3 of 4 • Industry Classification
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Select your industry profile</h3>
              <p className="text-sm text-neutral-600 mt-1 mb-6">
                Choose the industry that matches your operations. This customizes your workflows, catalog attributes, and reporting metrics.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-h-96 overflow-y-auto pr-1">
                {industries.map((ind) => {
                  const Icon = ind.icon;
                  const isSelected = industry === ind.id;
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => setIndustry(ind.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-sm'
                          : 'border-neutral-200 bg-white hover:bg-neutral-50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-neutral-900">{ind.name}</div>
                        <div className="text-xs text-neutral-500 mt-0.5 leading-snug">{ind.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all flex items-center gap-2"
                >
                  Contact & Regional Settings <ArrowRight className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Contact & Regional Information */}
          {step === 4 && (
            <div className="p-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                Step 4 of 4 • Contact & Regional Details
              </div>
              <h3 className="text-xl font-bold text-neutral-900">Complete business details</h3>
              <p className="text-sm text-neutral-600 mt-1 mb-6">
                Configure your operating currency, regional settings, and contact information.
              </p>

              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Primary Operating Currency</label>
                    <div className="relative">
                      <Coins className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={currency}
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      >
                        {currencies.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name} ({c.symbol})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Country</label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. Ghana, Nigeria, UK, US"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Contact Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +233 24 123 4567"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Business Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="info@yourcompany.com"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Physical Address / Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Spintex Road, Accra or Industrial Area"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={loading || !name.trim()}
                  onClick={handleFinish}
                  className="px-8 py-3 rounded-xl text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Initializing Workspace...</span>
                  ) : (
                    <>
                      <span>Launch Business Workspace</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
