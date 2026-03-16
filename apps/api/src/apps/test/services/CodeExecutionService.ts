import axios, { AxiosInstance } from 'axios';
import { logger } from '../../../utils/logger';
import {
    CodeSubmission,
    CodeExecutionResult,
    Language,
    CodeExecutionResponse
} from '../interface/CodeExecution';
import Config from '@repo/env-config';

// # Test API connectivity
// curl https://judge.blcompiler.com/health

// # Get all available languages
// curl https://judge.blcompiler.com/languages

// # Test Python execution
// curl -X POST "https://judge.blcompiler.com/submissions?base64_encoded=false&wait=true" \
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
// Add this temporary test method
async testWithoutBase64(submission: CodeSubmission): Promise<CodeExecutionResponse> {
    try {
        console.log("========== TEST WITHOUT BASE64 ==========");
        console.log("Sending raw code:", submission.source_code.substring(0, 200));
        
        const response = await axios.post(
            `${this.apiUrl}/submissions`,
            {
                source_code: submission.source_code, // Send raw, not base64
                language_id: submission.language_id,
                stdin: submission.stdin || '',
            },
            {
                params: {
                    base64_encoded: 'false', // Don't use base64
                    wait: 'true' // Wait for result
                }
            }
        );

        console.log("Test response:", response.data);
        console.log("========================================");
        
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.log("Test error:", error);
        return {
            success: false,
            // error: error.message
        };
    }
}
    /**
     * Submit code for execution
     */
// In your submitCode method, after getting the token, also log the full decoded code
async submitCode(submission: CodeSubmission): Promise<CodeExecutionResponse> {
    try {
        logger.info(`Submitting code for language ID: ${submission.language_id}`);

        // Convert source code to base64
        const base64Source = Buffer.from(submission.source_code, 'utf8').toString('base64');
        
        // Log the FULL decoded code for debugging
        console.log("========== FULL SOURCE CODE ==========");
        console.log(submission.source_code);
        console.log("======================================");
        console.log("Code length:", submission.source_code.length);
        
        // Check for common C++ issues
        if (!submission.source_code.includes('main')) {
            console.warn("WARNING: No main() function found!");
        }
        if (!submission.source_code.includes('#include')) {
            console.warn("WARNING: No includes found!");
        }
        
        // Check for mismatched braces
        const openBraces = (submission.source_code.match(/{/g) || []).length;
        const closeBraces = (submission.source_code.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
            console.warn(`WARNING: Brace mismatch! Open: ${openBraces}, Close: ${closeBraces}`);
        }

        const base64Submission = {
            ...submission,
            source_code: base64Source,
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

        console.log("Submission Response", response.data);
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
        console.log("ERROR SUBMITTING code", error);
        logger.error('Error submitting code:', error instanceof Error ? error.message : 'Unknown error');
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

        // Log the RAW response before decoding
        console.log("========== RAW JUDGE0 RESPONSE ==========");
        console.log("Status:", response.data.status);
        console.log("Raw compile_output:", response.data.compile_output);
        console.log("Raw stderr:", response.data.stderr);
        console.log("Raw message:", response.data.message);
        console.log("========================================");

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
            ...(response.data.time && { execution_time: Math.round(parseFloat(response.data.time) * 1000) })
        };

        console.log("========== DECODED RESULT ==========");
        console.log("Decoded compile_output:", result.compile_output);
        console.log("Decoded stderr:", result.stderr);
        console.log("====================================");

        logger.info(`Execution result fetched successfully for token: ${token}`);

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.log("ERROR executing code", error)
        logger.error('Error fetching execution result:', error instanceof Error ? error.message : 'Unknown error');
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
            logger.error('Error executing code:', error instanceof Error ? error.message : 'Unknown error');
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
