import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export function useLeads(params?: { status?: string; search?: string; agent?: string }) {
    return useQuery({
        queryKey: ['leads', params],
        queryFn: () => api.leads.list(params),
        staleTime: 30_000,
    });
}

export function useLead(id: string) {
    return useQuery({
        queryKey: ['lead', id],
        queryFn: () => api.leads.get(id),
        enabled: !!id,
    });
}

export function useKPIs() {
    return useQuery({
        queryKey: ['kpis'],
        queryFn: () => api.leads.kpis(),
        staleTime: 30_000,
    });
}

export function useFunnel() {
    return useQuery({
        queryKey: ['funnel'],
        queryFn: () => api.leads.funnel(),
        staleTime: 60_000,
    });
}

// ── Mutations ──

export function useCompleteFollowUp() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (leadId: string) => api.leads.completeFollowUp(leadId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['leads'] });
            qc.invalidateQueries({ queryKey: ['kpis'] });
        },
    });
}

export function useScheduleFollowUp() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ leadId, date }: { leadId: string; date: string }) =>
            api.leads.scheduleFollowUp(leadId, date),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['leads'] });
            qc.invalidateQueries({ queryKey: ['kpis'] });
        },
    });
}

export function useUpdateLead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => api.leads.update(id, data),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: ['leads'] });
            qc.invalidateQueries({ queryKey: ['lead', vars.id] });
            qc.invalidateQueries({ queryKey: ['kpis'] });
        },
    });
}

export function useCreateLead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.leads.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['leads'] });
            qc.invalidateQueries({ queryKey: ['kpis'] });
        },
    });
}

export function useDeleteLead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.leads.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['leads'] });
            qc.invalidateQueries({ queryKey: ['kpis'] });
        },
    });
}

export function useImportCSV() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => api.leads.importCSV(file),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['leads'] });
            qc.invalidateQueries({ queryKey: ['kpis'] });
        },
    });
}

export function useBulkAssign() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ leadIds, agentName }: { leadIds: string[]; agentName: string }) =>
            api.leads.bulkAssign(leadIds, agentName),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['leads'] });
        },
    });
}

export function useBulkDelete() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ leadIds }: { leadIds: string[] }) =>
            api.leads.bulkDelete(leadIds),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['leads'] });
            qc.invalidateQueries({ queryKey: ['kpis'] });
        },
    });
}
