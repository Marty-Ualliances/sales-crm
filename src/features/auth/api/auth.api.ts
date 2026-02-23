import { request } from '@/services/api/client';

export interface LoginResponse {
    token: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatar: string;
        role: 'admin' | 'sdr' | 'hr' | 'leadgen';
    };
}

export const authApi = {
    login: (email: string, password: string) =>
        request<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),
    me: () => request<LoginResponse['user']>('/auth/me'),
    impersonate: (userId: string) =>
        request<LoginResponse>('/auth/impersonate', {
            method: 'POST',
            body: JSON.stringify({ userId }),
        }),
    forgotPassword: (email: string) =>
        request<{ message: string }>('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),
    resetPassword: (token: string, password: string) =>
        request<{ message: string }>('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, password }),
        }),
    changePassword: (currentPassword: string, newPassword: string) =>
        request<{ message: string }>('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        }),
};
