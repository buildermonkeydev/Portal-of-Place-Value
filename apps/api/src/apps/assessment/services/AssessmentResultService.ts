import { TestExecutionService } from '../../test/services/TestExecutionService';
import { AssessmentResultRepository } from '../repository/AssessmentResultRepository';
import { AssessmentService } from './AssessmentService';
import { QuestionService } from '../../questions/service/QuestionService';
import { UserService } from '../../users/services/UserService';
import { logger } from '../../../utils/logger';
import { AssessmentType } from '../interface/Assessment';
import { IQuestionDocument } from '../../questions/interface/Question';
import { SubmitAssessmentDto, IQuestionResponseWithQuestion, IUserDocument } from '../../../core/types';
import { QuestionResponseDto } from '../../questions/dto/question.dto';
import EmailService from '../../../core/services/EmailService';
import { AppError, ERROR_CODES } from '../../../utils/errors';
import { redisService } from '../../../core/infrastructure/Redis';




export interface AssessmentResultResponse {
    _id: string;
    assessmentId: string;
    userId: string;
    totalMarksObtained: number;
    totalMarksPossible: number;
    percentage: number;
    status: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    sectionScores: any[];
    createdAt: Date;
}

// Minimal response for submit - excludes score information
export interface AssessmentSubmitResponse {
    _id: string;
    assessmentId: string;
    userId: string;
    status: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    createdAt: Date;
}

export class AssessmentResultService {
    private assessmentResultRepository: AssessmentResultRepository;
    private assessmentService: AssessmentService;
    private questionService: QuestionService;
    private testExecutionService: TestExecutionService;

    private emailService: EmailService;
    private userService: UserService;

    constructor(
        assessmentResultRepository: AssessmentResultRepository,
        assessmentService: AssessmentService,
        questionService: QuestionService,
        emailService: EmailService,
        userService: UserService,
        testExecutionService: TestExecutionService
    ) {
        this.assessmentResultRepository = assessmentResultRepository;
        this.assessmentService = assessmentService;
        this.questionService = questionService;
        this.emailService = emailService;
        this.userService = userService;
        this.testExecutionService = testExecutionService;
    }




    async startAssessment(userId: string, assessmentId: string): Promise<AssessmentResultResponse> {
        // Use distributed lock to prevent race conditions
        const lockKey = `assessment:start:${userId}:${assessmentId}`;

        return await redisService.withLock(lockKey, async () => {
            try {
                // Check if assessment exists and is active
                const assessment = await this.assessmentService.getAssessmentById(assessmentId);
                if (!assessment) {
                    throw new Error('Assessment not found');
                }

                if (assessment.status !== 'active') {
                    throw new Error('Assessment is not active');
                }

                const assignedUsers = await this.assessmentService.getAssignedUsers(assessmentId);

                if (!assignedUsers.includes(userId)) {
                    throw new Error('User is not assigned to this assessment');
                }

                const canRetake = await this.canUserRetakeAssessment(userId, assessmentId);
                if (!canRetake) {
                    throw new Error('Assessment already completed and cannot be retaken');
                }

                const existingResult = await this.assessmentResultRepository.findByUserAndAssessment(userId, assessmentId);
                if (existingResult) {
                    if (existingResult.status === 'completed') {
                        throw new Error('Assessment already completed');
                    }

                    if (existingResult.status === 'in_progress' || existingResult.status === 'paused') {
                        // Check if assessment time has expired
                        const assessmentDuration = assessment.duration * 60; // Convert to seconds
                        const timeElapsed = Math.floor((new Date().getTime() - existingResult.startTime.getTime()) / 1000);
                        const timeRemaining = assessmentDuration - timeElapsed;

                        if (timeRemaining <= 0) {
                            // Time expired, mark as failed
                            await this.assessmentResultRepository.update(existingResult._id + "", {
                                status: 'failed',
                                endTime: new Date(),
                                duration: assessmentDuration,
                                timeRemaining: 0
                            });

                            throw new Error('Assessment time has expired. You cannot continue.');
                        }

                        // User can continue the assessment
                        if (existingResult.status === 'paused') {
                            // Resume the assessment
                            await this.assessmentResultRepository.update(existingResult._id + "", {
                                status: 'in_progress',
                                resumeTime: new Date(),
                                timeRemaining: timeRemaining
                            });

                            logger.info(`Assessment resumed by user ${userId} for assessment ${assessmentId}`);
                        }

                        // Ensure responses array is properly initialized (for backward compatibility)
                        if (!existingResult.responses || existingResult.responses.length === 0) {
                            const questions = await this.questionService.getQuestionsByIds(assessment.questions);
                            const defaultResponses = questions.map(question => ({
                                questionId: question._id,
                                section: question.section || '',
                                selectedOptions: [],
                                isCorrect: false,
                                marksObtained: 0,
                                timeSpent: 0,
                            }));

                            await this.assessmentResultRepository.update(existingResult._id + "", {
                                responses: defaultResponses
                            });

                            logger.info(`Initialized responses array for existing assessment result ${existingResult._id}`);
                        }

                        // Return existing result with updated time remaining
                        const updatedResult = await this.assessmentResultRepository.findById(existingResult._id + "");
                        return this.toAssessmentResultResponse(updatedResult!);
                    }
                }

                const user = await this.userService.getUserById(userId);
                if (!user) {
                    throw new Error('User not found');
                }

                const questions = await this.questionService.getQuestionsByIds(assessment.questions);

                const codingQuestion = assessment.type != AssessmentType.MCQ ? await assessment.codingQuestions.map((cq: any) => ({
                    testId: cq._id,
                    section: cq.section,
                    selectedOptions: [],
                    isCorrect: false,
                    marksObtained: 0,
                    timeSpent: 0,
                    score: cq.score
                })) : []

                const defaultResponses = questions.map(question => ({
                    questionId: question._id,
                    section: question.section || '', // Include section from question
                    selectedOptions: [], // Default: no options selected
                    isCorrect: false, // Default: not correct (no answer selected yet)
                    marksObtained: 0, // Default: no marks obtained yet
                    timeSpent: 0, // Default: no e yet
                }));

                // Create new assessment result with user info
                try {
                    const newResult = await this.assessmentResultRepository.create({
                        assessmentId,
                        userId,
                        userInfo: {
                            collegeName: user.college?.name || 'N/A',
                            collegeId: user.college?._id?.toString() || '',
                            branchName: user.branch?.name || 'N/A',
                            branchId: user.branch?._id?.toString() || '',
                            collegeYear: user.collegeYear,
                        },
                        responses: defaultResponses,
                        codingQuestions: codingQuestion,
                        totalMarksObtained: 0,
                        totalMarksPossible: questions.reduce((sum, q) => sum + (q.marks || 0), 0) + (assessment.codingQuestions || []).reduce((sum: any, q: any) => sum + (q.score || 0), 0),
                        percentage: 0,
                        startTime: new Date(),
                        duration: 0,
                        status: 'in_progress',
                        timeRemaining: assessment.duration * 60, // Convert minutes to seconds
                        type: assessment.type || 'mcq', // Copy type from assessment
                    });

                    logger.info(`Assessment started by user ${userId} for assessment ${assessmentId}`);
                    return this.toAssessmentResultResponse(newResult);
                } catch (createError: any) {
                    // Handle duplicate key error (race condition where another request created the result)
                    if (createError.code === 11000 || createError.name === 'MongoServerError') {
                        logger.warn(`Duplicate assessment result detected for user ${userId} and assessment ${assessmentId}, fetching existing result`);

                        // Fetch and return the existing result that was just created by another request
                        const existingResult = await this.assessmentResultRepository.findByUserAndAssessment(userId, assessmentId);
                        if (existingResult) {
                            return this.toAssessmentResultResponse(existingResult);
                        }
                    }

                    // If it's not a duplicate error or we couldn't find the existing result, rethrow
                    throw createError;
                }
            } catch (error) {
                logger.error('Error starting assessment', `userId: ${userId}, assessmentId: ${assessmentId}`, error);
                throw error;
            }
        }, 10); // 10 second lock timeout
    }

    async pauseAssessment(userId: string, assessmentId: string): Promise<AssessmentResultResponse> {
        try {
            const existingResult = await this.assessmentResultRepository.findByUserAndAssessment(userId, assessmentId);
            if (!existingResult) {
                throw new Error('Assessment not found');
            }

            if (existingResult.status !== 'in_progress') {
                throw new Error('Assessment is not in progress');
            }

            // Calculate time remaining using Indian timezone
            const assessment = await this.assessmentService.getAssessmentById(assessmentId);
            if (!assessment) {
                throw new Error('Assessment not found');
            }

            const indianTimezone = 'Asia/Kolkata';
            const currentTime = new Date(new Date().toLocaleString("en-US", { timeZone: indianTimezone }));
            const startTime = new Date(existingResult.startTime.toLocaleString("en-US", { timeZone: indianTimezone }));

            const assessmentDurationInMinutes = assessment.duration; // Keep in minutes
            const timeElapsedInSeconds = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
            const timeElapsedInMinutes = Math.floor(timeElapsedInSeconds / 60);
            const timeRemaining = Math.max(0, assessmentDurationInMinutes - timeElapsedInMinutes);

            // Update the assessment result to paused status
            const updatedResult = await this.assessmentResultRepository.update(existingResult._id + "", {
                status: 'paused',
                timeRemaining: timeRemaining
            });

            if (updatedResult) {
                logger.info(`Assessment paused by user ${userId} for assessment ${assessmentId}`);
                return this.toAssessmentResultResponse(updatedResult);
            }

            throw new Error('Failed to pause assessment');
        } catch (error) {
            logger.error('Error pausing assessment', `userId: ${userId}, assessmentId: ${assessmentId}`, error);
            throw error;
        }
    }


    // async submitAssessment(userId: string, submitData: SubmitAssessmentDto): Promise<AssessmentResultResponse> {
    //     try {
    //         // Check if assessment result exists and is in progress
    //         const existingResult = await this.assessmentResultRepository.findByUserAndAssessmentWithIsCorrect(userId, submitData.assessmentId);
    //         if (!existingResult) {
    //             throw new Error('Assessment not started');
    //         }
    //         console.log("existingResult", existingResult);

    //         if (existingResult.status !== 'in_progress') {
    //             throw new Error('Assessment is not in progress');
    //         }

    //         // Get assessment details
    //         const assessment = await this.assessmentService.getAssessmentById(existingResult.assessmentId._id + "");
    //         if (!assessment) {
    //             throw new Error('Assessment not found');
    //         }

    //         // Check if time has expired
    //         const assessmentDuration = assessment.duration * 60; // Convert to seconds
    //         const timeElapsed = Math.floor((new Date().getTime() - existingResult.startTime.getTime()) / 1000);
    //         const timeRemaining = Math.max(0, assessmentDuration - timeElapsed + 5);

