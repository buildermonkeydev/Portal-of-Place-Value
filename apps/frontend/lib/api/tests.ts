import apiClient from './client';
import {
    Test,
    TestListItem,
    CreateTestData,
    UpdateTestData,
    TestQueryParams,
    TestSubmissionQueryParams,
    TestSubmission,
    TestSubmissionResult,
    TestStats,
    TestSubmissionStats
} from '@/lib/types/test';
import { PaginatedResponse, ApiResponse } from '@/lib/types';

export const testAPI = {
    // Create new test (admin only)
    createTest: async (data: CreateTestData): Promise<Test> => {
        const response = await apiClient.post('/api/v1/tests', data);
        return response.data.data;
    },

    // Get all tests (admin only)
    getAllTests: async (params?: TestQueryParams): Promise<PaginatedResponse<TestListItem>> => {
        const response = await apiClient.get('/api/v1/tests/admin', { params });
        return response.data.data;
    },

    // Get published tests for users
    getPublishedTests: async (params?: TestQueryParams): Promise<PaginatedResponse<TestListItem>> => {
        const response = await apiClient.get('/api/v1/tests', { params });
        return response.data.data;
    },

    // Get tests assigned to the current user
    getAssignedTests: async (params?: TestQueryParams): Promise<PaginatedResponse<TestListItem>> => {
        const response = await apiClient.get('/api/v1/tests/my/assigned', { params });
        return response.data.data;
    },

    // Get test by ID (admin - includes hidden test cases)
    getTestById: async (id: string): Promise<Test> => {
        const response = await apiClient.get(`/api/v1/tests/admin/${id}`);
        return response.data.data;
    },

    // Get test by ID for users (excludes hidden test cases)
    getTestByIdForUser: async (id: string): Promise<Test> => {
        const response = await apiClient.get(`/api/v1/tests/${id}`);
        return response.data.data;
    },

    // Update test (admin only)
    updateTest: async (id: string, data: UpdateTestData): Promise<Test> => {
        const response = await apiClient.put(`/api/v1/tests/admin/${id}`, data);
        return response.data.data;
    },

    // Delete test (admin only)
    deleteTest: async (id: string): Promise<void> => {
        await apiClient.delete(`/api/v1/tests/admin/${id}`);
    },

    // Publish test (admin only)
    publishTest: async (id: string): Promise<Test> => {
        const response = await apiClient.patch(`/api/v1/tests/admin/${id}/publish`);
        return response.data.data;
    },

    // Archive test (admin only)
    archiveTest: async (id: string): Promise<Test> => {
        const response = await apiClient.patch(`/api/v1/tests/admin/${id}/archive`);
        return response.data.data;
    },

    // Submit test solution (async - returns submissionId)
    submitTestSolution: async (testId: string, submission: TestSubmission): Promise<{
        submissionId: string;
        jobId: string;
        status: string;
        message: string;
    }> => {
        const response = await apiClient.post(`/api/v1/tests/${testId}/submit`, submission);
        return response.data.data;
    },

    // Get submission status (for polling async results)
    getSubmissionStatus: async (submissionId: string): Promise<{
        submission: {
            _id: string;
            status: string;
            totalTestCases?: number;
            passedTestCases?: number;
            score?: number;
            executionTime?: number;
            testResults?: any[];
        };
        status: string;
    }> => {
        const response = await apiClient.get(`/api/v1/tests/submissions/${submissionId}/status`);
        return response.data.data;
    },

    // Get user's submission history for a test
    getUserSubmissionHistory: async (testId: string): Promise<TestSubmissionResult[]> => {
        const response = await apiClient.get(`/api/v1/tests/${testId}/submissions`);
        return response.data.data;
    },

    // Get test submissions (admin only)
    getTestSubmissions: async (params?: TestSubmissionQueryParams): Promise<PaginatedResponse<TestSubmissionResult>> => {
        const response = await apiClient.get('/api/v1/tests/admin/submissions', { params });
        return response.data.data;
    },

    // Get test submissions for specific test (admin only)
    getTestSubmissionsById: async (testId: string, params?: TestSubmissionQueryParams): Promise<PaginatedResponse<TestSubmissionResult>> => {
        const response = await apiClient.get(`/api/v1/tests/admin/${testId}/submissions`, { params });
        return response.data.data;
    },

    // Get test statistics (admin only)
    getTestStats: async (): Promise<TestStats> => {
        const response = await apiClient.get('/api/v1/tests/admin/stats/overview');
        return response.data.data;
    },

    // Get test submission statistics (admin only)
    getTestSubmissionStats: async (testId: string): Promise<TestSubmissionStats> => {
        const response = await apiClient.get(`/api/v1/tests/admin/${testId}/stats`);
        return response.data.data;
    },

    // Search tests
    searchTests: async (query: string, params?: TestQueryParams): Promise<PaginatedResponse<TestListItem>> => {
        const response = await apiClient.get('/api/v1/tests/search', {
            params: { q: query, ...params }
        });
        return response.data.data;
    },

    // Get tests by creator (admin only)
    getTestsByCreator: async (creatorId: string, params?: TestQueryParams): Promise<PaginatedResponse<TestListItem>> => {
        const response = await apiClient.get(`/api/v1/tests/admin/creator/${creatorId}`, { params });
        return response.data.data;
    }
};
