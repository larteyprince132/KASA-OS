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
} from '../types';
import {
  generateSaleLedgerEntries,
  generatePurchaseLedgerEntries,
  generateExpenseLedgerEntries,
  calculateWeightedAverageCost,
  round2,
  getPaymentAccount,
  CHART_OF_ACCOUNTS,
} from '../utils/accounting';
import { getInitialDemoData, DEMO_ORG_ID } from './seedData';

const STORAGE_KEY_PREFIX = 'kasa_os_data_v1_';
const ACTIVE_ORG_KEY = 'kasa_os_active_org_id_v1';
const ALL_ORGS_KEY = 'kasa_os_org_list_v1';

export interface OrgDataStore {
  org: Organization;
  users: UserProfile[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  ledgerEntries: LedgerEntry[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
}

export function getActiveOrgId(): string {
  try {
    const saved = localStorage.getItem(ACTIVE_ORG_KEY);
    return saved || DEMO_ORG_ID;
  } catch {
    return DEMO_ORG_ID;
  }
}

export function setActiveOrgId(orgId: string): void {
  try {
    localStorage.setItem(ACTIVE_ORG_KEY, orgId);
  } catch (err) {
    console.error('Failed to save active org ID:', err);
  }
}

export function getKnownOrganizations(): { id: string; name: string; industry: string }[] {
  try {
    const raw = localStorage.getItem(ALL_ORGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load org list:', err);
  }
  return [
    {
      id: DEMO_ORG_ID,
      name: 'Kofi Mensah Hardware & Supplies',
      industry: 'distribution',
    },
  ];
}

export function saveKnownOrganization(org: { id: string; name: string; industry: string }) {
  const current = getKnownOrganizations();
  const exists = current.find((o) => o.id === org.id);
  let updated;
  if (exists) {
    updated = current.map((o) => (o.id === org.id ? org : o));
  } else {
    updated = [...current, org];
  }
  try {
    localStorage.setItem(ALL_ORGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save org list:', err);
  }
}

export function loadOrganizationData(orgId: string): OrgDataStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + orgId);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`Could not load data for org ${orgId}:`, err);
  }

  // If this is the demo org or not found, initialize with demo seed
  if (orgId === DEMO_ORG_ID) {
    const demo = getInitialDemoData();
    const dataStore: OrgDataStore = {
      ...demo,
      auditLogs: [
        {
          id: 'audit-init-0',
          orgId: DEMO_ORG_ID,
          userId: 'usr-kofi',
          userName: 'Kofi Mensah',
          action: 'ORG_INITIALIZED',
          entityType: 'organization',
          entityId: DEMO_ORG_ID,
          details: 'Initialized KASA OS demonstration organization with Ghanaian trade records.',
          timestamp: '2026-11-01T08:00:00Z',
        },
      ],
    };
    saveOrganizationData(orgId, dataStore);
    saveKnownOrganization({
      id: dataStore.org.id,
      name: dataStore.org.name,
      industry: dataStore.org.industry,
    });
    return dataStore;
  }

  // Create empty new organization
  const emptyStore: OrgDataStore = {
    org: {
      id: orgId,
      name: 'My Business',
      industry: 'general',
      description: 'Business operating system instance',
      country: 'Ghana',
      currency: 'GHS',
      currencySymbol: 'GH₵',
      timezone: 'Africa/Accra',
      businessSize: 'small',
      employeeCount: 1,
      taxRatePercent: 0,
      branches: [
        {
          id: `br-${orgId}-main`,
          name: 'Main Branch',
          code: 'MAIN-01',
          location: 'Headquarters',
          isMain: true,
        },
      ],
      activeBranchId: `br-${orgId}-main`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    users: [
      {
        id: `usr-${orgId}-admin`,
        orgId,
        name: 'Business Owner',
        email: 'owner@kasabusiness.com',
        role: 'owner',
        branchId: `br-${orgId}-main`,
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
    auditLogs: [],
  };
  saveOrganizationData(orgId, emptyStore);
  return emptyStore;
}

export function saveOrganizationData(orgId: string, data: OrgDataStore): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + orgId, JSON.stringify(data));
  } catch (err) {
    console.error(`Failed to persist data for org ${orgId}:`, err);
  }
}

