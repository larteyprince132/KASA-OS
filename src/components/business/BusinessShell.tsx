import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  TrendingUp,
  Package,
  Users,
  Truck,
  FileBarChart,
  Sparkles,
  Settings,
  LogOut,
  Plus,
  Lock,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Store,
  DollarSign,
  AlertCircle,
  Download,
  CheckCircle2,
  Calendar,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  Sale,
  Expense,
  Product,
  Customer,
  Supplier,
  BusinessMetrics,
} from '../../types';
import {
  getTenantSales,
  getTenantExpenses,
  getTenantProducts,
  getTenantCustomers,
  getTenantSuppliers,
  createTenantSale,
  createTenantExpense,
  createTenantProduct,
  createTenantCustomer,
  createTenantSupplier,
  updateTenantProductStock,
  calculateTenantMetrics,
} from '../../services/dataService';

export const BusinessShell: React.FC = () => {
  const { business, user, isSuperAdmin, signOut, setCurrentView } = useAuth();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'sales'
    | 'expenses'
    | 'profit'
    | 'inventory'
    | 'customers'
    | 'suppliers'
    | 'reports'
    | 'ai'
    | 'settings'
  >('overview');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Tenant Records (ZERO by default)
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Modals
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);

  // Form States for Modals
  const [saleForm, setSaleForm] = useState({
    customerId: '',
    customerName: '',
    productId: '',
    quantity: 1,
    unitPrice: 0,
    paidAmount: 0,
    paymentMethod: 'cash' as const,
    notes: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'utilities' as any,
    payee: '',
    amount: 0,
    paymentMethod: 'cash' as const,
    receiptRef: '',
    taxDeductible: true,
    notes: '',
  });

  const [productForm, setProductForm] = useState({
    sku: '',
    name: '',
    category: 'General',
    purchaseCost: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    minReorderPoint: 5,
    unit: 'pcs',
  });

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 1000,
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    email: '',
    contactPerson: '',
    paymentTerms: 'Net 30',
  });

  // AI Chat States
  const [aiMessage, setAiMessage] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Profit & Loss Accounting Toggle
  const [accountingBasis, setAccountingBasis] = useState<'accrual' | 'cash'>('accrual');

  // Load tenant data
  const loadTenantRecords = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const [s, e, p, c, sup] = await Promise.all([
        getTenantSales(business.id),
        getTenantExpenses(business.id),
        getTenantProducts(business.id),
        getTenantCustomers(business.id),
        getTenantSuppliers(business.id),
      ]);
      setSales(s);
      setExpenses(e);
      setProducts(p);
      setCustomers(c);
      setSuppliers(sup);
    } catch (err) {
      console.error('Failed to load tenant records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenantRecords();
  }, [business?.id]);

  if (!business) return null;

  const metrics: BusinessMetrics = calculateTenantMetrics(sales, expenses, products, customers, suppliers);
  const sym = business.currencySymbol || 'GH₵';

  // Handlers for record creation
  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === saleForm.productId);
    const cust = customers.find((c) => c.id === saleForm.customerId);

    const unitPrice = saleForm.unitPrice || prod?.sellingPrice || 0;
    const totalAmount = unitPrice * saleForm.quantity;
    const paid = Number(saleForm.paidAmount) || 0;
    const bal = Math.max(0, totalAmount - paid);

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      businessId: business.id,
      invoiceNumber: `INV-${Date.now().toString().slice(-4)}`,
      customerId: cust?.id || 'cust-walkin',
      customerName: cust?.name || saleForm.customerName || 'Walk-in Client',
      items: prod
        ? [{ productId: prod.id, productName: prod.name, quantity: saleForm.quantity, unitPrice, total: totalAmount }]
        : [{ productId: 'custom', productName: 'Custom Sale', quantity: saleForm.quantity, unitPrice, total: totalAmount }],
      totalAmount,
      paidAmount: paid,
      balanceAmount: bal,
      paymentStatus: bal <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      paymentMethod: saleForm.paymentMethod,
      date: new Date().toISOString().split('T')[0],
      notes: saleForm.notes,
      createdAt: new Date().toISOString(),
    };

    await createTenantSale(business.id, newSale);
    setShowNewSaleModal(false);
    setSaleForm({
      customerId: '',
      customerName: '',
      productId: '',
      quantity: 1,
      unitPrice: 0,
      paidAmount: 0,
      paymentMethod: 'cash',
      notes: '',
    });
    await loadTenantRecords();
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      businessId: business.id,
      category: expenseForm.category,
      payee: expenseForm.payee,
      amount: Number(expenseForm.amount) || 0,
      paymentMethod: expenseForm.paymentMethod,
      date: new Date().toISOString().split('T')[0],
      notes: expenseForm.notes,
      receiptRef: expenseForm.receiptRef,
      taxDeductible: expenseForm.taxDeductible,
      createdAt: new Date().toISOString(),
    };

    await createTenantExpense(business.id, newExp);
    setShowNewExpenseModal(false);
    setExpenseForm({
      category: 'utilities',
      payee: '',
      amount: 0,
      paymentMethod: 'cash',
      receiptRef: '',
      taxDeductible: true,
      notes: '',
    });
    await loadTenantRecords();
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      businessId: business.id,
      sku: productForm.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: productForm.name,
      category: productForm.category,
      purchaseCost: Number(productForm.purchaseCost) || 0,
      sellingPrice: Number(productForm.sellingPrice) || 0,
      stockQuantity: Number(productForm.stockQuantity) || 0,
      minReorderPoint: Number(productForm.minReorderPoint) || 5,
      unit: productForm.unit || 'pcs',
      createdAt: new Date().toISOString(),
    };

    await createTenantProduct(business.id, newProd);
    setShowNewProductModal(false);
    setProductForm({
      sku: '',
      name: '',
      category: 'General',
      purchaseCost: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      minReorderPoint: 5,
      unit: 'pcs',
    });
    await loadTenantRecords();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      businessId: business.id,
      name: customerForm.name,
      phone: customerForm.phone,
      email: customerForm.email,
      address: customerForm.address,
      creditLimit: Number(customerForm.creditLimit) || 1000,
      outstandingBalance: 0,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
    };

    await createTenantCustomer(business.id, newCust);
    setShowNewCustomerModal(false);
    setCustomerForm({ name: '', phone: '', email: '', address: '', creditLimit: 1000 });
    await loadTenantRecords();
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      businessId: business.id,
      name: supplierForm.name,
      phone: supplierForm.phone,
      email: supplierForm.email,
      contactPerson: supplierForm.contactPerson,
      paymentTerms: supplierForm.paymentTerms,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
    };

    await createTenantSupplier(business.id, newSup);
    setShowNewSupplierModal(false);
    setSupplierForm({ name: '', phone: '', email: '', contactPerson: '', paymentTerms: 'Net 30' });
    await loadTenantRecords();
  };

  // AI CFO Chat Submission
  const handleSendAiMessage = async (textToSend?: string) => {
    const q = textToSend || aiMessage;
    if (!q.trim()) return;

    const newHistory = [...aiChatHistory, { role: 'user' as const, text: q }];
    setAiChatHistory(newHistory);
    setAiMessage('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          businessContext: {
            name: business.name,
            industry: business.industry,
            currency: business.currency,
            currencySymbol: sym,
            metrics,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiChatHistory([...newHistory, { role: 'assistant', text: data.reply }]);
      }
    } catch (err) {
      setAiChatHistory([
        ...newHistory,
        { role: 'assistant', text: 'Error contacting AI business co-pilot. Please try again.' },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Invoice / Ref', 'Customer / Payee', 'Type', 'Amount', 'Status'],
      ...sales.map((s) => [s.date, s.invoiceNumber, s.customerName, 'Sale', s.totalAmount, s.paymentStatus]),
      ...expenses.map((e) => [e.date, e.receiptRef || 'EXP', e.payee, 'Expense', e.amount, 'Paid']),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${business.name.replace(/\s+/g, '_')}_Financials.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const navItems = [
    { id: 'overview', label: 'Business Overview', icon: LayoutDashboard },
    { id: 'sales', label: `Sales & Invoicing (${sales.length})`, icon: ShoppingCart },
    { id: 'expenses', label: `Operating Expenses (${expenses.length})`, icon: Receipt },
    { id: 'profit', label: 'Profit & Loss', icon: TrendingUp },
    { id: 'inventory', label: `Inventory & Stock (${products.length})`, icon: Package },
    { id: 'customers', label: `Customers & Debtors (${customers.length})`, icon: Users },
    { id: 'suppliers', label: `Suppliers & Payables (${suppliers.length})`, icon: Truck },
    { id: 'reports', label: 'Financial Reports', icon: FileBarChart },
    { id: 'ai', label: 'KASA AI Intelligence', icon: Sparkles },
    { id: 'settings', label: 'Workspace Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 flex font-sans text-neutral-900">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-64 bg-neutral-950 text-neutral-300 flex-col shrink-0 border-r border-neutral-800">
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              K
            </div>
            <div>
              <div className="font-extrabold text-white text-base tracking-tight leading-tight">KASA OS</div>
              <div className="text-[11px] text-neutral-400 capitalize">{business.industry} Workspace</div>
            </div>
          </div>
        </div>

        {/* Business Selector / Tenant Badge */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-neutral-900 border border-neutral-800">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Active Workspace</div>
          <div className="font-bold text-white text-sm truncate mt-0.5">{business.name}</div>
          <div className="text-xs text-emerald-400 font-mono mt-0.5">
            {business.currency} ({sym}) • Clean State
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Super Admin Switcher (If Authorized) */}
        {isSuperAdmin && (
          <div className="p-3 border-t border-neutral-800">
            <button
              onClick={() => setCurrentView('super_admin')}
              className="w-full p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/50 hover:bg-purple-900/40 text-purple-300 text-xs font-bold transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                <span>Super Admin Portal</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* User Footer */}
        <div className="p-4 border-t border-neutral-800 flex items-center justify-between text-xs">
          <div className="truncate pr-2">
            <div className="font-semibold text-white truncate">{user?.displayName || user?.email?.split('@')[0]}</div>
            <div className="text-[11px] text-neutral-500 truncate">{user?.email}</div>
          </div>
          <button
            onClick={() => signOut()}
            title="Sign Out"
            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-neutral-200 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-bold text-neutral-900 capitalize">
              {navItems.find((n) => n.id === activeTab)?.label.split('(')[0].trim()}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowNewSaleModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Record Sale
            </button>
            <button
              onClick={() => setShowNewExpenseModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Log Expense
            </button>
          </div>
        </header>

        {/* Content View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* TAB 1: BUSINESS OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                  <span className="text-xs font-semibold text-neutral-500 uppercase">Total Sales Revenue</span>
                  <div className="mt-2 text-2xl font-extrabold text-neutral-900">
                    {sym} {metrics.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">{metrics.salesCount} sales recorded</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                  <span className="text-xs font-semibold text-neutral-500 uppercase">Cash Collected</span>
                  <div className="mt-2 text-2xl font-extrabold text-emerald-600">
                    {sym} {metrics.cashInflows.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">Realized cash / MoMo receipts</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                  <span className="text-xs font-semibold text-neutral-500 uppercase">Customer Receivables</span>
                  <div className="mt-2 text-2xl font-extrabold text-amber-600">
                    {sym} {metrics.outstandingReceivables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">Uncollected customer credit</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                  <span className="text-xs font-semibold text-neutral-500 uppercase">Operating Expenses</span>
                  <div className="mt-2 text-2xl font-extrabold text-neutral-900">
                    {sym} {metrics.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">Utilities, rent, wages, supplies</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                  <span className="text-xs font-semibold text-neutral-500 uppercase">Gross Profit</span>
                  <div className="mt-2 text-2xl font-extrabold text-neutral-900">
                    {sym} {metrics.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">Sales turnover minus product cost</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                  <span className="text-xs font-semibold text-neutral-500 uppercase">Net Operating Profit</span>
                  <div
                    className={`mt-2 text-2xl font-extrabold ${
                      metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {sym} {metrics.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">After all operating overheads</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                  <span className="text-xs font-semibold text-neutral-500 uppercase">Merchandise Inventory</span>
                  <div className="mt-2 text-2xl font-extrabold text-neutral-900">
                    {sym} {metrics.inventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">{metrics.inventoryCount} catalog products</div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                  <span className="text-xs font-semibold text-neutral-500 uppercase">Supplier Payables</span>
                  <div className="mt-2 text-2xl font-extrabold text-neutral-900">
                    {sym} {metrics.outstandingPayables.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">Pending vendor disbursements</div>
                </div>
              </div>

              {/* Zero State Alert Banner */}
              {sales.length === 0 && expenses.length === 0 && (
                <div className="p-8 rounded-2xl bg-white border border-dashed border-neutral-300 text-center max-w-2xl mx-auto my-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-neutral-900">Clean Workspace Initialized</h3>
                  <p className="text-sm text-neutral-600 mt-1 max-w-md mx-auto">
                    Your {business.name} workspace has zero mock or simulated data. Start by adding your catalog products or recording your first customer sale.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => setShowNewProductModal(true)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                    >
                      + Add First Product
                    </button>
                    <button
                      onClick={() => setShowNewSaleModal(true)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                    >
                      + Record First Sale
                    </button>
                    <button
                      onClick={() => setShowNewCustomerModal(true)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                    >
                      + Register First Customer
                    </button>
                  </div>
                </div>
              )}

              {/* Recent Activity Split */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sales */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-neutral-900 text-base">Recent Sales</h3>
                    <button
                      onClick={() => setActiveTab('sales')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View All →
                    </button>
                  </div>
                  {sales.length === 0 ? (
                    <div className="py-8 text-center text-neutral-400 text-xs">No sales recorded yet.</div>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {sales.slice(0, 5).map((s) => (
                        <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-neutral-900">{s.customerName}</div>
                            <div className="text-neutral-500">
                              {s.invoiceNumber} • {s.date} • {s.paymentMethod.toUpperCase()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-neutral-900">
                              {sym} {s.totalAmount.toLocaleString()}
                            </div>
                            <div
                              className={`text-[10px] font-bold uppercase ${
                                s.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                              }`}
                            >
                              {s.paymentStatus}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Expenses */}
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-neutral-900 text-base">Recent Operating Expenses</h3>
                    <button
                      onClick={() => setActiveTab('expenses')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View All →
                    </button>
                  </div>
                  {expenses.length === 0 ? (
                    <div className="py-8 text-center text-neutral-400 text-xs">No expenses recorded yet.</div>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {expenses.slice(0, 5).map((e) => (
                        <div key={e.id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-neutral-900">{e.payee}</div>
                            <div className="text-neutral-500 capitalize">
                              {e.category} • {e.date}
                            </div>
                          </div>
                          <div className="font-bold text-neutral-900">
                            {sym} {e.amount.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SALES & INVOICING */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Sales Invoices</h2>
                  <p className="text-xs text-neutral-500">Customer trade transactions and payment statuses</p>
                </div>
                <button
                  onClick={() => setShowNewSaleModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Create Sale
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-neutral-700">
                    <thead className="text-xs uppercase bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                      <tr>
                        <th className="px-6 py-3.5">Invoice #</th>
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5">Customer</th>
                        <th className="px-6 py-3.5">Total Amount</th>
                        <th className="px-6 py-3.5">Paid</th>
                        <th className="px-6 py-3.5">Balance</th>
                        <th className="px-6 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {sales.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-neutral-400 text-xs">
                            No sales recorded yet. Click &quot;Create Sale&quot; to issue your first invoice.
                          </td>
                        </tr>
                      ) : (
                        sales.map((s) => (
                          <tr key={s.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 font-mono font-bold text-neutral-900">{s.invoiceNumber}</td>
                            <td className="px-6 py-4 text-xs text-neutral-500">{s.date}</td>
                            <td className="px-6 py-4 font-semibold text-neutral-900">{s.customerName}</td>
                            <td className="px-6 py-4 font-bold text-neutral-900">
                              {sym} {s.totalAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-xs text-emerald-600 font-semibold">
                              {sym} {s.paidAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-xs text-amber-600 font-semibold">
                              {sym} {s.balanceAmount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  s.paymentStatus === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : s.paymentStatus === 'partial'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {s.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OPERATING EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Operating Expenses</h2>
                  <p className="text-xs text-neutral-500">Record rent, utility bills, staff wages, and overheads</p>
                </div>
                <button
                  onClick={() => setShowNewExpenseModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Log Expense
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-neutral-700">
                    <thead className="text-xs uppercase bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                      <tr>
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5">Payee / Vendor</th>
                        <th className="px-6 py-3.5">Payment Method</th>
                        <th className="px-6 py-3.5">Receipt Ref</th>
                        <th className="px-6 py-3.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-neutral-400 text-xs">
                            Zero expenses logged. Track overheads by clicking &quot;Log Expense&quot;.
                          </td>
                        </tr>
                      ) : (
                        expenses.map((e) => (
                          <tr key={e.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 text-xs text-neutral-500">{e.date}</td>
                            <td className="px-6 py-4 font-semibold capitalize text-neutral-900">{e.category}</td>
                            <td className="px-6 py-4 text-neutral-800">{e.payee}</td>
                            <td className="px-6 py-4 text-xs font-mono uppercase text-neutral-500">{e.paymentMethod}</td>
                            <td className="px-6 py-4 text-xs font-mono text-neutral-400">{e.receiptRef || '—'}</td>
                            <td className="px-6 py-4 text-right font-bold text-neutral-900">
                              {sym} {e.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROFIT & LOSS */}
          {activeTab === 'profit' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Profit & Loss Statement</h2>
                  <p className="text-xs text-neutral-500">Comprehensive income statement with accounting toggle</p>
                </div>

                <div className="flex items-center p-1 rounded-xl bg-neutral-200 text-xs font-semibold">
                  <button
                    onClick={() => setAccountingBasis('accrual')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      accountingBasis === 'accrual' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                    }`}
                  >
                    Accrual Basis
                  </button>
                  <button
                    onClick={() => setAccountingBasis('cash')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      accountingBasis === 'cash' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                    }`}
                  >
                    Cash Basis
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-xs space-y-6">
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                    <span className="font-bold text-neutral-900">
                      {accountingBasis === 'accrual' ? 'Total Invoiced Revenue' : 'Realized Cash Collections'}
                    </span>
                    <span className="font-bold text-neutral-900 text-base">
                      {sym}{' '}
                      {(accountingBasis === 'accrual' ? metrics.totalSales : metrics.cashInflows).toLocaleString(
                        'en-US',
                        { minimumFractionDigits: 2 }
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                    <span className="font-bold text-neutral-900">Cost of Goods Sold (COGS)</span>
                    <span className="font-bold text-red-600 text-base">
                      - {sym}{' '}
                      {(metrics.totalSales - metrics.grossProfit).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 flex justify-between items-center">
                  <span className="font-extrabold text-neutral-900">Gross Profit</span>
                  <span className="font-extrabold text-emerald-700 text-lg">
                    {sym} {metrics.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">
                    Operating Overhead Expenses
                  </div>
                  <div className="space-y-2 text-xs">
                    {expenses.length === 0 ? (
                      <p className="text-neutral-400 py-2">No expenses logged.</p>
                    ) : (
                      expenses.map((e) => (
                        <div key={e.id} className="flex justify-between text-neutral-600">
                          <span className="capitalize">
                            {e.category} ({e.payee})
                          </span>
                          <span>{sym} {e.amount.toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t-2 border-neutral-900 flex justify-between items-center">
                  <div>
                    <div className="text-base font-extrabold text-neutral-900">Net Operating Profit</div>
                    <div className="text-xs text-neutral-500">
                      {accountingBasis === 'accrual' ? 'Accrued net commercial result' : 'Cash basis net profit'}
                    </div>
                  </div>
                  <div
                    className={`text-2xl font-extrabold ${
                      metrics.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {sym} {metrics.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INVENTORY & STOCK */}
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Inventory Catalog</h2>
                  <p className="text-xs text-neutral-500">Stock tracking, purchase costs, and reorder levels</p>
                </div>
                <button
                  onClick={() => setShowNewProductModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-neutral-700">
                    <thead className="text-xs uppercase bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                      <tr>
                        <th className="px-6 py-3.5">SKU</th>
                        <th className="px-6 py-3.5">Product Name</th>
                        <th className="px-6 py-3.5">Category</th>
                        <th className="px-6 py-3.5">Cost</th>
                        <th className="px-6 py-3.5">Price</th>
                        <th className="px-6 py-3.5">In Stock</th>
                        <th className="px-6 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-neutral-400 text-xs">
                            No products in inventory catalog. Click &quot;Add Product&quot; to begin tracking stock.
                          </td>
                        </tr>
                      ) : (
                        products.map((p) => {
                          const isLow = p.stockQuantity <= p.minReorderPoint;
                          return (
                            <tr key={p.id} className="hover:bg-neutral-50">
                              <td className="px-6 py-4 font-mono text-xs text-neutral-500">{p.sku}</td>
                              <td className="px-6 py-4 font-bold text-neutral-900">{p.name}</td>
                              <td className="px-6 py-4 text-xs text-neutral-500">{p.category}</td>
                              <td className="px-6 py-4 text-xs text-neutral-700">
                                {sym} {p.purchaseCost.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 font-bold text-neutral-900">
                                {sym} {p.sellingPrice.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 font-semibold text-neutral-900">
                                {p.stockQuantity} {p.unit}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                    isLow ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {isLow ? 'Low Stock' : 'In Stock'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMERS & DEBTORS */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Customer Directory</h2>
                  <p className="text-xs text-neutral-500">Track client accounts and outstanding credit balances</p>
                </div>
                <button
                  onClick={() => setShowNewCustomerModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Customer
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-neutral-700">
                    <thead className="text-xs uppercase bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                      <tr>
                        <th className="px-6 py-3.5">Customer Name</th>
                        <th className="px-6 py-3.5">Phone</th>
                        <th className="px-6 py-3.5">Email</th>
                        <th className="px-6 py-3.5">Credit Limit</th>
                        <th className="px-6 py-3.5 text-right">Outstanding Debt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {customers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 text-xs">
                            No registered customers. Click &quot;Add Customer&quot; to build your client accounts.
                          </td>
                        </tr>
                      ) : (
                        customers.map((c) => (
                          <tr key={c.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 font-bold text-neutral-900">{c.name}</td>
                            <td className="px-6 py-4 text-xs font-mono text-neutral-600">{c.phone}</td>
                            <td className="px-6 py-4 text-xs text-neutral-500">{c.email || '—'}</td>
                            <td className="px-6 py-4 text-xs text-neutral-700">
                              {sym} {c.creditLimit.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-amber-600">
                              {sym} {c.outstandingBalance.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SUPPLIERS & PAYABLES */}
          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Suppliers & Payables</h2>
                  <p className="text-xs text-neutral-500">Manage vendors, procurement orders, and trade credit terms</p>
                </div>
                <button
                  onClick={() => setShowNewSupplierModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Supplier
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-neutral-700">
                    <thead className="text-xs uppercase bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                      <tr>
                        <th className="px-6 py-3.5">Supplier Name</th>
                        <th className="px-6 py-3.5">Contact Person</th>
                        <th className="px-6 py-3.5">Phone</th>
                        <th className="px-6 py-3.5">Terms</th>
                        <th className="px-6 py-3.5 text-right">Balance Payable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {suppliers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 text-xs">
                            No registered suppliers. Click &quot;Add Supplier&quot; to manage vendor accounts.
                          </td>
                        </tr>
                      ) : (
                        suppliers.map((s) => (
                          <tr key={s.id} className="hover:bg-neutral-50">
                            <td className="px-6 py-4 font-bold text-neutral-900">{s.name}</td>
                            <td className="px-6 py-4 text-xs text-neutral-700">{s.contactPerson || '—'}</td>
                            <td className="px-6 py-4 text-xs font-mono text-neutral-600">{s.phone}</td>
                            <td className="px-6 py-4 text-xs text-neutral-500">{s.paymentTerms}</td>
                            <td className="px-6 py-4 text-right font-bold text-neutral-900">
                              {sym} {s.outstandingBalance.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: FINANCIAL REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Financial Reports & Exports</h2>
                  <p className="text-xs text-neutral-500">Auditable financial statements and spreadsheets</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-emerald-600" /> Export CSV Spreadsheet
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                  <h3 className="font-bold text-neutral-900 text-base">Sales Summary</h3>
                  <p className="text-xs text-neutral-500 mt-1 mb-4">Total commercial billing activity</p>
                  <div className="text-2xl font-extrabold text-neutral-900">
                    {sym} {metrics.totalSales.toLocaleString()}
                  </div>
                  <div className="mt-4 text-xs text-neutral-600 flex justify-between">
                    <span>Cash Realized:</span>
                    <span className="font-bold text-emerald-600">{sym} {metrics.cashInflows.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-xs text-neutral-600 flex justify-between">
                    <span>Uncollected Debt:</span>
                    <span className="font-bold text-amber-600">{sym} {metrics.outstandingReceivables.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                  <h3 className="font-bold text-neutral-900 text-base">Overhead Costs</h3>
                  <p className="text-xs text-neutral-500 mt-1 mb-4">Operational disbursement summary</p>
                  <div className="text-2xl font-extrabold text-neutral-900">
                    {sym} {metrics.totalExpenses.toLocaleString()}
                  </div>
                  <div className="mt-4 text-xs text-neutral-600 flex justify-between">
                    <span>Disbursement Count:</span>
                    <span className="font-bold text-neutral-900">{expenses.length} records</span>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-xs">
                  <h3 className="font-bold text-neutral-900 text-base">Inventory Valuation</h3>
                  <p className="text-xs text-neutral-500 mt-1 mb-4">WAC asset valuation on hand</p>
                  <div className="text-2xl font-extrabold text-neutral-900">
                    {sym} {metrics.inventoryValue.toLocaleString()}
                  </div>
                  <div className="mt-4 text-xs text-neutral-600 flex justify-between">
                    <span>Catalog SKUs:</span>
                    <span className="font-bold text-neutral-900">{products.length} items</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: KASA AI BUSINESS INTELLIGENCE */}
          {activeTab === 'ai' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">KASA AI CFO Co-Pilot</h2>
                  <p className="text-xs text-neutral-500">
                    Context-aware business intelligence strictly grounded in your verified records
                  </p>
                </div>
              </div>

              {/* Chat Container */}
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden flex flex-col h-[520px]">
                {/* Messages Feed */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {aiChatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-neutral-900 text-base">How can I assist your business today?</h3>
                      <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-6">
                        I am your embedded AI CFO. Ask me to evaluate cash flow, profit margins, inventory reorder needs, or debtor recovery.
                      </p>

                      <div className="flex flex-wrap justify-center gap-2">
                        {[
                          'What operations should I set up first?',
                          'Evaluate our cash position',
                          'Analyze product profit margins',
                          'Debtor collection action plan',
                        ].map((prompt) => (
                          <button
                            key={prompt}
                            onClick={() => handleSendAiMessage(prompt)}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
                          >
                            &quot;{prompt}&quot;
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    aiChatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                            msg.role === 'user'
                              ? 'bg-neutral-900 text-white rounded-br-none'
                              : 'bg-neutral-100 text-neutral-900 rounded-bl-none border border-neutral-200'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="p-3.5 rounded-2xl bg-neutral-100 text-neutral-500 text-xs flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                        Analyzing business records...
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask KASA Intelligence about your finances or operations..."
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendAiMessage()}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 bg-white"
                  />
                  <button
                    onClick={() => handleSendAiMessage()}
                    disabled={aiLoading || !aiMessage.trim()}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl bg-white rounded-2xl border border-neutral-200 p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">Workspace Settings</h2>
                <p className="text-xs text-neutral-500">Business profile and multi-tenant parameters</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Business Name:</span>
                    <span className="font-bold text-neutral-900">{business.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Tenant Workspace ID:</span>
                    <span className="font-mono text-neutral-700">{business.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Industry:</span>
                    <span className="font-semibold text-neutral-900 capitalize">{business.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Currency:</span>
                    <span className="font-semibold text-neutral-900">
                      {business.currency} ({sym})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Workspace Status:</span>
                    <span className="font-bold uppercase tracking-wider text-emerald-700">{business.status}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <h4 className="font-bold text-neutral-900 text-sm mb-2">Data Isolation & Security</h4>
                  <p className="text-neutral-600 text-xs leading-relaxed mb-4">
                    Your records are stored under tenant path <code>/businesses/{business.id}</code> with zero-trust Firestore security rules.
                  </p>
                  <button
                    onClick={handleExportCSV}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-600" /> Export All Workspace Records (CSV)
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: NEW SALE */}
      {showNewSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-neutral-200 relative">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900 text-lg">Record Customer Sale</h3>
              <button onClick={() => setShowNewSaleModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSale} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Customer</label>
                {customers.length > 0 ? (
                  <select
                    value={saleForm.customerId}
                    onChange={(e) => setSaleForm({ ...saleForm, customerId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  >
                    <option value="">Walk-in Client (Cash Sale)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Balance: {sym}{c.outstandingBalance})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Customer Name (e.g. Adom Construction or Walk-in)"
                    value={saleForm.customerName}
                    onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Product</label>
                {products.length > 0 ? (
                  <select
                    value={saleForm.productId}
                    onChange={(e) => {
                      const p = products.find((prod) => prod.id === e.target.value);
                      setSaleForm({
                        ...saleForm,
                        productId: e.target.value,
                        unitPrice: p ? p.sellingPrice : 0,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  >
                    <option value="">Select Catalog Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({sym}{p.sellingPrice} • Stock: {p.stockQuantity})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 rounded-lg bg-neutral-50 text-neutral-600 text-xs">
                    No products added yet. Add a product first or enter custom sale amount below.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Unit Price ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={saleForm.unitPrice}
                    onChange={(e) => setSaleForm({ ...saleForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex justify-between items-center text-xs">
                <span className="font-semibold text-neutral-700">Total Invoice Amount:</span>
                <span className="font-extrabold text-neutral-900 text-sm">
                  {sym} {(saleForm.quantity * saleForm.unitPrice).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Immediate Cash/MoMo Paid</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={saleForm.paidAmount}
                    onChange={(e) => setSaleForm({ ...saleForm, paidAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Payment Method</label>
                  <select
                    value={saleForm.paymentMethod}
                    onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs uppercase"
                  >
                    <option value="cash">Cash</option>
                    <option value="momo">Mobile Money (MoMo)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSaleModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                  Post Sale & Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW EXPENSE */}
      {showNewExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-neutral-200 relative">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900 text-lg">Log Operating Expense</h3>
              <button onClick={() => setShowNewExpenseModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs capitalize"
                >
                  <option value="rent">Rent & Premises</option>
                  <option value="utilities">Power & Utilities</option>
                  <option value="salaries">Staff Wages & Salaries</option>
                  <option value="transport">Transport & Logistics</option>
                  <option value="repairs">Repairs & Maintenance</option>
                  <option value="marketing">Marketing & Promotion</option>
                  <option value="fees">Bank & MoMo Charges</option>
                  <option value="supplies">Office Supplies</option>
                  <option value="other">General Overheads</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Payee / Recipient</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ECG Power, Landlord, Fuel Station"
                  value={expenseForm.payee}
                  onChange={(e) => setExpenseForm({ ...expenseForm, payee: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Amount ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs uppercase"
                  >
                    <option value="cash">Cash</option>
                    <option value="momo">MoMo</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Receipt Reference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. REC-9821 or Trans ID"
                  value={expenseForm.receiptRef}
                  onChange={(e) => setExpenseForm({ ...expenseForm, receiptRef: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-neutral-900 hover:bg-neutral-800 font-bold"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW PRODUCT */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-neutral-200 relative">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900 text-lg">Add Inventory Product</h3>
              <button onClick={() => setShowNewProductModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Portland Cement 50kg, Brake Pads, Engine Oil"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">SKU / Code</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Building Materials, Spare Parts"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Purchase Cost ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={productForm.purchaseCost}
                    onChange={(e) => setProductForm({ ...productForm, purchaseCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Selling Price ({sym})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={productForm.sellingPrice}
                    onChange={(e) => setProductForm({ ...productForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Initial Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stockQuantity}
                    onChange={(e) => setProductForm({ ...productForm, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Min Reorder Threshold</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.minReorderPoint}
                    onChange={(e) => setProductForm({ ...productForm, minReorderPoint: parseInt(e.target.value) || 5 })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW CUSTOMER */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-neutral-200 relative">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900 text-lg">Add Customer Account</h3>
              <button onClick={() => setShowNewCustomerModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Customer / Enterprise Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Asante or Adom Construction"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +233 24 000 0000"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="client@domain.com"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Credit Limit ({sym})</label>
                <input
                  type="number"
                  placeholder="1000"
                  value={customerForm.creditLimit}
                  onChange={(e) => setCustomerForm({ ...customerForm, creditLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NEW SUPPLIER */}
      {showNewSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-neutral-200 relative">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900 text-lg">Add Supplier / Vendor</h3>
              <button onClick={() => setShowNewSupplierModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Supplier Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ghacem Cement Ltd, Total Energies"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Account Rep Name"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+233 30 000 0000"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Payment Terms</label>
                <select
                  value={supplierForm.paymentTerms}
                  onChange={(e) => setSupplierForm({ ...supplierForm, paymentTerms: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-xs"
                >
                  <option value="Immediate Cash">Immediate Cash</option>
                  <option value="Net 15 Days">Net 15 Days</option>
                  <option value="Net 30 Days">Net 30 Days</option>
                  <option value="Net 60 Days">Net 60 Days</option>
                </select>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSupplierModal(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:text-neutral-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                  Create Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
