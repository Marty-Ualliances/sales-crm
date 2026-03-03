import { request } from '@/services/api/client';

export const hrApi = {
    dashboard: (timeRange?: string) => request<any>(`/hr/dashboard${timeRange ? `?timeRange=${timeRange}` : ''}`),
    leads: async (params?: { status?: string; search?: string; agent?: string }) => {
        const q = new URLSearchParams();
        if (params?.status) q.set('status', params.status);
        if (params?.search) q.set('search', params.search);
        if (params?.agent) q.set('agent', params.agent);
        const qs = q.toString();
        const raw = await request<any>(`/hr/leads${qs ? `?${qs}` : ''}`);
        // Server returns { leads, total, page, limit } — unwrap the array
        if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'leads' in raw) {
            return raw.leads as any[];
        }
        return Array.isArray(raw) ? raw : [];
    },
    closedLeads: (params?: { search?: string; agent?: string }) => {
        const q = new URLSearchParams();
        if (params?.search) q.set('search', params.search);
        if (params?.agent) q.set('agent', params.agent);
        const qs = q.toString();
        return request<any[]>(`/hr/closed-leads${qs ? `?${qs}` : ''}`);
    },
};