    //         if (timeRemaining <= 0) {
    //             // Time expired, mark as failed
    //             await this.assessmentResultRepository.update(existingResult._id + "", {
    //                 status: 'failed',
    //                 endTime: new Date(),
    //                 duration: assessmentDuration,
    //                 timeRemaining: 0
    //             });

    //             throw new Error('Assessment time has expired. Your submission will be marked as failed.');
    //         }

    //         // Get questions for grading
    //         const questions = await this.questionService.getQuestionsByIds(assessment.questions);
    //         if (questions.length === 0) {
    //             throw new Error('No questions found for assessment');
    //         }

    //         // Grade the assessment
    //         const gradedResult = await this.gradeAssessment(existingResult.responses, questions);
    //         console.log("gradedResult", gradedResult);

    //         // Calculate time taken
    //         const endTime = new Date();
    //         const timeTaken = Math.floor((endTime.getTime() - existingResult.startTime.getTime()) / 1000);



    //         // Update the assessment result
    //         const updatedResult = await this.assessmentResultRepository.update(existingResult._id + "", {
    //             responses: gradedResult.responses,
    //             totalMarksObtained: gradedResult.totalMarksObtained,
    //             percentage: gradedResult.percentage,
    //             endTime: endTime,
    //             duration: timeTaken,
    //             status: 'completed',
    //             timeRemaining: 0
    //         });

    //         if (updatedResult) {
    //             // Send result email to user
    //             await this.sendResultEmail(
    //                 userId,
    //                 assessment.title,
    //                 gradedResult.totalMarksObtained,
    //                 assessment.totalMarks,
    //                 gradedResult.percentage,
    //                 timeTaken
    //             );

    //             logger.info(`Assessment submitted by user ${userId} for assessment ${existingResult.assessmentId}`);
    //         }

    //         return updatedResult ? this.toAssessmentResultResponse(updatedResult) : this.toAssessmentResultResponse(existingResult);
    //     } catch (error) {
    //         logger.error(`Error submitting assessment for user ${userId}:`, error);
    //         throw error;
    //     }
    // }



    async submitAssessment(userId: string, submitData: SubmitAssessmentDto): Promise<AssessmentSubmitResponse> {
        try {
            // Check if assessment result exists and is in progress
            const existingResult = await this.assessmentResultRepository.findByUserAndAssessmentWithIsCorrect(userId, submitData.assessmentId);
            if (!existingResult) {
                throw new Error('Assessment not started');
            }
            console.log("existingResult", existingResult);

            if (existingResult.status !== 'in_progress') {
                throw new Error('Assessment is not in progress');
            }

            // Get assessment details
            const assessment = await this.assessmentService.getAssessmentById(existingResult.assessmentId._id + "");
            if (!assessment) {
                throw new Error('Assessment not found');
            }

            const user = await this.userService.getUserById(userId);
            const assessmentIdForEmail =
                (assessment._id as string) ||
                ((existingResult.assessmentId as any)?._id?.toString()) ||
                submitData.assessmentId;

            // Check if time has expired
            const assessmentDuration = (assessment.duration * 60) + 120;
            const timeElapsed = Math.floor((new Date().getTime() - existingResult.startTime.getTime()) / 1000);
            const timeRemaining = Math.max(0, assessmentDuration - timeElapsed + 60);

            if (timeRemaining <= 0) {
                await this.assessmentResultRepository.update(existingResult._id + "", {
                    status: 'failed',
                    endTime: new Date(),
                    duration: assessmentDuration,
                    timeRemaining: 0
                });

                throw new Error('Assessment time has expired. Your submission will be marked as failed.');
            }

            const questions = await this.questionService.getQuestionsByIds(assessment.questions);

            // Check if there are any questions (MCQ or Coding)
            // Allow empty questions array if there are coding questions
            const hasCodingQuestions = assessment.codingQuestions && assessment.codingQuestions.length > 0;

            if (questions.length === 0 && !hasCodingQuestions) {
                throw new Error('No questions found for assessment');
            }

            // Merge submitData.responses with existingResult.responses to ensure all answers are captured
            // This fixes the issue where answers might not have been saved via saveAnswer
            // We use a Map to deduplicate responses based on questionId, handling both populated and unpopulated IDs
            const responseMap = new Map();
            const existingResponses = existingResult.responses || [];

            // 1. Add existing responses to Map
            if (existingResponses.length > 0) {
                existingResponses.forEach((r: any) => {
                    // Handle both populated (Object with _id) and unpopulated (ObjectId/String) questionIds
                    // If questionId is populated, toString() returns '[object Object]', so we must check _id first
                    const qId = r.questionId?._id?.toString() || r.questionId?.toString();
                    if (qId && qId !== '[object Object]') {
                        responseMap.set(qId, r);
                    }
                });
            }

            // 2. Merge submitted responses
            if (submitData.responses && Array.isArray(submitData.responses) && submitData.responses.length > 0) {
                submitData.responses.forEach((submittedResponse: any) => {
                    const qId = submittedResponse.questionId?.toString() || submittedResponse.questionId;
                    if (qId) {
                        const existingResponse = responseMap.get(qId);
                        if (existingResponse) {
                            // Update existing response with submitted data
                            existingResponse.selectedOptions = submittedResponse.selectedOptions || existingResponse.selectedOptions || [];
                            existingResponse.section = submittedResponse.section || existingResponse.section || '';
                            existingResponse.timeSpent = submittedResponse.timeSpent || existingResponse.timeSpent || 0;
                        } else {
                            // Find the question object to preserve the correct questionId format if possible
                            const question = questions.find(q => (q._id?.toString() || q._id) === qId);
                            // Add new response if it doesn't exist
                            responseMap.set(qId, {
                                questionId: question ? question._id : qId, // Use question._id object if available, otherwise use string
                                selectedOptions: submittedResponse.selectedOptions || [],
                                section: submittedResponse.section || '',
                                isCorrect: false,
                                marksObtained: 0,
                                timeSpent: submittedResponse.timeSpent || 0
                            });
                        }
                    }
                });

                logger.info(`Merged ${submitData.responses.length} submitted responses with existing responses for assessment ${submitData.assessmentId}`);
            }

            const finalResponses = Array.from(responseMap.values());

            let gradedResult;
            if (questions.length > 0) {
                gradedResult = await this.gradeAssessment(finalResponses, questions);
            } else {
                // If no MCQ questions, return default graded result
                gradedResult = {
                    responses: finalResponses,
                    sectionScores: [],
                    totalMarksObtained: 0,
                    totalMarksPossible: 0,
                    percentage: 0
                };
            }
            console.log("gradedResult", gradedResult);

            const correctAnswers = gradedResult.responses.filter((response: any) => response.isCorrect).length;
            const attemptedResponses = gradedResult.responses.filter((response: any) => (response.selectedOptions || []).length > 0);
            const incorrectAnswers = attemptedResponses.filter((response: any) => !response.isCorrect).length;
            const unattemptedQuestions = gradedResult.responses.length - attemptedResponses.length;

            let updatedCodingQuestions = existingResult.codingQuestions || [];
            if ((assessment.type === 'mixed' || assessment.type === 'coding') &&
                existingResult.codingQuestions && existingResult.codingQuestions.length > 0) {
                updatedCodingQuestions = await this.updateCodingQuestionScores(
                    existingResult.codingQuestions,
                    assessment.codingQuestions || []
                );
                console.log("updatedCodingQuestions", updatedCodingQuestions);
            }

            const endTime = new Date();
            const timeTaken = Math.floor((endTime.getTime() - existingResult.startTime.getTime()) / 1000);

            const codingMarksObtained = updatedCodingQuestions.reduce((sum: number, cq: any) => sum + (cq.marksObtained || 0), 0);
            const totalMarksObtained = gradedResult.totalMarksObtained + codingMarksObtained;

            const codingTotalMarks = (assessment.codingQuestions || []).reduce((sum: number, cq: any) => sum + (cq.score || 0), 0);
            const totalMarksPossible = gradedResult.totalMarksPossible + codingTotalMarks;

            let percentage = totalMarksPossible > 0 ? (totalMarksObtained / totalMarksPossible) * 100 : 0;

            if (percentage > 100) {
                logger.warn(`Calculated percentage ${percentage} exceeds 100. Clamping to 100.`, {
                    totalMarksObtained,
                    totalMarksPossible,
                    assessmentId: submitData.assessmentId,
                    userId
                });
                percentage = 100;
            }

            // Determine pass/fail based on passPercentage from assessment
            const passPercentage = assessment.passPercentage ?? 60; // Default to 60 if not set
            const isPassed = percentage >= passPercentage;

            const updatedResult = await this.assessmentResultRepository.update(existingResult._id + "", {
                responses: gradedResult.responses,
                codingQuestions: updatedCodingQuestions,
                sectionScores: gradedResult.sectionScores,
                totalMarksObtained,
                totalMarksPossible,
                percentage,
                endTime: endTime,
                duration: timeTaken,
                status: isPassed ? 'completed' : 'failed',
                timeRemaining: 0
            });

            // Email sending disabled - students should not receive emails after test submission
            // if (updatedResult && user) {
            //     await this.sendResultEmail({
            //         user,
            //         assessmentId: assessmentIdForEmail,
            //         assessmentTitle: assessment.title,
            //         assessmentType: assessment.type,
            //         assessmentDurationMinutes: assessment.duration,
            //         resultId: updatedResult._id?.toString() || existingResult._id?.toString(),
            //         totalMarksObtained,
            //         totalMarksPossible,
            //         percentage,
            //         timeTakenSeconds: timeTaken,
            //         isPassed,
            //         passPercentage,
            //         submittedAt: endTime,
            //         correctAnswers,
            //         incorrectAnswers,
            //         unattemptedQuestions
            //     });
            // }

            if (updatedResult) {
                logger.info(`Assessment submitted by user ${userId} for assessment ${existingResult.assessmentId}`);
            }

            // Return minimal response without scores - frontend doesn't use score data
            const result = updatedResult || existingResult;
            return {
                _id: result._id?.toString() || result._id,
                assessmentId: typeof result.assessmentId === 'object' && (result.assessmentId as any)?._id
                    ? (result.assessmentId as any)._id.toString()
                    : result.assessmentId?.toString() || result.assessmentId,
                userId: typeof result.userId === 'object' && (result.userId as any)?._id
                    ? (result.userId as any)._id.toString()
                    : result.userId?.toString() || result.userId,
                status: result.status,
                startTime: result.startTime,
                endTime: result.endTime,
                duration: result.duration,
                createdAt: result.createdAt,
            };
        } catch (error) {
            logger.error('Error submitting assessment', `userId: ${userId}, assessmentId: ${submitData.assessmentId}`, error);
            throw error;
        }
    }