/**
 * Process a Sale with Atomic Consistency:
 * 1. Decrement Product Stock
 * 2. Record Stock Movements
 * 3. Update Customer totalPurchases and outstandingBalance
 * 4. Generate immutable double-entry ledger entries
 * 5. Append Audit Log
 */
export function processSaleTransaction(
  currentStore: OrgDataStore,
  sale: Sale,
  operatorName = 'System Operator'
): OrgDataStore {
  const store = structuredClone(currentStore);
  const now = new Date().toISOString();

  // 1. Calculate COGS and update stock
  let totalCogs = 0;
  const newMovements: StockMovement[] = [];

  for (const item of sale.items) {
    const prodIndex = store.products.findIndex((p) => p.id === item.productId);
    if (prodIndex >= 0) {
      const prod = store.products[prodIndex];
      const prevQty = prod.stockQuantity;
      if (!prod.isService) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
        // Deduct from branch stock
        const branchKey = sale.branchId || store.org.activeBranchId;
        if (prod.branchStock && prod.branchStock[branchKey] !== undefined) {
          prod.branchStock[branchKey] = Math.max(0, prod.branchStock[branchKey] - item.quantity);
        }
      }
      totalCogs += (item.unitCost || prod.purchaseCost) * item.quantity;

      if (!prod.isService) {
        newMovements.push({
          id: `mov-${Date.now()}-${item.productId}`,
          orgId: store.org.id,
          productId: prod.id,
          productName: prod.name,
          type: 'sale',
          quantityChange: -item.quantity,
          balanceAfter: prod.stockQuantity,
          unitCost: item.unitCost || prod.purchaseCost,
          reference: sale.invoiceNumber,
          branchId: sale.branchId,
          date: sale.date,
          notes: `Sold to ${sale.customerName} (${sale.invoiceNumber})`,
        });
      }
    }
  }

  // 2. Update Customer record
  const custIndex = store.customers.findIndex((c) => c.id === sale.customerId);
  if (custIndex >= 0) {
    const cust = store.customers[custIndex];
    cust.totalPurchases = round2(cust.totalPurchases + sale.totalAmount);
    cust.outstandingBalance = round2(cust.outstandingBalance + sale.balanceAmount);
  }

  // 3. Generate Double-Entry Ledger Entries
  const ledgerEntries = generateSaleLedgerEntries(sale, totalCogs);

  // 4. Audit Log
  const auditEntry: AuditLog = {
    id: `audit-${Date.now()}`,
    orgId: store.org.id,
    userId: sale.createdBy || 'usr-operator',
    userName: operatorName,
    action: 'SALE_RECORDED',
    entityType: 'sale',
    entityId: sale.id,
    details: `Posted sale ${sale.invoiceNumber} for ${sale.customerName}. Total: ${store.org.currencySymbol}${sale.totalAmount}, Paid: ${store.org.currencySymbol}${sale.paidAmount}, Bal: ${store.org.currencySymbol}${sale.balanceAmount}`,
    timestamp: now,
  };

  store.sales.unshift(sale);
  store.stockMovements.unshift(...newMovements);
  store.ledgerEntries.push(...ledgerEntries);
  store.auditLogs.unshift(auditEntry);

  saveOrganizationData(store.org.id, store);
  return store;
}

/**
 * Process a Purchase Order / Supplier Bill with Atomic Consistency:
 * 1. Increment Product Stock and recalculate Weighted Average Cost
 * 2. Record Stock Movements
 * 3. Update Supplier totalPurchased and outstandingBalance
 * 4. Generate immutable double-entry ledger entries
 * 5. Append Audit Log
 */
