import { apiClient as client } from './client';
import {
    Language,
    CodeExecutionRequest,
    CodeExecutionResponse,
    CodeExecutionResult
} from '../types/codeExecution';

export const codeExecutionApi = {
    /**
     * Get all supported programming languages
     */
    // Get all languages (global)
    async getLanguages(): Promise<Language[]> {
        const response = await client.get('/api/v1/code-execution/languages');
        return response.data.data; // Extract data array
    },

    // Get supported languages for a specific test
    async getLanguagesForTest(testId: string): Promise<Language[]> {
        const response = await client.get(`/api/v1/tests/${testId}/languages`);
        return response.data.data; // Extract data array
    },

    // Get language by ID
    async getLanguageById(id: number): Promise<Language> {
        const response = await client.get(`/api/v1/code-execution/languages/${id}`);
        return response.data.data; // Extract data
    },

    /**
     * Submit code for execution
     */
    async submitCode(submission: CodeExecutionRequest): Promise<{ token: string }> {
        const response = await client.post('/api/v1/code-execution/submit', submission);
        return response.data.data;
    },

    /**
     * Get execution result by token
     */
    async getExecutionResult(token: string): Promise<CodeExecutionResult> {
        const response = await client.get(`/api/v1/code-execution/result/${token}`);
        return response.data.data;
    },

    /**
     * Execute code and wait for result (synchronous)
     */
    async executeCode(submission: CodeExecutionRequest): Promise<CodeExecutionResult> {
        const response = await client.post('/api/v1/code-execution/execute', submission);
        return response.data.data;
    }
};
