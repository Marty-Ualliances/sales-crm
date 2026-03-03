import { request } from '@/services/api/client';
import { Lead } from '@/features/leads/types/leads';

export interface PipelineStage {
    _id: string;
    name: string;
    order: number;
    color: string;
    probability: number;
    isDefault: boolean;
    isActive: boolean;
}

export interface PipelineBoardColumn {
    _id: string;
    name: string;
    color: string;
    order: number;
    probability: number;
    leads: Lead[];
    count: number;
    totalValue: number;
}

export const getPipelineStages = async () => {
    return request<PipelineStage[]>('/pipeline/stages');
};

export const getPipelineBoard = async (params?: { assignedTo?: string; search?: string; dateFrom?: string; dateTo?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return request<PipelineBoardColumn[]>(`/pipeline/board${qs ? `?${qs}` : ''}`);
};

export const updateLeadStage = async (leadId: string, stageId: string, extra?: { dealValue?: number; lostReason?: string; expectedCloseDate?: string }) => {
    return request<Lead>(`/pipeline/leads/${leadId}/stage`, { method: 'PATCH', body: JSON.stringify({ stageId, ...extra }) });
};
