import { request } from '@/services/api/client';

export interface Activity {
    _id: string;
    leadId: any;
    userId: any;
    type: string;
    callDuration?: number;
    callOutcome?: string;
    description?: string;
    fromStage?: any;
    toStage?: any;
    dueDate?: Date;
    isCompleted?: boolean;
    createdAt: Date;
}

export const getMyTasks = async () => {
    return request<Activity[]>('/activities/my/tasks');
};

export const getLeadActivities = async (leadId: string) => {
    const response = await request<any>(`/activities/lead/${leadId}`);
    if (response && typeof response === 'object' && Array.isArray(response.activities)) {
        return response.activities as Activity[];
    }
    return Array.isArray(response) ? (response as Activity[]) : [];
};

export const completeActivity = async (id: string, updates: Partial<Activity>) => {
    return request<Activity>(`/activities/${id}/complete`, { method: 'PATCH', body: JSON.stringify(updates) });
};

export const createActivity = async (payload: Partial<Activity>) => {
    return request<Activity>('/activities', { method: 'POST', body: JSON.stringify(payload) });
};

export const getActivityFeed = async () => {
    return request<Activity[]>('/activities/feed');
};
