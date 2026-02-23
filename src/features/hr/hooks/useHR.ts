'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export function useHRDashboard() {
    return useQuery({
        queryKey: ['hr-dashboard'],
        queryFn: () => api.hr.dashboard(),
        staleTime: 30_000,
    });
}

export function useHRLeads(params?: { status?: string; search?: string; agent?: string }) {
    return useQuery({
        queryKey: ['hr-leads', params],
        queryFn: () => api.hr.leads(params),
        staleTime: 30_000,
    });
}

export function useHRClosedLeads(params?: { search?: string; agent?: string }) {
    return useQuery({
        queryKey: ['hr-closed-leads', params],
        queryFn: () => api.hr.closedLeads(params),
        staleTime: 30_000,
    });
}
