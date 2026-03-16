import { QuestionService } from "../service/QuestionService";
import { IRequest, IResponse } from "../../../core/types";
import { asyncHandler } from "../../../utils/errors";

export class QuestionController {
    private questionService: QuestionService;

    constructor(questionService: QuestionService) {
        this.questionService = questionService;
    }

    createQuestion = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const questionData = req.body;
        const adminId = req.user?._id + "";

        const newQuestion = await this.questionService.createQuestion(questionData, adminId);

        res.status(201).json({
            success: true,
            message: 'Question created successfully',
            data: newQuestion,
            timestamp: new Date().toISOString(),
        });
    });

    // Get all questions (admin only)
    getAllQuestions = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const page = parseInt(req.query['page'] as string) || 1;
        const limit = parseInt(req.query['limit'] as string) || 10;
        const filter: any = {};

        // Apply filters
        if (req.query['type']) {
            filter.type = req.query['type'];
        }
        if (req.query['isActive'] !== undefined) {
            filter.isActive = req.query['isActive'] === 'true';
        }

        const result = await this.questionService.getAllQuestions(page, limit, filter);

        res.status(200).json({
            success: true,
            message: 'Questions retrieved successfully',
            data: result.questions,
            pagination: result.pagination,
            timestamp: new Date().toISOString(),
        });
    });

    // Get question by ID (admin only)
    getQuestionById = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const questionId = req.params['id'] as string;
        const question = await this.questionService.getQuestionById(questionId);

        if (!question) {
            res.status(404).json({
                success: false,
                message: 'Question not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Question retrieved successfully',
            data: question,
            timestamp: new Date().toISOString(),
        });
    });

    // Update question (admin only)
    updateQuestion = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const questionId = req.params['id'] as string;
        const updateData = req.body;

        const updatedQuestion = await this.questionService.updateQuestion(questionId, updateData);

        if (!updatedQuestion) {
            res.status(404).json({
                success: false,
                message: 'Question not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Question updated successfully',
            data: updatedQuestion,
            timestamp: new Date().toISOString(),
        });
    });

    // Delete question (admin only)
    deleteQuestion = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const questionId = req.params['id'] as string;
        const success = await this.questionService.deleteQuestion(questionId);

        if (!success) {
            res.status(404).json({
                success: false,
                message: 'Question not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Question deleted successfully',
            timestamp: new Date().toISOString(),
        });
    });

    // Search questions (admin only)
    searchQuestions = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const searchTerm = req.query['q'] as string;
        const page = parseInt(req.query['page'] as string) || 1;
        const limit = parseInt(req.query['limit'] as string) || 10;

        if (!searchTerm) {
            res.status(400).json({
                success: false,
                message: 'Search term is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const questions = await this.questionService.searchQuestions(searchTerm, page, limit);

        res.status(200).json({
            success: true,
            message: 'Search completed successfully',
            data: questions,
            timestamp: new Date().toISOString(),
        });
    });

    // Toggle question status (admin only)
    toggleQuestionStatus = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const questionId = req.params['id'] as string;
        const success = await this.questionService.toggleQuestionStatus(questionId);

        if (!success) {
            res.status(404).json({
                success: false,
                message: 'Question not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Question status toggled successfully',
            timestamp: new Date().toISOString(),
        });
    });
} 