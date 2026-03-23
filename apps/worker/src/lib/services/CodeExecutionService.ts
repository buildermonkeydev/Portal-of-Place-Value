import axios, { AxiosInstance } from 'axios';
import logger from '@repo/logger';
import {
    CodeSubmission,
    CodeExecutionResult,
    Language,
    CodeExecutionResponse
} from '../interfaces/CodeExecution';
import Config from '@repo/env-config';


//   -H "Content-Type: application/json" \
//   -d '{"language_id": 71, "source_code": "print(\"Hello World!\")", "stdin": ""}'

const config = Config.getInstance();
export class CodeExecutionService {
    private readonly apiUrl: string;

    constructor() {
        this.apiUrl = config.getJudge0Url().first;
    }

    // Supported programming languages
    private readonly supportedLanguages: Language[] = [
        {
            id: 48,
            name: 'C (GCC 7.4.0)',
            extension: '.c',
            ace_mode: 'c_cpp',
            sample_code: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}'
        },
        {
            id: 52,
            name: 'C++ (GCC 7.4.0)',
            extension: '.cpp',
            ace_mode: 'c_cpp',
            sample_code: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}'
        },
        {
            id: 62,
            name: 'Java (OpenJDK 13.0.1)',
            extension: '.java',
            ace_mode: 'java',
            sample_code: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'
        },
        {
            id: 71,
            name: 'Python (3.8.1)',
            extension: '.py',
            ace_mode: 'python',
            sample_code: 'print("Hello, World!")'
        },
        {
            id: 63,
            name: 'JavaScript (Node.js 12.14.0)',
            extension: '.js',
            ace_mode: 'javascript',
            sample_code: 'console.log("Hello, World!");'
        }
    ];

    /**
     * Get all supported programming languages
     */
    async getSupportedLanguages(): Promise<Language[]> {
        return this.supportedLanguages;
    }

    /**
     * Get language by ID
     */
    async getLanguageById(id: number): Promise<Language | null> {
        return this.supportedLanguages.find(lang => lang.id === id) || null;
    }

    /**
     * Submit code for execution
     */
    async submitCode(submission: CodeSubmission): Promise<CodeExecutionResponse> {
        try {
            logger.info(`Submitting code for language ID: ${submission.language_id}`);

            // Convert source code to base64 to handle special characters
            const base64Submission = {
                ...submission,
                source_code: Buffer.from(submission.source_code, 'utf8').toString('base64'),
                stdin: submission.stdin ? Buffer.from(submission.stdin, 'utf8').toString('base64') : undefined,
                expected_output: submission.expected_output ? Buffer.from(submission.expected_output, 'utf8').toString('base64') : undefined
            };

            const response = await axios.post(
                `${this.apiUrl}/submissions`,
                base64Submission,
                {
                    params: {
                        base64_encoded: 'true',
                        wait: 'false'
                    }
                }
            );

            console.log("Response", response.data)
            const token = response.data.token;
            logger.info(`Code submitted successfully with token: ${token}`);

            return {
                success: true,
                token,
                data: {
                    token,
                    status: { id: 1, description: 'In Queue' }
                }
            };
        } catch (error) {
            console.log("ERROR SUBMITTING code", error)

            logger.error('Error submitting code:', 'CodeExecutionService', { error: error instanceof Error ? error.message : 'Unknown error' });
            return {
                success: false,
                error: 'Failed to submit code for execution'
            };
        }
    }

    /**
     * Get execution result by token
     */
    async getExecutionResult(token: string): Promise<CodeExecutionResponse> {
        try {
            logger.info(`Fetching execution result for token: ${token}`);

            const response = await axios.get(
                `${this.apiUrl}/submissions/${token}`,
                {
                    params: {
                        base64_encoded: 'true',
                        fields: 'stdout,stderr,compile_output,message,time,memory,status'
                    }
                }
            );


            // Decode base64 responses
            const result: CodeExecutionResult = {
                token,
                status: response.data.status,
                stdout: response.data.stdout ? Buffer.from(response.data.stdout, 'base64').toString('utf8') : '',
                stderr: response.data.stderr ? Buffer.from(response.data.stderr, 'base64').toString('utf8') : '',
                compile_output: response.data.compile_output ? Buffer.from(response.data.compile_output, 'base64').toString('utf8') : '',
                message: response.data.message ? Buffer.from(response.data.message, 'base64').toString('utf8') : '',
                time: response.data.time,
                memory: response.data.memory,
                // Convert time from seconds to milliseconds for consistency with frontend
                ...(response.data.time && { execution_time: Math.round(parseFloat(response.data.time) * 1000) })
            };

            console.log("RESULT", result);
            logger.info(`Execution result fetched successfully for token: ${token}`);

            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.log("ERROR executing code", error)
            logger.error('Error fetching execution result:', 'CodeExecutionService', { error: error instanceof Error ? error.message : 'Unknown error' });
            return {
                success: false,
                error: 'Failed to fetch execution result'
            };
        }
    }

    /**
     * Execute code and wait for result (synchronous)
     */
    async executeCode(submission: CodeSubmission): Promise<CodeExecutionResponse> {
        try {
            // Submit code
            const submitResponse = await this.submitCode(submission);
            if (!submitResponse.success || !submitResponse.token) {
                return submitResponse;
            }

            const token = submitResponse.token;
            let attempts = 0;
            const maxAttempts = 30; // Wait up to 30 seconds

            // Poll for result
            while (attempts < maxAttempts) {
                const resultResponse = await this.getExecutionResult(token);
                if (!resultResponse.success) {
                    return resultResponse;
                }

                const result = resultResponse.data;
                if (result && result.status.id >= 3) { // Status 3+ means processing is complete
                    return resultResponse;
                }

                // Wait 1 second before next attempt
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
            }

            return {
                success: false,
                error: 'Execution timeout - code took too long to execute'
            };
        } catch (error) {
            console.log("ERROR", error);
            logger.error('Error executing code:', 'CodeExecutionService', { error: error instanceof Error ? error.message : 'Unknown error' });
            return {
                success: false,
                error: 'Failed to execute code'
            };
        }
    }

    /**
     * Validate code submission
     */
    validateSubmission(submission: CodeSubmission): { isValid: boolean; error?: string } {
        if (!submission.source_code || submission.source_code.trim().length === 0) {
            return { isValid: false, error: 'Source code is required' };
        }

        if (!submission.language_id) {
            return { isValid: false, error: 'Language ID is required' };
        }

        const language = this.supportedLanguages.find(lang => lang.id === submission.language_id);
        if (!language) {
            return { isValid: false, error: 'Unsupported programming language' };
        }

        if (submission.source_code.length > 100000) {
            return { isValid: false, error: 'Source code is too long (max 100KB)' };
        }

        return { isValid: true };
    }
}
