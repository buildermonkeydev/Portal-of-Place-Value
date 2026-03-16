import { IRequest, IResponse, UserRole } from '../../../core/types';
import { AssessmentResultService } from '../services/AssessmentResultService';
import { AssessmentService } from '../services/AssessmentService';
import { QuestionService } from '../../questions/service/QuestionService';
import { UserService } from '../../users/services/UserService';
import { AssessmentRepository } from '../repository/AssessmentRepository';
import { QuestionRepository } from '../../questions/repository/QuestionRepository';
import { UserRepository } from '../../users/repository/UserRepository';
import { asyncHandler } from '../../../utils/errors';
import { logger } from '../../../utils/logger';

export class AssessmentResultController {
    private assessmentResultService: AssessmentResultService;

    constructor(assessmentResultService: AssessmentResultService) {

        this.assessmentResultService = assessmentResultService;
    }

    // Start assessment
    startAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const { assessmentId } = req.body;

        if (!assessmentId) {
            res.status(400).json({
                success: false,
                message: 'Assessment ID is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const result = await this.assessmentResultService.startAssessment(userId, assessmentId);

        res.status(200).json({
            success: true,
            message: 'Assessment started successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });

    // Pause assessment
    pauseAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const { assessmentId } = req.body;

        if (!assessmentId) {
            res.status(400).json({
                success: false,
                message: 'Assessment ID is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // const result = await this.assessmentResultService.pauseAssessment(userId, assessmentId);

        res.status(200).json({
            success: true,
            message: 'Assessment paused successfully',
            data: "Assessment paused successfully",
            // data: result,
            // timestamp: new Date().toISOString(),
        });
    });

    // Get current assessment state
    getCurrentAssessmentState = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const assessmentId = req.params['id'] as string;

        const result = await this.assessmentResultService.getCurrentAssessmentState(userId, assessmentId);

        if (!result) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found or not started',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment state retrieved successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });
    getResultByAssessmentId = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const assessmentId = req.params['assessmentId'] as string;

        const result = await this.assessmentResultService.getResultByAssessmentId(userId, assessmentId);

        if (!result) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found or not started',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment state retrieved successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });


    // Save individual answer
    saveAnswer = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const { assessmentId, questionId, selectedOptions = [], section } = req.body;

        if (!assessmentId || !questionId) {
            res.status(400).json({
                success: false,
                message: 'Assessment ID, question ID, and selected options are required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        logger.info('User ID', { userId });
        if (!userId) {
            logger.error('User ID is required', { userId });
            res.status(400).json({
                success: false,
                message: 'User ID is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const result = await this.assessmentResultService.saveAnswer(userId, assessmentId, questionId, selectedOptions, section);

        res.status(200).json({
            success: true,
            message: 'Answer saved successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });

    clearAnswer = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const assessmentId = req.params['id'] as string;

        if (!assessmentId) {
            res.status(400).json({
                success: false,
                message: 'Assessment ID is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const result = await this.assessmentResultService.clearAnswer(userId, assessmentId);

        res.status(200).json({
            success: true,
            message: 'Answer saved successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });

    // Submit assessment
    submitAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const submitData = req.body;

        if (!submitData.assessmentId) {
            res.status(400).json({
                success: false,
                message: 'Assessment ID and responses are required',
                timestamp: new Date().toISOString(),
            });
            return;
        }



        const result = await this.assessmentResultService.submitAssessment(userId, submitData);

        res.status(200).json({
            success: true,
            message: 'Assessment submitted successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });

    // Get assessment result for current user
    getMyAssessmentResult = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const resultId = req.params['id'] as string;

        const isAdmin = req.user?.role === UserRole.ADMIN;
        const result = await this.assessmentResultService.getAssessmentResult(userId, resultId, isAdmin);

        if (!result) {
            res.status(404).json({
                success: false,
                message: 'Assessment result not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment result retrieved successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });

    getOnGoingAssessmentResult = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const resultId = req.params['id'] as string;

        const result = await this.assessmentResultService.getOnGoingAssessmentResult(userId, resultId);

        if (!result) {
            res.status(404).json({
                success: false,
                message: 'Assessment result not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment result retrieved successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });

    // Get all results for current user
    getMyResults = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const results = await this.assessmentResultService.getUserResults(userId);

        res.status(200).json({
            success: true,
            message: 'Results retrieved successfully',
            data: results,
            timestamp: new Date().toISOString(),
        });
    });

    // Get all results for current user (for reports page - returns populated assessmentId objects)
    getMyResultsForReports = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const results = await this.assessmentResultService.getUserResultsForReports(userId);

        res.status(200).json({
            success: true,
            message: 'Results retrieved successfully',
            data: results,
            timestamp: new Date().toISOString(),
        });
    });

    // Get all assessment results (admin only)
    getAllResults = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const page = parseInt(req.query['page'] as string) || 1;
        const limit = parseInt(req.query['limit'] as string) || 10;
        const filter: any = {};

        // Apply filters
        if (req.query['assessmentId']) {
            filter.assessmentId = req.query['assessmentId'];
        }
        if (req.query['userId']) {
            filter.userId = req.query['userId'];
        }
        if (req.query['status']) {
            filter.status = req.query['status'];
        }

        const result = await this.assessmentResultService.getAllResults(page, limit, filter);

        res.status(200).json({
            success: true,
            message: 'Assessment results retrieved successfully',
            data: result.results,
            pagination: result.pagination,
            timestamp: new Date().toISOString(),
        });
    });

    // Get assessment result by ID (admin only)
    getResultById = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const resultId = req.params['id'] as string;
        const result = await this.assessmentResultService.getResultById(resultId);

        if (!result) {
            res.status(404).json({
                success: false,
                message: 'Assessment result not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment result retrieved successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });

    // Get results by user (admin only)
    getResultsByUser = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['userId'] as string;
        const results = await this.assessmentResultService.getResultsByUser(userId);

        res.status(200).json({
            success: true,
            message: 'User results retrieved successfully',
            data: results,
            timestamp: new Date().toISOString(),
        });
    });

    // Get assessments for a user (admin only) - returns assessments the user has completed
    getAssessmentsForUser = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['userId'] as string;
        const assessments = await this.assessmentResultService.getAssessmentsForUserReports(userId);

        res.status(200).json({
            success: true,
            message: 'Assessments retrieved successfully',
            data: assessments,
            timestamp: new Date().toISOString(),
        });
    });

    // Get my results by date range (authenticated users)
    getMyResultsByDateRange = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const startDate = new Date(req.query['startDate'] as string);
        const endDate = new Date(req.query['endDate'] as string);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            res.status(400).json({
                success: false,
                message: 'Valid startDate and endDate are required (ISO format)',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        if (startDate.getTime() > endDate.getTime()) {
            res.status(400).json({
                success: false,
                message: 'startDate must be before or equal to endDate',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Set endDate to end of day
        endDate.setHours(23, 59, 59, 999);

        // Check if this is for reports (query param)
        const forReportsParam = req.query['forReports'];
        const forReports = typeof forReportsParam === 'string' && (forReportsParam === 'true' || forReportsParam === '1');

        logger.info(`getMyResultsByDateRange called with forReports=${forReportsParam} (parsed: ${forReports}), userId=${userId}`);

        let results;
        if (forReports) {
            results = await this.assessmentResultService.getUserResultsByDateRangeForReports(userId, startDate, endDate);
        } else {
            results = await this.assessmentResultService.getUserResultsByDateRange(userId, startDate, endDate);
        }

        res.status(200).json({
            success: true,
            message: 'Results retrieved successfully',
            data: results,
            timestamp: new Date().toISOString(),
        });
    });

    // Get result by user and assessment (admin only) - for individual reports
    getResultByUserAndAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['userId'] as string;
        const assessmentId = req.query['assessmentId'] as string;

        if (!assessmentId) {
            res.status(400).json({
                success: false,
                message: 'Assessment ID is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const result = await this.assessmentResultService.getResultByUserAndAssessment(userId, assessmentId);

        if (!result) {
            res.status(404).json({
                success: false,
                message: 'No result found for this user and assessment',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Result retrieved successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });

    // Get results by user and date range (admin only)
    getResultsByUserAndDateRange = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['userId'] as string;
        const startDate = new Date(req.query['startDate'] as string);
        const endDate = new Date(req.query['endDate'] as string);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            res.status(400).json({
                success: false,
                message: 'Valid startDate and endDate are required (ISO format)',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        if (startDate.getTime() > endDate.getTime()) {
            res.status(400).json({
                success: false,
                message: 'startDate must be less than or equal to endDate',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Set endDate to end of day
        endDate.setHours(23, 59, 59, 999);

        const results = await this.assessmentResultService.getResultsByUserAndDateRange(userId, startDate, endDate);

        res.status(200).json({
            success: true,
            message: 'User results retrieved successfully',
            data: results,
            timestamp: new Date().toISOString(),
        });
    });

    // Get results by user and date range for admin reports (admin only) - returns populated assessmentId objects
    getResultsByUserAndDateRangeForReports = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['userId'] as string;
        const startDate = new Date(req.query['startDate'] as string);
        const endDate = new Date(req.query['endDate'] as string);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            res.status(400).json({
                success: false,
                message: 'Valid startDate and endDate are required (ISO format)',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        if (startDate.getTime() > endDate.getTime()) {
            res.status(400).json({
                success: false,
                message: 'startDate must be less than or equal to endDate',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Set endDate to end of day
        endDate.setHours(23, 59, 59, 999);

        const results = await this.assessmentResultService.getResultsByUserAndDateRangeForReports(userId, startDate, endDate);

        res.status(200).json({
            success: true,
            message: 'User results retrieved successfully',
            data: results,
            timestamp: new Date().toISOString(),
        });
    });

    // Export my results by date range (authenticated users)
    exportMyResultsByDateRange = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const startDate = new Date(req.query['startDate'] as string);
        const endDate = new Date(req.query['endDate'] as string);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            res.status(400).json({
                success: false,
                message: 'Valid startDate and endDate are required (ISO format)',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        if (startDate.getTime() > endDate.getTime()) {
            res.status(400).json({
                success: false,
                message: 'startDate must be less than or equal to endDate',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Set endDate to end of day
        endDate.setHours(23, 59, 59, 999);

        const csvData = await this.assessmentResultService.exportUserResultsByDateRange(userId, startDate, endDate);

        const filename = `my-assessment-results-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.status(200).send(csvData);
    });

    // Export results by user and date range (admin only)
    exportResultsByUserAndDateRange = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.params['userId'] as string;
        const startDate = new Date(req.query['startDate'] as string);
        const endDate = new Date(req.query['endDate'] as string);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            res.status(400).json({
                success: false,
                message: 'Valid startDate and endDate are required (ISO format)',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        if (startDate.getTime() > endDate.getTime()) {
            res.status(400).json({
                success: false,
                message: 'startDate must be on or before endDate',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Set endDate to end of day
        endDate.setHours(23, 59, 59, 999);

        const csvData = await this.assessmentResultService.exportUserResultsByDateRange(userId, startDate, endDate, true);

        const filename = `student-assessment-results-${userId}-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.status(200).send(csvData);
    });

    // Export results (admin only)
    exportResults = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const { assessmentId, college, branch, year, status } = req.body;

        if (!assessmentId) {
            res.status(400).json({
                success: false,
                message: 'Assessment ID is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const filters: any = {};
        if (college && college !== 'all') filters.college = college;
        if (branch && branch !== 'all') filters.branch = branch;
        if (year && year !== 'all') filters.year = year;
        if (status && status !== 'all') filters.status = status;

        const csvData = await this.assessmentResultService.exportResults(assessmentId, filters);

        // Get assessment title for filename
        const assessmentService = new AssessmentService(
            new AssessmentRepository(),
            new QuestionService(new QuestionRepository()),
            new UserService()
        );
        const assessment = await assessmentService.getAssessmentById(assessmentId);
        const assessmentTitle = assessment?.title || 'assessment';
        const filename = `${assessmentTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-results.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.status(200).send(csvData);
    });

    // Update assessment result (admin only)
    updateResult = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const resultId = req.params['id'] as string;
        const updateData = req.body;

        const updatedResult = await this.assessmentResultService.updateResult(resultId, updateData);

        if (!updatedResult) {
            res.status(404).json({
                success: false,
                message: 'Assessment result not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment result updated successfully',
            data: updatedResult,
            timestamp: new Date().toISOString(),
        });
    });

    // Delete assessment result (admin only)
    deleteResult = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const resultId = req.params['id'] as string;
        const success = await this.assessmentResultService.deleteResult(resultId);

        if (!success) {
            res.status(404).json({
                success: false,
                message: 'Assessment result not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment result deleted successfully',
            timestamp: new Date().toISOString(),
        });
    });

    // Create assessment result (admin only)
    createResult = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const resultData = req.body;
        const result = await this.assessmentResultService.createResult(resultData);

        res.status(201).json({
            success: true,
            message: 'Assessment result created successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });

    // Get all results for an assessment (admin only)
    getAssessmentResults = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;
        const results = await this.assessmentResultService.getAssessmentResults(assessmentId);

        res.status(200).json({
            success: true,
            message: 'Assessment results retrieved successfully',
            data: results,
            timestamp: new Date().toISOString(),
        });
    });

    // Get all results for an assessment with college info (admin only)
    getAssessmentResultsWithCollegeInfo = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;
        const filters = {
            college: req.query['college'] as string,
            branch: req.query['branch'] as string,
            year: req.query['year'] as string,
        };

        // Extract pagination params
        const page = req.query['page'] ? parseInt(req.query['page'] as string) : undefined;
        const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : undefined;

        const pagination = (page || limit) ? { page, limit } : undefined;

        const result = await this.assessmentResultService.getAssessmentResultsWithCollegeInfo(assessmentId, filters, pagination);

        // If pagination was requested, return results with pagination metadata
        if (pagination) {
            res.status(200).json({
                success: true,
                message: 'Assessment results with college info retrieved successfully',
                data: result.results,
                pagination: result.pagination,
                timestamp: new Date().toISOString(),
            });
        } else {
            // Backward compatibility: return results array directly
            res.status(200).json({
                success: true,
                message: 'Assessment results with college info retrieved successfully',
                data: result,
                timestamp: new Date().toISOString(),
            });
        }
    });

    // Get assessment statistics (admin only)
    getAssessmentStatistics = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;
        const stats = await this.assessmentResultService.getAssessmentStatistics(assessmentId);

        res.status(200).json({
            success: true,
            message: 'Assessment statistics retrieved successfully',
            data: stats,
            timestamp: new Date().toISOString(),
        });
    });

    // Recalculate scores for all results of an assessment (admin only)
    recalculateAssessmentScores = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const assessmentId = req.params['id'] as string;

        if (!assessmentId) {
            res.status(400).json({
                success: false,
                message: 'Assessment ID is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Respond immediately with 202 Accepted to prevent timeout
        res.status(202).json({
            success: true,
            message: 'Score recalculation started. This may take a few minutes for large datasets.',
            timestamp: new Date().toISOString(),
        });

        // Run recalculation in background (fire and forget)
        this.assessmentResultService.recalculateAssessmentScores(assessmentId)
            .then((result) => {
                logger.info(`Recalculation completed for assessment ${assessmentId}: ${result.recalculated} recalculated, ${result.failed} failed`);
            })
            .catch((error) => {
                logger.error(`Recalculation failed for assessment ${assessmentId}:`, error);
            });
    });

    // Recalculate scores for a single result (admin only)
    recalculateResultScores = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const resultId = req.params['id'] as string;

        if (!resultId) {
            res.status(400).json({
                success: false,
                message: 'Result ID is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Respond immediately with 202 Accepted to prevent timeout
        res.status(202).json({
            success: true,
            message: 'Score recalculation started.',
            timestamp: new Date().toISOString(),
        });

        // Run recalculation in background (fire and forget)
        this.assessmentResultService.recalculateResultScores(resultId)
            .then((result) => {
                logger.info(`Recalculation completed for result ${resultId}`);
            })
            .catch((error) => {
                logger.error(`Recalculation failed for result ${resultId}:`, error);
            });
    });

    // Get assessment questions for taking the assessment
    getAssessmentQuestions = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const assessmentId = req.params['id'] as string;

        // Check if user has started the assessment
        const result = await this.assessmentResultService.getAssessmentResult(userId, assessmentId);
        if (!result || result.status !== 'in_progress') {
            res.status(400).json({
                success: false,
                message: 'Assessment not started or already completed',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Get assessment details with questions
        const assessmentService = new AssessmentService(
            new AssessmentRepository(),
            new QuestionService(new QuestionRepository()),
            new UserService()
        );

        const assessment = await assessmentService.getAssessmentById(assessmentId);
        if (!assessment) {
            res.status(404).json({
                success: false,
                message: 'Assessment not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        // Get questions without explanations (for assessment taking)
        const questionService = new QuestionService(new QuestionRepository());
        const questions = await questionService.getQuestionsByIds(assessment.questions);

        // Remove correct answer information for assessment
        const assessmentQuestions = questions.map(q => ({
            _id: q._id,
            text: q.text,
            type: q.type,
            options: q.options.map(opt => ({
                text: opt.text,
                // Don't include isCorrect flag
            })),
            marks: q.marks,
        }));

        res.status(200).json({
            success: true,
            message: 'Assessment questions retrieved successfully',
            data: {
                assessment: {
                    _id: assessment._id,
                    title: assessment.title,
                    description: assessment.description,
                    totalMarks: assessment.totalMarks,
                    duration: assessment.duration,
                    startTime: result.startTime,
                },
                questions: assessmentQuestions,
            },
            timestamp: new Date().toISOString(),
        });
    });

    // Resume assessment (if user has an in-progress assessment)
    resumeAssessment = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const assessmentId = req.params['id'] as string;

        const result = await this.assessmentResultService.getAssessmentResult(userId, assessmentId);

        if (!result) {
            res.status(404).json({
                success: false,
                message: 'Assessment result not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        if (result.status === 'completed') {
            res.status(400).json({
                success: false,
                message: 'Assessment already completed',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Assessment resumed successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });

    // Auto-fail expired assessments (admin only)
    autoFailExpiredAssessments = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        await this.assessmentResultService.autoFailExpiredAssessments();

        res.status(200).json({
            success: true,
            message: 'Expired assessments auto-failed successfully',
            timestamp: new Date().toISOString(),
        });
    });

    // Get detailed individual assessment result (owner or admin only)
    getDetailedAssessmentResult = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const resultId = req.params['id'] as string;
        const userId = req.user?._id + "";
        const isAdmin = req.user?.role === UserRole.ADMIN;

        if (!userId) {
            res.status(401).json({
                success: false,
                message: 'Unauthorized: User ID is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const result = await this.assessmentResultService.getDetailedAssessmentResult(resultId, userId, isAdmin);

        if (!result) {
            res.status(404).json({
                success: false,
                message: 'Assessment result not found',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Detailed assessment result retrieved successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });

    // Send individual report via email (admin only)
    sendIndividualReport = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const resultId = req.params['id'] as string;
        const { email } = req.body;

        if (!email) {
            res.status(400).json({
                success: false,
                message: 'Email address is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        await this.assessmentResultService.sendIndividualReport(resultId, email);

        res.status(200).json({
            success: true,
            message: 'Individual report sent successfully',
            timestamp: new Date().toISOString(),
        });
    });


    submitCodingSolution = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        const userId = req.user?._id + "";
        const { assessmentId, testId, sourceCode, languageId, section } = req.body;

        const result = await this.assessmentResultService.submitCodingSolution(userId + "", assessmentId, testId, sourceCode, languageId, section);

        res.status(200).json({
            success: true,
            message: 'Coding solution submitted successfully',
            data: result,
            timestamp: new Date().toISOString(),
        });
    });
} 