import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { User, UserRole } from '@/types/auth';
import { api } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('insurelead_user');
    return stored ? JSON.parse(stored) : null;
  });

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('insurelead_token');
    if (token && !user) {
      api.auth.me()
        .then((u) => {
          setUser(u);
          localStorage.setItem('insurelead_user', JSON.stringify(u));
        })
        .catch(() => {
          localStorage.removeItem('insurelead_token');
          localStorage.removeItem('insurelead_user');
          setUser(null);
        });
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    try {
      const result = await api.auth.signup(name, email, password);
      setUser(result.user);
      localStorage.setItem('insurelead_token', result.token);
      localStorage.setItem('insurelead_user', JSON.stringify(result.user));
      return { success: true, role: result.user.role as UserRole };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signup failed' };
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await api.auth.login(email, password);
      setUser(result.user);
      localStorage.setItem('insurelead_token', result.token);
      localStorage.setItem('insurelead_user', JSON.stringify(result.user));
      return { success: true, role: result.user.role as UserRole };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid email or password' };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('insurelead_token');
    localStorage.removeItem('insurelead_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, signup, login, logout }}>
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
