import { TestSubmission } from '../types/test';
import apiClient from './client';
import {
    AssessmentResult,
    AssessmentResultWithCollegeInfo,
    Assessment,
    PaginatedResponse,
    ApiResponse
} from '@/lib/types';

export const assessmentResultAPI = {
    // Get all assessment results (admin only)
    getAllResults: async (params?: any): Promise<PaginatedResponse<AssessmentResult>> => {
        const response = await apiClient.get('/api/v1/assessment-results', { params });
        return response.data;
    },

    // Get assessment result by ID (admin only)
    getResultById: async (id: string): Promise<AssessmentResult> => {
        const response = await apiClient.get(`/api/v1/assessment-results/${id}`);
        return response.data;
    },

    // Get my assessment result by ID (authenticated users)
    getMyResultById: async (id: string): Promise<AssessmentResult> => {
        const response = await apiClient.get(`/api/v1/assessment-results/my/results/${id}`);
        return response.data.data;
    },

    // Get results by assessment (admin only)
    getResultsByAssessment: async (assessmentId: string): Promise<AssessmentResult[]> => {
        const response = await apiClient.get(`/api/v1/assessment-results/assessment/${assessmentId}`);
        return response.data;
    },

    // Get results by assessment with college info (admin only)
    getResultsByAssessmentWithCollegeInfo: async (
        assessmentId: string,
        filters?: { college?: string; branch?: string; year?: string },
        pagination?: { page?: number; limit?: number }
    ): Promise<AssessmentResultWithCollegeInfo[] | { results: AssessmentResultWithCollegeInfo[]; pagination: any }> => {
        const params = new URLSearchParams();
        if (filters?.college && filters.college !== 'all') params.append('college', filters.college);
        if (filters?.branch && filters.branch !== 'all') params.append('branch', filters.branch);
        if (filters?.year && filters.year !== 'all') params.append('year', filters.year);

        // Add pagination params if provided
        if (pagination?.page) params.append('page', pagination.page.toString());
        if (pagination?.limit) params.append('limit', pagination.limit.toString());

        const queryString = params.toString();
        const url = `/api/v1/assessment-results/assessment/${assessmentId}/results-detailed${queryString ? `?${queryString}` : ''}`;

        const response = await apiClient.get(url);

        // If pagination was requested, return results with pagination metadata
        if (pagination?.page || pagination?.limit) {
            return {
                results: response.data.data,
                pagination: response.data.pagination
            };
        }

        // Backward compatibility: return results array directly
        return response.data.data;
    },

    // Get results by user (admin only)
    getResultsByUser: async (userId: string): Promise<AssessmentResult[]> => {
        const response = await apiClient.get(`/api/v1/assessment-results/user/${userId}`);
        return response.data;
    },

    // Get assessments for a user (admin only) - returns assessments the user has completed
    getAssessmentsForUser: async (userId: string): Promise<Assessment[]> => {
        const response = await apiClient.get(`/api/v1/assessment-results/user/${userId}/assessments`);
        return response.data.data;
    },

    // Get my results (authenticated users)
    getMyResults: async (): Promise<AssessmentResult[]> => {
        const response = await apiClient.get('/api/v1/assessment-results/my/results');
        return response.data.data;
    },

    // Get my results for reports (authenticated users) - returns populated assessmentId objects
    getMyResultsForReports: async (): Promise<any[]> => {
        const response = await apiClient.get('/api/v1/assessment-results/my/results-for-reports');
        return response.data.data;
    },

    // Get my assessment result by ID
    getMyAssessmentResult: async (resultId: string): Promise<AssessmentResult> => {
        const response = await apiClient.get(`/api/v1/assessment-results/my/results/${resultId}`);
        return response.data.data;
    },

    getMyOnGoingAssessmentResult: async (resultId: string): Promise<AssessmentResult> => {
        const response = await apiClient.get(`/api/v1/assessment-results/on-going/${resultId}`);
        return response.data.data;
    },

    // Start assessment
    startAssessment: async (data: { assessmentId: string }): Promise<any> => {
        const response = await apiClient.post('/api/v1/assessment-results/start', data);
        return response.data;
    },

    // Submit assessment
    submitAssessment: async (data: { assessmentId: string; responses: any[] }): Promise<any> => {
        const response = await apiClient.post('/api/v1/assessment-results/submit', data);
        return response.data;
    },

    // Pause assessment
    pauseAssessment: async (data: { assessmentId: string }): Promise<any> => {
        const response = await apiClient.post('/api/v1/assessment-results/pause', data);
        return response.data;
    },

    // Save individual answer
    saveAnswer: async (data: { assessmentId: string; questionId: string; selectedOptions: string[]; section?: string }): Promise<any> => {
        const response = await apiClient.post('/api/v1/assessment-results/save-answer', data);
        return response.data;
    },

    clearAnswer: async (data: { assessmentId: string }): Promise<any> => {
        const response = await apiClient.delete(`/api/v1/assessment-results/clear-answer/${data.assessmentId}`);
        return response.data;
    },

    // Get current assessment state
    getCurrentAssessmentState: async (assessmentId: string): Promise<any> => {
        const response = await apiClient.get(`/api/v1/assessment-results/state/${assessmentId}`);
        return response.data;
    },

    // Submit assessment result
    submitResult: async (data: any): Promise<AssessmentResult> => {
        const response = await apiClient.post('/api/v1/assessment-results', data);
        return response.data;
    },

    // Update assessment result (admin only)
    updateResult: async (id: string, data: any): Promise<AssessmentResult> => {
        const response = await apiClient.put(`/api/v1/assessment-results/${id}`, data);
        return response.data;
    },

    // Delete assessment result (admin only)
    deleteResult: async (id: string): Promise<ApiResponse<void>> => {
        const response = await apiClient.delete(`/api/v1/assessment-results/${id}`);
        return response.data;
    },

    // Export results (admin only)
    exportResults: async (assessmentId: string, filters?: {
        college?: string;
        branch?: string;
        year?: string;
        status?: string
    }): Promise<Blob> => {
        const response = await apiClient.post('/api/v1/assessment-results/export', {
            assessmentId,
            ...filters
        }, {
            responseType: 'blob'
        });
        return response.data;
    },

    // Recalculate scores for all results of an assessment (admin only)
    recalculateScores: async (assessmentId: string): Promise<{ recalculated?: number; failed?: number; message: string }> => {
        const response = await apiClient.post(`/api/v1/assessment-results/assessment/${assessmentId}/recalculate-scores`);
        return response.data;
    },

    // Recalculate score for a single result (admin only)
    recalculateResult: async (resultId: string): Promise<{ success: boolean; message: string }> => {
        const response = await apiClient.post(`/api/v1/assessment-results/${resultId}/recalculate`);
        return response.data;
    },

    // Get detailed individual assessment result (admin only)
    getDetailedResult: async (resultId: string): Promise<AssessmentResultWithCollegeInfo> => {
        const response = await apiClient.get(`/api/v1/assessment-results/${resultId}/detailed`);
        return response.data.data;
    },

    // Send individual report via email (admin only)
    sendIndividualReport: async (resultId: string, email: string): Promise<{ message: string }> => {
        const response = await apiClient.post(`/api/v1/assessment-results/${resultId}/send-report`, { email });
        return response.data;
    },

    submitTestSolution: async (testId: string, submission: TestSubmission): Promise<{
        totalTestCases: number;
        passedTestCases: number;
        score: number;
        executionTime: number;
        testResults: any[];
    }> => {
        const response = await apiClient.post(`/api/v1/assessment-results/submit-coding-solution`, submission);
        return response.data.data;
    },

    // Get my results by date range (authenticated users)
    getMyResultsByDateRange: async (startDate: string, endDate: string): Promise<AssessmentResult[]> => {
        const response = await apiClient.get('/api/v1/assessment-results/my/results/date-range', {
            params: { startDate, endDate, forReports: 'true' } // Request populated assessmentId objects for reports
        });
        return response.data.data;
    },

    // Export my results by date range (authenticated users)
    exportMyResultsByDateRange: async (startDate: string, endDate: string): Promise<Blob> => {
        const response = await apiClient.get('/api/v1/assessment-results/my/results/export', {
            params: { startDate, endDate },
            responseType: 'blob'
        });
        return response.data;
    },

    // Get result by user and assessment (admin only) - for individual reports
    getResultByUserAndAssessment: async (userId: string, assessmentId: string): Promise<AssessmentResultWithCollegeInfo> => {
        const response = await apiClient.get(`/api/v1/assessment-results/user/${userId}/assessment`, {
            params: { assessmentId }
        });
        return response.data.data;
    },

    // Get results by user and date range (admin only)
    getResultsByUserAndDateRange: async (userId: string, startDate: string, endDate: string): Promise<AssessmentResult[]> => {
        const response = await apiClient.get(`/api/v1/assessment-results/user/${userId}/date-range`, {
            params: { startDate, endDate }
        });
        return response.data.data;
    },

    // Get results by user and date range for admin reports (admin only) - returns populated assessmentId objects
    getResultsByUserAndDateRangeForReports: async (userId: string, startDate: string, endDate: string): Promise<AssessmentResult[]> => {
        const response = await apiClient.get(`/api/v1/assessment-results/user/${userId}/date-range/reports`, {
            params: { startDate, endDate }
        });
        return response.data.data;
    },

    // Export results by user and date range (admin only)
    exportResultsByUserAndDateRange: async (userId: string, startDate: string, endDate: string): Promise<Blob> => {
        const response = await apiClient.get(`/api/v1/assessment-results/user/${userId}/export`, {
            params: { startDate, endDate },
            responseType: 'blob'
        });
        return response.data;
    },

}; 