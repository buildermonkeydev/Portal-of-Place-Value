export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
    timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        currentPage: number;
        totalPages: number;
        nextPage: number;
        previousPage: number;
    };
} 