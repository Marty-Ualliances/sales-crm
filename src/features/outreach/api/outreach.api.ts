import { request } from '@/services/api/client';

export interface OutreachStats {
    totalEmails: number;
    todayEmails: number;
    todayDate: string;
}

export const outreachApi = {
    getStats: () =>
        request<OutreachStats>('/outreach'),

    logEmails: (count: number) =>
        request('/outreach', {
            method: 'POST',
            body: JSON.stringify({ count }),
        }),
};