export function processPurchaseTransaction(
  currentStore: OrgDataStore,
  purchase: Purchase,
  operatorName = 'System Operator'
): OrgDataStore {
  const store = structuredClone(currentStore);
  const now = new Date().toISOString();

  const newMovements: StockMovement[] = [];

  for (const item of purchase.items) {
    const prodIndex = store.products.findIndex((p) => p.id === item.productId);
    if (prodIndex >= 0) {
      const prod = store.products[prodIndex];
      const prevQty = prod.stockQuantity;
      const prevCost = prod.purchaseCost;
      const newCost = calculateWeightedAverageCost(prevQty, prevCost, item.quantity, item.unitCost);

      prod.stockQuantity += item.quantity;
      prod.purchaseCost = newCost;

      const branchKey = purchase.branchId || store.org.activeBranchId;
      if (!prod.branchStock) prod.branchStock = {};
      prod.branchStock[branchKey] = (prod.branchStock[branchKey] || 0) + item.quantity;

      newMovements.push({
        id: `mov-${Date.now()}-${item.productId}`,
        orgId: store.org.id,
        productId: prod.id,
        productName: prod.name,
        type: 'purchase',
        quantityChange: item.quantity,
        balanceAfter: prod.stockQuantity,
        unitCost: item.unitCost,
        reference: purchase.billNumber,
        branchId: purchase.branchId,
        date: purchase.date,
        notes: `Received from ${purchase.supplierName} (${purchase.billNumber})`,
      });
    }
  }

  // Update Supplier record
  const suppIndex = store.suppliers.findIndex((s) => s.id === purchase.supplierId);
  if (suppIndex >= 0) {
    const supp = store.suppliers[suppIndex];
    supp.totalPurchased = round2(supp.totalPurchased + purchase.totalAmount);
    supp.outstandingBalance = round2(supp.outstandingBalance + purchase.balanceAmount);
  }

  const ledgerEntries = generatePurchaseLedgerEntries(purchase);

  const auditEntry: AuditLog = {
    id: `audit-${Date.now()}`,
    orgId: store.org.id,
    userId: 'usr-operator',
    userName: operatorName,
    action: 'PURCHASE_RECEIVED',
    entityType: 'purchase',
    entityId: purchase.id,
    details: `Received purchase ${purchase.billNumber} from ${purchase.supplierName}. Total: ${store.org.currencySymbol}${purchase.totalAmount}, Paid: ${store.org.currencySymbol}${purchase.paidAmount}, Bal: ${store.org.currencySymbol}${purchase.balanceAmount}`,
    timestamp: now,
  };

  store.purchases.unshift(purchase);
  store.stockMovements.unshift(...newMovements);
  store.ledgerEntries.push(...ledgerEntries);
  store.auditLogs.unshift(auditEntry);

  saveOrganizationData(store.org.id, store);
  return store;
}

/**
 * Record Customer Payment against outstanding debt
 * Debits Cash/MoMo/Bank and Credits Accounts Receivable
 */
export function recordCustomerPayment(
  currentStore: OrgDataStore,
  customerId: string,
  amount: number,
  paymentMethod: 'cash' | 'momo' | 'bank_transfer' | 'cheque',
  reference: string,
  notes: string,
  operatorName = 'System Operator'
): OrgDataStore {
  const store = structuredClone(currentStore);
  const now = new Date().toISOString();
  const paymentAcc = getPaymentAccount(paymentMethod);

  const custIndex = store.customers.findIndex((c) => c.id === customerId);
  if (custIndex < 0) return store;

  const cust = store.customers[custIndex];
  const paidAmount = round2(amount);
  cust.outstandingBalance = round2(Math.max(0, cust.outstandingBalance - paidAmount));

  // Update customer's unpaid invoices sequentially
  let remainingPaid = paidAmount;
  for (const sale of store.sales) {
    if (sale.customerId === customerId && sale.balanceAmount > 0 && remainingPaid > 0) {
      const applyAmount = Math.min(sale.balanceAmount, remainingPaid);
      sale.paidAmount = round2(sale.paidAmount + applyAmount);
      sale.balanceAmount = round2(sale.balanceAmount - applyAmount);
      sale.paymentStatus = sale.balanceAmount <= 0 ? 'paid' : 'partial';
      remainingPaid -= applyAmount;
    }
  }

  // Create Double-Entry Ledger entries
  const ledgerEntries: LedgerEntry[] = [
    {
      id: `led-${Date.now()}-cash`,
      orgId: store.org.id,
      transactionId: `pmt-${Date.now()}`,
      transactionType: 'customer_payment',
      date: new Date().toISOString().split('T')[0],
      accountCode: paymentAcc.code,
      accountName: paymentAcc.name,
      debit: paidAmount,
      credit: 0,
      description: `Debt payment received from ${cust.name} (${reference})`,
      reference,
      createdAt: now,
    },
    {
      id: `led-${Date.now()}-ar`,
      orgId: store.org.id,
      transactionId: `pmt-${Date.now()}`,
      transactionType: 'customer_payment',
      date: new Date().toISOString().split('T')[0],
      accountCode: CHART_OF_ACCOUNTS.ACCOUNTS_RECEIVABLE.code,
      accountName: CHART_OF_ACCOUNTS.ACCOUNTS_RECEIVABLE.name,
      debit: 0,
      credit: paidAmount,
      description: `Reduction in Accounts Receivable for ${cust.name}`,
      reference,
      createdAt: now,
    },
  ];

  const auditEntry: AuditLog = {
    id: `audit-${Date.now()}`,
    orgId: store.org.id,
    userId: 'usr-operator',
    userName: operatorName,
    action: 'CUSTOMER_PAYMENT',
    entityType: 'customer',
    entityId: cust.id,
    details: `Recorded debt payment of ${store.org.currencySymbol}${paidAmount} from ${cust.name} via ${paymentMethod}. New balance: ${store.org.currencySymbol}${cust.outstandingBalance}`,
    timestamp: now,
  };

  store.ledgerEntries.push(...ledgerEntries);
  store.auditLogs.unshift(auditEntry);

  saveOrganizationData(store.org.id, store);
  return store;
}

