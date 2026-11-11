export type IndustryType =
  | 'retail'
  | 'wholesale'
  | 'manufacturing'
  | 'agriculture'
  | 'hospitality'
  | 'services'
  | 'construction'
  | 'automotive'
  | 'ecommerce'
  | 'other';

export interface Business {
  id: string;
  name: string;
  industry: IndustryType;
  email: string;
  phone: string;
  address: string;
  country: string;
  currency: string;
  currencySymbol: string;
  ownerId: string;
  ownerEmail: string;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'staff' | 'SUPER_ADMIN';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  businessId?: string | null;
  businessName?: string | null;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  businessId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentMethod: 'cash' | 'momo' | 'bank_transfer' | 'cheque' | 'card';
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  category: 'rent' | 'utilities' | 'salaries' | 'transport' | 'repairs' | 'marketing' | 'fees' | 'supplies' | 'other';
  payee: string;
  amount: number;
  paymentMethod: 'cash' | 'momo' | 'bank_transfer' | 'cheque' | 'card';
  date: string;
  notes?: string;
  receiptRef?: string;
  taxDeductible: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  sku: string;
  name: string;
  category: string;
  purchaseCost: number;
  sellingPrice: number;
  stockQuantity: number;
  minReorderPoint: number;
  unit: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimit: number;
  outstandingBalance: number;
  totalPurchases: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  contactPerson?: string;
  paymentTerms: string;
  outstandingBalance: number;
  createdAt: string;
}

export interface BusinessMetrics {
  totalSales: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  cashInflows: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  inventoryValue: number;
  salesCount: number;
  inventoryCount: number;
  customersCount: number;
  suppliersCount: number;
}

export interface PlatformAuditLog {
  id: string;
  action: string;
  details: string;
  adminEmail: string;
  adminUid: string;
  targetBusinessId?: string;
  targetBusinessName?: string;
  timestamp: string;
}

export interface PlatformSetting {
  id: string;
  platformName: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  defaultCurrency: string;
  supportEmail: string;
  updatedAt: string;
}

export interface PlatformOverviewData {
  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  totalUsers: number;
  recentRegistrations: Business[];
  industryCounts: Record<string, number>;
}
