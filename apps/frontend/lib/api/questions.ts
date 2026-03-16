import apiClient from './client';
import {
    Question,
    CreateQuestionData,
    UpdateQuestionData,
    QuestionQueryParams,
    PaginatedResponse,
    ApiResponse
} from '@/lib/types';

export const questionAPI = {
    // Create new question (admin only)
    createQuestion: async (data: CreateQuestionData): Promise<Question> => {
        const response = await apiClient.post('/api/v1/questions', data);
        return response.data;
    },

    // Get all questions (admin only)
    getAllQuestions: async (params?: QuestionQueryParams): Promise<PaginatedResponse<Question>> => {
        const response = await apiClient.get('/api/v1/questions', { params });
        return response.data;
    },

    // Search questions (admin only)
    searchQuestions: async (params?: QuestionQueryParams): Promise<PaginatedResponse<Question>> => {
        const response = await apiClient.get('/api/v1/questions/search', { params });
        return response.data;
    },

    // Get question by ID (admin only)
    getQuestionById: async (id: string): Promise<Question> => {
        const response = await apiClient.get(`/api/v1/questions/${id}`);
        return response.data;
    },

    // Update question (admin only)
    updateQuestion: async (id: string, data: UpdateQuestionData): Promise<Question> => {
        const response = await apiClient.put(`/api/v1/questions/${id}`, data);
        return response.data;
    },

    // Delete question (admin only)
    deleteQuestion: async (id: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/api/v1/questions/${id}`);
        return response.data;
    },

    // Toggle question status (admin only)
    toggleQuestionStatus: async (id: string): Promise<Question> => {
        const response = await apiClient.patch(`/api/v1/questions/${id}/toggle-status`);
        return response.data;
    },
}; 