/**
 * Record Supplier Payment
 * Debits Accounts Payable and Credits Cash/MoMo/Bank
 */
export function recordSupplierPayment(
  currentStore: OrgDataStore,
  supplierId: string,
  amount: number,
  paymentMethod: 'cash' | 'momo' | 'bank_transfer' | 'cheque',
  reference: string,
  notes: string,
  operatorName = 'System Operator'
): OrgDataStore {
  const store = structuredClone(currentStore);
  const now = new Date().toISOString();
  const paymentAcc = getPaymentAccount(paymentMethod);

  const suppIndex = store.suppliers.findIndex((s) => s.id === supplierId);
  if (suppIndex < 0) return store;

  const supp = store.suppliers[suppIndex];
  const paidAmount = round2(amount);
  supp.outstandingBalance = round2(Math.max(0, supp.outstandingBalance - paidAmount));

  // Update supplier's unpaid bills sequentially
  let remainingPaid = paidAmount;
  for (const purchase of store.purchases) {
    if (purchase.supplierId === supplierId && purchase.balanceAmount > 0 && remainingPaid > 0) {
      const applyAmount = Math.min(purchase.balanceAmount, remainingPaid);
      purchase.paidAmount = round2(purchase.paidAmount + applyAmount);
      purchase.balanceAmount = round2(purchase.balanceAmount - applyAmount);
      purchase.paymentStatus = purchase.balanceAmount <= 0 ? 'paid' : 'partial';
      remainingPaid -= applyAmount;
    }
  }

  // Create Double-Entry Ledger entries
  const ledgerEntries: LedgerEntry[] = [
    {
      id: `led-${Date.now()}-ap`,
      orgId: store.org.id,
      transactionId: `spmt-${Date.now()}`,
      transactionType: 'supplier_payment',
      date: new Date().toISOString().split('T')[0],
      accountCode: CHART_OF_ACCOUNTS.ACCOUNTS_PAYABLE.code,
      accountName: CHART_OF_ACCOUNTS.ACCOUNTS_PAYABLE.name,
      debit: paidAmount,
      credit: 0,
      description: `Settlement of Accounts Payable to ${supp.name} (${reference})`,
      reference,
      createdAt: now,
    },
    {
      id: `led-${Date.now()}-cash`,
      orgId: store.org.id,
      transactionId: `spmt-${Date.now()}`,
      transactionType: 'supplier_payment',
      date: new Date().toISOString().split('T')[0],
      accountCode: paymentAcc.code,
      accountName: paymentAcc.name,
      debit: 0,
      credit: paidAmount,
      description: `Disbursement to supplier ${supp.name} via ${paymentMethod}`,
      reference,
      createdAt: now,
    },
  ];

  const auditEntry: AuditLog = {
    id: `audit-${Date.now()}`,
    orgId: store.org.id,
    userId: 'usr-operator',
    userName: operatorName,
    action: 'SUPPLIER_PAYMENT',
    entityType: 'supplier',
    entityId: supp.id,
    details: `Paid ${store.org.currencySymbol}${paidAmount} to supplier ${supp.name} via ${paymentMethod}. New balance: ${store.org.currencySymbol}${supp.outstandingBalance}`,
    timestamp: now,
  };

  store.ledgerEntries.push(...ledgerEntries);
  store.auditLogs.unshift(auditEntry);

  saveOrganizationData(store.org.id, store);
  return store;
}

