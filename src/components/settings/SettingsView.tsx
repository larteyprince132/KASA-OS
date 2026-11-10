import React, { useState } from 'react';
import {
  Building2,
  Globe,
  DollarSign,
  MapPin,
  Download,
  RotateCcw,
  Sparkles,
  Plus,
  Check,
  Shield,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IndustryType, Organization, Branch } from '../../types';

const INDUSTRY_CONFIGS: { id: IndustryType; label: string; desc: string }[] = [
  { id: 'distribution', label: 'Distribution & Wholesale', desc: 'Warehousing, bulk consignment procurement, multi-branch depots, credit terms.' },
  { id: 'retail', label: 'Retail & Supermarket', desc: 'Fast counter sales, barcode scanning, cash register, low stock reorders.' },
  { id: 'hospitality', label: 'Restaurant & Hospitality', desc: 'Food ingredients, table orders, bill splitting, perishable inventory.' },
  { id: 'automotive', label: 'Automotive Workshop & Parts', desc: 'Spare parts stock, service labour billing, mechanic work orders.' },
  { id: 'manufacturing', label: 'Manufacturing & Assembly', desc: 'Raw material procurement, bill of materials, finished goods stock-in.' },
  { id: 'professional_services', label: 'Professional Services', desc: 'Consulting hourly billing, retainer invoices, project expense tracking.' },
  { id: 'general', label: 'General Enterprise', desc: 'Universal SME operating workflows for diverse commerce.' },
];

const CURRENCY_OPTIONS = [
  { code: 'GHS', symbol: 'GH₵', label: 'Ghana Cedi (GHS)' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD)' },
  { code: 'NGN', symbol: '₦', label: 'Nigerian Naira (NGN)' },
  { code: 'KES', symbol: 'KSh', label: 'Kenyan Shilling (KES)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP)' },
];

