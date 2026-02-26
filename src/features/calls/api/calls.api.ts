import { request } from '@/services/api/client';

export const callsApi = {
    list: (params?: { status?: string; search?: string }) => {
        const q = new URLSearchParams();
        if (params?.status) q.set('status', params.status);
        if (params?.search) q.set('search', params.search);
        const qs = q.toString();
        return request<any[]>(`/calls${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<any>(`/calls/${id}`),
    create: (data: any) =>
        request<any>('/calls', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
        request<any>(`/calls/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
