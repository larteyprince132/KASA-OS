/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { OverviewView } from './components/dashboard/OverviewView';
import { SalesView } from './components/sales/SalesView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { TransactionsView } from './components/ledger/TransactionsView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { InventoryView } from './components/inventory/InventoryView';
import { CustomersView } from './components/customers/CustomersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { FinancialReportsView } from './components/reports/FinancialReportsView';
import { KasaIntelligenceView } from './components/intelligence/KasaIntelligenceView';
import { ConversationalEntryView } from './components/entry/ConversationalEntryView';
import { EmployeesView } from './components/employees/EmployeesView';
import { SettingsView } from './components/settings/SettingsView';

import { NewSaleModal } from './components/sales/NewSaleModal';
import { NewPurchaseModal } from './components/purchases/NewPurchaseModal';
import { NewExpenseModal } from './components/expenses/NewExpenseModal';
import { NewProductModal } from './components/modals/NewProductModal';
import { NewCustomerModal } from './components/modals/NewCustomerModal';
import { DebtSettlementModal } from './components/modals/DebtSettlementModal';
import { CheckCircle2 } from 'lucide-react';

const MainShell: React.FC = () => {
  const { activeView, toastMessage } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Modal open states
  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);

  // Settlement modal state
  const [settlementConfig, setSettlementConfig] = useState<{
    isOpen: boolean;
    type: 'customer' | 'supplier';
    targetId?: string;
  }>({
    isOpen: false,
    type: 'customer',
  });

  const renderActiveView = () => {
    switch (activeView) {
      case 'overview':
        return (
          <OverviewView
            onOpenNewSale={() => setIsSaleOpen(true)}
            onOpenNewPurchase={() => setIsPurchaseOpen(true)}
            onOpenNewExpense={() => setIsExpenseOpen(true)}
          />
        );
      case 'sales':
      case 'invoices':
        return <SalesView onOpenNewSale={() => setIsSaleOpen(true)} />;
      case 'purchases':
        return (
          <PurchasesView
            onOpenNewPurchase={() => setIsPurchaseOpen(true)}
            onOpenPaySupplier={(supplierId) =>
              setSettlementConfig({ isOpen: true, type: 'supplier', targetId: supplierId })
            }
          />
        );
      case 'transactions':
        return <TransactionsView />;
      case 'expenses':
        return <ExpensesView onOpenNewExpense={() => setIsExpenseOpen(true)} />;
      case 'inventory':
        return <InventoryView onOpenNewProduct={() => setIsProductOpen(true)} />;
      case 'customers':
        return (
          <CustomersView
            onOpenNewCustomer={() => setIsCustomerOpen(true)}
            onOpenSettleDebt={(customerId) =>
              setSettlementConfig({ isOpen: true, type: 'customer', targetId: customerId })
            }
          />
        );
      case 'suppliers':
        return (
          <SuppliersView
            onOpenPaySupplier={(supplierId) =>
              setSettlementConfig({ isOpen: true, type: 'supplier', targetId: supplierId })
            }
          />
        );
      case 'reports':
        return <FinancialReportsView />;
      case 'intelligence':
        return <KasaIntelligenceView />;
      case 'entry':
        return <ConversationalEntryView />;
      case 'employees':
        return <EmployeesView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <OverviewView
            onOpenNewSale={() => setIsSaleOpen(true)}
            onOpenNewPurchase={() => setIsPurchaseOpen(true)}
            onOpenNewExpense={() => setIsExpenseOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-900 font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-68">
        <TopHeader
          setMobileOpen={setMobileOpen}
          onOpenNewSale={() => setIsSaleOpen(true)}
          onOpenNewPurchase={() => setIsPurchaseOpen(true)}
          onOpenNewExpense={() => setIsExpenseOpen(true)}
          onOpenNewProduct={() => setIsProductOpen(true)}
          onOpenNewCustomer={() => setIsCustomerOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <NewSaleModal isOpen={isSaleOpen} onClose={() => setIsSaleOpen(false)} />
      <NewPurchaseModal isOpen={isPurchaseOpen} onClose={() => setIsPurchaseOpen(false)} />
      <NewExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} />
      <NewProductModal isOpen={isProductOpen} onClose={() => setIsProductOpen(false)} />
      <NewCustomerModal isOpen={isCustomerOpen} onClose={() => setIsCustomerOpen(false)} />

      {settlementConfig.isOpen && (
        <DebtSettlementModal
          isOpen={settlementConfig.isOpen}
          onClose={() => setSettlementConfig({ isOpen: false, type: 'customer' })}
          targetType={settlementConfig.type}
          targetId={settlementConfig.targetId}
        />
      )}

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainShell />
    </AppProvider>
  );
}
