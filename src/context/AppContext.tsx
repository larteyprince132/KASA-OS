import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Organization,
  UserProfile,
  Product,
  Customer,
  Supplier,
  Sale,
  Purchase,
  Expense,
  LedgerEntry,
  StockMovement,
  AuditLog,
  DashboardMetrics,
  IndustryType,
} from '../types';
import {
  loadOrganizationData,
  saveOrganizationData,
  getActiveOrgId,
  setActiveOrgId,
  getKnownOrganizations,
  saveKnownOrganization,
  processSaleTransaction,
  processPurchaseTransaction,
  recordCustomerPayment,
  recordSupplierPayment,
  recordExpenseTransaction,
  adjustProductStock,
  resetOrganizationToDemo,
  OrgDataStore,
} from '../services/storage';
import { calculateDashboardMetrics, round2 } from '../utils/accounting';
import { DEMO_ORG_ID } from '../services/seedData';

export type NavView =
  | 'overview'
  | 'sales'
  | 'purchases'
  | 'transactions'
  | 'expenses'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'invoices'
  | 'reports'
  | 'intelligence'
  | 'entry'
  | 'employees'
  | 'settings';

export type DateFilter = 'today' | 'week' | 'month' | 'last_month' | 'all';

interface AppContextType {
  data: OrgDataStore;
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  metrics: DashboardMetrics;
  isDemoOrg: boolean;
  activeBranchId: string;
  setActiveBranchId: (branchId: string) => void;
  knownOrgs: { id: string; name: string; industry: string }[];
  switchOrg: (orgId: string) => void;
  createOrg: (orgData: Partial<Organization>) => void;
  recordSale: (sale: Sale) => void;
  recordPurchase: (purchase: Purchase) => void;
  recordExpense: (expense: Expense) => void;
  adjustStock: (productId: string, newQuantity: number, reason: string) => void;
  settleCustomerDebt: (
    customerId: string,
    amount: number,
    paymentMethod: 'cash' | 'momo' | 'bank_transfer' | 'cheque',
    reference: string,
    notes: string
  ) => void;
  settleSupplierPayable: (
    supplierId: string,
    amount: number,
    paymentMethod: 'cash' | 'momo' | 'bank_transfer' | 'cheque',
    reference: string,
    notes: string
  ) => void;
  addProduct: (product: Omit<Product, 'id' | 'orgId' | 'updatedAt'>) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'orgId' | 'createdAt' | 'totalPurchases' | 'outstandingBalance'>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id' | 'orgId' | 'createdAt' | 'totalPurchased' | 'outstandingBalance'>) => void;
  updateOrgProfile: (updates: Partial<Organization>) => void;
  resetToDemo: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeOrgId, setActiveOrgIdState] = useState<string>(() => getActiveOrgId());
  const [data, setData] = useState<OrgDataStore>(() => loadOrganizationData(activeOrgId));
  const [activeView, setActiveView] = useState<NavView>('overview');
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [knownOrgs, setKnownOrgs] = useState(() => getKnownOrganizations());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const isDemoOrg = data.org.id === DEMO_ORG_ID;

  // Filter records based on selected date filter
  const filteredRecords = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

    const filterDate = (d: string) => {
      if (dateFilter === 'all') return true;
      if (dateFilter === 'today') return d >= todayStr;
      if (dateFilter === 'week') return d >= weekAgoStr;
      if (dateFilter === 'month') return d >= monthStart;
      if (dateFilter === 'last_month') return d >= lastMonthStart && d <= lastMonthEnd;
      return true;
    };

    return {
      sales: data.sales.filter((s) => filterDate(s.date)),
      purchases: data.purchases.filter((p) => filterDate(p.date)),
      expenses: data.expenses.filter((e) => filterDate(e.date)),
    };
  }, [data.sales, data.purchases, data.expenses, dateFilter]);

  // Recalculate dashboard metrics
  const metrics = useMemo(() => {
    return calculateDashboardMetrics(
      filteredRecords.sales,
      filteredRecords.purchases,
      filteredRecords.expenses,
      data.products,
      data.customers,
      data.suppliers
    );
  }, [filteredRecords, data.products, data.customers, data.suppliers]);

  const switchOrg = (orgId: string) => {
    setActiveOrgId(orgId);
    setActiveOrgIdState(orgId);
    const loaded = loadOrganizationData(orgId);
    setData(loaded);
    showToast(`Switched to organization "${loaded.org.name}"`);
  };

  const createOrg = (orgData: Partial<Organization>) => {
    const newId = `org-${Date.now()}`;
    const newOrg: Organization = {
      id: newId,
      name: orgData.name || 'New Business',
      industry: (orgData.industry as IndustryType) || 'general',
      description: orgData.description || 'Enterprise on KASA OS',
      country: orgData.country || 'Ghana',
      currency: orgData.currency || 'GHS',
      currencySymbol: orgData.currencySymbol || 'GH₵',
      timezone: orgData.timezone || 'Africa/Accra',
      businessSize: orgData.businessSize || 'small',
      employeeCount: orgData.employeeCount || 1,
      taxRatePercent: orgData.taxRatePercent || 0,
      branches: [
        {
          id: `br-${newId}-main`,
          name: 'Main Location',
          code: 'HQ-01',
          location: 'Headquarters',
          isMain: true,
        },
      ],
      activeBranchId: `br-${newId}-main`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newStore: OrgDataStore = {
      org: newOrg,
      users: [
        {
          id: `usr-${newId}-owner`,
          orgId: newId,
          name: 'Business Administrator',
          email: 'admin@kasabusiness.com',
          role: 'owner',
          branchId: `br-${newId}-main`,
          status: 'active',
        },
      ],
      products: [],
      customers: [],
      suppliers: [],
      sales: [],
      purchases: [],
      expenses: [],
      ledgerEntries: [],
      stockMovements: [],
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          orgId: newId,
          userId: `usr-${newId}-owner`,
          userName: 'Business Administrator',
          action: 'ORG_CREATED',
          entityType: 'organization',
          entityId: newId,
          details: `Organization ${newOrg.name} registered on KASA OS.`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    saveOrganizationData(newId, newStore);
    saveKnownOrganization({
      id: newOrg.id,
      name: newOrg.name,
      industry: newOrg.industry,
    });
    setKnownOrgs(getKnownOrganizations());
    switchOrg(newId);
  };

  const setActiveBranchId = (branchId: string) => {
    const updated = structuredClone(data);
    updated.org.activeBranchId = branchId;
    setData(updated);
    saveOrganizationData(updated.org.id, updated);
  };

  const recordSale = (sale: Sale) => {
    const updated = processSaleTransaction(data, sale, data.users[0]?.name || 'Cashier');
    setData(updated);
    showToast(`Invoice ${sale.invoiceNumber} recorded successfully!`);
  };

  const recordPurchase = (purchase: Purchase) => {
    const updated = processPurchaseTransaction(data, purchase, data.users[0]?.name || 'Purchasing Officer');
    setData(updated);
    showToast(`Purchase bill ${purchase.billNumber} posted & inventory updated!`);
  };

  const recordExpense = (expense: Expense) => {
    const updated = recordExpenseTransaction(data, expense, data.users[0]?.name || 'Accountant');
    setData(updated);
    showToast(`Expense ${expense.reference} (${data.org.currencySymbol}${expense.amount}) recorded!`);
  };

  const adjustStock = (productId: string, newQuantity: number, reason: string) => {
    const updated = adjustProductStock(data, productId, newQuantity, reason, data.users[0]?.name || 'Inventory Manager');
    setData(updated);
    showToast('Inventory level adjusted successfully.');
  };

  const settleCustomerDebt = (
    customerId: string,
    amount: number,
    paymentMethod: 'cash' | 'momo' | 'bank_transfer' | 'cheque',
    reference: string,
    notes: string
  ) => {
    const updated = recordCustomerPayment(
      data,
      customerId,
      amount,
      paymentMethod,
      reference,
      notes,
      data.users[0]?.name || 'Accountant'
    );
    setData(updated);
    showToast(`Customer debt payment of ${data.org.currencySymbol}${amount} applied.`);
  };

  const settleSupplierPayable = (
    supplierId: string,
    amount: number,
    paymentMethod: 'cash' | 'momo' | 'bank_transfer' | 'cheque',
    reference: string,
    notes: string
  ) => {
    const updated = recordSupplierPayment(
      data,
      supplierId,
      amount,
      paymentMethod,
      reference,
      notes,
      data.users[0]?.name || 'Accountant'
    );
    setData(updated);
    showToast(`Supplier payment of ${data.org.currencySymbol}${amount} recorded.`);
  };

  const addProduct = (productData: Omit<Product, 'id' | 'orgId' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      orgId: data.org.id,
      updatedAt: new Date().toISOString(),
    };
    const updated = structuredClone(data);
    updated.products.push(newProduct);
    setData(updated);
    saveOrganizationData(updated.org.id, updated);
    showToast(`Product "${newProduct.name}" added to catalog.`);
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'orgId' | 'createdAt' | 'totalPurchases' | 'outstandingBalance'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: `cust-${Date.now()}`,
      orgId: data.org.id,
      totalPurchases: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = structuredClone(data);
    updated.customers.push(newCustomer);
    setData(updated);
    saveOrganizationData(updated.org.id, updated);
    showToast(`Customer "${newCustomer.name}" registered.`);
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'orgId' | 'createdAt' | 'totalPurchased' | 'outstandingBalance'>) => {
    const newSupplier: Supplier = {
      ...supplierData,
      id: `supp-${Date.now()}`,
      orgId: data.org.id,
      totalPurchased: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
    };
    const updated = structuredClone(data);
    updated.suppliers.push(newSupplier);
    setData(updated);
    saveOrganizationData(updated.org.id, updated);
    showToast(`Supplier "${newSupplier.name}" registered.`);
  };

  const updateOrgProfile = (updates: Partial<Organization>) => {
    const updated = structuredClone(data);
    updated.org = { ...updated.org, ...updates, updatedAt: new Date().toISOString() };
    setData(updated);
    saveOrganizationData(updated.org.id, updated);
    saveKnownOrganization({
      id: updated.org.id,
      name: updated.org.name,
      industry: updated.org.industry,
    });
    setKnownOrgs(getKnownOrganizations());
    showToast('Organization settings updated.');
  };

  const resetToDemo = () => {
    const resetData = resetOrganizationToDemo(data.org.id);
    setData(resetData);
    showToast('Organization reset to demo trade records.');
  };

  return (
    <AppContext.Provider
      value={{
        data,
        activeView,
        setActiveView,
        dateFilter,
        setDateFilter,
        metrics,
        isDemoOrg,
        activeBranchId: data.org.activeBranchId,
        setActiveBranchId,
        knownOrgs,
        switchOrg,
        createOrg,
        recordSale,
        recordPurchase,
        recordExpense,
        adjustStock,
        settleCustomerDebt,
        settleSupplierPayable,
        addProduct,
        addCustomer,
        addSupplier,
        updateOrgProfile,
        resetToDemo,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
