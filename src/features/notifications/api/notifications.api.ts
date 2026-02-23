import { request } from '@/services/api/client';

export const notificationsApi = {
    list: () => request<any[]>('/notifications'),
    markRead: (id: string) =>
        request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () =>
        request<any>('/notifications/read-all', { method: 'PUT' }),
};
