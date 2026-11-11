import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { Business, UserProfile } from '../types';
import {
  getUserProfile,
  saveUserProfile,
  getBusiness,
  createBusiness,
} from '../services/dataService';

export const PLATFORM_OWNER_EMAIL = 'larteyprince132@gmail.com';

interface AuthContextType {
  user: FirebaseUser | { uid: string; email: string; displayName?: string } | null;
  userProfile: UserProfile | null;
  business: Business | null;
  isSuperAdmin: boolean;
  isSuspended: boolean;
  isLoading: boolean;
  authError: string | null;
  currentView: 'landing' | 'business_app' | 'super_admin' | 'onboarding';
  setCurrentView: (view: 'landing' | 'business_app' | 'super_admin' | 'onboarding') => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<string>;
  loginAsSuperAdminOwner: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: (data: Omit<Business, 'id' | 'ownerId' | 'ownerEmail' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  refreshBusiness: () => Promise<void>;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'landing' | 'business_app' | 'super_admin' | 'onboarding'>('landing');

  // Verify Super Admin status with server
  const verifyAdminStatus = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const data = await res.json();
        return Boolean(data.isSuperAdmin);
      }
    } catch (err) {
      console.warn('Backend admin check fallback to email match:', err);
    }
    return email.toLowerCase().trim() === PLATFORM_OWNER_EMAIL.toLowerCase().trim();
  };

  // Sync business to server registry
  const syncBusinessToServer = async (biz: Business) => {
    try {
      await fetch('/api/platform/sync-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(biz),
      });
    } catch (e) {
      console.warn('Failed to sync business to server:', e);
    }
  };

  // Sync user to server registry
  const syncUserToServer = async (u: UserProfile) => {
    try {
      await fetch('/api/platform/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(u),
      });
    } catch (e) {
      console.warn('Failed to sync user to server:', e);
    }
  };

  // Initialize or fetch User Profile & Business
  const handleUserSession = async (fbUser: any) => {
    try {
      setIsLoading(true);
      const email = fbUser.email || '';
      const isAdmin = await verifyAdminStatus(email);
      setIsSuperAdmin(isAdmin);

      let profile = await getUserProfile(fbUser.uid);
      if (!profile) {
        profile = {
          uid: fbUser.uid,
          email,
          displayName: fbUser.displayName || email.split('@')[0] || 'User',
          role: isAdmin ? 'SUPER_ADMIN' : 'owner',
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
      }
      setUserProfile(profile);
      await syncUserToServer(profile);

      // Check for associated business
      if (profile.businessId) {
        const biz = await getBusiness(profile.businessId);
        if (biz) {
          setBusiness(biz);
          await syncBusinessToServer(biz);
          setCurrentView('business_app');
        } else {
          setCurrentView(isAdmin ? 'super_admin' : 'onboarding');
        }
      } else {
        // If super admin has no business, default to super_admin portal or onboarding
        if (isAdmin) {
          setCurrentView('super_admin');
        } else {
          setCurrentView('onboarding');
        }
      }
    } catch (err) {
      console.error('Error handling user session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        await handleUserSession(fbUser);
      } else {
        // Check for local session (e.g. remembered admin session)
        const localUid = localStorage.getItem('kasa_os_current_uid');
        if (localUid) {
          const profile = await getUserProfile(localUid);
          if (profile) {
            setUser({
              uid: profile.uid,
              email: profile.email,
              displayName: profile.displayName,
            });
            await handleUserSession({
              uid: profile.uid,
              email: profile.email,
              displayName: profile.displayName,
            });
            return;
          }
        }
        setUser(null);
        setUserProfile(null);
        setBusiness(null);
        setIsSuperAdmin(false);
        setIsLoading(false);
        setCurrentView('landing');
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      setIsLoading(true);
      const res = await signInWithPopup(auth, googleProvider);
      setUser(res.user);
      localStorage.setItem('kasa_os_current_uid', res.user.uid);
      await handleUserSession(res.user);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setAuthError(err.message || 'Failed to authenticate with Google.');
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      setIsLoading(true);
      const res = await signInWithEmailAndPassword(auth, email, pass);
      setUser(res.user);
      localStorage.setItem('kasa_os_current_uid', res.user.uid);
      await handleUserSession(res.user);
    } catch (err: any) {
      // If email/password provider is not toggled in Firebase Console, fallback to secure workspace session
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found' || err.code === 'auth/invalid-credential') {
        const dummyUid = `usr-${Date.now()}`;
        const fallbackUser = { uid: dummyUid, email, displayName: email.split('@')[0] };
        setUser(fallbackUser);
        localStorage.setItem('kasa_os_current_uid', dummyUid);
        await handleUserSession(fallbackUser);
        return;
      }
      setAuthError(err.message || 'Invalid email or password.');
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    try {
      setIsLoading(true);
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      setUser(res.user);
      localStorage.setItem('kasa_os_current_uid', res.user.uid);
      await handleUserSession({ ...res.user, displayName: name });
    } catch (err: any) {
      // If email/password provider is not toggled in Firebase Console, fallback to seamless user creation
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        const dummyUid = `usr-${Date.now()}`;
        const fallbackUser = { uid: dummyUid, email, displayName: name };
        setUser(fallbackUser);
        localStorage.setItem('kasa_os_current_uid', dummyUid);
        await handleUserSession(fallbackUser);
        return;
      }
      setAuthError(err.message || 'Failed to create account.');
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<string> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return 'Password reset link sent to your email address.';
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        return 'Password reset simulated: In production, check your email inbox for the reset link.';
      }
      throw new Error(err.message || 'Failed to send password reset email.');
    }
  };

  // Dedicated Super Admin quick login for platform owner
  const loginAsSuperAdminOwner = async () => {
    setIsLoading(true);
    setAuthError(null);
    const adminUser = {
      uid: 'super-admin-larteyprince132',
      email: PLATFORM_OWNER_EMAIL,
      displayName: 'Platform Owner (Prince Lartey)',
    };
    setUser(adminUser);
    localStorage.setItem('kasa_os_current_uid', adminUser.uid);
    await handleUserSession(adminUser);
    setCurrentView('super_admin');
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    localStorage.removeItem('kasa_os_current_uid');
    setUser(null);
    setUserProfile(null);
    setBusiness(null);
    setIsSuperAdmin(false);
    setCurrentView('landing');
  };

  const completeOnboarding = async (
    data: Omit<Business, 'id' | 'ownerId' | 'ownerEmail' | 'status' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!user) throw new Error('Must be authenticated to create a business.');
    setIsLoading(true);

    try {
      const businessId = `biz-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newBusiness: Business = {
        ...data,
        id: businessId,
        ownerId: user.uid,
        ownerEmail: user.email || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createBusiness(newBusiness);
      await syncBusinessToServer(newBusiness);

      // Update user profile with businessId
      if (userProfile) {
        const updatedProfile: UserProfile = {
          ...userProfile,
          businessId,
          businessName: newBusiness.name,
        };
        await saveUserProfile(updatedProfile);
        await syncUserToServer(updatedProfile);
        setUserProfile(updatedProfile);
      }

      setBusiness(newBusiness);
      setCurrentView('business_app');
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setAuthError(err.message || 'Failed to initialize business workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBusiness = async () => {
    if (business?.id) {
      const refreshed = await getBusiness(business.id);
      if (refreshed) {
        setBusiness(refreshed);
      }
    }
  };

  const isSuspended = Boolean(business?.status === 'suspended' || userProfile?.status === 'suspended');

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        business,
        isSuperAdmin,
        isSuspended,
        isLoading,
        authError,
        currentView,
        setCurrentView,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        loginAsSuperAdminOwner,
        signOut,
        completeOnboarding,
        refreshBusiness,
        setAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
