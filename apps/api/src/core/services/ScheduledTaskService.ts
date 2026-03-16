import { AssessmentRepository } from "../../apps/assessment/repository/AssessmentRepository";
import { AssessmentResultRepository } from "../../apps/assessment/repository/AssessmentResultRepository";
import { QuestionRepository } from "../../apps/questions/repository/QuestionRepository";
import { AssessmentResultService } from "../../apps/assessment/services/AssessmentResultService";
import { AssessmentService } from "../../apps/assessment/services/AssessmentService";
import EmailService from "./EmailService";
import { QuestionService } from "../../apps/questions/service/QuestionService";
import { TestExecutionService } from "../../apps/test/services/TestExecutionService";
import { UserService } from "../../apps/users/services/UserService";
import { logger } from "../../utils/logger";

export class ScheduledTaskService {
    private assessmentResultService: AssessmentResultService | null = null;

    constructor() {
        // Lazy initialization to avoid Redis dependency during instantiation
    }

    /**
     * Lazy getter for assessment result service to avoid Redis dependency during instantiation
     */
    private getAssessmentResultService(): AssessmentResultService {
        if (!this.assessmentResultService) {
            this.assessmentResultService = new AssessmentResultService(
                new AssessmentResultRepository(),
                new AssessmentService(
                    new AssessmentRepository(),
                    new QuestionService(new QuestionRepository()),
                    new UserService()
                ),
                new QuestionService(new QuestionRepository()),
                new EmailService(),
                new UserService(),
                new TestExecutionService()
            );
        }
        return this.assessmentResultService;
    }

    /**
     * Auto-fail expired assessments
     * This method should be called periodically (e.g., every minute)
     */
    async autoFailExpiredAssessments(): Promise<void> {
        try {
            logger.info('Starting auto-fail expired assessments task');
            await this.getAssessmentResultService().autoFailExpiredAssessments();
            logger.info('Completed auto-fail expired assessments task');
        } catch (error) {
            logger.error('Error in auto-fail expired assessments task:', error);
        }
    }

    /**
     * Run all scheduled tasks
     */
    async runAllScheduledTasks(): Promise<void> {
        try {
            logger.info('Starting scheduled tasks');

            // Auto-fail expired assessments
            await this.autoFailExpiredAssessments();

            logger.info('Completed all scheduled tasks');
        } catch (error) {
            logger.error('Error running scheduled tasks:', error);
        }
    }
} 