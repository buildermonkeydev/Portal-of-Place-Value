import { IRequest, IResponse } from "../../../core/types";
import { asyncHandler } from "../../../utils/errors";
import { AssessmentService } from "../services/AssessmentService";


export class AssessmentController {
    private assessmentService: AssessmentService;

    constructor(assessmentService: AssessmentService) {
        this.assessmentService = assessmentService;
    }

    createAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentData = req.body;
        const adminId = req.user?._id + ""

        const newAssessment = await this.assessmentService.createAssessment(assessmentData, adminId);

        res.status(201).json({
            success: true,
            message: 'Assessment created successfully',
            data: newAssessment,
            timestamp: new Date().toISOString(),
        });
    });

    updateQuestion = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const questionId = req.params['questionId'] as string;
        const updateData = req.body;

        const updatedAssessment = await this.assessmentService.updateQuestion(questionId, updateData);

        res.status(201).json({
            success: true,
            message: 'Assessment created successfully',
            data: updatedAssessment,
            timestamp: new Date().toISOString(),
        });
    });

    createQuestionInAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['assessmentId'] as string;
        const updateData = req.body;

        const updatedAssessment = await this.assessmentService.createQuestionInAssessment(assessmentId, updateData);

        res.status(201).json({
            success: true,
            message: 'Assessment created successfully',
            data: updatedAssessment,
            timestamp: new Date().toISOString(),
        });
    });

    getAllAssessments = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const page = parseInt(req.query['page'] as string) || 1;
        const limit = parseInt(req.query['limit'] as string) || 10;
        const filter: any = {};

        // Apply filters
        if (req.query['status']) {
            filter.status = req.query['status'];
        }
        if (req.query['isActive'] !== undefined) {
            filter.isActive = req.query['isActive'] === 'true';
        }
        if (req.query['createdBy']) {
            filter.createdBy = req.query['createdBy'];
        }
        // Handle search parameter
        if (req.query['search']) {
            filter.search = req.query['search'] as string;
        }

        const result = await this.assessmentService.getAllAssessments(page, limit, filter);

        res.status(200).json({
            success: true,
            message: 'Assessments retrieved successfully',
            data: result.assessments,
            pagination: result.pagination,
            timestamp: new Date().toISOString(),
        });
    });

    // Get assessment by ID (admin only)
    getAssessmentById = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;
        const assessment = await this.assessmentService.getAssessmentById(assessmentId);

        if (!assessment) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment retrieved successfully',
            data: assessment,
            timestamp: new Date().toISOString(),
        });
    });

    // Get assessment by ID with populated questions (admin only)
    getAssessmentByIdWithQuestions = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;
        if (!req.user?._id) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized',
                timestamp: new Date().toISOString(),
            });
            return
        }
        const userId = req.user?._id + "";

        const role = req.user?.role;
        const assessment = await this.assessmentService.getAssessmentByIdWithQuestions(userId, assessmentId, role === "admin" || false);

        if (!assessment) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment retrieved successfully',
            data: assessment,
            timestamp: new Date().toISOString(),
        });
    });

    getAssessmentByResultIdIdWithQuestions = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['resultId'] as string;
        if (!req.user?._id) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
            return
        }
        const userId = req.user?._id + "";

        const role = req.user?.role;
        const assessment = await this.assessmentService.getAssessmentByResultIdIdWithQuestions(userId, assessmentId);

        if (!assessment) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment retrieved successfully',
            data: assessment,
            timestamp: new Date().toISOString(),
        });
    });

    // Update assessment (admin only)
    updateAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;
        const updateData = req.body;

        const updatedAssessment = await this.assessmentService.updateAssessment(assessmentId, updateData);

        if (!updatedAssessment) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment updated successfully',
            data: updatedAssessment,
            timestamp: new Date().toISOString(),
        });
    });

    // Delete assessment (admin only)
    deleteAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;
        const success = await this.assessmentService.deleteAssessment(assessmentId);

        if (!success) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment deleted successfully',
            timestamp: new Date().toISOString(),
        });
    });

    // Activate assessment (admin only)
    activateAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;
        const assessment = await this.assessmentService.activateAssessment(assessmentId);

        if (!assessment) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment activated successfully',
            data: assessment,
            timestamp: new Date().toISOString(),
        });
    });
    cloneAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
            return
        }
        const userId = user._id + "";
        const assessment = await this.assessmentService.cloneAssessment(assessmentId, userId);

        if (!assessment) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment activated successfully',
            data: assessment,
            timestamp: new Date().toISOString(),
        });
    });


    // Deactivate assessment (admin only)
    deactivateAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;
        const assessment = await this.assessmentService.deactivateAssessment(assessmentId);

        if (!assessment) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment deactivated successfully',
            data: assessment,
            timestamp: new Date().toISOString(),
        });
    });

    // Assign users to assessment (admin only)
    assignUsersToAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            res.status(400).json({
                success: false,
                message: 'User IDs array is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const assessment = await this.assessmentService.assignUsersToAssessment(assessmentId, userIds);

        if (!assessment) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Users assigned to assessment successfully',
            data: assessment,
            timestamp: new Date().toISOString(),
        });
    });

    // Get assessments for current user
    getMyAssessments = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const assessments = await this.assessmentService.getAssessmentsForUser(userId);

        res.status(200).json({
            success: true,
            message: 'Assessments retrieved successfully',
            data: assessments,
            timestamp: new Date().toISOString(),
        });
    });

    // Get available assessments for current user (only active ones they can take)
    getMyAvailableAssessments = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const assessments = await this.assessmentService.getAvailableAssessmentsForUser(userId);

        res.status(200).json({
            success: true,
            message: 'Available assessments retrieved successfully',
            data: assessments,
            timestamp: new Date().toISOString(),
        });
    });

    // Get specific assessment for current user
    getMyAssessmentById = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const assessmentId = req.params['id'] as string;

        // Fix typo in role check and ensure type safety
        const isAdmin = req.user?.role === "admin";

        const assessment = await this.assessmentService.getMyAssessmentById(userId, assessmentId, isAdmin);

        if (!assessment) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found or you are not assigned to it',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment retrieved successfully',
            data: assessment,
            timestamp: new Date().toISOString(),
        });
    });

    // Search assessments (admin only)
    searchAssessments = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
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

        const assessments = await this.assessmentService.searchAssessments(searchTerm, page, limit);

        res.status(200).json({
            success: true,
            message: 'Search completed successfully',
            data: assessments,
            timestamp: new Date().toISOString(),
        });
    });

    // Get assessment statistics (admin only)
    getAssessmentStats = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;

        // This would typically call a method to get statistics
        // For now, returning basic info
        const assessment = await this.assessmentService.getAssessmentById(assessmentId);

        if (!assessment) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const stats = {
            totalAssignedUsers: assessment.assignedUsers.length,
            status: assessment.status,
            totalMarks: assessment.totalMarks,
            duration: assessment.duration,
            questionsCount: assessment.questions.length,
        };

        res.status(200).json({
            success: true,
            message: 'Assessment statistics retrieved successfully',
            data: stats,
            timestamp: new Date().toISOString(),
        });
    });

    /**
     * Get assessment success data (for success page)
     */
    getAssessmentSuccess = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { id } = req.params;
        const userId = req.user?._id + "";

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const resultId = id;
        const assessment = await this.assessmentService.getAssessmentGoogleFormById(userId, resultId);
        if (!assessment) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }


        res.status(200).json({
            success: true,
            message: 'Assessment success data retrieved successfully',
            data: assessment,
            timestamp: new Date().toISOString(),
        });
    });
} 