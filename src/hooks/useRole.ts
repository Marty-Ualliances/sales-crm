import { useAuth } from '@/features/auth/context/AuthContext';

export function useRole() {
    const { user } = useAuth();

    const role = user?.role || 'guest';

    return {
        role,
        isSDR: role === 'sdr',
        isLeadGen: role === 'leadgen',
        isHR: role === 'hr',
        isAdmin: role === 'admin',
    };
}
