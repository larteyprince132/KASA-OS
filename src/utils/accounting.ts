import {
  LedgerEntry,
  Sale,
  Purchase,
  Expense,
  Product,
  Customer,
  Supplier,
  DashboardMetrics,
} from '../types';

/**
 * Standard Chart of Accounts for KASA OS
 */
export const CHART_OF_ACCOUNTS = {
  // Assets (1000 - 1999)
  CASH_ON_HAND: { code: '1010', name: 'Cash on Hand', type: 'asset' },
  MOBILE_MONEY: { code: '1020', name: 'Mobile Money Account', type: 'asset' },
  BANK_ACCOUNT: { code: '1030', name: 'Operating Bank Account', type: 'asset' },
  ACCOUNTS_RECEIVABLE: { code: '1100', name: 'Accounts Receivable (Debtors)', type: 'asset' },
  INVENTORY_ASSET: { code: '1200', name: 'Merchandise Inventory', type: 'asset' },

  // Liabilities (2000 - 2999)
  ACCOUNTS_PAYABLE: { code: '2010', name: 'Accounts Payable (Creditors)', type: 'liability' },
  TAXES_PAYABLE: { code: '2020', name: 'VAT / Tax Payable', type: 'liability' },

  // Equity (3000 - 3999)
  OWNERS_EQUITY: { code: '3000', name: "Owner's Capital", type: 'equity' },
  RETAINED_EARNINGS: { code: '3010', name: 'Retained Earnings', type: 'equity' },

  // Revenue (4000 - 4999)
  SALES_REVENUE: { code: '4000', name: 'Sales Revenue', type: 'revenue' },
  SERVICE_REVENUE: { code: '4010', name: 'Service Revenue', type: 'revenue' },

  // Cost of Goods Sold (5000 - 5999)
  COST_OF_GOODS_SOLD: { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'cogs' },

  // Operating Expenses (6000 - 6999)
  RENT_EXPENSE: { code: '6010', name: 'Rent & Premises', type: 'expense' },
  UTILITIES_EXPENSE: { code: '6020', name: 'Utilities & Power', type: 'expense' },
  SALARIES_EXPENSE: { code: '6030', name: 'Staff Wages & Salaries', type: 'expense' },
  TRANSPORT_EXPENSE: { code: '6040', name: 'Transport & Logistics', type: 'expense' },
  REPAIRS_EXPENSE: { code: '6050', name: 'Repairs & Maintenance', type: 'expense' },
  MARKETING_EXPENSE: { code: '6060', name: 'Marketing & Promotion', type: 'expense' },
  FEES_EXPENSE: { code: '6070', name: 'Bank & Mobile Money Charges', type: 'expense' },
  GENERAL_EXPENSE: { code: '6090', name: 'General & Administrative', type: 'expense' },
} as const;

/**
 * Format currency with 2 decimal places and given symbol
 */
