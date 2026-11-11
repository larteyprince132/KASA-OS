import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { BusinessOnboarding } from './components/onboarding/BusinessOnboarding';
import { BusinessShell } from './components/business/BusinessShell';
import { SuperAdminPortal } from './components/admin/SuperAdminPortal';
import { SuspendedNotice } from './components/common/SuspendedNotice';

const MainAppRouter: React.FC = () => {
  const { currentView, isLoading, isSuspended } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center font-sans text-neutral-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg mx-auto shadow-sm animate-pulse">
            K
          </div>
          <div className="text-sm font-semibold tracking-wide text-neutral-300">Loading KASA OS...</div>
          <p className="text-xs text-neutral-500">Connecting to secure multi-tenant cloud storage</p>
        </div>
      </div>
    );
  }

  // If business is suspended and user is not super admin
  if (isSuspended && currentView !== 'super_admin') {
    return <SuspendedNotice />;
  }

  switch (currentView) {
    case 'super_admin':
      return <SuperAdminPortal />;
    case 'onboarding':
      return <BusinessOnboarding />;
    case 'business_app':
      return <BusinessShell />;
    case 'landing':
    default:
      return <LandingPage />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppRouter />
    </AuthProvider>
  );
}
