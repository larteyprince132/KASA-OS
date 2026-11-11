import { Sale, Expense, Product, Customer, Supplier, BusinessMetrics } from '../types';

/**
 * Standard double-entry account codes
 */
export const CHART_OF_ACCOUNTS = {
  CASH_ON_HAND: { code: '1010', name: 'Cash on Hand', type: 'asset' },
  MOBILE_MONEY: { code: '1020', name: 'Mobile Money Account', type: 'asset' },
  BANK_ACCOUNT: { code: '1030', name: 'Operating Bank Account', type: 'asset' },
  ACCOUNTS_RECEIVABLE: { code: '1100', name: 'Accounts Receivable (Debtors)', type: 'asset' },
  INVENTORY_ASSET: { code: '1200', name: 'Merchandise Inventory', type: 'asset' },
  ACCOUNTS_PAYABLE: { code: '2010', name: 'Accounts Payable (Creditors)', type: 'liability' },
  SALES_REVENUE: { code: '4000', name: 'Sales Revenue', type: 'revenue' },
  COST_OF_GOODS_SOLD: { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'cogs' },
  OPERATING_EXPENSES: { code: '6000', name: 'Operating Expenses', type: 'expense' },
} as const;

/**
 * Decimal safe rounding to 2 places
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Format currency with 2 decimal places and given symbol
 */
export function formatCurrency(amount: number, symbol = 'GH₵'): string {
  const num = Number.isFinite(amount) ? amount : 0;
  return `${symbol} ${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Weighted Average Cost (WAC) calculation when receiving new stock
 */
export function calculateWeightedAverageCost(
  currentStock: number,
  currentCost: number,
  addedStock: number,
  purchaseCost: number
): number {
  const totalStock = currentStock + addedStock;
  if (totalStock <= 0) return purchaseCost;
  const totalValue = currentStock * currentCost + addedStock * purchaseCost;
  return round2(totalValue / totalStock);
}

/**
 * Verify Double-Entry Balance
 */
export function verifyDoubleEntryBalance(entries: { debit: number; credit: number }[]): boolean {
  const totalDebit = round2(entries.reduce((sum, e) => sum + (e.debit || 0), 0));
  const totalCredit = round2(entries.reduce((sum, e) => sum + (e.credit || 0), 0));
  return Math.abs(totalDebit - totalCredit) < 0.01;
}
