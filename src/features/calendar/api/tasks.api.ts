import { request } from '@/services/api/client';

export const tasksApi = {
    list: (params?: { assignedTo?: string; status?: string; from?: string; to?: string; priority?: string }) => {
        const q = new URLSearchParams();
        if (params?.assignedTo) q.set('assignedTo', params.assignedTo);
        if (params?.status) q.set('status', params.status);
        if (params?.from) q.set('from', params.from);
        if (params?.to) q.set('to', params.to);
        if (params?.priority) q.set('priority', params.priority);
        const qs = q.toString();
        return request<any[]>(`/tasks${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<any>(`/tasks/${id}`),
    create: (data: any) =>
        request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
        request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
        request<any>(`/tasks/${id}`, { method: 'DELETE' }),
};
