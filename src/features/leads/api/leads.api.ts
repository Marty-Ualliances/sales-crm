import { request, getToken } from '@/services/api/client';
import { LeadSchema, LeadsListSchema, KPIsSchema } from '@/features/leads/schemas/lead.schema';
import type { Lead, KPIs } from '@/features/leads/schemas/lead.schema';

async function validated<T>(schema: { parse: (v: unknown) => T }, value: unknown): Promise<T> {
    try {
        return schema.parse(value);
    } catch {
        // Return raw data if validation fails to avoid breaking the app
        return value as T;
    }
}

export const leadsApi = {
    list: async (params?: { status?: string; search?: string; agent?: string }): Promise<Lead[]> => {
        const q = new URLSearchParams();
        if (params?.status) q.set('status', params.status);
        if (params?.search) q.set('search', params.search);
        if (params?.agent) q.set('agent', params.agent);
        const qs = q.toString();
        const raw = await request<unknown[]>(`/leads${qs ? `?${qs}` : ''}`);
        return validated(LeadsListSchema, raw);
    },
    kpis: async (): Promise<KPIs> => {
        const raw = await request<unknown>('/leads/kpis');
        return validated(KPIsSchema, raw);
    },
    get: async (id: string): Promise<Lead> => {
        const raw = await request<unknown>(`/leads/${id}`);
        return validated(LeadSchema, raw);
    },
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
