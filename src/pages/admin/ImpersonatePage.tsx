import { useState } from 'react';
import { useAgents } from '@/hooks/useApi';
import { api } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogIn, ArrowLeft, Shield, Users, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ROLE_REDIRECT: Record<string, string> = {
    admin: '/admin',
    sdr: '/sdr',
    hr: '/hr',
    leadgen: '/leadgen',
};

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-primary text-primary-foreground',
    sdr: 'bg-blue-500 text-white',
    hr: 'bg-emerald-500 text-white',
    leadgen: 'bg-amber-500 text-white',
};

export default function ImpersonatePage() {
    const { data: agents = [], isLoading } = useAgents();
    const { login: setAuth } = useAuth();
    const navigate = useNavigate();
    const [impersonating, setImpersonating] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleImpersonate = async (userId: string) => {
        setImpersonating(userId);
        setError('');
        try {
            const result = await api.auth.impersonate(userId);
            // Store the original admin token so we can come back
            const currentToken = localStorage.getItem('insurelead_token');
            const currentUser = localStorage.getItem('insurelead_user');
            if (currentToken) localStorage.setItem('insurelead_admin_token', currentToken);
            if (currentUser) localStorage.setItem('insurelead_admin_user', currentUser);
            // Login as the target user
            localStorage.setItem('insurelead_token', result.token);
            localStorage.setItem('insurelead_user', JSON.stringify(result.user));
            // We need to force a full page reload to reset all auth state
            window.location.href = ROLE_REDIRECT[result.user.role] || '/login';
        } catch (err: any) {
            setError(err.message || 'Failed to impersonate');
        } finally {
            setImpersonating(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between animate-slide-up">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                            <Eye className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Impersonate User</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">Access any user's panel as if you were them</p>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-4">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
            )}

            <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold text-foreground">All Users ({agents.length})</span>
                    </div>
                </div>
                <div className="divide-y divide-border">
                    {agents.map((agent: any) => (
                        <div
                            key={agent.id}
                            className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${ROLE_COLORS[agent.role] || 'bg-muted'}`}>
                                    {agent.avatar || agent.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                                    <p className="text-xs text-muted-foreground">{agent.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge
                                    variant="secondary"
                                    className={`text-xs capitalize ${agent.role === 'admin' ? 'bg-primary/15 text-primary' :
                                            agent.role === 'leadgen' ? 'bg-emerald-500/15 text-emerald-600' :
                                                agent.role === 'hr' ? 'bg-amber-500/15 text-amber-600' :
                                                    'bg-blue-500/15 text-blue-600'
                                        }`}
                                >
                                    {agent.role}
                                </Badge>
                                <button
                                    disabled={impersonating === agent.id}
                                    onClick={() => handleImpersonate(agent.id)}
                                    className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                                >
                                    {impersonating === agent.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <LogIn className="h-4 w-4" />
                                    )}
                                    Login as
                                </button>
                            </div>
                        </div>
                    ))}
                    {agents.length === 0 && (
                        <div className="px-6 py-12 text-center">
                            <p className="text-sm text-muted-foreground">No users found</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4">
                <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Security Notice</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Impersonation tokens expire after 2 hours. To return to your admin account, log out and log back in with your admin credentials.
                            Your original admin session is preserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
