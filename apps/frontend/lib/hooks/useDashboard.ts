import { useQuery } from '@tanstack/react-query';
import { dashboardAPI, DashboardStats } from '@/lib/api/dashboard';

export const useDashboardStats = () => {
    return useQuery<DashboardStats>({
        queryKey: ['dashboard', 'stats'],
        queryFn: () => dashboardAPI.getDashboardStats(),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    });
}; 