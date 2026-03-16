import { CodeExecutionService } from "../services/CodeExecutionService";
import { CodeExecutionRequest } from "../interface/CodeExecution";
import { IRequest, IResponse } from "../../../core/types";
import { ResponseUtils } from "../../../utils/responseUtils";
import { logger } from "../../../utils/logger";

export class CodeExecutionController {
    private codeExecutionService: CodeExecutionService;

    constructor() {
        this.codeExecutionService = new CodeExecutionService();
    }

    /**
     * Get all supported programming languages
     */
    async getSupportedLanguages(req: IRequest, res: IResponse): Promise<void> {
        try {
            const languages = await this.codeExecutionService.getSupportedLanguages();
            ResponseUtils.success(res, languages, 'Languages retrieved successfully');
            return; // Add return
        } catch (error) {
            logger.error('Error getting supported languages:', error);
            ResponseUtils.error(res, 'Failed to retrieve supported languages', 500);
            return; // Add return
        }
    }

    /**
     * Get language by ID
     */
    async getLanguageById(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { id } = req.params;
            if (!id) {
                ResponseUtils.badRequest(res, 'Language ID is required');
                return; // Already have return here - good!
            }
            const languageId = parseInt(id);

            if (isNaN(languageId)) {
                ResponseUtils.badRequest(res, 'Invalid language ID');
                return; // Already have return here - good!
            }

            const language = await this.codeExecutionService.getLanguageById(languageId);
            if (!language) {
                ResponseUtils.notFound(res, 'Language not found');
                return; // Already have return here - good!
            }

            ResponseUtils.success(res, language, 'Language retrieved successfully');
            return; // Add return
        } catch (error) {
            logger.error('Error getting language by ID:', error);
            ResponseUtils.error(res, 'Failed to retrieve language', 500);
            return; // Add return
        }
    }

    /**
     * Submit code for execution
     */
    async submitCode(req: IRequest, res: IResponse): Promise<void> {
        try {
            const submission: CodeExecutionRequest = req.body;

            // Validate submission
            const validation = this.codeExecutionService.validateSubmission(submission);
            if (!validation.isValid) {
                ResponseUtils.badRequest(res, validation.error ?? 'Invalid submission');
                return; // Already have return here - good!
            }

            const result = await this.codeExecutionService.submitCode(submission);
            if (!result.success) {
                ResponseUtils.error(res, result.error || 'Failed to submit code', 500);
                return; // Already have return here - good!
            }

            ResponseUtils.success(res, { token: result.token }, 'Code submitted successfully');
            return; // Add return
        } catch (error) {
            logger.error('Error submitting code:', error);
            ResponseUtils.error(res, 'Failed to submit code', 500);
            return; // Add return
        }
    }

    /**
     * Get execution result by token
     */
    async getExecutionResult(req: IRequest, res: IResponse): Promise<void> {
        try {
            const { token } = req.params;

            if (!token) {
                ResponseUtils.badRequest(res, 'Token is required');
                return; // Already have return here - good!
            }

            const result = await this.codeExecutionService.getExecutionResult(token);
            if (!result.success) {
                ResponseUtils.error(res, result.error || 'Failed to retrieve result', 500);
                return; // Already have return here - good!
            }

            ResponseUtils.success(res, result.data, 'Execution result retrieved successfully');
            return; // Add return
        } catch (error) {
            logger.error('Error getting execution result:', error);
            ResponseUtils.error(res, 'Failed to retrieve execution result', 500);
            return; // Add return
        }
    }

    /**
     * Execute code and wait for result (synchronous)
     */
    async executeCode(req: IRequest, res: IResponse): Promise<void> {
        try {
            const submission: CodeExecutionRequest = req.body;

            // Validate submission
            const validation = this.codeExecutionService.validateSubmission(submission);
            if (!validation.isValid) {
                ResponseUtils.badRequest(res, validation.error ?? 'Invalid submission');
                return; // Already have return here - good!
            }

            const result = await this.codeExecutionService.executeCode(submission);
            if (!result.success) {
                ResponseUtils.error(res, result.error || 'Failed to execute code', 500);
                return; // Already have return here - good!
            }

            ResponseUtils.success(res, result.data, 'Code executed successfully');
            return; // Add return
        } catch (error) {
            logger.error('Error executing code:', error);
            ResponseUtils.error(res, 'Failed to execute code', 500);
            return; // Add return
        }
    }
}