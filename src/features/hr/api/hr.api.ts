import { request } from '@/services/api/client';

export const hrApi = {
    dashboard: (timeRange?: string) => request<any>(`/hr/dashboard${timeRange ? `?timeRange=${timeRange}` : ''}`),
    leads: (params?: { status?: string; search?: string; agent?: string }) => {
        const q = new URLSearchParams();
        if (params?.status) q.set('status', params.status);
        if (params?.search) q.set('search', params.search);
        if (params?.agent) q.set('agent', params.agent);
        const qs = q.toString();
        return request<any[]>(`/hr/leads${qs ? `?${qs}` : ''}`);
    },
    closedLeads: (params?: { search?: string; agent?: string }) => {
        const q = new URLSearchParams();
        if (params?.search) q.set('search', params.search);
        if (params?.agent) q.set('agent', params.agent);
        const qs = q.toString();
        return request<any[]>(`/hr/closed-leads${qs ? `?${qs}` : ''}`);
    },
};
