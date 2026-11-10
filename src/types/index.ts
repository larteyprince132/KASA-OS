export type IndustryType =
  | 'retail'
  | 'hospitality'
  | 'automotive'
  | 'distribution'
  | 'professional_services'
  | 'manufacturing'
  | 'general';

export type UserRole = 'owner' | 'admin' | 'accountant' | 'manager' | 'cashier';

export interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
  isMain: boolean;
  phone?: string;
}

export interface Organization {
  id: string;
  name: string;
  industry: IndustryType;
  description: string;
  country: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  businessSize: string;
  employeeCount: number;
  taxIdentificationNumber?: string;
  branches: Branch[];
  activeBranchId: string;
  taxRatePercent: number; // e.g. 15% (VAT/NHIL/GETFund or custom)
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string;
  avatarUrl?: string;
  status: 'active' | 'suspended';
}

export interface Product {
  id: string;
  orgId: string;
  sku: string;
  barcode?: string;
  name: string;
  category: string;
  unit: string; // e.g. 'bag', 'pcs', 'kg', 'box', 'hrs'
  purchaseCost: number;
  sellingPrice: number;
  stockQuantity: number;
  minReorderPoint: number;
  branchStock: Record<string, number>; // branchId -> quantity
  isService: boolean;
  notes?: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  orgId: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'reversal';
  quantityChange: number; // negative for sales, positive for purchases/returns
  balanceAfter: number;
  unitCost: number;
  reference: string;
  branchId: string;
  fromBranchId?: string;
  toBranchId?: string;
  date: string;
  notes?: string;
}

export interface Customer {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  taxNumber?: string;
  creditLimit: number;
  totalPurchases: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  orgId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTermsDays: number;
  totalPurchased: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountPercent: number;
  taxRatePercent: number;
  subtotal: number;
  total: number;
}

export interface Sale {
  id: string;
  orgId: string;
  branchId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentMethod: 'cash' | 'momo' | 'bank_transfer' | 'cheque';
  status: 'posted' | 'draft' | 'voided';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Purchase {
  id: string;
  orgId: string;
  branchId: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  dueDate: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentMethod: 'cash' | 'momo' | 'bank_transfer' | 'cheque';
  status: 'received' | 'draft' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'rent'
  | 'utilities'
  | 'salaries'
  | 'transport_logistics'
  | 'repairs_maintenance'
  | 'marketing'
  | 'licenses_permits'
  | 'office_supplies'
  | 'financial_fees'
  | 'other';

export interface Expense {
  id: string;
  orgId: string;
  branchId: string;
  reference: string;
  category: ExpenseCategory;
  categoryLabel: string;
  amount: number;
  paymentMethod: 'cash' | 'momo' | 'bank_transfer' | 'cheque';
  date: string;
  payee: string;
  description: string;
  taxDeductible: boolean;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  orgId: string;
  transactionId: string;
  transactionType: 'sale' | 'purchase' | 'customer_payment' | 'supplier_payment' | 'expense' | 'reversal';
  date: string;
  accountCode: string; // e.g. "1010", "1100", "4000"
  accountName: string;
  debit: number;
  credit: number;
  description: string;
  reference: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalSales: number;
  collectedPayments: number;
  outstandingReceivables: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  cashPosition: number;
  inventoryValue: number;
  outstandingPayables: number;
  totalSalesCount: number;
  lowStockCount: number;
}
