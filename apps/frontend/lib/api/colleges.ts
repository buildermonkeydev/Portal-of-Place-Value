import apiClient from './client';
import { College, CreateCollegeData, UpdateCollegeData, BulkImportResult } from '@/lib/types/college';

export const collegesApi = {
    // Get all colleges with optional search and pagination
    getColleges: async (params?: { search?: string | ''; limit?: number; page?: number }): Promise<any> => {

        if (!params?.search || params.search === '') {
            delete params?.search;
        }
        const response = await apiClient.get<{ data: College[]; total: number }>('/api/v1/colleges', { params });
        return response.data.data;
    },

    // Get college by ID
    getCollege: async (id: string) => {
        const response = await apiClient.get<{ data: College }>(`/api/v1/colleges/${id}`);
        return response.data.data;
    },

    // Create new college
    createCollege: async (data: CreateCollegeData) => {
        const response = await apiClient.post<{ data: College }>('/api/v1/colleges', data);
        return response.data.data;
    },

    // Update college
    updateCollege: async (id: string, data: UpdateCollegeData) => {
        const response = await apiClient.put<{ data: College }>(`/api/v1/colleges/${id}`, data);
        return response.data.data;
    },

    // Delete college
    deleteCollege: async (id: string) => {
        const response = await apiClient.delete<{ data: void }>(`/api/v1/colleges/${id}`);
        return response.data.data;
    },

    // Search colleges by name
    searchColleges: async (name: string) => {
        const response = await apiClient.get<{ data: College[] }>('/api/v1/colleges/search/name', {
            params: { name }
        });
        return response.data.data;
    },

    // Bulk import colleges
    bulkImport: async (colleges: CreateCollegeData[]) => {
        const response = await apiClient.post<{ data: BulkImportResult }>('/api/v1/colleges/bulk-import', { colleges });
        return response.data.data;
    },

    // Bulk import from file
    bulkImportFromFile: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post<{ data: BulkImportResult }>('/api/v1/colleges/bulk-import/file', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data;
    },

    // Find colleges by names
    findCollegesByNames: async (names: string[]) => {
        const response = await apiClient.post<{ data: College[] }>('/api/v1/colleges/by-names', { names });
        return response.data.data;
    },

    // Get colleges with branches
    getCollegesWithBranches: async (query?: string) => {
        const response = await apiClient.get<{ data: College[] }>('/api/v1/colleges/with-branches/list?q=' + query);
        return response.data.data;
    },
}; 