export function formatCurrency(amount: number, symbol = 'GH₵'): string {
  const num = Number.isFinite(amount) ? amount : 0;
  return `${symbol} ${num.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Decimal safe round to 2 places
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Determine asset account code based on payment method
 */
export function getPaymentAccount(method: 'cash' | 'momo' | 'bank_transfer' | 'cheque'): { code: string; name: string } {
  switch (method) {
    case 'cash':
      return { code: CHART_OF_ACCOUNTS.CASH_ON_HAND.code, name: CHART_OF_ACCOUNTS.CASH_ON_HAND.name };
    case 'momo':
      return { code: CHART_OF_ACCOUNTS.MOBILE_MONEY.code, name: CHART_OF_ACCOUNTS.MOBILE_MONEY.name };
    case 'bank_transfer':
    case 'cheque':
    default:
      return { code: CHART_OF_ACCOUNTS.BANK_ACCOUNT.code, name: CHART_OF_ACCOUNTS.BANK_ACCOUNT.name };
  }
}

/**
 * Generate immutable Double-Entry Ledger entries for a Sale
 * Follows core accounting equation: Assets = Liabilities + Equity
 * For a sale:
 *  - Debit Cash/MoMo/Bank (collected portion)
 *  - Debit Accounts Receivable (unpaid balance)
 *  - Credit Sales Revenue (total sale amount before tax, or subtotal)
 *  - Credit Tax Payable (tax portion, if any)
 *  - Debit COGS (total cost of inventory sold)
 *  - Credit Inventory Asset (cost of inventory leaving stock)
 */
export function generateSaleLedgerEntries(
  sale: Sale,
  cogsTotal: number
): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  const now = new Date().toISOString();
  const paymentAcc = getPaymentAccount(sale.paymentMethod);

  // 1. Debit Cash/Bank/MoMo for collected payment
  if (sale.paidAmount > 0) {
    entries.push({
      id: `led-${sale.id}-cash`,
      orgId: sale.orgId,
      transactionId: sale.id,
      transactionType: 'sale',
      date: sale.date,
      accountCode: paymentAcc.code,
      accountName: paymentAcc.name,
      debit: round2(sale.paidAmount),
      credit: 0,
      description: `Payment received for ${sale.invoiceNumber} (${sale.customerName})`,
      reference: sale.invoiceNumber,
      createdAt: now,
    });
  }

  // 2. Debit Accounts Receivable for outstanding debt
  if (sale.balanceAmount > 0) {
    entries.push({
      id: `led-${sale.id}-ar`,
      orgId: sale.orgId,
      transactionId: sale.id,
      transactionType: 'sale',
      date: sale.date,
      accountCode: CHART_OF_ACCOUNTS.ACCOUNTS_RECEIVABLE.code,
      accountName: CHART_OF_ACCOUNTS.ACCOUNTS_RECEIVABLE.name,
      debit: round2(sale.balanceAmount),
      credit: 0,
      description: `Credit extended for ${sale.invoiceNumber} (${sale.customerName})`,
      reference: sale.invoiceNumber,
      createdAt: now,
    });
  }

  // 3. Credit Sales Revenue (Net of tax)
  const netRevenue = round2(sale.totalAmount - sale.taxTotal);
  entries.push({
    id: `led-${sale.id}-rev`,
    orgId: sale.orgId,
    transactionId: sale.id,
    transactionType: 'sale',
    date: sale.date,
    accountCode: CHART_OF_ACCOUNTS.SALES_REVENUE.code,
    accountName: CHART_OF_ACCOUNTS.SALES_REVENUE.name,
    debit: 0,
    credit: netRevenue,
    description: `Sales revenue for ${sale.invoiceNumber}`,
    reference: sale.invoiceNumber,
    createdAt: now,
  });

  // 4. Credit Tax Payable if tax applied
  if (sale.taxTotal > 0) {
    entries.push({
      id: `led-${sale.id}-tax`,
      orgId: sale.orgId,
      transactionId: sale.id,
      transactionType: 'sale',
      date: sale.date,
      accountCode: CHART_OF_ACCOUNTS.TAXES_PAYABLE.code,
      accountName: CHART_OF_ACCOUNTS.TAXES_PAYABLE.name,
      debit: 0,
      credit: round2(sale.taxTotal),
      description: `Output VAT/NHIL on ${sale.invoiceNumber}`,
      reference: sale.invoiceNumber,
      createdAt: now,
    });
  }

  // 5. Debit COGS and Credit Inventory Asset if inventory cost is tracked
  if (cogsTotal > 0) {
    entries.push({
      id: `led-${sale.id}-cogs`,
      orgId: sale.orgId,
      transactionId: sale.id,
      transactionType: 'sale',
      date: sale.date,
      accountCode: CHART_OF_ACCOUNTS.COST_OF_GOODS_SOLD.code,
      accountName: CHART_OF_ACCOUNTS.COST_OF_GOODS_SOLD.name,
      debit: round2(cogsTotal),
      credit: 0,
      description: `COGS recognized for ${sale.invoiceNumber}`,
      reference: sale.invoiceNumber,
      createdAt: now,
    });

    entries.push({
      id: `led-${sale.id}-inv`,
      orgId: sale.orgId,
      transactionId: sale.id,
      transactionType: 'sale',
      date: sale.date,
      accountCode: CHART_OF_ACCOUNTS.INVENTORY_ASSET.code,
      accountName: CHART_OF_ACCOUNTS.INVENTORY_ASSET.name,
      debit: 0,
      credit: round2(cogsTotal),
      description: `Inventory reduction for ${sale.invoiceNumber}`,
      reference: sale.invoiceNumber,
      createdAt: now,
    });
  }

  return entries;
}

/**
 * Generate Ledger entries for Purchase
 * - Debit Inventory Asset (value of goods received)
 * - Credit Cash/MoMo/Bank (amount paid upfront)
 * - Credit Accounts Payable (outstanding balance due to supplier)
 */
export function generatePurchaseLedgerEntries(purchase: Purchase): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  const now = new Date().toISOString();
  const paymentAcc = getPaymentAccount(purchase.paymentMethod);

  // 1. Debit Inventory Asset
  entries.push({
    id: `led-${purchase.id}-inv`,
    orgId: purchase.orgId,
    transactionId: purchase.id,
    transactionType: 'purchase',
    date: purchase.date,
    accountCode: CHART_OF_ACCOUNTS.INVENTORY_ASSET.code,
    accountName: CHART_OF_ACCOUNTS.INVENTORY_ASSET.name,
    debit: round2(purchase.totalAmount),
    credit: 0,
    description: `Inventory stock-in from bill ${purchase.billNumber} (${purchase.supplierName})`,
    reference: purchase.billNumber,
    createdAt: now,
  });

  // 2. Credit Cash/Bank for paid portion
  if (purchase.paidAmount > 0) {
    entries.push({
      id: `led-${purchase.id}-cash`,
      orgId: purchase.orgId,
      transactionId: purchase.id,
      transactionType: 'purchase',
      date: purchase.date,
      accountCode: paymentAcc.code,
      accountName: paymentAcc.name,
      debit: 0,
      credit: round2(purchase.paidAmount),
      description: `Payment to supplier ${purchase.supplierName} (${purchase.billNumber})`,
      reference: purchase.billNumber,
      createdAt: now,
    });
  }

  // 3. Credit Accounts Payable for outstanding balance
  if (purchase.balanceAmount > 0) {
    entries.push({
      id: `led-${purchase.id}-ap`,
      orgId: purchase.orgId,
      transactionId: purchase.id,
      transactionType: 'purchase',
      date: purchase.date,
      accountCode: CHART_OF_ACCOUNTS.ACCOUNTS_PAYABLE.code,
      accountName: CHART_OF_ACCOUNTS.ACCOUNTS_PAYABLE.name,
      debit: 0,
      credit: round2(purchase.balanceAmount),
      description: `Accounts payable liability recorded for ${purchase.supplierName}`,
      reference: purchase.billNumber,
      createdAt: now,
    });
  }

  return entries;
}

/**
 * Generate Ledger entries for Operating Expense
 * - Debit Expense Account
 * - Credit Cash/MoMo/Bank Account
 */
export function generateExpenseLedgerEntries(expense: Expense): LedgerEntry[] {
  const now = new Date().toISOString();
  const paymentAcc = getPaymentAccount(expense.paymentMethod);

  let expenseAccount: { readonly code: string; readonly name: string; readonly type: string } =
    CHART_OF_ACCOUNTS.GENERAL_EXPENSE;
  switch (expense.category) {
    case 'rent':
      expenseAccount = CHART_OF_ACCOUNTS.RENT_EXPENSE;
      break;
    case 'utilities':
      expenseAccount = CHART_OF_ACCOUNTS.UTILITIES_EXPENSE;
      break;
    case 'salaries':
      expenseAccount = CHART_OF_ACCOUNTS.SALARIES_EXPENSE;
      break;
    case 'transport_logistics':
      expenseAccount = CHART_OF_ACCOUNTS.TRANSPORT_EXPENSE;
      break;
    case 'repairs_maintenance':
      expenseAccount = CHART_OF_ACCOUNTS.REPAIRS_EXPENSE;
      break;
    case 'marketing':
      expenseAccount = CHART_OF_ACCOUNTS.MARKETING_EXPENSE;
      break;
    case 'financial_fees':
      expenseAccount = CHART_OF_ACCOUNTS.FEES_EXPENSE;
      break;
    default:
      expenseAccount = CHART_OF_ACCOUNTS.GENERAL_EXPENSE;
      break;
  }

  return [
    {
      id: `led-${expense.id}-exp`,
      orgId: expense.orgId,
      transactionId: expense.id,
      transactionType: 'expense',
      date: expense.date,
      accountCode: expenseAccount.code,
      accountName: expenseAccount.name,
      debit: round2(expense.amount),
      credit: 0,
      description: `${expense.categoryLabel}: ${expense.description} (${expense.payee})`,
      reference: expense.reference,
      createdAt: now,
    },
    {
      id: `led-${expense.id}-pay`,
      orgId: expense.orgId,
      transactionId: expense.id,
      transactionType: 'expense',
      date: expense.date,
      accountCode: paymentAcc.code,
      accountName: paymentAcc.name,
      debit: 0,
      credit: round2(expense.amount),
      description: `Disbursement for ${expense.categoryLabel} to ${expense.payee}`,
      reference: expense.reference,
      createdAt: now,
    },
  ];
}

/**
 * Verify Ledger Balance: Total Debits must equal Total Credits
 */
export function verifyLedgerBalance(entries: LedgerEntry[]): {
  isBalanced: boolean;
  totalDebits: number;
  totalCredits: number;
  difference: number;
} {
  let totalDebits = 0;
  let totalCredits = 0;

  for (const entry of entries) {
    totalDebits += entry.debit;
    totalCredits += entry.credit;
  }

  totalDebits = round2(totalDebits);
  totalCredits = round2(totalCredits);
  const diff = round2(Math.abs(totalDebits - totalCredits));

  return {
    isBalanced: diff < 0.01,
    totalDebits,
    totalCredits,
    difference: diff,
  };
}

/**
 * Calculate Comprehensive Dashboard Metrics from live records
 */
export function calculateDashboardMetrics(
  sales: Sale[],
  purchases: Purchase[],
  expenses: Expense[],
  products: Product[],
  customers: Customer[],
  suppliers: Supplier[]
): DashboardMetrics {
  const activeSales = sales.filter((s) => s.status === 'posted');
  const activePurchases = purchases.filter((p) => p.status === 'received');

  let totalSales = 0;
  let collectedPayments = 0;
  let cogs = 0;

  for (const sale of activeSales) {
    totalSales += sale.totalAmount;
    collectedPayments += sale.paidAmount;
    for (const item of sale.items) {
      cogs += (item.unitCost || 0) * item.quantity;
    }
  }

  // Outstanding receivables calculated directly from sales or customer ledgers
  let outstandingReceivables = 0;
  for (const c of customers) {
    outstandingReceivables += Math.max(0, c.outstandingBalance || 0);
  }

  // Outstanding payables to suppliers
  let outstandingPayables = 0;
  for (const s of suppliers) {
    outstandingPayables += Math.max(0, s.outstandingBalance || 0);
  }

  let totalExpenses = 0;
  for (const exp of expenses) {
    totalExpenses += exp.amount;
  }

  // Gross profit = Total Sales Revenue - COGS
  const grossProfit = round2(totalSales - cogs);
  // Net profit = Gross profit - Operating expenses
  const netProfit = round2(grossProfit - totalExpenses);

  // Cash position = (Collected sales payments + other inflows) - (Paid purchases + expenses)
  let purchasePaid = 0;
  for (const p of activePurchases) {
    purchasePaid += p.paidAmount;
  }
  const cashPosition = round2(collectedPayments - (purchasePaid + totalExpenses));

  // Inventory value (Weighted Average Cost valuation)
  let inventoryValue = 0;
  let lowStockCount = 0;
  for (const prod of products) {
    if (!prod.isService) {
      inventoryValue += prod.purchaseCost * Math.max(0, prod.stockQuantity);
      if (prod.stockQuantity <= prod.minReorderPoint) {
        lowStockCount++;
      }
    }
  }

  return {
    totalSales: round2(totalSales),
    collectedPayments: round2(collectedPayments),
    outstandingReceivables: round2(outstandingReceivables),
    totalExpenses: round2(totalExpenses),
    grossProfit,
    netProfit,
    cashPosition,
    inventoryValue: round2(inventoryValue),
    outstandingPayables: round2(outstandingPayables),
    totalSalesCount: activeSales.length,
    lowStockCount,
  };
}

/**
 * Calculate Profit and Loss Statement with Accrual vs Cash distinction
 */
export function generateProfitAndLoss(
  sales: Sale[],
  expenses: Expense[],
  mode: 'accrual' | 'cash' = 'accrual'
) {
  const activeSales = sales.filter((s) => s.status === 'posted');

  let revenue = 0;
  let cogs = 0;

  if (mode === 'accrual') {
    // Accrual: Revenue is recognized when sale is made, regardless of payment
    for (const sale of activeSales) {
      revenue += sale.totalAmount - sale.taxTotal;
      for (const it of sale.items) {
        cogs += it.unitCost * it.quantity;
      }
    }
  } else {
    // Cash: Only collected cash counts as revenue; COGS proportionally recognized
    for (const sale of activeSales) {
      const collectionRatio = sale.totalAmount > 0 ? Math.min(1, sale.paidAmount / sale.totalAmount) : 0;
      revenue += (sale.totalAmount - sale.taxTotal) * collectionRatio;
      for (const it of sale.items) {
        cogs += it.unitCost * it.quantity * collectionRatio;
      }
    }
  }

  revenue = round2(revenue);
  cogs = round2(cogs);
  const grossProfit = round2(revenue - cogs);
  const grossMargin = revenue > 0 ? round2((grossProfit / revenue) * 100) : 0;

  // Breakdown of operating expenses by category
  const expenseBreakdown: Record<string, { label: string; amount: number }> = {};
  let totalOperatingExpenses = 0;

  for (const exp of expenses) {
    totalOperatingExpenses += exp.amount;
    if (!expenseBreakdown[exp.category]) {
      expenseBreakdown[exp.category] = { label: exp.categoryLabel, amount: 0 };
    }
    expenseBreakdown[exp.category].amount += exp.amount;
  }

  totalOperatingExpenses = round2(totalOperatingExpenses);
  const netProfit = round2(grossProfit - totalOperatingExpenses);
  const netMargin = revenue > 0 ? round2((netProfit / revenue) * 100) : 0;

  return {
    mode,
    revenue,
    cogs,
    grossProfit,
    grossMargin,
    operatingExpenses: totalOperatingExpenses,
    expenseBreakdown,
    netProfit,
    netMargin,
  };
}

/**
 * Weighted Average Cost (WAC) update formula when purchasing new stock:
 * New WAC = ((Old Quantity * Old WAC) + (New Quantity * Purchase Price)) / (Old Quantity + New Quantity)
 */
export function calculateWeightedAverageCost(
  currentQty: number,
  currentCost: number,
  addedQty: number,
  addedCost: number
): number {
  if (currentQty <= 0) {
    return addedCost;
  }
  const totalCost = currentQty * currentCost + addedQty * addedCost;
  const totalQty = currentQty + addedQty;
  if (totalQty <= 0) return currentCost;
  return round2(totalCost / totalQty);
}