export const SettingsView: React.FC = () => {
  const { data, updateOrgProfile, createOrg, resetToDemo, knownOrgs, switchOrg } = useApp();

  const [name, setName] = useState(data.org.name);
  const [industry, setIndustry] = useState<IndustryType>(data.org.industry);
  const [description, setDescription] = useState(data.org.description);
  const [country, setCountry] = useState(data.org.country);
  const [currency, setCurrency] = useState(data.org.currency);
  const [currencySymbol, setCurrencySymbol] = useState(data.org.currencySymbol);
  const [taxRate, setTaxRate] = useState(data.org.taxRatePercent.toString());
  const [taxId, setTaxId] = useState(data.org.taxIdentificationNumber || '');

  // Branch management state
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLocation, setNewBranchLocation] = useState('');
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);

  // Onboarding modal state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardName, setOnboardName] = useState('');
  const [onboardIndustry, setOnboardIndustry] = useState<IndustryType>('retail');
  const [onboardCountry, setOnboardCountry] = useState('Ghana');
  const [onboardCurrency, setOnboardCurrency] = useState('GHS');
  const [onboardEmployees, setOnboardEmployees] = useState('5');
  const [onboardDescription, setOnboardDescription] = useState('');

  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    const found = CURRENCY_OPTIONS.find((c) => c.code === code);
    if (found) {
      setCurrencySymbol(found.symbol);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgProfile({
      name,
      industry,
      description,
      country,
      currency,
      currencySymbol,
      taxRatePercent: parseFloat(taxRate) || 0,
      taxIdentificationNumber: taxId,
    });
  };

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    const newBranch: Branch = {
      id: `br-${Date.now()}`,
      name: newBranchName.trim(),
      code: `BR-0${data.org.branches.length + 1}`,
      location: newBranchLocation.trim() || 'Secondary Branch',
      isMain: false,
    };

    updateOrgProfile({
      branches: [...data.org.branches, newBranch],
    });

    setNewBranchName('');
    setNewBranchLocation('');
    setIsAddBranchOpen(false);
  };

  const handleCompleteOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardName.trim()) return;

    const currencyObj = CURRENCY_OPTIONS.find((c) => c.code === onboardCurrency);

    createOrg({
      name: onboardName.trim(),
      industry: onboardIndustry,
      description: onboardDescription.trim() || `Commercial business operations for ${onboardName}`,
      country: onboardCountry,
      currency: onboardCurrency,
      currencySymbol: currencyObj?.symbol || 'GH₵',
      employeeCount: parseInt(onboardEmployees) || 1,
    });

    setIsOnboardingOpen(false);
  };

  const handleExportSystemJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kasa_os_backup_${data.org.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Organization Settings & Multi-Tenant Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure regional currency, industry workflow modules, tax identification, and branch networks.
          </p>
        </div>

        <button
          onClick={() => setIsOnboardingOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Register New Business</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Profile & Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form */}
          <form onSubmit={handleSaveProfile} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Business Profile & Regional Parameters</h3>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Organization Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Operating Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Industry Module Workflow</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value as IndustryType)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden cursor-pointer"
                >
                  {INDUSTRY_CONFIGS.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      {ind.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operating Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden cursor-pointer"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Tax / VAT %</label>
                <input
                  type="number"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax Identification Number (TIN / GRA)</label>
              <input
                type="text"
                placeholder="e.g. TIN-P0029481920"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>

          {/* Branch Network */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Branches & Warehouses ({data.org.branches.length})</h3>
                <p className="text-slate-500">Manage multiple sales depots and storage locations</p>
              </div>
              <button
                onClick={() => setIsAddBranchOpen(true)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer"
              >
                + Add Branch
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {data.org.branches.map((b) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-bold text-slate-900">{b.name}</p>
                      <p className="text-slate-500 text-[11px]">{b.location}</p>
                    </div>
                  </div>
                  {b.isMain ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      Main Headquarters
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      Depot Branch
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Backups, Organizations & Reset */}
        <div className="space-y-4 text-xs">
          {/* Organization Switcher Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Multi-Tenant Organizations</h3>
            <p className="text-slate-500 text-[11px]">
              KASA OS isolates all ledger records, invoices, customers, and stock per tenant:
            </p>

            <div className="space-y-1.5">
              {knownOrgs.map((o) => (
                <button
                  key={o.id}
                  onClick={() => switchOrg(o.id)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    o.id === data.org.id
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="truncate">{o.name}</span>
                  {o.id === data.org.id && <span className="text-[10px] text-emerald-600">Active</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Backup & Data Export */}
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Data Backup & Portability</h3>
            <p className="text-slate-500 text-[11px]">
              Download an encrypted, self-contained JSON snapshot of all your organization tables, audit logs, and double-entry journals:
            </p>

            <button
              onClick={handleExportSystemJSON}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded font-bold cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Full JSON Backup</span>
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-rose-900 text-sm">Demonstration Organization Reset</h3>
            <p className="text-slate-500 text-[11px]">
              Re-populate this workspace with the authentic Ghanaian SME trade records (cement, rebar, roofing, Adom Construction, MoMo transactions).
            </p>

            <button
              onClick={resetToDemo}
              className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded font-bold cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Reset to Demo Records</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Branch Modal */}
      {isAddBranchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Branch / Warehouse</h3>
            <form onSubmit={handleAddBranch} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kumasi Depot or Tema Warehouse"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Location</label>
                <input
                  type="text"
                  placeholder="e.g. Suame Roundabout, Kumasi"
                  value={newBranchLocation}
                  onChange={(e) => setNewBranchLocation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddBranchOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Business Onboarding Wizard Modal */}
      {isOnboardingOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl my-8 overflow-hidden text-xs">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-600 rounded">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold">Business Onboarding Wizard</h2>
                  <p className="text-slate-400">Initialize a new isolated business instance on KASA OS</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCompleteOnboarding} className="p-5 space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Gold Coast Logistics Ltd or Accra Auto Care..."
                  value={onboardName}
                  onChange={(e) => setOnboardName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Industry Profile</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {INDUSTRY_CONFIGS.map((ind) => (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => setOnboardIndustry(ind.id)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                        onboardIndustry === ind.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="text-xs">{ind.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5 line-clamp-2">
                        {ind.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operating Country</label>
                  <input
                    type="text"
                    value={onboardCountry}
                    onChange={(e) => setOnboardCountry(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Base Currency</label>
                  <select
                    value={onboardCurrency}
                    onChange={(e) => setOnboardCurrency(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden cursor-pointer"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Main Business Description</label>
                <input
                  type="text"
                  placeholder="e.g. Wholesale trade, parts servicing, freight forwarding..."
                  value={onboardDescription}
                  onChange={(e) => setOnboardDescription(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOnboardingOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Launch Organization</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
