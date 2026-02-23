'use client';

import { CalendarDays } from 'lucide-react';

export type DateRange = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'allTime';

export interface DateFilterProps {
    value: DateRange;
    onChange: (value: DateRange) => void;
}

export function filterByDateRange<T extends { date?: Date | string; createdAt?: Date | string }>(
    items: T[],
    range: DateRange,
    dateField: keyof T = 'date' as keyof T
): T[] {
    if (range === 'allTime') return items;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const last7DaysStart = new Date(todayStart);
    last7DaysStart.setDate(last7DaysStart.getDate() - 6);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return items.filter(item => {
        const rawDate = item[dateField] || (item as any).createdAt;
        if (!rawDate) return false;

        const d = new Date(rawDate as any);

        switch (range) {
            case 'today':
                return d >= todayStart;
            case 'yesterday':
                return d >= yesterdayStart && d < todayStart;
            case 'last7days':
                return d >= last7DaysStart;
            case 'thisMonth':
                return d >= thisMonthStart;
            default:
                return true;
        }
    });
}

export default function DateFilter({ value, onChange }: DateFilterProps) {
    return (
        <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <CalendarDays className="h-4 w-4" />
            </div>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as DateRange)}
                className="h-8 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus:ring-1 focus:ring-primary/50"
            >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="thisMonth">This Month</option>
                <option value="allTime">All Time</option>
            </select>
        </div>
    );
}
