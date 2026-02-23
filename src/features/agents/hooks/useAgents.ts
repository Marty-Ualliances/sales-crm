'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export function useAgents() {
    return useQuery({
        queryKey: ['agents'],
        queryFn: () => api.agents.list(),
        staleTime: 60_000,
    });
}

export function useCreateAgent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; email: string; password: string; role: 'admin' | 'sdr' | 'hr' | 'leadgen' }) =>
            api.agents.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['agents'] });
        },
    });
}

export function useDeleteAgent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.agents.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['agents'] });
        },
    });
}
