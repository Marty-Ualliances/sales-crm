import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { UserRole } from '@/features/auth/types/auth';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to correct panel
    const redirectMap: Record<string, string> = { admin: '/admin', sdr: '/sdr', hr: '/hr', leadgen: '/leadgen' };
    return <Navigate to={redirectMap[user.role] || '/login'} replace />;
  }

  return <>{children}</>;
}
