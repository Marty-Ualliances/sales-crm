'use client';
import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/features/auth/types/auth';
import { api } from '@/services/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  impersonatedBy: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string; error?: string }>;
  logout: () => void;
  impersonate: (userId: string) => Promise<{ success: boolean; error?: string }>;
  exitImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** User profile is cached in sessionStorage for display only (no security token stored client-side) */
const USER_KEY = 'insurelead_user';
const IMPERSONATED_BY_KEY = 'insurelead_impersonated_by';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Initialize to null universally to prevent SSR/client hydration mismatch.
  // sessionStorage is loaded only in useEffect (client-side).
  const [user, setUser] = useState<AuthUser | null>(null);
  const [impersonatedBy, setImpersonatedBy] = useState<string | null>(null);

  // On mount: restore from sessionStorage, then verify with server
  useEffect(() => {
    // Hydrate from sessionStorage for instant UI
    try {
      const stored = sessionStorage.getItem(USER_KEY);
      if (stored) setUser(JSON.parse(stored) as AuthUser);
      const storedImpersonation = sessionStorage.getItem(IMPERSONATED_BY_KEY);
      if (storedImpersonation) setImpersonatedBy(storedImpersonation);
    } catch { /* ignore */ }

    // Verify the httpOnly cookie is still valid
    api.auth.me()
      .then((u) => {
        setUser(u);
        sessionStorage.setItem(USER_KEY, JSON.stringify(u));
      })
      .catch(() => {
        // Cookie expired or invalid — clear local state
        setUser(null);
        setImpersonatedBy(null);
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(IMPERSONATED_BY_KEY);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await api.auth.login(email, password);
      setUser(result.user);
      setImpersonatedBy(null);
      sessionStorage.setItem(USER_KEY, JSON.stringify(result.user));
      sessionStorage.removeItem(IMPERSONATED_BY_KEY);
      return { success: true, role: result.user.role };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      return { success: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    setUser(null);
    setImpersonatedBy(null);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(IMPERSONATED_BY_KEY);
    router.push('/login');
  }, [router]);

  const impersonate = useCallback(async (userId: string) => {
    try {
      const result = await api.auth.impersonate(userId);
      setUser(result.user);
      const by = result.impersonatedBy ?? null;
      setImpersonatedBy(by);
      sessionStorage.setItem(USER_KEY, JSON.stringify(result.user));
      if (by) sessionStorage.setItem(IMPERSONATED_BY_KEY, by);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impersonation failed';
      return { success: false, error: msg };
    }
  }, []);

  /** Restore the original admin session without requiring re-login */
  const exitImpersonation = useCallback(async () => {
    try {
      const result = await api.auth.exitImpersonation();
      setUser(result.user);
      setImpersonatedBy(null);
      sessionStorage.setItem(USER_KEY, JSON.stringify(result.user));
      sessionStorage.removeItem(IMPERSONATED_BY_KEY);
      router.push('/admin');
    } catch {
      // Backup cookie expired — fall back to full logout
      try { await api.auth.logout(); } catch { /* ignore */ }
      setUser(null);
      setImpersonatedBy(null);
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(IMPERSONATED_BY_KEY);
      router.push('/login');
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, impersonatedBy, login, logout, impersonate, exitImpersonation }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
