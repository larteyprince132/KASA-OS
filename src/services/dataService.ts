import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Business,
  UserProfile,
  Sale,
  Expense,
  Product,
  Customer,
  Supplier,
  BusinessMetrics,
  PlatformAuditLog,
  PlatformSetting,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Local cache keys for offline resiliency
const LOCAL_STORAGE_PREFIX = 'kasa_os_tenant_';

export function getLocalTenantData<T>(businessId: string, key: string): T[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${businessId}_${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalTenantData<T>(businessId: string, key: string, data: T[]): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${businessId}_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to local cache:', err);
  }
}

/**
 * Business Tenant Operations
 */
export async function getBusiness(businessId: string): Promise<Business | null> {
  const path = `businesses/${businessId}`;
  try {
    const snap = await getDoc(doc(db, 'businesses', businessId));
    if (snap.exists()) {
      return snap.data() as Business;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }

  // Fallback to local storage if offline
  try {
    const raw = localStorage.getItem(`kasa_os_biz_${businessId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function createBusiness(business: Business): Promise<void> {
  const path = `businesses/${business.id}`;
  // Save locally first for instant optimistic response
  localStorage.setItem(`kasa_os_biz_${business.id}`, JSON.stringify(business));

  // Add to global business index locally for admin view
  try {
    const rawIndex = localStorage.getItem('kasa_os_all_businesses');
    const index: Business[] = rawIndex ? JSON.parse(rawIndex) : [];
    if (!index.some((b) => b.id === business.id)) {
      index.unshift(business);
      localStorage.setItem('kasa_os_all_businesses', JSON.stringify(index));
    }
  } catch (e) {
    console.warn(e);
  }

  try {
    await setDoc(doc(db, 'businesses', business.id), business);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateBusinessStatus(businessId: string, status: 'active' | 'suspended'): Promise<void> {
  const path = `businesses/${businessId}`;
  try {
    await updateDoc(doc(db, 'businesses', businessId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }

  // Update local caches
  try {
    const raw = localStorage.getItem(`kasa_os_biz_${businessId}`);
    if (raw) {
      const biz = JSON.parse(raw);
      biz.status = status;
      biz.updatedAt = new Date().toISOString();
      localStorage.setItem(`kasa_os_biz_${businessId}`, JSON.stringify(biz));
    }

    const rawIndex = localStorage.getItem('kasa_os_all_businesses');
    if (rawIndex) {
      const index: Business[] = JSON.parse(rawIndex);
      const updated = index.map((b) => (b.id === businessId ? { ...b, status, updatedAt: new Date().toISOString() } : b));
      localStorage.setItem('kasa_os_all_businesses', JSON.stringify(updated));
    }
  } catch (e) {
    console.warn(e);
  }
}

/**
 * User Profile Operations
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }

  try {
    const raw = localStorage.getItem(`kasa_os_user_${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.uid}`;
  localStorage.setItem(`kasa_os_user_${profile.uid}`, JSON.stringify(profile));

  try {
    const rawUsers = localStorage.getItem('kasa_os_all_users');
    const allUsers: UserProfile[] = rawUsers ? JSON.parse(rawUsers) : [];
    const idx = allUsers.findIndex((u) => u.uid === profile.uid);
    if (idx >= 0) {
      allUsers[idx] = profile;
    } else {
      allUsers.unshift(profile);
    }
    localStorage.setItem('kasa_os_all_users', JSON.stringify(allUsers));
  } catch (e) {
    console.warn(e);
  }

  try {
    await setDoc(doc(db, 'users', profile.uid), profile);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Tenant Sales Operations
 */
export async function getTenantSales(businessId: string): Promise<Sale[]> {
  const path = `businesses/${businessId}/sales`;
  try {
    const q = query(collection(db, 'businesses', businessId, 'sales'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Sale);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
  return getLocalTenantData<Sale>(businessId, 'sales');
}

export async function createTenantSale(businessId: string, sale: Sale): Promise<void> {
  const path = `businesses/${businessId}/sales/${sale.id}`;
  // Save locally first
  const current = getLocalTenantData<Sale>(businessId, 'sales');
  current.unshift(sale);
  saveLocalTenantData(businessId, 'sales', current);

  // If customer has a balance, update customer outstanding balance
  if (sale.balanceAmount > 0 && sale.customerId) {
    const customers = getLocalTenantData<Customer>(businessId, 'customers');
    const cust = customers.find((c) => c.id === sale.customerId);
    if (cust) {
      cust.outstandingBalance = (cust.outstandingBalance || 0) + sale.balanceAmount;
      cust.totalPurchases = (cust.totalPurchases || 0) + sale.totalAmount;
      saveLocalTenantData(businessId, 'customers', customers);
    }
  }

  // Deduct inventory quantities
  if (sale.items && sale.items.length > 0) {
    const products = getLocalTenantData<Product>(businessId, 'products');
    for (const item of sale.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
      }
    }
    saveLocalTenantData(businessId, 'products', products);
  }

  try {
    await setDoc(doc(db, 'businesses', businessId, 'sales', sale.id), sale);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Tenant Expenses Operations
 */
export async function getTenantExpenses(businessId: string): Promise<Expense[]> {
  const path = `businesses/${businessId}/expenses`;
  try {
    const q = query(collection(db, 'businesses', businessId, 'expenses'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Expense);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
  return getLocalTenantData<Expense>(businessId, 'expenses');
}

export async function createTenantExpense(businessId: string, expense: Expense): Promise<void> {
  const path = `businesses/${businessId}/expenses/${expense.id}`;
  const current = getLocalTenantData<Expense>(businessId, 'expenses');
  current.unshift(expense);
  saveLocalTenantData(businessId, 'expenses', current);

  try {
    await setDoc(doc(db, 'businesses', businessId, 'expenses', expense.id), expense);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Tenant Inventory Operations
 */
export async function getTenantProducts(businessId: string): Promise<Product[]> {
  const path = `businesses/${businessId}/inventory`;
  try {
    const snap = await getDocs(collection(db, 'businesses', businessId, 'inventory'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Product);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
  return getLocalTenantData<Product>(businessId, 'products');
}

export async function createTenantProduct(businessId: string, product: Product): Promise<void> {
  const path = `businesses/${businessId}/inventory/${product.id}`;
  const current = getLocalTenantData<Product>(businessId, 'products');
  current.unshift(product);
  saveLocalTenantData(businessId, 'products', current);

  try {
    await setDoc(doc(db, 'businesses', businessId, 'inventory', product.id), product);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateTenantProductStock(businessId: string, productId: string, newStock: number): Promise<void> {
  const products = getLocalTenantData<Product>(businessId, 'products');
  const prod = products.find((p) => p.id === productId);
  if (prod) {
    prod.stockQuantity = newStock;
    saveLocalTenantData(businessId, 'products', products);
  }

  try {
    await updateDoc(doc(db, 'businesses', businessId, 'inventory', productId), {
      stockQuantity: newStock,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/inventory/${productId}`);
  }
}

/**
 * Tenant Customer Operations
 */
export async function getTenantCustomers(businessId: string): Promise<Customer[]> {
  const path = `businesses/${businessId}/customers`;
  try {
    const snap = await getDocs(collection(db, 'businesses', businessId, 'customers'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Customer);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
  return getLocalTenantData<Customer>(businessId, 'customers');
}

export async function createTenantCustomer(businessId: string, customer: Customer): Promise<void> {
  const path = `businesses/${businessId}/customers/${customer.id}`;
  const current = getLocalTenantData<Customer>(businessId, 'customers');
  current.unshift(customer);
  saveLocalTenantData(businessId, 'customers', current);

  try {
    await setDoc(doc(db, 'businesses', businessId, 'customers', customer.id), customer);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Tenant Supplier Operations
 */
export async function getTenantSuppliers(businessId: string): Promise<Supplier[]> {
  const path = `businesses/${businessId}/suppliers`;
  try {
    const snap = await getDocs(collection(db, 'businesses', businessId, 'suppliers'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Supplier);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
  return getLocalTenantData<Supplier>(businessId, 'suppliers');
}

export async function createTenantSupplier(businessId: string, supplier: Supplier): Promise<void> {
  const path = `businesses/${businessId}/suppliers/${supplier.id}`;
  const current = getLocalTenantData<Supplier>(businessId, 'suppliers');
  current.unshift(supplier);
  saveLocalTenantData(businessId, 'suppliers', current);

  try {
    await setDoc(doc(db, 'businesses', businessId, 'suppliers', supplier.id), supplier);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Calculate dynamic tenant metrics from actual records
 */
export function calculateTenantMetrics(
  sales: Sale[],
  expenses: Expense[],
  products: Product[],
  customers: Customer[],
  suppliers: Supplier[]
): BusinessMetrics {
  const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const cashInflows = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  const outstandingReceivables = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Estimate COGS from sales items or 65% of sales
  let estimatedCOGS = 0;
  for (const sale of sales) {
    if (sale.items && sale.items.length > 0) {
      for (const item of sale.items) {
        const prod = products.find((p) => p.id === item.productId);
        const cost = prod ? prod.purchaseCost : item.unitPrice * 0.7;
        estimatedCOGS += cost * item.quantity;
      }
    } else {
      estimatedCOGS += sale.totalAmount * 0.7;
    }
  }

  const grossProfit = totalSales - estimatedCOGS;
  const netProfit = grossProfit - totalExpenses;
  const inventoryValue = products.reduce((sum, p) => sum + (p.purchaseCost || 0) * (p.stockQuantity || 0), 0);
  const outstandingPayables = suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);

  return {
    totalSales,
    totalExpenses,
    grossProfit,
    netProfit,
    cashInflows,
    outstandingReceivables,
    outstandingPayables,
    inventoryValue,
    salesCount: sales.length,
    inventoryCount: products.length,
    customersCount: customers.length,
    suppliersCount: suppliers.length,
  };
}

/**
 * Super Admin Operations
 */
export async function getAllBusinesses(): Promise<Business[]> {
  try {
    const snap = await getDocs(collection(db, 'businesses'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as Business);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'businesses');
  }

  try {
    const raw = localStorage.getItem('kasa_os_all_businesses');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as UserProfile);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
  }

  try {
    const raw = localStorage.getItem('kasa_os_all_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getPlatformAuditLogs(): Promise<PlatformAuditLog[]> {
  try {
    const q = query(collection(db, 'platform_audit_logs'), orderBy('timestamp', 'desc'), limit(50));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as PlatformAuditLog);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'platform_audit_logs');
  }

  try {
    const raw = localStorage.getItem('kasa_os_platform_audit_logs');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addPlatformAuditLog(log: Omit<PlatformAuditLog, 'id' | 'timestamp'>): Promise<void> {
  const fullLog: PlatformAuditLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const current = await getPlatformAuditLogs();
    current.unshift(fullLog);
    localStorage.setItem('kasa_os_platform_audit_logs', JSON.stringify(current));
  } catch (e) {
    console.warn(e);
  }

  try {
    await setDoc(doc(db, 'platform_audit_logs', fullLog.id), fullLog);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `platform_audit_logs/${fullLog.id}`);
  }
}
