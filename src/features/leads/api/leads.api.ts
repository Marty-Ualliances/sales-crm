import { request, getToken } from '@/services/api/client';

export const leadsApi = {
    list: (params?: { status?: string; search?: string; agent?: string }) => {
        const q = new URLSearchParams();
        if (params?.status) q.set('status', params.status);
        if (params?.search) q.set('search', params.search);
        if (params?.agent) q.set('agent', params.agent);
        const qs = q.toString();
        return request<any[]>(`/leads${qs ? `?${qs}` : ''}`);
    },
    kpis: () => request<any>('/leads/kpis'),
    get: (id: string) => request<any>(`/leads/${id}`),
    create: (data: any) =>
        request<any>('/leads', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
        request<any>(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
        request<any>(`/leads/${id}`, { method: 'DELETE' }),
    importCSV: async (file: File) => {
        const token = getToken();
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/leads/import', {
            method: 'POST',
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: formData,
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || 'Import failed');
        }
        return res.json();
    },
    completeFollowUp: (id: string) =>
        request<any>(`/leads/${id}/complete-followup`, { method: 'POST' }),
    scheduleFollowUp: (id: string, date: string) =>
        request<any>(`/leads/${id}/schedule-followup`, { method: 'POST', body: JSON.stringify({ date }) }),
    bulkAssign: (leadIds: string[], agentName: string) =>
        request<{ updated: number }>('/leads/bulk-assign', { method: 'POST', body: JSON.stringify({ leadIds, agentName }) }),
    bulkDelete: (leadIds: string[]) =>
        request<{ deleted: number }>('/leads/bulk-delete', { method: 'POST', body: JSON.stringify({ leadIds }) }),
    funnel: () => request<any>('/leads/funnel'),
};
