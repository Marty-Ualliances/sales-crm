import { request } from '@/services/api/client';

export const meetingsApi = {
    list: () => request<any[]>('/meetings'),
    create: (data: any) =>
        request<any>('/meetings', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
        request<any>(`/meetings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
        request<any>(`/meetings/${id}`, { method: 'DELETE' }),
};
