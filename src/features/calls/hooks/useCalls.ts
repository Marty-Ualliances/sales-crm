import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export function useCalls(params?: { status?: string; search?: string }) {
    return useQuery({
        queryKey: ['calls', params],
        queryFn: () => api.calls.list(params),
        staleTime: 30_000,
    });
}

export function useCall(id: string) {
    return useQuery({
        queryKey: ['call', id],
        queryFn: () => api.calls.get(id),
        enabled: !!id,
    });
}

export function useCreateCall() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => api.calls.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['calls'] });
            qc.invalidateQueries({ queryKey: ['leads'] });
        },
    });
}
