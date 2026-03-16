import { UserRepository } from "../../users/repository/UserRepository";
import { AssessmentRepository } from "../../assessment/repository/AssessmentRepository";
import { AssessmentResultRepository } from "../../assessment/repository/AssessmentResultRepository";
import { QuestionRepository } from "../../questions/repository/QuestionRepository";
import { IResponse } from "../../../core/types";

import { IRequest } from "../../../core/types";
import { asyncHandler } from "../../../utils/errors";


export class DashboardController {
    private userRepository: UserRepository;
    private assessmentRepository: AssessmentRepository;
    private assessmentResultRepository: AssessmentResultRepository;
    private questionRepository: QuestionRepository;

    constructor(
        userRepository: UserRepository,
        assessmentRepository: AssessmentRepository,
        assessmentResultRepository: AssessmentResultRepository,
        questionRepository: QuestionRepository
    ) {
        this.userRepository = userRepository;
        this.assessmentRepository = assessmentRepository;
        this.assessmentResultRepository = assessmentResultRepository;
        this.questionRepository = questionRepository;
    }

    // Get dashboard overview statistics (admin only)
    getDashboardStats = asyncHandler(async (req: IRequest, res: IResponse): Promise<void> => {
        try {
            // Get user statistics
            const userStats = await this.userRepository.getUserStats();

            // Get assessment statistics
            const assessmentStats = await this.assessmentRepository.getAssessmentStats();

            // Get question statistics
            const questionStats = await this.questionRepository.getQuestionStats();

            // Get recent activity
            const recentAssessments = await this.assessmentRepository.getRecentAssessments(5);
            const recentResults = await this.assessmentResultRepository.getRecentResults(5);

            const dashboardStats = {
                users: {
                    total: userStats.total,
                    active: userStats.active,
                    inactive: userStats.inactive,
                    verified: userStats.verified,
                    unverified: userStats.unverified,
                    byRole: userStats.byRole
                },
                assessments: {
                    total: assessmentStats.total,
                    active: assessmentStats.active,
                    inactive: assessmentStats.inactive,
                    completed: assessmentStats.completed,
                    upcoming: assessmentStats.upcoming
                },
                questions: {
                    total: questionStats.total,
                    byType: questionStats.byType
                },
                recentActivity: {
                    assessments: recentAssessments,
                    results: recentResults
                }
            };

            res.status(200).json({
                success: true,
                message: 'Dashboard statistics retrieved successfully',
                data: dashboardStats,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve dashboard statistics',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            });
        }
    });
} 