/**
 * Record an Operating Expense
 */
export function recordExpenseTransaction(
  currentStore: OrgDataStore,
  expense: Expense,
  operatorName = 'System Operator'
): OrgDataStore {
  const store = structuredClone(currentStore);
  const now = new Date().toISOString();

  const ledgerEntries = generateExpenseLedgerEntries(expense);

  const auditEntry: AuditLog = {
    id: `audit-${Date.now()}`,
    orgId: store.org.id,
    userId: 'usr-operator',
    userName: operatorName,
    action: 'EXPENSE_RECORDED',
    entityType: 'expense',
    entityId: expense.id,
    details: `Recorded expense ${expense.reference} (${expense.categoryLabel}): ${store.org.currencySymbol}${expense.amount} to ${expense.payee}`,
    timestamp: now,
  };

  store.expenses.unshift(expense);
  store.ledgerEntries.push(...ledgerEntries);
  store.auditLogs.unshift(auditEntry);

  saveOrganizationData(store.org.id, store);
  return store;
}

/**
 * Stock Adjustment (for write-offs, physical count adjustments, spoilage)
 */
export function adjustProductStock(
  currentStore: OrgDataStore,
  productId: string,
  newQuantity: number,
  reason: string,
  operatorName = 'System Operator'
): OrgDataStore {
  const store = structuredClone(currentStore);
  const now = new Date().toISOString();

  const prodIndex = store.products.findIndex((p) => p.id === productId);
  if (prodIndex < 0) return store;

  const prod = store.products[prodIndex];
  const oldQuantity = prod.stockQuantity;
  const diff = newQuantity - oldQuantity;
  if (diff === 0) return store;

  prod.stockQuantity = newQuantity;

  const movement: StockMovement = {
    id: `mov-adj-${Date.now()}`,
    orgId: store.org.id,
    productId: prod.id,
    productName: prod.name,
    type: 'adjustment',
    quantityChange: diff,
    balanceAfter: newQuantity,
    unitCost: prod.purchaseCost,
    reference: 'STOCK-ADJUSTMENT',
    branchId: store.org.activeBranchId,
    date: new Date().toISOString().split('T')[0],
    notes: `${reason} (Adjusted by ${diff > 0 ? '+' : ''}${diff})`,
  };

  const auditEntry: AuditLog = {
    id: `audit-${Date.now()}`,
    orgId: store.org.id,
    userId: 'usr-operator',
    userName: operatorName,
    action: 'STOCK_ADJUSTED',
    entityType: 'product',
    entityId: prod.id,
    details: `Stock for ${prod.name} adjusted from ${oldQuantity} to ${newQuantity}. Reason: ${reason}`,
    timestamp: now,
  };

  store.stockMovements.unshift(movement);
  store.auditLogs.unshift(auditEntry);

  saveOrganizationData(store.org.id, store);
  return store;
}

/**
 * Reset Demo Data
 */
export function resetOrganizationToDemo(orgId: string = DEMO_ORG_ID): OrgDataStore {
  const demo = getInitialDemoData();
  const dataStore: OrgDataStore = {
    ...demo,
    auditLogs: [
      {
        id: `audit-reset-${Date.now()}`,
        orgId,
        userId: 'usr-kofi',
        userName: 'Kofi Mensah',
        action: 'ORG_RESET',
        entityType: 'organization',
        entityId: orgId,
        details: 'Reset system data to standard demo records.',
        timestamp: new Date().toISOString(),
      },
    ],
  };
  saveOrganizationData(orgId, dataStore);
  return dataStore;
}
