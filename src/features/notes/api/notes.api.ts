import { request } from '@/services/api/client';

export const notesApi = {
    list: () => request<any[]>('/notes'),
    create: (content: string) =>
        request<any>('/notes', { method: 'POST', body: JSON.stringify({ content }) }),
    update: (id: string, content: string) =>
        request<any>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify({ content }) }),
    delete: (id: string) =>
        request<any>(`/notes/${id}`, { method: 'DELETE' }),
};
