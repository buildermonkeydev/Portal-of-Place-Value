import apiClient from './client';
import { Branch, CreateBranchData, UpdateBranchData, BulkImportResult, BranchStats } from '@/lib/types/branch';

export const branchesApi = {
    // Get all branches with optional search and pagination
    getBranches: async (params?: { search?: string; limit?: number; page?: number }): Promise<{ data: Branch[]; total: number; page?: number; limit?: number; totalPages?: number }> => {
        if (!params?.search || params.search === '') {
            delete params?.search;
        }
        const response = await apiClient.get('/api/v1/branches', { params });

        // Handle nested response structure: { success, message, data: { data: [...], total: n } }
        let branches: Branch[] = [];
        let total = 0;

        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
            branches = response.data.data.data;
            total = response.data.data.total || branches.length;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
            branches = response.data.data;
            total = response.data.total || branches.length;
        } else if (Array.isArray(response.data)) {
            branches = response.data;
            total = branches.length;
        }

        const limit = params?.limit || 10;
        const page = params?.page || 1;
        const totalPages = Math.ceil(total / limit);

        return {
            data: branches,
            total,
            page,
            limit,
            totalPages,
        };
    },

    // Get branch by ID
    getBranch: async (id: string) => {
        const response = await apiClient.get<{ data: Branch }>(`/api/v1/branches/${id}`);
        return response.data.data;
    },

    // Create new branch
    createBranch: async (data: CreateBranchData) => {
        const response = await apiClient.post<{ data: Branch }>('/api/v1/branches', data);
        return response.data.data;
    },

    // Update branch
    updateBranch: async (id: string, data: UpdateBranchData) => {
        const response = await apiClient.put<{ data: Branch }>(`/api/v1/branches/${id}`, data);
        return response.data.data;
    },

    // Delete branch
    deleteBranch: async (id: string) => {
        const response = await apiClient.delete<{ data: void }>(`/api/v1/branches/${id}`);
        return response.data.data;
    },

    // Search branches by name
    searchBranches: async (name: string) => {
        const response = await apiClient.get<{ data: Branch[] }>('/api/v1/branches/search/name', {
            params: { name }
        });
        return response.data.data;
    },

    // Bulk import branches
    bulkImport: async (branches: CreateBranchData[]) => {
        const response = await apiClient.post<{ data: BulkImportResult }>('/api/v1/branches/bulk-import', { branches });
        return response.data.data;
    },

    // Bulk import from file
    bulkImportFromFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<{ data: BulkImportResult }>('/api/v1/branches/bulk-import/file', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    },

    // Find branches by names
    findBranchesByNames: async (names: string[]) => {
        const response = await apiClient.post<{ data: Branch[] }>('/api/v1/branches/by-names', { names });
        return response.data.data;
    },

    // Get branch statistics
    getBranchStats: async () => {
        const response = await apiClient.get<{ data: BranchStats }>('/api/v1/branches/stats');
        return response.data.data;
    },
}; 