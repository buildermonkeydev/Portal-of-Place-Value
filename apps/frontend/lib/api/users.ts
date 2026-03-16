import apiClient from './client';
import {
    User,
    CreateUserData,
    UpdateUserData,
    UserQueryParams,
    PaginatedResponse,
    ApiResponse
} from '@/lib/types';

export const userAPI = {
    // Get all users (admin only)
    getAllUsers: async (params?: UserQueryParams): Promise<PaginatedResponse<User>> => {
        const response = await apiClient.get('/api/v1/user/users', { params });
        return response.data;
    },

    // Search users (admin only)
    searchUsers: async (params?: UserQueryParams): Promise<PaginatedResponse<User>> => {
        const response = await apiClient.get('/api/v1/user/users/search', { params });
        return response.data;
    },

    // Get user by ID (admin only)
    getUserById: async (id: string): Promise<User> => {
        const response = await apiClient.get(`/api/v1/user/users/${id}`);
        return response.data;
    },

    // Update user by ID (admin only)
    updateUserById: async (id: string, data: UpdateUserData): Promise<User> => {
        const response = await apiClient.put(`/api/v1/user/users/${id}`, data);
        return response.data;
    },

    // Delete user by ID (admin only)
    deleteUserById: async (id: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/api/v1/user/users/${id}`);
        return response.data;
    },

    // Soft delete user and associated data (admin only)
    deleteUserAndData: async (id: string): Promise<ApiResponse<any>> => {
        const response = await apiClient.delete(`/api/v1/user/users/${id}/full`);
        return response.data;
    },

    // Deactivate user (admin only)
    deactivateUser: async (id: string): Promise<User> => {
        const response = await apiClient.put(`/api/v1/user/users/${id}/deactivate`);
        return response.data;
    },

    // Activate user (admin only)
    activateUser: async (id: string): Promise<User> => {
        const response = await apiClient.put(`/api/v1/user/users/${id}/activate`);
        return response.data;
    },

    // Update user role (admin only)
    updateUserRole: async (id: string, role: string): Promise<User> => {
        const response = await apiClient.patch(`/api/v1/user/users/${id}/role`, { role });
        return response.data;
    },

    // Get user assessments (admin only)
    getUserAssessments: async (id: string): Promise<any[]> => {
        const response = await apiClient.get(`/api/v1/user/users/${id}/assessments`);
        return response.data;
    },

    // Get user results (admin only)
    getUserResults: async (id: string): Promise<any[]> => {
        const response = await apiClient.get(`/api/v1/user/users/${id}/results`);
        return response.data;
    },

    // Bulk delete users (admin only)
    bulkDeleteUsers: async (userIds: string[]): Promise<ApiResponse<void>> => {
        const response = await apiClient.post('/api/v1/user/users/bulk-delete', { userIds });
        return response.data;
    },

    // Bulk update user roles (admin only)
    bulkUpdateUserRoles: async (userIds: string[], role: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.post('/api/v1/user/users/bulk-role-update', { userIds, role });
        return response.data;
    },

    // Bulk assign assessment (admin only)
    bulkAssignAssessment: async (userIds: string[], assessmentId: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.post('/api/v1/user/users/bulk-assign-assessment', { userIds, assessmentId });
        return response.data;
    },

    // Export users (admin only)
    exportUsers: async (params?: UserQueryParams): Promise<Blob> => {
        const response = await apiClient.post('/api/v1/user/users/export', params, {
            responseType: 'blob'
        });
        return response.data;
    },

    // Import users (admin only)
    importUsers: async (file: File): Promise<ApiResponse<void>> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/api/v1/user/users/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Send registration invitations (admin only)
    sendInvitations: async (emails: string[], message?: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.post('/api/v1/user/users/invite', { emails, message });
        return response.data;
    },

    // Send registration invitations from file (admin only)
    sendInvitationsFromFile: async (file: File): Promise<ApiResponse<void>> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/api/v1/user/users/invite/file', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Create user (admin only)
    createUser: async (userData: CreateUserData): Promise<User> => {
        const response = await apiClient.post('/api/v1/user/users', userData);
        return response.data;
    },

    // Bulk disable users with filters (admin only)
    bulkDisableUsersWithFilters: async (filters: {
        collegeId?: string;
        branchId?: string;
        branchIds?: string[];
        collegeYear?: number;
        collegeYears?: number[];
    }): Promise<ApiResponse<{ disabledCount: number; filter: any }>> => {
        const response = await apiClient.post('/api/v1/user/users/bulk-disable', filters);
        return response.data;
    },

    // Bulk enable users with filters (admin only)
    bulkEnableUsersWithFilters: async (filters: {
        collegeId?: string;
        branchId?: string;
        branchIds?: string[];
        collegeYear?: number;
        collegeYears?: number[];
    }): Promise<ApiResponse<{ enabledCount: number; filter: any }>> => {
        const response = await apiClient.post('/api/v1/user/users/bulk-enable', filters);
        return response.data;
    },
}; 