    private async updateCodingQuestionScores(
        userCodingQuestions: any[],
        assessmentCodingQuestions: any[]
    ): Promise<any[]> {
        return userCodingQuestions.map(userCodingQ => {
            console.log("assessmentCodingQuestions", assessmentCodingQuestions);
            console.log("userCodingQ", userCodingQ);


            const assessmentCodingQ = assessmentCodingQuestions.find(
                acq => acq._id.toString() === userCodingQ.testId._id.toString()
            );
            console.log("assessmentCodingQ", assessmentCodingQ);

            if (assessmentCodingQ) {
                const marksObtained = userCodingQ.isCorrect ? assessmentCodingQ.score : 0;
                console.log("marksObtained", marksObtained);

                return {
                    sourceCode: userCodingQ.sourceCode,
                    languageId: userCodingQ.languageId,
                    timeSpent: userCodingQ.timeSpent,
                    isCorrect: userCodingQ.isCorrect,
                    testId: userCodingQ.testId,
                    marksObtained,
                    score: assessmentCodingQ.score

                };
            }

            return userCodingQ;
        });
    }

    async calculateScore(userId: string, assessmentId: string): Promise<any> {
        try {
            const existingResult = await this.assessmentResultRepository.findByUserAndAssessment(userId, assessmentId);

            if (!existingResult) {
                throw new Error('Assessment not found');
            }

            const data = await Promise.all(existingResult.responses.map(async (response: any) => {
                console.log("response", response?.questionId, response);
                const question = response?.questionId;

                let isCorrect = false;

                if (question?.type === 'multiple_choice') {
                    const correctOptions = question.options.filter((option: any) => option.isCorrect);
                    const selectedOptions = response.selectedOptions.map((id: string) => id.toString());
                    const correctOptionIds = correctOptions.map((option: any) => option._id.toString());

                    const allCorrectSelected = correctOptions.every((option: any) =>
                        selectedOptions.includes(option._id.toString())
                    );

                    const noIncorrectSelected = question.options
                        .filter((option: any) => !option.isCorrect)
                        .every((option: any) => !selectedOptions.includes(option._id.toString()));

                    isCorrect = allCorrectSelected && noIncorrectSelected;
                } else {
                    const selectedOption = question.options.find((option: any) =>
                        option._id.toString() === response.selectedOptions[0]?.toString()
                    );
                    isCorrect = selectedOption?.isCorrect || false;
                }

                console.log("isCorrect", isCorrect);

                return {
                    ...response,
                    isCorrect
                }
            }));

            await this.assessmentResultRepository.update(existingResult._id + "", {
                responses: data
            });

        }
        catch (error) {
            logger.error('Error calculating score', `userId: ${userId}, assessmentId: ${assessmentId}`, error);
            throw error;
        }
    }

