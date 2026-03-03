import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPipelineStages, getPipelineBoard, updateLeadStage } from '../api/pipeline.api';
import { toast } from 'sonner';

export const usePipelineStages = () => {
    return useQuery({
        queryKey: ['pipeline-stages'],
        queryFn: getPipelineStages,
    });
};

export const usePipelineBoard = (params?: { assignedTo?: string; search?: string; dateFrom?: string; dateTo?: string }) => {
    return useQuery({
        queryKey: ['pipeline-board', params],
        queryFn: () => getPipelineBoard(params),
    });
};

export const useUpdateLeadStage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ leadId, stageId, ...extra }: { leadId: string; stageId: string; dealValue?: number; lostReason?: string; expectedCloseDate?: string }) =>
            updateLeadStage(leadId, stageId, extra),
        onSuccess: () => {
            toast.success('Lead stage updated');
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['pipeline-board'] });
            queryClient.invalidateQueries({ queryKey: ['leads'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update stage');
        },
    });
};
