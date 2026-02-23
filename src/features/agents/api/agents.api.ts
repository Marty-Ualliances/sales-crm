import { request } from '@/services/api/client';

export const agentsApi = {
    list: () => request<any[]>('/agents'),
    get: (id: string) => request<any>(`/agents/${id}`),
    create: (data: { name: string; email: string; password: string; role: 'admin' | 'sdr' | 'hr' | 'leadgen' }) =>
        request<any>('/agents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
        request<any>(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
        request<any>(`/agents/${id}`, { method: 'DELETE' }),
};
