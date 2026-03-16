import apiClient from './client';
import {
    Assessment,
    AssessmentWithDetails,
    CreateAssessmentData,
    UpdateAssessmentData,
    AssessmentQueryParams,
    PaginatedResponse,
    ApiResponse,
    UserAssessment,
    AssessmentWithDetailsForUser
} from '@/lib/types';

export const assessmentAPI = {
    // Create new assessment (admin only)
    createAssessment: async (data: CreateAssessmentData): Promise<Assessment> => {
        const response = await apiClient.post('/api/v1/assessments', data);
        return response.data;
    },

    // Get all assessments (admin only)
    getAllAssessments: async (params?: AssessmentQueryParams): Promise<PaginatedResponse<Assessment>> => {
        const response = await apiClient.get('/api/v1/assessments', { params });
        return response.data;
    },

    // Search assessments (admin only)
    searchAssessments: async (params?: AssessmentQueryParams): Promise<PaginatedResponse<Assessment>> => {
        const response = await apiClient.get('/api/v1/assessments/search', { params });
        return response.data;
    },

    // Get available assessments (user specific)
    getAvailableAssessments: async (params?: AssessmentQueryParams): Promise<UserAssessment[]> => {
        const response = await apiClient.get('/api/v1/assessments/my/available-assessments', { params });
        return response.data.data;
    },

    // Get assessment by ID (admin only)
    getAssessmentByIdWithQuestion: async (id: string): Promise<AssessmentWithDetails> => {
        const response = await apiClient.get(`/api/v1/assessments/${id}/with-questions`);
        // console.log("getAssessmentById", response.data.data);
        return response.data.data;
    },

    getAssessmentById: async (id: string): Promise<AssessmentWithDetailsForUser> => {
        const response = await apiClient.get(`/api/v1/assessments/user/${id}/`);
        // console.log("getAssessmentById", response.data.data);
        return response.data.data;
    },

    // Update assessment (admin only)
    updateAssessment: async (id: string, data: UpdateAssessmentData): Promise<Assessment> => {
        const response = await apiClient.put(`/api/v1/assessments/${id}`, data);
        return response.data;
    },

    // Delete assessment (admin only)
    deleteAssessment: async (id: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/api/v1/assessments/${id}`);
        return response.data;
    },

    // Activate assessment (admin only)
    activateAssessment: async (id: string): Promise<Assessment> => {
        const response = await apiClient.patch(`/api/v1/assessments/${id}/activate`);
        return response.data;
    },

    // Deactivate assessment (admin only)
    deactivateAssessment: async (id: string): Promise<Assessment> => {
        const response = await apiClient.patch(`/api/v1/assessments/${id}/deactivate`);
        return response.data;
    },

    // Clone assessment (admin only)
    cloneAssessment: async (id: string): Promise<Assessment> => {
        const response = await apiClient.patch(`/api/v1/assessments/${id}/clone`);
        return response.data;
    },

    // Assign users to assessment (admin only)
    assignUsersToAssessment: async (id: string, userIds: string[]): Promise<ApiResponse<void>> => {
        const response = await apiClient.post(`/api/v1/assessments/${id}/assign-users`, { userIds });
        return response.data;
    },

    // Get assessment stats (admin only)
    getAssessmentStats: async (id: string): Promise<any> => {
        const response = await apiClient.get(`/api/v1/assessments/${id}/stats`);
        return response.data;
    },

    // Get my assessments (authenticated users)
    getMyAssessments: async (): Promise<UserAssessment[]> => {
        const response = await apiClient.get('/api/v1/assessments/my/assessments');
        return response.data.data;
    },

    // Get specific assessment for current user (authenticated users)
    getMyAssessmentById: async (id: string): Promise<UserAssessment> => {
        const response = await apiClient.get(`/api/v1/assessments/my/assessments/${id}`);
        return response.data.data;
    },

    // Update question within assessment (admin only)
    updateQuestion: async (questionId: string, data: any): Promise<any> => {
        const response = await apiClient.put(`/api/v1/assessments/update-question/${questionId}`, data);
        return response.data;
    },

    // Create question within assessment (admin only)
    createQuestionInAssessment: async (assessmentId: string, data: any): Promise<any> => {
        const response = await apiClient.post(`/api/v1/assessments/create-question/${assessmentId}`, data);
        return response.data.data;
    },
}; 