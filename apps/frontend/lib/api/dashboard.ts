import { apiClient } from './client';

export interface DashboardStats {
    users: {
        total: number;
        active: number;
        inactive: number;
        verified: number;
        unverified: number;
        byRole: { [key: string]: number };
    };
    assessments: {
        total: number;
        active: number;
        inactive: number;
        completed: number;
        upcoming: number;
    };
    questions: {
        total: number;
        byType: { [key: string]: number };
    };
    recentActivity: {
        assessments: any[];
        results: any[];
    };
}

export const dashboardAPI = {
    // Get dashboard statistics (admin only)
    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await apiClient.get('/api/v1/dashboard/stats');
        return response.data.data;
    },
}; 