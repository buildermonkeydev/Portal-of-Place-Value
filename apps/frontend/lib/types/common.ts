// API Response types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

// Dashboard stats
export interface DashboardStats {
    totalUsers: number;
    totalQuestions: number;
    totalAssessments: number;
    totalResults: number;
    activeAssessments: number;
    recentResults: any[]; // AssessmentResult type
    userGrowth: { date: string; count: number }[];
    assessmentCompletion: { assessment: string; completionRate: number }[];
} 