    async getCurrentAssessmentState(userId: string, assessmentId: string): Promise<any> {
        try {
            const existingResult = await this.assessmentResultRepository.findByUserAndAssessment(userId, assessmentId);
            if (!existingResult) {
                return null;
            }

            const assessment = await this.assessmentService.getAssessmentById(assessmentId);
            if (!assessment) {
                throw new Error('Assessment not found');
            }

            const assessmentDuration = assessment.duration * 60; // Convert to seconds
            const timeElapsed = Math.floor((new Date().getTime() - existingResult.startTime.getTime()) / 1000);
            const timeRemaining = Math.max(0, assessmentDuration - timeElapsed);

            if (timeRemaining <= 0 && existingResult.status === 'in_progress') {
                await this.assessmentResultRepository.update(existingResult._id + "", {
                    status: 'failed',
                    endTime: new Date(),
                    duration: assessmentDuration,
                    timeRemaining: 0
                });

                existingResult.status = 'failed';
                existingResult.timeRemaining = 0;
            }

            if (!existingResult.responses || existingResult.responses.length === 0) {
                const questions = await this.questionService.getQuestionsByIds(assessment.questions);
                const defaultResponses = questions.map(question => ({
                    questionId: question._id,
                    selectedOptions: [],
                    isCorrect: false,
                    marksObtained: 0,
                    timeSpent: 0,
                }));

                await this.assessmentResultRepository.update(existingResult._id + "", {
                    responses: defaultResponses
                });

                existingResult.responses = defaultResponses;
                logger.info(`Initialized responses array for assessment result ${existingResult._id} in getCurrentAssessmentState`);
            }

            return {
                ...existingResult.toObject(),
                timeRemaining,
                canContinue: existingResult.status === 'in_progress' || existingResult.status === 'paused',
                isExpired: timeRemaining <= 0
            };
        } catch (error) {
            logger.error('Error getting current assessment state', `userId: ${userId}, assessmentId: ${assessmentId}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }


    async getResultByAssessmentId(userId: string, assessmentId: string): Promise<any> {
        try {
            // await this.calculateScore(userId, assessmentId);

            const existingResult = await this.assessmentResultRepository.findByUserAndAssessment(userId, assessmentId);
            if (!existingResult) {
                throw new Error('Assessment not found');
            }

            return existingResult
        } catch (error) {
            logger.error('Error getting assessment result', `userId: ${userId}, assessmentId: ${assessmentId}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async saveAnswer(userId: string, assessmentId: string, questionId: string, selectedOptions: string[], section?: string): Promise<AssessmentResultResponse> {
        try {
            console.log("userId", userId, assessmentId);
            const existingResult = await this.assessmentResultRepository.findByUserAndAssessmentNormal(userId, assessmentId);

            console.log("existingResult", existingResult);
            if (!existingResult) {
                throw new Error('Assessment not started');
            }
            console.log("status", existingResult.status);

            if (existingResult.status !== 'in_progress') {
                throw new Error('Assessment is not in progress');
            }

            const assessment = await this.assessmentService.getAssessmentById(existingResult.assessmentId);
            if (!assessment) {
                throw new Error('Assessment not found');
            }

            const assessmentDuration = (assessment.duration * 60) + 120;

            const indianTimezone = 'Asia/Kolkata';
            const assessmentEndTime = new Date(assessment.endDate!.toLocaleString("en-US", { timeZone: indianTimezone }));
            const currentTime = new Date(new Date().toLocaleString("en-US", { timeZone: indianTimezone }));
            const startTime = new Date(existingResult.startTime.toLocaleString("en-US", { timeZone: indianTimezone }));

            if (currentTime >= assessmentEndTime) {
                const actualDurationUsed = Math.floor((assessmentEndTime.getTime() - startTime.getTime()) / 1000);

                await this.assessmentResultRepository.update(existingResult._id + "", {
                    status: "completed",
                    endTime: assessmentEndTime,
                    duration: actualDurationUsed,
                    timeRemaining: 0
                });

                throw new Error('Assessment end time has passed. You cannot continue.');
            }

            const timeElapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
            const timeRemaining = Math.max(0, assessmentDuration - timeElapsed);

            if (!existingResult.responses || existingResult.responses.length === 0) {
                const questions = await this.questionService.getQuestionsByIds(assessment.questions);
                const defaultResponses = questions.map(question => ({
                    questionId: question._id,
                    section: question.section || '',
                    selectedOptions: [],
                    isCorrect: false,
                    marksObtained: 0,
                    timeSpent: 0,
                }));

                // Update the database with initialized responses
                await this.assessmentResultRepository.update(existingResult._id + "", {
                    responses: defaultResponses
                });

                existingResult.responses = defaultResponses;
                logger.info(`Initialized responses array for assessment result ${existingResult._id} in saveAnswer`);
            }

            const responses = existingResult.responses || [];

            const existingResponseIndex = responses.findIndex(
                (r: any) => r.questionId.toString() === questionId
            );

            if (existingResponseIndex >= 0 && responses[existingResponseIndex]) {
                responses[existingResponseIndex].selectedOptions = selectedOptions;
                responses[existingResponseIndex].section = section || responses[existingResponseIndex].section || '';
            } else {
                logger.warn(`Question ${questionId} not found in initialized responses for assessment ${assessmentId}`);
                responses.push({
                    questionId: questionId,
                    selectedOptions: selectedOptions,
                    section: section || '',
                    isCorrect: false,
                    marksObtained: 0,
                    timeSpent: 0 // Will be calculated on final submit
                });
            }

            existingResult.responses = responses;

            const updatedResult = await this.assessmentResultRepository.update(existingResult._id + "", {
                responses: existingResult.responses,
                timeRemaining: timeRemaining
            });

            if (updatedResult) {
                logger.info(`Answer saved for user ${userId} for question ${questionId} in assessment ${assessmentId}`);
                return this.toAssessmentResultResponse(updatedResult);
            }

            throw new Error('Failed to save answer');
        } catch (error) {
            logger.error('Error saving answer', `userId: ${userId}, assessmentId: ${assessmentId}, questionId: ${questionId}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async clearAnswer(userId: string, assessmentId: string): Promise<AssessmentResultResponse> {
        try {
            const existingResult = await this.assessmentResultRepository.findByUserAndAssessmentNormal(userId, assessmentId);

            console.log("existingResult", existingResult);
            if (!existingResult) {
                throw new Error('Assessment not started');
            }
            console.log("status", existingResult.status);

            if (existingResult.status !== 'in_progress') {
                throw new Error('Assessment is not in progress');
            }

            const assessment = await this.assessmentService.getAssessmentById(existingResult.assessmentId);
            if (!assessment) {
                throw new Error('Assessment not found');
            }

            const assessmentDuration = assessment.duration * 60; // Convert to seconds
            const timeElapsed = Math.floor((new Date().getTime() - existingResult.startTime.getTime()) / 1000);
            const timeRemaining = Math.max(0, assessmentDuration - timeElapsed);

            if (timeRemaining <= 0) {
                await this.assessmentResultRepository.update(existingResult._id + "", {
                    status: 'failed',
                    endTime: new Date(),
                    duration: assessmentDuration,
                    timeRemaining: 0
                });

                throw new Error('Assessment time has expired. You cannot continue.');
            }


            const questions = await this.questionService.getQuestionsByIds(assessment.questions);
            const defaultResponses = questions.map(question => ({
                questionId: question._id,
                selectedOptions: [],

                isCorrect: false,
                marksObtained: 0,
                timeSpent: 0,
            }));

            await this.assessmentResultRepository.update(existingResult._id + "", {
                responses: defaultResponses
            });

            existingResult.responses = defaultResponses;
            logger.info(`Initialized responses array for assessment result ${existingResult._id} in saveAnswer`);



            const updatedResult = await this.assessmentResultRepository.update(existingResult._id + "", {
                responses: existingResult.responses,
                timeRemaining: timeRemaining
            });

            if (updatedResult) {
                logger.info(`Answer cleared for user ${userId} for assessment ${assessmentId}`);
                return this.toAssessmentResultResponse(updatedResult);
            }

            throw new Error('Failed to save answer');
        } catch (error) {
            logger.error('Error clearing answer', `userId: ${userId}, assessmentId: ${assessmentId}`, error);
            throw error;
        }
    }

    async getAssessmentResult(userId: string, resultId: string, isAdmin: boolean = false): Promise<any | null> {
        try {

            // await this.calculateScore(userId, resultId);

            const result = await this.assessmentResultRepository.findById(resultId) as unknown as any;
            if (!result) {
                return null;
            }

            const resultOwnerId = (result.userId?._id || result.userId || '').toString();
            if (!isAdmin && (!resultOwnerId || resultOwnerId !== userId.toString())) {
                throw new AppError(
                    'You are not authorized to view this assessment result.',
                    403,
                    ERROR_CODES.INSUFFICIENT_PERMISSIONS,
                    true
                );
            }

            const assessment = await this.assessmentService.getAssessmentById(result.assessmentId._id + "");

            if (!isAdmin && assessment && assessment.showResultsToUsers === false) {
                throw new AppError(
                    'Assessment results are not available for this assessment.',
                    403,
                    ERROR_CODES.RESULTS_NOT_AVAILABLE,
                    true
                );
            }

            return {
                ...result,
                assessmentId: assessment
            };
        } catch (error) {
            logger.error('Error getting assessment result', `userId: ${userId}, resultId: ${resultId}`, error);
            throw error;
        }
    }
    async submitCodingSolution(userId: string, assessmentId: string, testId: string, sourceCode: string, languageId: number, section: string): Promise<any> {
        try {
            console.log("UserId", userId);
            console.log("AssessmentId", assessmentId);
            const result = await this.assessmentResultRepository.findByUserAndAssessment(userId, assessmentId);
            if (!result) {
                throw new Error('Assessment not found');
            }

            const submissionData = {
                sourceCode,
                languageId,
                section
            };

            const submission = await this.testExecutionService.executeTestSubmissionWithSubmissionData(testId, submissionData.sourceCode, submissionData.languageId, userId);

            const updatedCodingQuestions = [
                ...result.codingQuestions.filter((q: any) => q.testId + "" !== testId),
                {
                    testId,
                    section,
                    sourceCode,
                    languageId,
                    isCorrect: submission.passedTestCases === submission.totalTestCases,
                    timeSpent: submission.executionTime
                }
            ];

            const updatedAssessmentResult = await this.assessmentResultRepository.update(result._id + "", {
                codingQuestions: updatedCodingQuestions
            });
            return submission;

        } catch (error) {
            logger.error('Error submitting coding solution', `userId: ${userId}, assessmentId: ${assessmentId}, testId: ${testId}, section: ${section}`, error);
            throw error;
        }
    }
    async getOnGoingAssessmentResult(userId: string, resultId: string): Promise<any | null> {
        try {
            const result = await this.assessmentResultRepository.findByIdWithoutIsCorrect(resultId) as unknown as any;
            if (!result) {
                return null;
            }

            // Ensure both userId and result.userId are strings and compare their values
            const resultUserId = (result?.userId?._id || result?.userId || "").toString();
            if (userId.toString() !== resultUserId) {
                throw new Error('You are not authorized to view this assessment result');
            }

            const updatedData = result.responses.map((que: any) => {
                console.log("QUES", que)
                const { isCorrect, ...rest } = que;
                const options = que.questionId?.options?.map((opt: any) => {
                    const { isCorrect, ...rest } = opt;
                    return {
                        ...rest,
                    }
                })
                return {
                    options,
                    ...rest,

                }
            })

            return {
                ...result,
                responses: updatedData,
            };
        } catch (error) {
            logger.error('Error getting assessment result', `userId: ${userId}, resultId: ${resultId}`, error);
            throw error;
        }
    }

    async getUserResults(userId: string): Promise<AssessmentResultResponse[]> {
        try {
            const results = await this.assessmentResultRepository.findByUser(userId);

            const visibleResults = results.filter((result) => {
                // Filter out results with null assessmentId (orphaned results from deleted assessments)
                if (!result.assessmentId) {
                    return false;
                }

                const assessment: any = result.assessmentId;
                if (assessment && typeof assessment === 'object' && 'showResultsToUsers' in assessment) {
                    return assessment.showResultsToUsers !== false;
                }
                return true;
            });

            return visibleResults.map((result) => this.toAssessmentResultResponse(result));
        } catch (error) {
            logger.error('Error getting user results', `userId: ${userId}`, error);
            throw error;
        }
    }

    /**
     * Get assessments that a user has completed (has results for) - Admin version
     * Returns unique assessments with their details, including those hidden from users
     * Admin can see all assessments regardless of showResultsToUsers setting
     */
    async getAssessmentsForUserReports(userId: string): Promise<any[]> {
        try {
            const results = await this.assessmentResultRepository.findByUser(userId);

            // Filter out results with null assessmentId and get unique assessments
            // Admin can see all assessments, even if showResultsToUsers is false
            const assessmentMap = new Map<string, any>();

            results.forEach((result: any) => {
                if (!result.assessmentId) {
                    return; // Skip orphaned results
                }

                const assessment: any = result.assessmentId;

                // Only include if assessment is populated as an object (exists and not deleted)
                // If assessment is a string ID, it means the assessment was deleted, so skip it
                if (assessment && typeof assessment === 'object' && assessment._id) {
                    const assessmentId = assessment._id.toString();

                    // Only add if not already in map (to get unique assessments)
                    // Admin can see all assessments regardless of showResultsToUsers, but not deleted ones
                    if (!assessmentMap.has(assessmentId)) {
                        assessmentMap.set(assessmentId, {
                            _id: assessmentId,
                            title: assessment.title,
                            description: assessment.description,
                            showResultsToUsers: assessment.showResultsToUsers,
                        });
                    }
                }
                // If assessment is a string (deleted), skip it - don't include deleted assessments
            });

            return Array.from(assessmentMap.values());
        } catch (error) {
            logger.error('Error getting assessments for user reports', `userId: ${userId}`, error);
            throw error;
        }
    }

    /**
     * Get user results for reports - returns results with populated assessmentId objects
     * This is specifically for the reports page which needs assessment details
     */
    async getUserResultsForReports(userId: string): Promise<any[]> {
        try {
            const results = await this.assessmentResultRepository.findByUser(userId);

            const visibleResults = results.filter((result: any) => {
                // Filter out results with null assessmentId (orphaned results from deleted assessments)
                if (!result.assessmentId) {
                    return false;
                }

                const assessment: any = result.assessmentId;
                if (assessment && typeof assessment === 'object' && 'showResultsToUsers' in assessment) {
                    return assessment.showResultsToUsers !== false;
                }
                return true;
            });

            // Return results with populated assessmentId objects (not converted to string)
            return visibleResults.map((result: any) => {
                const assessment: any = result.assessmentId;
                const userIdObj: any = result.userId;

                return {
                    _id: (result._id as any)?.toString() || result._id,
                    assessmentId: assessment ? {
                        _id: (assessment._id as any)?.toString() || assessment.toString(),
                        title: assessment.title,
                        description: assessment.description,
                        showResultsToUsers: assessment.showResultsToUsers,
                    } : null,
                    userId: userIdObj ? (typeof userIdObj === 'object' && userIdObj._id ? {
                        _id: (userIdObj._id as any)?.toString(),
                        email: userIdObj.email,
                        firstName: userIdObj.firstName,
                        lastName: userIdObj.lastName,
                        fullName: userIdObj.fullName || `${userIdObj.firstName || ''} ${userIdObj.lastName || ''}`.trim(),
                        id: (userIdObj._id as any)?.toString(),
                    } : userIdObj.toString()) : null,
                    totalMarksObtained: result.totalMarksObtained,
                    totalMarksPossible: result.totalMarksPossible,
                    percentage: result.percentage,
                    status: result.status,
                    startTime: result.startTime,
                    endTime: result.endTime,
                    duration: result.duration,
                    sectionScores: result.sectionScores || [],
                    createdAt: result.createdAt,
                };
            });
        } catch (error) {
            logger.error('Error getting user results for reports', `userId: ${userId}`, error);
            throw error;
        }
    }

    async getAssessmentResults(assessmentId: string): Promise<AssessmentResultResponse[]> {
        try {
            const results = await this.assessmentResultRepository.findByAssessment(assessmentId);
            return results.map(result => this.toAssessmentResultResponse(result));
        } catch (error) {
            logger.error('Error getting results', `assessmentId: ${assessmentId}`, error);
            throw error;
        }
    }

    async getAssessmentResultsWithCollegeInfo(
        assessmentId: string,
        filters?: {
            college?: string;
            branch?: string;
            year?: string;
        },
        pagination?: {
            page?: number;
            limit?: number;
        }
    ): Promise<any> {
        try {
            console.log("FitlersFilter", filters)
            let results = await this.assessmentResultRepository.findByAssessmentWithCollegeInfo(assessmentId);

            // Handle case where results is null or undefined
            if (!results) {
                console.log("No results found for assessment:", assessmentId);
                return pagination ? { results: [], pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: pagination.limit || 50, hasNextPage: false, hasPrevPage: false } } : [];
            }

            console.log("results", results[0]?.userId)

            if (filters) {
                if (filters.college && filters.college !== 'all') {
                    results = results.filter(result => {
                        if (result.userInfo?.collegeId) {
                            console.log("Filtering by college ID (stored):", filters.college, "User college ID:", result.userInfo.collegeId.toString());
                            return result.userInfo.collegeId.toString() === filters.college;
                        } else {
                            const user = result.userId as any;
                            const collegeId = user.college?._id?._id?.toString() || user.college?._id?.toString();
                            console.log("Filtering by college ID (populated):", filters.college, "User college ID:", collegeId);
                            return collegeId === filters.college;
                        }
                    });
                }

                if (filters.branch && filters.branch !== 'all') {
                    results = results.filter(result => {
                        if (result.userInfo?.branchId) {
                            console.log("Filtering by branch ID (stored):", filters.branch, "User branch ID:", result.userInfo.branchId.toString());
                            return result.userInfo.branchId.toString() === filters.branch;
                        } else {
                            const user = result.userId as any;
                            const branchId = user.branch?._id?.toString();
                            console.log("Filtering by branch ID (populated):", filters.branch, "User branch ID:", branchId);
                            return branchId === filters.branch;
                        }
                    });
                }

                if (filters.year && filters.year !== 'all') {
                    results = results.filter(result => {
                        // Use stored userInfo if available, otherwise fall back to populated user data
                        if (result.userInfo?.collegeYear) {
                            console.log("Filtering by year (stored):", filters.year, "User year:", result.userInfo.collegeYear);
                            return result.userInfo.collegeYear === parseInt(filters.year!);
                        } else {
                            const user = result.userId as any;
                            console.log("Filtering by year (populated):", filters.year, "User year:", user.collegeYear);
                            return user.collegeYear === parseInt(filters.year!);
                        }
                    });
                }
            }

            const mappedResults = results.map(result => {
                // Safety check for null/undefined result
                if (!result) {
                    console.warn("Skipping null/undefined result");
                    return null;
                }

                const user = result.userId as any; // Type assertion for populated user
                const assessment = result.assessmentId as any; // Type assertion for populated assessment

                // Safety check for user data
                if (!user) {
                    console.error(`⚠️ ORPHANED RESULT FOUND - Result with missing/null user:`, {
                        resultId: result._id,
                        assessmentId: assessmentId,
                        status: result.status,
                        createdAt: result.createdAt
                    });
                    console.error(`To fix in MongoDB: db.assessmentresults.deleteOne({_id: ObjectId('${result._id}')})`);
                    return null;
                }

                return {
                    _id: result._id,
                    assessmentId: result.assessmentId,
                    userId: result.userId,
                    totalMarksObtained: result.totalMarksObtained,
                    totalMarksPossible: result.totalMarksPossible,
                    percentage: result.percentage,
                    status: result.status,
                    startTime: result.startTime,
                    endTime: result.endTime,
                    duration: result.duration,
                    sectionScores: result.sectionScores || [],
                    createdAt: result.createdAt,
                    updatedAt: result.updatedAt,
                    codingQuestions: result.codingQuestions,
                    user: {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        registrationNo: user.registrationNo,
                        collegeName: user.college?.name || 'N/A',
                        branchName: user.branch?.name || 'N/A',
                        collegeYear: user.collegeYear || null
                    },
                    assessment: {
                        _id: assessment._id,
                        title: assessment.title,
                        description: assessment.description,
                        allowedColleges: assessment.colleges || []
                    },
                    responses: result.responses.map((response: any) => ({
                        _id: response._id,
                        questionId: response.questionId,
                        section: response.section || response.questionId?.section || 'General',
                        selectedOptions: response.selectedOptions,
                        isCorrect: response.isCorrect,
                        marksObtained: response.marksObtained,
                        timeSpent: response.timeSpent,
                        question: response.questionId ? {
                            _id: response.questionId._id,
                            text: response.questionId.text,
                            type: response.questionId.type,
                            section: response.questionId.section || 'General',
                            options: response.questionId.options,
                            marks: response.questionId.marks,
                            explanation: response.questionId.explanation,
                            correctAnswer: (response.questionId.options || [])
                                .filter((opt: any) => opt.isCorrect)
                                .map((opt: any) => opt.text)
                        } : null
                    }))
                };
            }).filter(result => result !== null); // Filter out null results

            // Apply pagination if requested
            if (pagination) {
                const page = pagination.page || 1;
                const limit = pagination.limit || 50;
                const totalItems = mappedResults.length;
                const totalPages = Math.ceil(totalItems / limit);
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                const paginatedResults = mappedResults.slice(startIndex, endIndex);

                return {
                    results: paginatedResults,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalItems,
                        itemsPerPage: limit,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1
                    }
                };
            }

            // Return all results if no pagination requested (for backward compatibility)
            return mappedResults;
        } catch (error) {
            logger.error('Error getting results with college info', `assessmentId: ${assessmentId}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async getAssessmentStatistics(assessmentId: string): Promise<any> {
        try {
            const results = await this.assessmentResultRepository.findByAssessment(assessmentId);
            const completedResults = results.filter(r => r.status === 'completed');

            if (completedResults.length === 0) {
                return {
                    totalParticipants: 0,
                    completedParticipants: 0,
                    averageScore: 0,
                    averagePercentage: 0,
                    highestScore: 0,
                    lowestScore: 0,
                };
            }

            const scores = completedResults.map(r => r.totalMarksObtained);
            const percentages = completedResults.map(r => r.percentage);

            return {
                totalParticipants: results.length,
                completedParticipants: completedResults.length,
                averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
                averagePercentage: percentages.reduce((a, b) => a + b, 0) / percentages.length,
                highestScore: Math.max(...scores),
                lowestScore: Math.min(...scores),
            };
        } catch (error) {
            logger.error('Error getting statistics', `assessmentId: ${assessmentId}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async getAllResults(page: number = 1, limit: number = 10, filter: any = {}): Promise<{
        results: AssessmentResultResponse[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }> {
        try {
            const result = await this.assessmentResultRepository.getResultsWithPagination(filter, { page, limit });

            return {
                results: result.results.map((r: any) => this.toAssessmentResultResponse(r)),
                pagination: result.pagination,
            };
        } catch (error) {
            logger.error('Error getting all assessment results:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async getResultById(id: string): Promise<AssessmentResultResponse | null> {
        try {
            const result = await this.assessmentResultRepository.findById(id);
            return result ? this.toAssessmentResultResponse(result) : null;
        } catch (error) {
            logger.error('Error getting assessment result by ID', `id: ${id}`, error);
            throw error;
        }
    }

    async getResultsByUser(userId: string): Promise<AssessmentResultResponse[]> {
        try {
            const results = await this.assessmentResultRepository.findByUser(userId);
            return results.map(result => this.toAssessmentResultResponse(result));
        } catch (error) {
            logger.error('Error getting results by user', `userId: ${userId}`, error);
            throw error;
        }
    }

    async exportResults(assessmentId: string, filters: {
        college?: string;
        branch?: string;
        year?: string;
        status?: string;
    } = {}): Promise<string> {
        try {
            // Get all results for the assessment with college info (no pagination for export - get all)
            const results = await this.getAssessmentResultsWithCollegeInfo(assessmentId, filters);

            if (!results || results.length === 0) {
                return 'No results found for export\n';
            }

            // Get all unique sections from all results
            const allSections = new Set<string>();
            results.forEach((result: any) => {
                const sectionScores = result.sectionScores || [];
                sectionScores.forEach((section: any) => allSections.add(section.sectionName));
            });
            const sectionNames = Array.from(allSections).sort();

            // Create CSV content array
            const csvContent: string[][] = [];

            // Create dynamic header row with section scores
            const headerRow = [
                'College Name',
                'User ID',
                'Registration Number',
                'Email',
                'Name',
                'Branch',
                'Year',
                'Assessment Name',
            ];

            // Add section score columns (obtained and max for each section)
            sectionNames.forEach((sectionName) => {
                headerRow.push(`${sectionName} Score Obtained`);
                headerRow.push(`${sectionName} Max Score`);
            });

            // Add total columns
            headerRow.push('Total Score Obtained');
            headerRow.push('Max Total Score');
            headerRow.push('Overall Percentage');

            csvContent.push(headerRow);

            // Data rows with section-wise scores
            results.forEach((result: any) => {
                const sectionScores = result.sectionScores || [];
                const sectionScoreMap = new Map<string, { marksObtained: number; totalMarks: number }>(
                    sectionScores.map((s: any) => [s.sectionName, s])
                );

                const baseRow: string[] = [
                    result.user.collegeName || '',
                    result.user._id || '',
                    result.user.registrationNo?.toString() || 'N/A',
                    result.user.email || '',
                    `${result.user.firstName} ${result.user.lastName}`.trim(),
                    result.user.branchName || 'N/A',
                    result.user.collegeYear ? `Year ${result.user.collegeYear}` : 'N/A',
                    result.assessment.title || '',
                ];

                // Add section scores (obtained and max for each section)
                sectionNames.forEach((sectionName) => {
                    const sectionScore = sectionScoreMap.get(sectionName);
                    baseRow.push(
                        sectionScore ? sectionScore.marksObtained.toString() : '0'
                    );
                    baseRow.push(sectionScore ? sectionScore.totalMarks.toString() : '0');
                });

                // Add total scores
                baseRow.push(result.totalMarksObtained.toString());
                baseRow.push(result.totalMarksPossible.toString());
                baseRow.push(`${result.percentage.toFixed(1)}%`);

                csvContent.push(baseRow);
            });

            // Convert to CSV string
            const csv = csvContent
                .map((row) => row.map((cell) => `"${cell}"`).join(','))
                .join('\n');

            return csv;
        } catch (error) {
            logger.error('Error exporting assessment results:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async updateResult(id: string, updateData: any): Promise<AssessmentResultResponse | null> {
        try {
            const updatedResult = await this.assessmentResultRepository.update(id, updateData);
            return updatedResult ? this.toAssessmentResultResponse(updatedResult) : null;
        } catch (error) {
            logger.error('Error updating assessment result', `id: ${id}`, error);
            throw error;
        }
    }

    async deleteResult(id: string): Promise<boolean> {
        try {
            return await this.assessmentResultRepository.delete(id);
        } catch (error) {
            logger.error('Error deleting assessment result', `id: ${id}`, error);
            throw error;
        }
    }

    async recalculateAssessmentScores(assessmentId: string): Promise<{
        recalculated: number;
        failed: number;
        message: string;
    }> {
        try {
            logger.info(`Starting score recalculation for assessment ${assessmentId}`);

            // Get assessment details
            const assessment = await this.assessmentService.getAssessmentById(assessmentId);
            if (!assessment) {
                throw new Error('Assessment not found');
            }

            // Get all questions for the assessment
            const questions = await this.questionService.getQuestionsByIds(assessment.questions);
            if (!questions || questions.length === 0) {
                throw new Error('No questions found for assessment');
            }

            // Get all completed AND in_progress results for this assessment
            const allResults = await this.assessmentResultRepository.findByAssessment(assessmentId);
            // Recalculate for ALL results regardless of status (including failed)
            const resultsToRecalculate = allResults;

            if (resultsToRecalculate.length === 0) {
                return {
                    recalculated: 0,
                    failed: 0,
                    message: 'No completed or in-progress results found to recalculate'
                };
            }

            let recalculated = 0;
            let failed = 0;

            // Recalculate each result
            for (const result of resultsToRecalculate) {
                try {
                    // Grade the assessment responses
                    const gradedResult = await this.gradeAssessment(result.responses as any, questions);

                    // Handle coding questions if present
                    let updatedCodingQuestions = result.codingQuestions || [];
                    let codingMarksObtained = 0;

                    if ((assessment.type === 'mixed' || assessment.type === 'coding') &&
                        result.codingQuestions && result.codingQuestions.length > 0) {
                        updatedCodingQuestions = await this.updateCodingQuestionScores(
                            result.codingQuestions,
                            assessment.codingQuestions || []
                        );
                        codingMarksObtained = updatedCodingQuestions.reduce(
                            (sum: number, cq: any) => sum + (cq.marksObtained || 0),
                            0
                        );
                    }

                    // Calculate total marks
                    const totalMarksObtained = gradedResult.totalMarksObtained + codingMarksObtained;
                    const codingTotalMarks = (assessment.codingQuestions || []).reduce(
                        (sum: number, cq: any) => sum + (cq.score || 0),
                        0
                    );
                    const totalMarksPossible = gradedResult.totalMarksPossible + codingTotalMarks;

                    let percentage = totalMarksPossible > 0
                        ? (totalMarksObtained / totalMarksPossible) * 100
                        : 0;

                    if (percentage > 100) {
                        percentage = 100;
                    }

                    // Determine pass/fail based on passPercentage from assessment
                    const passPercentage = assessment.passPercentage ?? 60; // Default to 60 if not set

                    // Update status based on pass percentage, but only for completed or failed assessments
                    // Keep in_progress assessments as in_progress since they haven't been submitted yet
                    let newStatus = result.status;
                    // if (result.status === 'completed' || result.status === 'failed') {
                    newStatus = percentage >= passPercentage ? 'completed' : 'failed';
                    logger.info(`Updated status for result ${result._id}: ${result.status} -> ${newStatus} (${percentage.toFixed(2)}% vs ${passPercentage}% required)`);
                    // }

                    // Update the result with recalculated scores and updated status
                    // Add endTime if status is changing from in_progress to completed/failed
                    const updatePayload: any = {
                        responses: gradedResult.responses,
                        codingQuestions: updatedCodingQuestions,
                        sectionScores: gradedResult.sectionScores,
                        totalMarksObtained,
                        totalMarksPossible,
                        percentage,
                        status: newStatus,
                        updatedAt: new Date()
                    };

                    if (result.status === 'in_progress' && (newStatus === 'completed' || newStatus === 'failed')) {
                        updatePayload.endTime = new Date();
                        logger.info(`Setting endTime for result ${result._id} as status changed from in_progress to ${newStatus}`);
                    }

                    await this.assessmentResultRepository.update(result._id.toString(), updatePayload);

                    recalculated++;
                    logger.info(`Recalculated scores for result ${result._id}`);
                } catch (error) {
                    failed++;
                    logger.error(`Error recalculating scores for result ${result._id}:`, error);
                }
            }

            const message = `Recalculated ${recalculated} results successfully${failed > 0 ? `, ${failed} failed` : ''}`;
            logger.info(`Finished recalculation for assessment ${assessmentId}: ${message}`);

            return {
                recalculated,
                failed,
                message
            };
        } catch (error) {
            logger.error('Error recalculating assessment scores', `assessmentId: ${assessmentId}`, error);
            throw error;
        }
    }

    async recalculateResultScores(resultId: string): Promise<{
        success: boolean;
        message: string;
        data?: any;
    }> {
        try {
            logger.info(`Starting score recalculation for result ${resultId}`);

            // Get result details
            const result = await this.assessmentResultRepository.findById(resultId);
            if (!result) {
                throw new Error('Assessment result not found');
            }

            // Get assessment details
            const assessmentId = (result.assessmentId as any)._id
                ? (result.assessmentId as any)._id.toString()
                : result.assessmentId.toString();
            const assessment = await this.assessmentService.getAssessmentById(assessmentId);
            if (!assessment) {
                throw new Error('Assessment not found');
            }

            // Get all questions for the assessment
            const questions = await this.questionService.getQuestionsByIds(assessment.questions);
            if (!questions || questions.length === 0) {
                throw new Error('No questions found for assessment');
            }

            // Grade the assessment responses
            const gradedResult = await this.gradeAssessment(result.responses as any, questions);

            // Handle coding questions if present
            let updatedCodingQuestions = result.codingQuestions || [];
            let codingMarksObtained = 0;

            if ((assessment.type === 'mixed' || assessment.type === 'coding') &&
                result.codingQuestions && result.codingQuestions.length > 0) {
                updatedCodingQuestions = await this.updateCodingQuestionScores(
                    result.codingQuestions,
                    assessment.codingQuestions || []
                );
                codingMarksObtained = updatedCodingQuestions.reduce(
                    (sum: number, cq: any) => sum + (cq.marksObtained || 0),
                    0
                );
            }

            // Calculate total marks
            const totalMarksObtained = gradedResult.totalMarksObtained + codingMarksObtained;
            const codingTotalMarks = (assessment.codingQuestions || []).reduce(
                (sum: number, cq: any) => sum + (cq.score || 0),
                0
            );
            const totalMarksPossible = gradedResult.totalMarksPossible + codingTotalMarks;

            let percentage = totalMarksPossible > 0
                ? (totalMarksObtained / totalMarksPossible) * 100
                : 0;

            if (percentage > 100) {
                percentage = 100;
            }

            // Determine pass/fail based on passPercentage from assessment
            const passPercentage = assessment.passPercentage ?? 60; // Default to 60 if not set

            // Update status based on pass percentage
            const newStatus = percentage >= passPercentage ? 'completed' : 'failed';
            logger.info(`Updated status for result ${result._id}: ${result.status} -> ${newStatus} (${percentage.toFixed(2)}% vs ${passPercentage}% required)`);

            // Update the result with recalculated scores and updated status
            // Add endTime if status is changing from in_progress to completed/failed
            const updatePayload: any = {
                responses: gradedResult.responses,
                codingQuestions: updatedCodingQuestions,
                sectionScores: gradedResult.sectionScores,
                totalMarksObtained,
                totalMarksPossible,
                percentage,
                status: newStatus,
                updatedAt: new Date()
            };

            if (result.status === 'in_progress' && (newStatus === 'completed' || newStatus === 'failed')) {
                updatePayload.endTime = new Date();
                logger.info(`Setting endTime for result ${result._id} as status changed from in_progress to ${newStatus}`);
            }

            const updatedResult = await this.assessmentResultRepository.update(result._id.toString(), updatePayload);

            logger.info(`Recalculated scores for result ${result._id}`);

            return {
                success: true,
                message: 'Score recalculated successfully',
                data: updatedResult
            };
        } catch (error) {
            logger.error('Error recalculating result scores', `resultId: ${resultId}`, error);
            throw error;
        }
    }

    async createResult(resultData: any): Promise<AssessmentResultResponse> {
        try {
            const newResult = await this.assessmentResultRepository.create(resultData);
            return this.toAssessmentResultResponse(newResult);
        } catch (error) {
            logger.error('Error creating assessment result:', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async getAssessmentQuestions(assessmentId: string): Promise<any[]> {
        try {
            const assessment = await this.assessmentService.getAssessmentById(assessmentId);
            if (!assessment) {
                throw new Error('Assessment not found');
            }

            const questions = await this.questionService.getQuestionsByIds(assessment.questions);
            // Return questions without correct answers for security
            return questions.map(q => ({
                _id: q._id,
                text: q.text,
                type: q.type,
                options: q.options.map((opt: any, index: any) => ({
                    index: index,
                    text: opt.text
                })),
                marks: q.marks,
                explanation: q.explanation
            }));
        } catch (error) {
            logger.error('Error getting assessment questions', `assessmentId: ${assessmentId}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async resumeAssessment(userId: string, assessmentId: string): Promise<AssessmentResultResponse | null> {
        try {
            const result = await this.assessmentResultRepository.findByUserAndAssessment(userId, assessmentId);
            if (!result || result.status === 'completed') {
                return null;
            }

            return this.toAssessmentResultResponse(result);
        } catch (error) {
            logger.error('Error resuming assessment', `userId: ${userId}, assessmentId: ${assessmentId}`, error);
            throw error;
        }
    }

    async autoFailExpiredAssessments(): Promise<void> {
        try {
            // Find all in-progress assessments
            const inProgressResults = await this.assessmentResultRepository.getAllInProgressResults();

            for (const result of inProgressResults) {
                const assessment = await this.assessmentService.getAssessmentById(result.assessmentId.toString());
                if (!assessment) continue;

                // Calculate time elapsed since start
                const now = new Date();
                const timeElapsed = Math.floor((now.getTime() - result.startTime.getTime()) / 1000);
                const maxDuration = assessment.duration * 60; // Convert minutes to seconds

                // If time exceeded, mark as failed
                if (timeElapsed > maxDuration) {
                    await this.assessmentResultRepository.update((result._id.toString()), {
                        status: 'failed',
                        endTime: now,
                        duration: maxDuration,
                        totalMarksObtained: 0,
                        percentage: 0
                    });
                    // await this.calculateScore(result.userId.toString(), result.assessmentId.toString());

                    logger.info(`Assessment ${result.assessmentId} auto-failed for user ${result.userId} due to time limit`);
                }
            }
        } catch (error) {
            logger.error('Error auto-failing expired assessments:', error instanceof Error ? error.message : String(error));
        }
    }

    async canUserRetakeAssessment(userId: string, assessmentId: string): Promise<boolean> {
        try {
            const existingResult = await this.assessmentResultRepository.findByUserAndAssessment(userId, assessmentId);

            // If no previous attempt, user can take
            if (!existingResult) {
                return true;
            }

            // If previous attempt was failed or abandoned, user can retake
            if (existingResult.status === 'failed' || existingResult.status === 'abandoned') {
                return true;
            }

            // If completed, user cannot retake
            if (existingResult.status === 'completed') {
                return false;
            }

            // If in progress, user can continue
            return true;
        } catch (error) {
            logger.error('Error checking retake eligibility', `userId: ${userId}, assessmentId: ${assessmentId}`, error instanceof Error ? error.message : String(error));
            return false;
        }
    }

    private async gradeAssessment(
        responses: IQuestionResponseWithQuestion[],
        questions: QuestionResponseDto[]
    ): Promise<{
        responses: any[];
        sectionScores: any[];
        totalMarksObtained: number;
        totalMarksPossible: number;
        percentage: number;
    }> {
        let totalMarksObtained = 0;
        const gradedResponses: any[] = [];

        console.log("question", questions);
        for (const response of responses) {
            console.log("response", response);

            // Handle both populated and unpopulated questionIds
            const responseQuestionId = response.questionId?._id?.toString() || response.questionId?.toString();
            const question = questions.find(q => q._id.toString() === responseQuestionId);
            if (!question) {
                continue;
            }

            console.log("question", question, response);
            let isCorrect = false;
            let marksObtained = 0;

            // Ensure selectedOptions is always an array
            const selectedOptions = Array.isArray(response.selectedOptions) ? response.selectedOptions : [];

            // Ensure question.options exists and is an array
            if (!question.options || !Array.isArray(question.options)) {
                logger.warn(`Question ${question._id} has invalid or missing options array`);
                gradedResponses.push({
                    questionId: response.questionId,
                    section: response.section || question.section || '',
                    selectedOptions: selectedOptions,
                    isCorrect: false,
                    marksObtained: 0,
                    timeSpent: response.timeSpent || 0,
                });
                continue;
            }

            // Check if selected options are correct    
            if (question.type === 'single_choice') {
                const correctOption = question.options.find(opt => opt.isCorrect);
                if (correctOption) {
                    isCorrect = selectedOptions.includes(correctOption.text);
                } else {
                    logger.warn(`Question ${question._id} has no correct option marked`);
                    isCorrect = false;
                }
            } else if (question.type === 'multiple_choice') {
                const correctOptions = question.options.filter(opt => opt.isCorrect).map(opt => opt.text);
                const incorrectOptions = question.options.filter(opt => !opt.isCorrect).map(opt => opt.text);

                // For multiple choice, all correct options must be selected AND no incorrect options selected
                // Also ensure the number of selected options matches the number of correct options
                const allCorrectSelected = correctOptions.length > 0 &&
                    correctOptions.every(opt => selectedOptions.includes(opt));
                const noIncorrectSelected = incorrectOptions.every(opt => !selectedOptions.includes(opt));
                const correctLength = selectedOptions.length === correctOptions.length;

                isCorrect = allCorrectSelected && noIncorrectSelected && correctLength;

                // Log for debugging
                if (!isCorrect && selectedOptions.length > 0) {
                    logger.info(`Multiple choice scoring for question ${question._id}:`, {
                        selectedOptions,
                        correctOptions,
                        incorrectOptions,
                        allCorrectSelected,
                        noIncorrectSelected,
                        correctLength,
                        isCorrect
                    });
                }
            } else {
                logger.warn(`Question ${question._id} has unknown type: ${question.type}`);
                isCorrect = false;
            }

            if (isCorrect) {
                marksObtained = question.marks;
                totalMarksObtained += marksObtained;
            }

            gradedResponses.push({
                questionId: response.questionId,
                section: response.section || question.section || '', // Preserve section from response or question
                selectedOptions: selectedOptions, // Use normalized array
                isCorrect,
                marksObtained,
                timeSpent: response.timeSpent || 0, // Default to 0 if not provided
            });
        }

        const totalMarksPossible = questions.reduce((total, question) => total + question.marks, 0);
        const percentage = (totalMarksObtained / totalMarksPossible) * 100;

        // Calculate section-wise scores
        const sectionMap = new Map<string, {
            sectionName: string;
            marksObtained: number;
            totalMarks: number;
            questionsCount: number;
        }>();

        // Process each graded response to calculate section scores
        gradedResponses.forEach((response) => {
            // Handle both populated and unpopulated questionIds
            const responseQuestionId = response.questionId?._id?.toString() || response.questionId?.toString();
            const question = questions.find(q => q._id.toString() === responseQuestionId);
            if (!question) return;

            const sectionName = response.section || question.section || 'General';
            const questionMarks = question.marks;
            const obtainedMarks = response.marksObtained;

            if (sectionMap.has(sectionName)) {
                const existing = sectionMap.get(sectionName)!;
                existing.marksObtained += obtainedMarks;
                existing.totalMarks += questionMarks;
                existing.questionsCount += 1;
            } else {
                sectionMap.set(sectionName, {
                    sectionName,
                    marksObtained: obtainedMarks,
                    totalMarks: questionMarks,
                    questionsCount: 1,
                });
            }
        });

        // Convert to array and calculate percentages
        const sectionScores = Array.from(sectionMap.values()).map(section => ({
            sectionName: section.sectionName,
            marksObtained: section.marksObtained,
            totalMarks: section.totalMarks,
            percentage: section.totalMarks > 0 ? Math.min((section.marksObtained / section.totalMarks) * 100, 100) : 0,
            questionsCount: section.questionsCount,
        }));

        return {
            responses: gradedResponses,
            sectionScores,
            totalMarksObtained,
            totalMarksPossible,
            percentage,
        };
    }

    private async sendResultEmail(payload: {
        user: IUserDocument;
        assessmentId: string;
        assessmentTitle: string;
        assessmentType: string;
        assessmentDurationMinutes: number;
        resultId: string;
        totalMarksObtained: number;
        totalMarksPossible: number;
        percentage: number;
        timeTakenSeconds: number;
        isPassed: boolean;
        passPercentage: number;
        submittedAt: Date;
        correctAnswers: number;
        incorrectAnswers: number;
        unattemptedQuestions: number;
    }): Promise<void> {
        try {
            if (!payload.user?.email) {
                return;
            }

            const normalizedUserId = typeof payload.user._id?.toString === 'function'
                ? payload.user._id.toString()
                : String(payload.user._id);

            await this.emailService.sendAssessmentCompletion({
                userId: normalizedUserId,
                userName: `${payload.user.firstName ?? ''} ${payload.user.lastName ?? ''}`.trim(),
                userEmail: payload.user.email,
                registrationNo: payload.user.registrationNo,
                assessmentId: payload.assessmentId,
                assessmentTitle: payload.assessmentTitle,
                assessmentType: payload.assessmentType,
                resultId: payload.resultId,
                totalMarks: payload.totalMarksPossible,
                obtainedMarks: payload.totalMarksObtained,
                percentage: payload.percentage,
                durationSeconds: payload.timeTakenSeconds,
                assessmentDurationMinutes: payload.assessmentDurationMinutes,
                submittedAt: payload.submittedAt,
                isPassed: payload.isPassed,
                passPercentage: payload.passPercentage,
                correctAnswers: payload.correctAnswers,
                incorrectAnswers: payload.incorrectAnswers,
                unattemptedQuestions: payload.unattemptedQuestions
            });
        } catch (error) {
            logger.error('Error sending result email', `userId: ${payload.user?._id}`, error instanceof Error ? error.message : String(error));
            // Don't throw error as it shouldn't fail the submission
        }
    }

    private toAssessmentResultResponse(result: any): AssessmentResultResponse {
        // Handle assessmentId - it can be null if assessment was deleted
        let assessmentId: string | null = null;
        if (result.assessmentId) {
            if (typeof result.assessmentId === 'object' && result.assessmentId._id) {
                assessmentId = result.assessmentId._id.toString();
            } else if (typeof result.assessmentId === 'string') {
                assessmentId = result.assessmentId;
            }
        }

        return {
            _id: result._id.toString(),
            assessmentId: assessmentId as string, // Cast to string for type compatibility, but can be null in DB
            userId: result.userId as string,
            totalMarksObtained: result.totalMarksObtained,
            totalMarksPossible: result.totalMarksPossible,
            percentage: result.percentage,
            status: result.status,
            startTime: result.startTime,
            endTime: result.endTime,
            duration: result.duration,
            sectionScores: result.sectionScores || [],
            createdAt: result.createdAt,
        };
    }

    /**
     * Shuffles questions by section: first shuffles questions within each section,
     * then shuffles the sections themselves to maintain section grouping
     */
    private shuffleQuestionsBySection(questions: any[]): any[] {
        // Group questions by section
        const questionsBySection = new Map<string, any[]>();

        questions.forEach(question => {
            const section = question.section || 'default';
            if (!questionsBySection.has(section)) {
                questionsBySection.set(section, []);
            }
            questionsBySection.get(section)!.push(question);
        });

        // Shuffle questions within each section
        const shuffledSections = new Map<string, any[]>();
        questionsBySection.forEach((sectionQuestions, section) => {
            const shuffledQuestions = [...sectionQuestions].sort(() => Math.random() - 0.5);
            shuffledSections.set(section, shuffledQuestions);
        });

        // Get all section names and shuffle them
        const sectionNames = Array.from(shuffledSections.keys());
        const shuffledSectionNames = [...sectionNames].sort(() => Math.random() - 0.5);

        // Combine shuffled questions from shuffled sections
        const finalShuffledQuestions: any[] = [];
        shuffledSectionNames.forEach(sectionName => {
            const sectionQuestions = shuffledSections.get(sectionName)!;
            finalShuffledQuestions.push(...sectionQuestions);
        });

        return finalShuffledQuestions;
    }

    async getDetailedAssessmentResult(resultId: string, userId: string, isAdmin: boolean = false): Promise<any> {
        try {
            const result = await this.assessmentResultRepository.findByIdWithDetails(resultId);
            if (!result) return null;

            // Authorization check: Only the owner or admin can access the result
            // Handle both populated and non-populated userId (can be object with _id or just string/ObjectId)
            let resultUserId: string;
            if (typeof result.userId === 'object' && result.userId !== null && '_id' in result.userId) {
                resultUserId = (result.userId as any)._id?.toString() || '';
            } else {
                resultUserId = result.userId?.toString() || '';
            }

            if (!isAdmin && resultUserId !== userId) {
                logger.warn(`Unauthorized access attempt: User ${userId} tried to access result ${resultId} owned by ${resultUserId}`);
                throw new AppError(
                    'You do not have permission to access this assessment result',
                    403,
                    ERROR_CODES.INSUFFICIENT_PERMISSIONS
                );
            }

            const user = result.userId as any;
            const assessment = result.assessmentId as any;

            if (!isAdmin && assessment && assessment.showResultsToUsers === false) {
                throw new AppError(
                    'Assessment results are not available for this assessment.',
                    403,
                    ERROR_CODES.RESULTS_NOT_AVAILABLE,
                    true
                );
            }

            return {
                _id: result._id,
                assessmentId: result.assessmentId,
                userId: result.userId,
                totalMarksObtained: result.totalMarksObtained,
                totalMarksPossible: result.totalMarksPossible,
                percentage: result.percentage,
                status: result.status,
                startTime: result.startTime,
                endTime: result.endTime,
                duration: result.duration,
                sectionScores: result.sectionScores || [],
                createdAt: result.createdAt,
                updatedAt: result.updatedAt,
                user: {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    registrationNo: user.registrationNo,
                    collegeName: user.college?.name || 'N/A',
                    branchName: user.branch?.name || 'N/A',
                    collegeYear: user.collegeYear || null
                },
                assessment: {
                    _id: assessment._id,
                    title: assessment.title,
                    description: assessment.description,
                    totalMarks: assessment.totalMarks,
                    duration: assessment.duration
                },
                responses: result.responses.map((response: any) => ({
                    _id: response._id,
                    questionId: response.questionId,
                    section: response.section || response.questionId?.section || 'General',
                    selectedOptions: response.selectedOptions || [],
                    isCorrect: response.isCorrect,
                    marksObtained: response.marksObtained,
                    timeSpent: response.timeSpent,
                    question: response.questionId ? {
                        _id: response.questionId._id,
                        text: response.questionId.text,
                        type: response.questionId.type,
                        section: response.questionId.section || 'General',
                        options: response.questionId.options || [],
                        marks: response.questionId.marks,
                        explanation: response.questionId.explanation,
                        correctAnswer: (response.questionId.options || [])
                            .filter((opt: any) => opt.isCorrect)
                            .map((opt: any) => opt.text)
                    } : null
                })),
                codingQuestions: result.codingQuestions || [],
                type: (result as any).type || 'mcq'
            };
        } catch (error) {
            logger.error(`Error getting detailed assessment result ${resultId}:`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async sendIndividualReport(resultId: string, email: string): Promise<void> {
        try {
            // Admin-only method, so pass isAdmin: true to bypass authorization check
            const result = await this.getDetailedAssessmentResult(resultId, '', true);
            if (!result) {
                throw new Error('Assessment result not found');
            }

            // Generate PDF report (you can implement this based on your PDF generation library)
            const reportData = {
                user: result.user,
                assessment: result.assessment,
                result: {
                    percentage: result.percentage,
                    totalMarksObtained: result.totalMarksObtained,
                    totalMarksPossible: result.totalMarksPossible,
                    duration: result.duration,
                    status: result.status,
                    submittedAt: result.endTime || result.createdAt
                },
                responses: result.responses
            };

            // Send email with report
            console.log("reportData", reportData);
            await this.emailService.sendIndividualAssessmentReport(email, reportData);

            logger.info(`Individual assessment report sent to ${email} for result ${resultId}`);
        } catch (error) {
            logger.error('Error sending individual report', `resultId: ${resultId}, email: ${email}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Get user results by date range (for students)
     */
    async getResultByUserAndAssessment(userId: string, assessmentId: string): Promise<any> {
        try {
            const result = await this.assessmentResultRepository.findByUserAndAssessmentWithIsCorrect(userId, assessmentId);
            if (!result) {
                logger.warn(`No result found for user ${userId} and assessment ${assessmentId}`);
                return null;
            }

            // Get detailed result using the existing method - pass empty string for userId since we're admin
            return await this.getDetailedAssessmentResult(result._id.toString(), '', true);
        } catch (error) {
            logger.error('Error getting result by user and assessment', `userId: ${userId}, assessmentId: ${assessmentId}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async getUserResultsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<AssessmentResultResponse[]> {
        try {
            const results = await this.assessmentResultRepository.getResultsByUserAndDateRange(userId, startDate, endDate);

            const visibleResults = results.filter((result) => {
                // Filter out results with null assessmentId (orphaned results from deleted assessments)
                if (!result.assessmentId) {
                    return false;
                }

                const assessment: any = result.assessmentId;
                if (assessment && typeof assessment === 'object' && 'showResultsToUsers' in assessment) {
                    return assessment.showResultsToUsers === true;
                }
                return false;
            });

            return visibleResults.map((result) => this.toAssessmentResultResponse(result));
        } catch (error) {
            logger.error('Error getting user results by date range', `userId: ${userId}`, error);
            throw error;
        }
    }

    /**
     * Get user results by date range for reports - returns results with populated assessmentId objects
     * This is specifically for the reports page which needs assessment details
     */
    async getUserResultsByDateRangeForReports(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
        try {
            const results = await this.assessmentResultRepository.getResultsByUserAndDateRange(userId, startDate, endDate);

            const visibleResults = results.filter((result: any) => {
                // Filter out results with null assessmentId (orphaned results from deleted assessments)
                if (!result.assessmentId) {
                    return false;
                }

                const assessment: any = result.assessmentId;
                if (assessment && typeof assessment === 'object' && 'showResultsToUsers' in assessment) {
                    return assessment.showResultsToUsers === true;
                }
                return false;
            });

            // Return results with populated assessmentId objects (not converted to string)
            return visibleResults.map((result: any) => {
                const assessment: any = result.assessmentId;
                const userIdObj: any = result.userId;

                // Handle assessmentId - if it's a populated object, use it; if it's a string ID, we need to fetch it
                let assessmentObj: any = null;
                if (assessment) {
                    if (typeof assessment === 'object' && assessment._id) {
                        // Populated object
                        assessmentObj = {
                            _id: (assessment._id as any)?.toString() || assessment._id.toString(),
                            title: assessment.title,
                            description: assessment.description,
                            showResultsToUsers: assessment.showResultsToUsers,
                            totalMarks: assessment.totalMarks,
                            duration: assessment.duration,
                        };
                    } else if (typeof assessment === 'string') {
                        // If it's still a string, populate didn't work - log warning but return null
                        logger.warn(`Assessment ${assessment} was not populated for result ${result._id}`);
                        assessmentObj = null;
                    }
                }

                return {
                    _id: (result._id as any)?.toString() || result._id,
                    assessmentId: assessmentObj,
                    userId: userIdObj ? (typeof userIdObj === 'object' && userIdObj._id ? {
                        _id: (userIdObj._id as any)?.toString(),
                        email: userIdObj.email,
                        firstName: userIdObj.firstName,
                        lastName: userIdObj.lastName,
                        fullName: userIdObj.fullName || `${userIdObj.firstName || ''} ${userIdObj.lastName || ''}`.trim(),
                        id: (userIdObj._id as any)?.toString(),
                        college: userIdObj.college,
                        branch: userIdObj.branch,
                        collegeYear: userIdObj.collegeYear,
                        registrationNo: userIdObj.registrationNo,
                    } : userIdObj.toString()) : null,
                    totalMarksObtained: result.totalMarksObtained,
                    totalMarksPossible: result.totalMarksPossible,
                    percentage: result.percentage,
                    status: result.status,
                    startTime: result.startTime,
                    endTime: result.endTime,
                    duration: result.duration,
                    sectionScores: result.sectionScores || [],
                    createdAt: result.createdAt,
                };
            });
        } catch (error) {
            logger.error('Error getting user results by date range for reports', `userId: ${userId}`, error);
            throw error;
        }
    }

    /**
     * Get user results by date range (for admin viewing a specific student)
     */
    async getResultsByUserAndDateRange(userId: string, startDate: Date, endDate: Date): Promise<AssessmentResultResponse[]> {
        try {
            const results = await this.assessmentResultRepository.getResultsByUserAndDateRange(userId, startDate, endDate);
            return results.map((result) => this.toAssessmentResultResponse(result));
        } catch (error) {
            logger.error('Error getting results by user and date range', `userId: ${userId}`, error);
            throw error;
        }
    }

    /**
     * Get user results by date range for admin reports - returns results with populated assessmentId objects
     * This is specifically for the admin reports page which needs assessment details
     */
    async getResultsByUserAndDateRangeForReports(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
        try {
            const results = await this.assessmentResultRepository.getResultsByUserAndDateRange(userId, startDate, endDate);

            // Filter out results with null assessmentId or deleted assessments (string IDs mean deleted)
            const visibleResults = results.filter((result: any) => {
                if (!result.assessmentId) {
                    return false; // Skip orphaned results
                }

                const assessment: any = result.assessmentId;
                // If assessment is a string, it means the assessment was deleted (populate failed)
                // Skip deleted assessments - only include results where assessment exists
                if (typeof assessment === 'string') {
                    return false; // Skip deleted assessments
                }

                // Only include if assessment is populated as an object (exists)
                return assessment && typeof assessment === 'object' && assessment._id;
            });

            // Return results with populated assessmentId objects (not converted to string)
            return visibleResults.map((result: any) => {
                const assessment: any = result.assessmentId;
                const userIdObj: any = result.userId;

                // Assessment is guaranteed to be a populated object at this point
                const assessmentObj = {
                    _id: (assessment._id as any)?.toString() || assessment._id.toString(),
                    title: assessment.title,
                    description: assessment.description,
                    showResultsToUsers: assessment.showResultsToUsers,
                    totalMarks: assessment.totalMarks,
                    duration: assessment.duration,
                };

                return {
                    _id: (result._id as any)?.toString() || result._id,
                    assessmentId: assessmentObj,
                    userId: userIdObj ? (typeof userIdObj === 'object' && userIdObj._id ? {
                        _id: (userIdObj._id as any)?.toString(),
                        email: userIdObj.email,
                        firstName: userIdObj.firstName,
                        lastName: userIdObj.lastName,
                        fullName: userIdObj.fullName || `${userIdObj.firstName || ''} ${userIdObj.lastName || ''}`.trim(),
                        id: (userIdObj._id as any)?.toString(),
                        college: userIdObj.college,
                        branch: userIdObj.branch,
                        collegeYear: userIdObj.collegeYear,
                        registrationNo: userIdObj.registrationNo,
                    } : userIdObj.toString()) : null,
                    totalMarksObtained: result.totalMarksObtained,
                    totalMarksPossible: result.totalMarksPossible,
                    percentage: result.percentage,
                    status: result.status,
                    startTime: result.startTime,
                    endTime: result.endTime,
                    duration: result.duration,
                    sectionScores: result.sectionScores || [],
                    createdAt: result.createdAt,
                };
            });
        } catch (error) {
            logger.error('Error getting results by user and date range for admin reports', `userId: ${userId}`, error);
            throw error;
        }
    }

    /**
     * Export user results by date range to CSV
     * Applies showResultsToUsers filter to prevent students from exporting hidden results
     * Only exports: Assessment Name, Date of Test, Total Marks Possible, Total Marks Section Wise
     */
    async exportUserResultsByDateRange(userId: string, startDate: Date, endDate: Date, isAdmin: boolean = false): Promise<string> {
        try {
            const results = await this.assessmentResultRepository.getResultsByUserAndDateRange(userId, startDate, endDate);

            // Filter out results where showResultsToUsers is false (unless admin)
            const visibleResults = results.filter((result) => {
                if (isAdmin) return true;

                const assessment: any = result.assessmentId;
                if (assessment && typeof assessment === 'object' && 'showResultsToUsers' in assessment) {
                    return assessment.showResultsToUsers === true;
                }
                return false;
            });

            if (visibleResults.length === 0) {
                return 'No results found for the selected date range.';
            }

            const csvContent: string[][] = [];

            // Build header row with dynamic section columns
            // First, collect all unique section names across all results
            const allSectionNames = new Set<string>();
            visibleResults.forEach((result: any) => {
                if (result.sectionScores && Array.isArray(result.sectionScores)) {
                    result.sectionScores.forEach((section: any) => {
                        if (section.sectionName) {
                            allSectionNames.add(section.sectionName);
                        }
                    });
                }
            });
            const sortedSectionNames = Array.from(allSectionNames).sort();

            // Create header row: Assessment Name, Date of Test, Total Marks Possible, then section-wise total marks
            const headerRow = ['Assessment Name', 'Date of Test', 'Total Marks Possible'];
            sortedSectionNames.forEach((sectionName) => {
                headerRow.push(`${sectionName} - Total Marks`);
            });
            csvContent.push(headerRow);

            // Process each result
            visibleResults.forEach((result: any) => {
                const assessment = result.assessmentId;
                const assessmentName = assessment?.title || 'N/A';

                // Get date of test (prefer endTime, fallback to createdAt)
                let dateOfTest: string;
                if (result.endTime) {
                    dateOfTest = new Date(result.endTime).toLocaleDateString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                } else if (result.createdAt) {
                    dateOfTest = new Date(result.createdAt).toLocaleDateString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                } else {
                    dateOfTest = 'N/A';
                }

                // Total marks possible
                const totalMarksPossible = result.totalMarksPossible?.toString() || '0';

                // Build data row
                const dataRow = [assessmentName, dateOfTest, totalMarksPossible];

                // Add section-wise total marks (in the same order as header)
                sortedSectionNames.forEach((sectionName) => {
                    const section = result.sectionScores?.find((s: any) => s.sectionName === sectionName);
                    const sectionTotalMarks = section?.totalMarks?.toString() || '0';
                    dataRow.push(sectionTotalMarks);
                });

                csvContent.push(dataRow);
            });

            // Convert to CSV string
            const csv = csvContent
                .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                .join('\n');

            return csv;
        } catch (error) {
            logger.error('Error exporting user results by date range:', `userId: ${userId}`, error);
            throw error;
        }
    }
} 