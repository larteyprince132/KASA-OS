import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSaleLedgerEntries,
  generatePurchaseLedgerEntries,
  generateExpenseLedgerEntries,
  verifyLedgerBalance,
  calculateWeightedAverageCost,
  generateProfitAndLoss,
  calculateDashboardMetrics,
  round2,
} from './accounting';
import { Sale, Purchase, Expense, Product, Customer, Supplier } from '../types';

test('Double-Entry Balance: Sale with partial payment balances debits and credits', () => {
  const mockSale: Sale = {
    id: 'sale-001',
    orgId: 'org-test',
    branchId: 'b-accra',
    invoiceNumber: 'INV-2026-001',
    customerId: 'cust-1',
    customerName: 'Kwame Mensah',
    date: '2026-11-10',
    dueDate: '2026-11-24',
    items: [
      {
        productId: 'prod-1',
        productName: 'Cement 50kg',
        sku: 'CEM-01',
        quantity: 10,
        unitPrice: 120,
        unitCost: 85,
        discountPercent: 0,
        taxRatePercent: 0,
        subtotal: 1200,
        total: 1200,
      },
    ],
    subtotal: 1200,
    discountTotal: 0,
    taxTotal: 0,
    totalAmount: 1200,
    paidAmount: 800, // Partial payment
    balanceAmount: 400, // Remaining receivable
    paymentStatus: 'partial',
    paymentMethod: 'momo',
    status: 'posted',
    createdBy: 'user-1',
    createdAt: '2026-11-10T08:00:00Z',
  };

  const cogsTotal = 85 * 10; // 850
  const entries = generateSaleLedgerEntries(mockSale, cogsTotal);

  const verification = verifyLedgerBalance(entries);
  assert.equal(verification.isBalanced, true, 'Sale ledger debits must strictly equal credits');
  // Debits: MoMo 800 + AR 400 + COGS 850 = 2050
  // Credits: Sales Revenue 1200 + Inventory 850 = 2050
  assert.equal(verification.totalDebits, 2050);
  assert.equal(verification.totalCredits, 2050);
  assert.equal(verification.difference, 0);
});

test('Double-Entry Balance: Purchase of goods on supplier credit balances debits and credits', () => {
  const mockPurchase: Purchase = {
    id: 'purch-001',
    orgId: 'org-test',
    branchId: 'b-accra',
    billNumber: 'BILL-1001',
    supplierId: 'supp-1',
    supplierName: 'Ghana Cement Works',
    date: '2026-11-10',
    dueDate: '2026-12-10',
    items: [
      {
        productId: 'prod-1',
        productName: 'Cement 50kg',
        sku: 'CEM-01',
        quantity: 100,
        unitCost: 80,
        total: 8000,
      },
    ],
    totalAmount: 8000,
    paidAmount: 3000,
    balanceAmount: 5000, // Payable liability
    paymentStatus: 'partial',
    paymentMethod: 'bank_transfer',
    status: 'received',
    createdAt: '2026-11-10T08:30:00Z',
  };

  const entries = generatePurchaseLedgerEntries(mockPurchase);
  const verification = verifyLedgerBalance(entries);

  assert.equal(verification.isBalanced, true, 'Purchase ledger must balance');
  // Debit: Inventory Asset 8000
  // Credit: Bank 3000, Accounts Payable 5000
  assert.equal(verification.totalDebits, 8000);
  assert.equal(verification.totalCredits, 8000);
});

test('Double-Entry Balance: Operating expense balances debits and credits', () => {
  const mockExpense: Expense = {
    id: 'exp-001',
    orgId: 'org-test',
    branchId: 'b-accra',
    reference: 'EXP-101',
    category: 'utilities',
    categoryLabel: 'Utilities & Power',
    amount: 650.5,
    paymentMethod: 'cash',
    date: '2026-11-10',
    payee: 'Electricity Company of Ghana (ECG)',
    description: 'November power bill',
    taxDeductible: true,
    createdAt: '2026-11-10T09:00:00Z',
  };

  const entries = generateExpenseLedgerEntries(mockExpense);
  const verification = verifyLedgerBalance(entries);

  assert.equal(verification.isBalanced, true);
  assert.equal(verification.totalDebits, 650.5);
  assert.equal(verification.totalCredits, 650.5);
});

test('Weighted Average Cost (WAC) formula handles additions accurately', () => {
  // Existing: 20 units at GH₵50 each = GH₵1,000
  // Purchasing: 30 units at GH₵60 each = GH₵1,800
  // Total cost = GH₵2,800 / 50 units = GH₵56.00
  const newWAC = calculateWeightedAverageCost(20, 50, 30, 60);
  assert.equal(newWAC, 56);

  // If currentQty is 0, new price is simply the new cost
  const initialCost = calculateWeightedAverageCost(0, 0, 10, 75);
  assert.equal(initialCost, 75);
});

test('Profit and Loss: Distinction between Accrual and Cash accounting', () => {
  const sales: Sale[] = [
    {
      id: 's1',
      orgId: 'o1',
      branchId: 'b1',
      invoiceNumber: 'INV-1',
      customerId: 'c1',
      customerName: 'Adom Stores',
      date: '2026-11-01',
      dueDate: '2026-11-15',
      items: [
        {
          productId: 'p1',
          productName: 'Item A',
          sku: 'A1',
          quantity: 10,
          unitPrice: 100,
          unitCost: 60,
          discountPercent: 0,
          taxRatePercent: 0,
          subtotal: 1000,
          total: 1000,
        },
      ],
      subtotal: 1000,
      discountTotal: 0,
      taxTotal: 0,
      totalAmount: 1000,
      paidAmount: 400, // 40% collected
      balanceAmount: 600,
      paymentStatus: 'partial',
      paymentMethod: 'cash',
      status: 'posted',
      createdBy: 'u1',
      createdAt: '2026-11-01T10:00:00Z',
    },
  ];

  const expenses: Expense[] = [
    {
      id: 'e1',
      orgId: 'o1',
      branchId: 'b1',
      reference: 'EXP-1',
      category: 'rent',
      categoryLabel: 'Rent',
      amount: 200,
      paymentMethod: 'cash',
      date: '2026-11-02',
      payee: 'Landlord',
      description: 'Shop rent',
      taxDeductible: true,
      createdAt: '2026-11-02T10:00:00Z',
    },
  ];

  // Accrual basis: Revenue = 1000, COGS = 600, Gross Profit = 400, Expenses = 200, Net Profit = 200
  const pnlAccrual = generateProfitAndLoss(sales, expenses, 'accrual');
  assert.equal(pnlAccrual.revenue, 1000);
  assert.equal(pnlAccrual.cogs, 600);
  assert.equal(pnlAccrual.grossProfit, 400);
  assert.equal(pnlAccrual.netProfit, 200);

  // Cash basis: Revenue = 400 (only cash collected), COGS = 240 (40% of 600), Gross Profit = 160, Expenses = 200, Net Profit = -40
  const pnlCash = generateProfitAndLoss(sales, expenses, 'cash');
  assert.equal(pnlCash.revenue, 400);
  assert.equal(pnlCash.cogs, 240);
  assert.equal(pnlCash.grossProfit, 160);
  assert.equal(pnlCash.netProfit, -40);
});

test('Decimal safe rounding avoids JavaScript binary float issues', () => {
  const result = round2(0.1 + 0.2);
  assert.equal(result, 0.3);
});
