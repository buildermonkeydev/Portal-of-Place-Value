import {
    CreateAssessmentDto,
    UpdateAssessmentDto,
    AssessmentResponseDto,
    AssessmentWithQuestionsDto,
    CreateQuestionInlineDto,
} from '../dto/assessment.dto';
import { AssessmentStatus, AssessmentType, IAssessment, IAssessmentDocument, QuestionResponseDto } from '../../../core/types';
import { AssessmentRepository } from '../repository/AssessmentRepository';
import { AssessmentResultRepository } from '../repository/AssessmentResultRepository';
import {
    toIndianTime,
    fromIndianTime,
    getCurrentIndianTime,
    isFutureDate,
    isPastDate,
    formatIndianDate,
    convert12To24Hour,
    parseTimeString,
    parseIST,
    convertISTtoUTC,
    parseDateTimeLocal
} from '../../../utils/dateUtils';
import mongoose from 'mongoose';
import Config from '@repo/env-config';
import { QuestionService } from '../../questions/service/QuestionService';
import EmailService from '../../../core/services/EmailService';
import { UserService } from '../../users/services/UserService';
import { User } from '../../users/models/User';
import { logger } from '../../../utils/logger';
import { assessmentCachedService } from '../../../cached/assessment.cached.service';

const config = Config.getInstance();
export class AssessmentService {
    private assessmentRepository: AssessmentRepository;
    private assessmentResultRepository: AssessmentResultRepository;
    private emailService: EmailService | null;
    private questionService: QuestionService;
    private userService: UserService;

    constructor(
        assessmentRepository: AssessmentRepository,
        questionService: QuestionService,
        userService: UserService
    ) {
        this.assessmentRepository = assessmentRepository;
        this.questionService = questionService;
        this.userService = userService;
        this.emailService = null; // Lazy initialization
        this.assessmentResultRepository = new AssessmentResultRepository();
    }

    /**
     * Lazy getter for email service to avoid Redis dependency during instantiation
     */
    private getEmailService(): EmailService {
        if (!this.emailService) {
            this.emailService = new EmailService();
        }
        return this.emailService;
    }
async getUserIdsOfGivenColleges(id: string): Promise<string[]> {
    try {
        console.log("id", id);

        const users = await User.find({ "college._id": new mongoose.Types.ObjectId(id) });
        console.log("users", users);
        return users?.map(user => user._id.toString()); // Convert ObjectId to string

    } catch (error) {
        logger.error('Error getting user IDs of given colleges', `id: ${id}`, error instanceof Error ? error.message : String(error));
        return []
    }
}

    async getUserIdsFromCollegeFilters(collegeData: {
        _id: string;
        branches?: {
            _id: string;
            name: string;
        }[];
        year?: number[];
    }): Promise<string[]> {
        try {
            console.log("Getting users for college filter:", collegeData);

            // Build the query filter
            const filter: any = {
                "college._id": new mongoose.Types.ObjectId(collegeData._id),
                isActive: true
            };

            // Add branch filter if provided
            if (collegeData.branches && collegeData.branches.length > 0) {
                filter["branch._id"] = {
                    $in: collegeData.branches.map(branch => new mongoose.Types.ObjectId(branch._id))
                };
            }

            // Add year filter if provided
            if (collegeData.year && collegeData.year.length > 0) {
                filter.collegeYear = { $in: collegeData.year };
            }

            const users = await User.find(filter);
            console.log(`Found ${users.length} users for college ${collegeData._id}`);

            return users.map(user => (user._id as mongoose.Types.ObjectId).toString());

        } catch (error) {
            logger.error('Error getting user IDs for college filters', '', error instanceof Error ? error.message : String(error));
            return [];
        }
    }

    async createAssessment(assessmentData: CreateAssessmentDto, adminId: string): Promise<AssessmentResponseDto> {
        try {
            let questionIds: string[] = [];
            let codingQuestions: { _id: string, section: string, score: number }[] = [];
            let calculatedTotalMarks = 0;

            if (assessmentData.questionsToCreate && assessmentData.questionsToCreate.length > 0) {
                const createdQuestions = await this.createQuestionsInline(assessmentData.questionsToCreate, adminId);
                questionIds = createdQuestions.map(q => q._id);
                calculatedTotalMarks += createdQuestions.reduce((sum, q) => sum + q.marks, 0);
            } else if (assessmentData.questions && assessmentData.questions.length > 0) {
                const questions = await this.questionService.getQuestionsByIds(assessmentData.questions);
                if (questions.length !== assessmentData.questions.length) {
                    throw new Error('Some questions are invalid or inactive');
                }
                questionIds = assessmentData.questions;
                calculatedTotalMarks += questions.reduce((sum, q) => sum + q.marks, 0);
            }

            // Handle coding questions
            if (assessmentData.codingQuestions && assessmentData.codingQuestions.length > 0) {
                codingQuestions = assessmentData.codingQuestions;
                calculatedTotalMarks += codingQuestions.reduce((sum, cq) => sum + cq.score, 0);
            }

            const assessmentType = assessmentData.type || AssessmentType.MCQ;
            if (assessmentType === AssessmentType.MCQ) {
                codingQuestions = [];
                calculatedTotalMarks = 0;
                if (assessmentData.questionsToCreate && assessmentData.questionsToCreate.length > 0) {
                    const createdQuestions = await this.createQuestionsInline(assessmentData.questionsToCreate, adminId);
                    calculatedTotalMarks += createdQuestions.reduce((sum, q) => sum + q.marks, 0);
                } else if (assessmentData.questions && assessmentData.questions.length > 0) {
                    const questions = await this.questionService.getQuestionsByIds(assessmentData.questions);
                    calculatedTotalMarks += questions.reduce((sum, q) => sum + q.marks, 0);
                }
                logger.info(`MCQ Assessment: Removed coding questions, total marks: ${calculatedTotalMarks}`);
            } else if (assessmentType === AssessmentType.CODING) {
                questionIds = [];
                calculatedTotalMarks = 0;
                if (assessmentData.codingQuestions && assessmentData.codingQuestions.length > 0) {
                    calculatedTotalMarks += codingQuestions.reduce((sum, cq) => sum + cq.score, 0);
                }
                logger.info(`CODING Assessment: Removed MCQ questions, total marks: ${calculatedTotalMarks}`);
            }
            const totalQuestions = questionIds.length + codingQuestions.length;
            if (assessmentData.totalMarks && totalQuestions > 0 && assessmentData.totalMarks !== calculatedTotalMarks) {
                throw new Error(`Total marks mismatch. Expected: ${calculatedTotalMarks}, Provided: ${assessmentData.totalMarks}`);
            }

            let assignedUserIds: string[] = [];
            if (assessmentData.assignedUsers === 'all') {
                const allUsers = await this.userService.getAllUsers(1, 1000);
                assignedUserIds = allUsers.users.map(user => user._id.toString());
                if (assignedUserIds.length === 0) {
                    throw new Error('No users found in the system');
                }
            } else {
                assignedUserIds = assessmentData.assignedUsers;
            }

            if (assessmentData.colleges && assessmentData.colleges.length > 0) {
                const collegeUserIds = await Promise.all(
                    assessmentData.colleges.map(async (college) => {
                        return await this.getUserIdsFromCollegeFilters(college);
                    })
                );

                const flattenedUserIds = collegeUserIds.flat();
                assignedUserIds = [...assignedUserIds, ...flattenedUserIds];

                assignedUserIds = [...new Set(assignedUserIds)];
            }


            let invitedUsers: string[] = [];
            if (assessmentData.invitedUsers && assessmentData.invitedUsers.length > 0) {

                const reversedUsers = assessmentData.invitedUsers?.reverse();
                console.log("reversedUsers", reversedUsers);
                for (let i = 0; i < reversedUsers.length; i++) {
                    const email = reversedUsers[i];
                    if (!email) continue;

                    try {
                        const existingUser = await this.userService.getUserByEmail(email);
                        if (existingUser) {
                            const userId = (existingUser as any)._id.toString();
                            if (!assignedUserIds.includes(userId)) {
                                assignedUserIds.push(userId);
                                logger.info(`Added existing user ${email} to assigned users for assessment`);
                            }
                        } else {
                            invitedUsers.push(email)

                        }
                        // }
                    } catch (error) {
                        logger.warn(`Failed to process invited user ${email}:`, error);
                    }
                }
            }

            console.log("assignedUserIds", assignedUserIds);
            console.log("assessmentData.invitedUsers", assessmentData.invitedUsers);


            const createData: any = {
                ...assessmentData,
                questions: questionIds,
                assignedUsers: assignedUserIds,
                invitedUsers: assessmentData.invitedUsers,
                totalMarks: questionIds.length > 0 ? calculatedTotalMarks : (assessmentData.totalMarks || 0),
                createdBy: adminId,
                status: AssessmentStatus.ACTIVE,
            };

            if (typeof createData.showResultsToUsers === 'undefined') {
                createData.showResultsToUsers = false;
            }

            // Handle start date and time (now combined in datetime-local format)
            if (assessmentData.startDate) {
                try {
                    console.log(`startDate: -> ${assessmentData.startDate}`);

                    const startDateStr = String(assessmentData.startDate);
                    console.log(`startDateStr: -> ${startDateStr}`);

                    createData.startDate = parseDateTimeLocal(startDateStr);
                    console.log(`Saving startDate: ${startDateStr} -> ${createData.startDate.toISOString()}`);
                } catch (error) {
                    console.error('Start date parsing error:', error);
                    throw new Error('Invalid start date format');
                }
            }

            if (assessmentData.endDate) {
                try {
                    console.log(`endDate: -> ${assessmentData.endDate}`);

                    const endDateStr = String(assessmentData.endDate);
                    createData.endDate = parseDateTimeLocal(endDateStr);
                    console.log(`Saving endDate: ${endDateStr} -> ${createData.endDate.toISOString()}`);
                } catch (error) {
                    console.error('End date parsing error:', error);
                    throw new Error('Invalid end date format');
                }
            }


            // Create assessment with the question IDs (can be empty array)
            const newAssessment = await this.assessmentRepository.create(createData);

            // Convert to response DTO
            const assessmentResponse = this.toAssessmentResponseDto(newAssessment);

            try {
                await this.sendAssessmentInvitations(newAssessment);
                logger.info(`Assessment invitations queued for ${assignedUserIds.length} users for assessment: ${assessmentResponse._id}`);
            } catch (emailError) {
                logger.warn(`Assessment created but failed to send invitations: ${emailError}`);
                // Don't fail the assessment creation if email sending fails
            }
            // } else {
            //     logger.info(`Assessment created without sending emails (sendEmails: false) for assessment: ${assessmentResponse._id}`);
            // }

            if (invitedUsers && invitedUsers.length > 0) {

                const reversedUsers = invitedUsers.reverse();
                console.log("reversedUsers", reversedUsers);
                for (let i = 0; i < reversedUsers.length; i++) {
                    const email = reversedUsers[i];
                    if (!email) continue;

                    try {

                        await this.sendInvitationToNonRegisteredUser(email, assessmentData);
                        logger.info(`Queued invitation email to non-registered user: ${email}`);

                    } catch (error) {
                        logger.warn(`Failed to process invited user ${email}:`, error);

                    }
                }
            }

            logger.info(`Assessment created successfully by admin ${adminId}: ${assessmentResponse._id}`);

            // Invalidate all assessment caches after successful creation
            try {
                await assessmentCachedService.invalidateAllAssessmentCaches();
                logger.debug(`All assessment caches invalidated after creation: ${assessmentResponse._id}`);
            } catch (cacheError) {
                logger.warn(`Failed to invalidate assessment cache after creation: ${cacheError}`);
            }

            return assessmentResponse;
        } catch (error) {
            logger.error('Error creating assessment', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async createCloneAssessment(assessmentData: CreateAssessmentDto, adminId: string): Promise<AssessmentResponseDto> {
        try {
            let questionIds: string[] = [];
            let codingQuestions: { _id: string, section: string, score: number }[] = [];
            let calculatedTotalMarks = 0;

            // Handle questions - either existing questions or create new ones
            if (assessmentData.questionsToCreate && assessmentData.questionsToCreate.length > 0) {
                // Create new questions inline
                const createdQuestions = await this.createQuestionsInline(assessmentData.questionsToCreate, adminId);
                questionIds = createdQuestions.map(q => q._id);
                calculatedTotalMarks = createdQuestions.reduce((sum, q) => sum + q.marks, 0);
            } else if (assessmentData.questions && assessmentData.questions.length > 0) {
                // Use existing questions
                const questions = await this.questionService.getQuestionsByIds(assessmentData.questions);
                if (questions.length !== assessmentData.questions.length) {
                    throw new Error('Some questions are invalid or inactive');
                }
                questionIds = assessmentData.questions;
                calculatedTotalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
            }

            // Handle coding questions
            if (assessmentData.codingQuestions && assessmentData.codingQuestions.length > 0) {
                codingQuestions = assessmentData.codingQuestions;
                calculatedTotalMarks += codingQuestions.reduce((sum, cq) => sum + cq.score, 0);
            }

            // Validate total marks if provided, otherwise use calculated value
            const totalQuestions = questionIds.length + codingQuestions.length;
            if (assessmentData.totalMarks && totalQuestions > 0 && assessmentData.totalMarks !== calculatedTotalMarks) {
                throw new Error(`Total marks mismatch. Expected: ${calculatedTotalMarks}, Provided: ${assessmentData.totalMarks}`);
            }

            // Handle assigned users - if 'all', fetch all user IDs
            let assignedUserIds: string[] = [];
            if (assessmentData.assignedUsers === 'all') {
                // Get all active users
                const allUsers = await this.userService.getAllUsers(1, 1000); // Get up to 1000 users
                assignedUserIds = allUsers.users.map(user => user._id.toString());
                if (assignedUserIds.length === 0) {
                    throw new Error('No users found in the system');
                }
            } else {
                assignedUserIds = assessmentData.assignedUsers;
            }

            // Handle college-based user assignment
            if (assessmentData.colleges && assessmentData.colleges.length > 0) {
                const collegeUserIds = await Promise.all(
                    assessmentData.colleges.map(async (college) => {
                        return await this.getUserIdsFromCollegeFilters(college);
                    })
                );

                // Flatten the array and add to assigned users
                const flattenedUserIds = collegeUserIds.flat();
                assignedUserIds = [...assignedUserIds, ...flattenedUserIds];

                // Remove duplicates
                assignedUserIds = [...new Set(assignedUserIds)];
            }


            let invitedUsers: string[] = [];
            if (assessmentData.invitedUsers && assessmentData.invitedUsers.length > 0) {

                const reversedUsers = assessmentData.invitedUsers?.reverse();
                console.log("reversedUsers", reversedUsers);
                // Check each invited user email with 3-second delay
                for (let i = 0; i < reversedUsers.length; i++) {
                    const email = reversedUsers[i];
                    if (!email) continue; // Skip if email is undefined

                    try {
                        // Check if user exists with this email
                        const existingUser = await this.userService.getUserByEmail(email);
                        if (existingUser) {
                            const userId = (existingUser as any)._id.toString();
                            if (!assignedUserIds.includes(userId)) {
                                assignedUserIds.push(userId);
                                logger.info(`Added existing user ${email} to assigned users for assessment`);
                            }
                        } else {
                            invitedUsers.push(email)

                        }
                        // }
                    } catch (error) {
                        logger.warn(`Failed to process invited user ${email}:`, error);
                        // Continue with other users even if one fails
                    }
                }
            }

            console.log("assignedUserIds", assignedUserIds);
            console.log("assessmentData.invitedUsers", assessmentData.invitedUsers);


            const createData: any = {
                ...assessmentData,
                questions: questionIds,
                codingQuestions: codingQuestions,
                assignedUsers: assignedUserIds,
                invitedUsers: assessmentData.invitedUsers,
                totalMarks: (questionIds.length > 0 || codingQuestions.length > 0) ? calculatedTotalMarks : (assessmentData.totalMarks || 0),
                createdBy: adminId,
                status: AssessmentStatus.ACTIVE,
            };

            // Handle start date and time (now combined in datetime-local format)
            // if (assessmentData.startDate) {
            //     try {
            //         console.log(`startDate: -> ${assessmentData.startDate}`);

            //         const startDateStr = String(assessmentData.startDate);
            //         console.log(`startDateStr: -> ${startDateStr}`);

            //         createData.startDate = parseDateTimeLocal(startDateStr);
            //         console.log(`Saving startDate: ${startDateStr} -> ${createData.startDate.toISOString()}`);
            //     } catch (error) {
            //         console.error('Start date parsing error:', error);
            //         throw new Error('Invalid start date format');
            //     }
            // }

            // if (assessmentData.endDate) {
            //     try {
            //         console.log(`endDate: -> ${assessmentData.endDate}`);

            //         const endDateStr = String(assessmentData.endDate);
            //         createData.endDate = parseDateTimeLocal(endDateStr);
            //         console.log(`Saving endDate: ${endDateStr} -> ${createData.endDate.toISOString()}`);
            //     } catch (error) {
            //         console.error('End date parsing error:', error);
            //         throw new Error('Invalid end date format');
            //     }
            // }


            // Create assessment with the question IDs (can be empty array)
            const newAssessment = await this.assessmentRepository.create(createData);

            // Convert to response DTO
            const assessmentResponse = this.toAssessmentResponseDto(newAssessment);

            try {
                await this.sendAssessmentInvitations(newAssessment);
                logger.info(`Assessment invitations queued for ${assignedUserIds.length} users for assessment: ${assessmentResponse._id}`);
            } catch (emailError) {
                logger.warn(`Assessment created but failed to send invitations: ${emailError}`);
                // Don't fail the assessment creation if email sending fails
            }
            // } else {
            //     logger.info(`Assessment created without sending emails (sendEmails: false) for assessment: ${assessmentResponse._id}`);
            // }

            if (invitedUsers && invitedUsers.length > 0) {

                const reversedUsers = invitedUsers.reverse();
                console.log("reversedUsers", reversedUsers);
                for (let i = 0; i < reversedUsers.length; i++) {
                    const email = reversedUsers[i];
                    if (!email) continue;

                    try {
                        await this.sendInvitationToNonRegisteredUser(email, assessmentData);
                        logger.info(`Queued invitation email to non-registered user: ${email}`);

                    } catch (error) {
                        logger.warn(`Failed to process invited user ${email}:`, error);

                    }
                }
            }

            logger.info(`Assessment created successfully by admin ${adminId}: ${assessmentResponse._id}`);

            // Invalidate all assessment caches after successful clone creation
            try {
                await assessmentCachedService.invalidateAllAssessmentCaches();
                logger.debug(`All assessment caches invalidated after clone creation: ${assessmentResponse._id}`);
            } catch (cacheError) {
                console.log("cacheError in cloneAssessment", cacheError)
                logger.warn(`Failed to invalidate assessment cache after clone: ${cacheError}`);
            }

            return assessmentResponse;
        } catch (error) {
            logger.error('Error creating assessment', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }


    async getAssessmentById(id: string): Promise<AssessmentResponseDto | null> {
        try {
            let assessment = await assessmentCachedService.getAssessment(id);

            if (!assessment) {
                const dbAssessment = await this.assessmentRepository.findById(id);
                if (!dbAssessment) {
                    return null;
                }
                assessment = this.toAssessmentResponseDto(dbAssessment);
                await assessmentCachedService.setAssessment(id, assessment);
            }

            return assessment;
        } catch (error) {
            logger.error(`Error getting assessment by ID ${id}:`, error);
            throw error;
        }
    }

    async getAssessmentGoogleFormById(userId: string, resultId: string): Promise<string | null> {
        try {
            const dbAssessment = await this.assessmentResultRepository.findByUserAndAssessment(userId, resultId);
            if (!dbAssessment) {
                return null;
            }
            return dbAssessment.assessmentId;
        } catch (error) {
            logger.error(`Error getting assessment by ID ${resultId}:`, error);
            throw error;
        }
    }

    async updateQuestion(questionId: string, updateData: any): Promise<QuestionResponseDto | null> {
        try {
            const assessment = await this.questionService.getQuestionById(questionId);
            if (!assessment) {
                return null;
            }

            const updatedAssessment = await this.questionService.updateQuestion(questionId, updateData);

            if (!updatedAssessment) {
                return null;
            }

            return updatedAssessment
        } catch (error) {
            logger.error(`Error updating question ${questionId}:`, error);
            throw error;
        }
    }

    async createQuestionInAssessment(assessmentId: string, questionData: CreateQuestionInlineDto): Promise<CreateQuestionInlineDto | null> {
        try {
            const assessment = await this.assessmentRepository.findByIdRaw(assessmentId);
            if (!assessment) {
                return null;
            }

            const newQuestion = await this.questionService.createQuestion(questionData, assessment.createdBy + "");

            if (!newQuestion) {
                return null;
            }

            const updateAssessment = await this.assessmentRepository.update(assessmentId, {
                questions: [...assessment.questions, newQuestion._id],
            });

            return newQuestion;
        } catch (error) {
            logger.error(`Error creating question in assessment ${assessmentId}:`, error);
            throw error;
        }
    }

    async getAssessmentByIdWithQuestions(userId: string, id: string, isAdmin: boolean): Promise<AssessmentWithQuestionsDto | null> {
        try {
            const assessment = await this.assessmentRepository.findById(id);
            if (!assessment) {
                return null;
            }

            if (!isAdmin && !assessment.assignedUsers) {
                return null;
            }
            return this.toAssessmentWithQuestionsDto(assessment);
        } catch (error) {
            logger.error(`Error getting assessment by ID with questions ${id}:`, error);
            throw error;
        }
    }

    async getAssessmentByResultIdIdWithQuestions(userId: string, resultId: string): Promise<any | null> {
        try {
            const assessment = await this.assessmentResultRepository.findByUserAndAssessment(userId, resultId);
            if (!assessment) {
                return null;
            }

            const { assignedUsers, ...rest } = this.toAssessmentWithQuestionsDto(assessment);

            return rest;
        } catch (error) {
            logger.error(`Error getting assessment result by ID with questions ${userId}:`, error);
            throw error;
        }
    }

    async getAllAssessments(page: number = 1, limit: number = 10, filter: any = {}): Promise<{
        assessments: AssessmentResponseDto[];
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
            // Create cache key based on filter and pagination
            const filterKey = JSON.stringify({ page, limit, filter });

            let cachedResult = await assessmentCachedService.getAssessmentListWithPagination(filterKey);

            if (!cachedResult) {
                const options = { page, limit };
                const result = await this.assessmentRepository.getAssessmentsWithPagination(filter, options);

                const response = {
                    assessments: result.assessments.map((assessment: any) => this.toAssessmentResponseDtoForList(assessment)),
                    pagination: result.pagination,
                };


                return response;
            }

            logger.debug(`Assessment list cache hit: ${filterKey}`);
            return cachedResult;
        } catch (error) {
            logger.error('Error getting all assessments:', error);
            throw error;
        }
    }





    async updateAssessment(id: string, assessmentData: UpdateAssessmentDto): Promise<AssessmentResponseDto | null> {
        try {
            // Check if assessment exists
            console.log("assessmentData", assessmentData)
            const existingAssessment = await this.assessmentRepository.findByIdRaw(id) as unknown as any;
            if (!existingAssessment) {
                return null;
            }

            let questionIds: string[] = [...existingAssessment.questions];
            let calculatedTotalMarks = existingAssessment.totalMarks;
            let latestAssignedUsers: string[] = [];
            let latestInvitedUsers: string[] = [];



            if (assessmentData.questionsToCreate && assessmentData.questionsToCreate.length > 0) {
                const createdQuestions = await this.createQuestionsInline(assessmentData.questionsToCreate, existingAssessment.createdBy?._id + "");
                const newQuestionIds = createdQuestions.map(q => q._id);

                questionIds = [...existingAssessment.questions, ...newQuestionIds];

                const existingQuestions = await this.questionService.getQuestionsByIds(existingAssessment.questions);
                const allQuestions = [...existingQuestions, ...createdQuestions];
                calculatedTotalMarks = allQuestions.reduce((sum, q) => sum + q.marks, 0);
            } else if (assessmentData.questions !== undefined) {
                if (assessmentData.questions.length > 0) {
                    const questions = await this.questionService.getQuestionsByIds(assessmentData.questions);
                    if (questions.length !== assessmentData.questions.length) {
                        throw new Error('Some questions are invalid or inactive');
                    }
                    questionIds = assessmentData.questions;
                    calculatedTotalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
                } else {
                    questionIds = [];
                    calculatedTotalMarks = 0;
                }
            }

            let codingQuestions: { _id: string, section: string, score: number }[] = [];
            if (assessmentData.codingQuestions !== undefined) {
                codingQuestions = assessmentData.codingQuestions;
                calculatedTotalMarks += codingQuestions.reduce((sum, cq) => sum + cq.score, 0);
            } else {
                codingQuestions = existingAssessment.codingQuestions || [];
                calculatedTotalMarks += codingQuestions.reduce((sum, cq) => sum + cq.score, 0);
            }

            let assignedUserIds: string[] = [];
            if (assessmentData.assignedUsers === 'all') {
                const allUsers = await this.userService.getAllUsers(1, 1000); // Get up to 1000 users
                assignedUserIds = allUsers.users.map(user => user._id.toString());
                if (assignedUserIds.length === 0) {
                    throw new Error('No users found in the system');
                }
            } else if (assessmentData.assignedUsers !== undefined) {
                // Replace existing assigned users with new ones (don't merge)
                assignedUserIds = (assessmentData.assignedUsers as string[]) || [];
                latestAssignedUsers = assignedUserIds;
            } else {
                // If no new assigned users provided, keep existing ones
                assignedUserIds = existingAssessment.assignedUsers?.map((id: any) => id.toString()) || [];
            }

            // Handle college-based user assignment
            if (assessmentData.colleges && assessmentData.colleges.length > 0) {
                const collegeUserIds = await Promise.all(
                    assessmentData.colleges.map(async (college) => {
                        return await this.getUserIdsFromCollegeFilters(college);
                    })
                );

                const flattenedUserIds = collegeUserIds.flat();
                assignedUserIds = [...assignedUserIds, ...flattenedUserIds];

                assignedUserIds = [...new Set(assignedUserIds)];
            }


            const updateData: any = {
                ...assessmentData,
                questions: questionIds,
                codingQuestions: codingQuestions,
                totalMarks: calculatedTotalMarks || assessmentData.totalMarks,
            };

            if (assessmentData.invitedUsers !== undefined) {
                // Explicitly provided - replace existing list (could be empty array to clear)
                const newInvitedUsers = (assessmentData.invitedUsers as string[]) || [];
                const existingInvitedUsers = existingAssessment.invitedUsers?.map((em: any) => em.toString()) || [];

                // Process ALL invitedUsers emails: check if user exists, if yes add to assignedUsers
                const finalInvitedUsers: string[] = [];
                const emailsToProcess = [...newInvitedUsers]; // Process all emails in the new list
                const newlyAddedEmails = newInvitedUsers.filter(
                    (email: string) => !existingInvitedUsers.includes(email)
                );

                for (const email of emailsToProcess) {
                    if (!email) continue;

                    try {
                        const existingUser = await this.userService.getUserByEmail(email);
                        if (existingUser) {
                            // User exists - add to assignedUsers instead of invitedUsers
                            const userId = (existingUser as any)._id.toString();
                            if (!assignedUserIds.includes(userId)) {
                                assignedUserIds.push(userId);
                                logger.info(`Moved existing user ${email} from invitedUsers to assignedUsers`);
                            }
                            // Don't add to finalInvitedUsers - user exists, so they're assigned, not invited
                        } else {
                            // User doesn't exist - keep in invitedUsers
                            finalInvitedUsers.push(email);
                        }
                    } catch (error) {
                        // If we can't check the user, keep them in invitedUsers to be safe
                        logger.warn(`Failed to check if user exists for email ${email}, keeping in invitedUsers:`, error);
                        finalInvitedUsers.push(email);
                    }
                }

                // latestInvitedUsers should only contain newly added emails that don't exist as users (for sending invitations)
                latestInvitedUsers = newlyAddedEmails.filter(email => finalInvitedUsers.includes(email));

                // Replace with the filtered list (only non-existent users)
                updateData.invitedUsers = finalInvitedUsers;
                logger.info(`Processed invitedUsers: ${newInvitedUsers.length} provided -> ${finalInvitedUsers.length} non-existent users kept in invitedUsers, ${newInvitedUsers.length - finalInvitedUsers.length} existing users moved to assignedUsers`);
            } else if (
                assessmentData.assignedUsers !== undefined &&
                Array.isArray(assessmentData.assignedUsers) &&
                assessmentData.assignedUsers.length === 0 &&
                (!assessmentData.colleges || assessmentData.colleges.length === 0)
            ) {
                // If assignedUsers was explicitly cleared (empty array) and no colleges, also clear invitedUsers
                latestInvitedUsers = [];
                updateData.invitedUsers = [];
                logger.info('Clearing invitedUsers because assignedUsers was explicitly cleared and no colleges assigned');
            } else {
                // Preserve existing invitedUsers if not explicitly provided, but still check if any existing users should be moved
                const existingInvitedUsersList = existingAssessment.invitedUsers?.map((em: any) => em.toString()) || [];
                const finalInvitedUsers: string[] = [];

                for (const email of existingInvitedUsersList) {
                    if (!email) continue;

                    try {
                        const existingUser = await this.userService.getUserByEmail(email);
                        if (existingUser) {
                            // User exists - add to assignedUsers instead of keeping in invitedUsers
                            const userId = (existingUser as any)._id.toString();
                            if (!assignedUserIds.includes(userId)) {
                                assignedUserIds.push(userId);
                                logger.info(`Moved existing user ${email} from invitedUsers to assignedUsers`);
                            }
                            // Don't add to finalInvitedUsers
                        } else {
                            // User doesn't exist - keep in invitedUsers
                            finalInvitedUsers.push(email);
                        }
                    } catch (error) {
                        // If we can't check, keep in invitedUsers to be safe
                        logger.warn(`Failed to check if user exists for email ${email}, keeping in invitedUsers:`, error);
                        finalInvitedUsers.push(email);
                    }
                }

                latestInvitedUsers = [];
                updateData.invitedUsers = finalInvitedUsers;
                logger.info(`Processed existing invitedUsers: ${existingInvitedUsersList.length} existing -> ${finalInvitedUsers.length} non-existent users kept`);
            }

            // Update total marks if questions changed
            if (assessmentData.totalMarks === undefined) {
                assessmentData.totalMarks = calculatedTotalMarks;
            }

            // Handle start date - save as entered using utility
            if (assessmentData.startDate) {
                try {
                    const startDateStr = String(assessmentData.startDate);
                    updateData.startDate = parseDateTimeLocal(startDateStr);
                    console.log(`Saving startDate: ${startDateStr} -> ${updateData.startDate.toISOString()}`);
                } catch (error) {
                    console.error('Start date parsing error:', error);
                    throw new Error('Invalid start date format');
                }
            }

            if (assessmentData.endDate) {
                try {
                    const endDateStr = String(assessmentData.endDate);
                    updateData.endDate = parseDateTimeLocal(endDateStr);
                    console.log(`Saving endDate: ${endDateStr} -> ${updateData.endDate.toISOString()}`);
                } catch (error) {
                    console.error('End date parsing error:', error);
                    throw new Error('Invalid end date format');
                }
            }

            if (assignedUserIds !== undefined) {
                assignedUserIds = Array.from(new Set(assignedUserIds));
                updateData.assignedUsers = assignedUserIds;
            }

            console.log("updateData", updateData)
            console.log("updateData.assignedUsers", updateData.assignedUsers)

            // if (invitedUsers !== undefined) {
            //     updateData.invitedUsers = invitedUsers;
            // }


            const updatedAssessment = await this.assessmentRepository.update(id, updateData);

            if (!updatedAssessment) {
                return null;
            }

            const response = this.toAssessmentResponseDto(updatedAssessment);

            // Calculate newly added users by comparing existing with new assigned users
            const existingAssignedUserIds = (existingAssessment.assignedUsers || []).map((id: any) => id.toString());
            const newlyAddedUserIds = assignedUserIds.filter(
                (userId: string) => !existingAssignedUserIds.includes(userId)
            );

            logger.info(`Assessment update email check:`, {
                assessmentId: id,
                existingAssignedCount: existingAssignedUserIds.length,
                newAssignedCount: assignedUserIds.length,
                newlyAddedCount: newlyAddedUserIds.length,
                existingUserIds: existingAssignedUserIds.slice(0, 5), // Log first 5 for debugging
                newUserIds: assignedUserIds.slice(0, 5),
                newlyAddedUserIds: newlyAddedUserIds.slice(0, 5)
            });

            // Only send emails to newly added users who haven't already taken the assessment
            if (newlyAddedUserIds && newlyAddedUserIds.length > 0) {
                logger.info(`Sending invitation emails to ${newlyAddedUserIds.length} newly added users`);

                const reversedUsers = [...newlyAddedUserIds].reverse();
                let emailsQueued = 0;
                let emailsSkipped = 0;
                let emailsFailed = 0;

                for (const userId of reversedUsers) {
                    try {
                        // Check if user already has a result for this assessment (already allotted)
                        const hasExistingResult = await this.assessmentResultRepository.isAssessmentTaken(userId, id);
                        if (hasExistingResult) {
                            logger.info(`Skipping email for user ${userId} - already has result for assessment ${id}`);
                            emailsSkipped++;
                            continue;
                        }

                        const existingUser = await this.userService.getUserById(userId);
                        if (!existingUser) {
                            logger.warn(`User ${userId} not found, skipping email`);
                            emailsSkipped++;
                            continue;
                        }

                        // Ensure email service is ready
                        const emailService = this.getEmailService();
                        if (!emailService.isReady()) {
                            logger.error(`Email service not ready, cannot send invitation to ${existingUser.email}`);
                            emailsFailed++;
                            continue;
                        }

                        await this.sendInvitationToRegisteredUser(
                            existingUser.email,
                            existingUser.firstName + " " + existingUser.lastName,
                            {
                                _id: updatedAssessment._id + "",
                                title: updatedAssessment.title ?? "",
                                description: updatedAssessment.description ?? "",
                                duration: updatedAssessment.duration,
                                totalMarks: updatedAssessment.totalMarks,
                                startDate: updatedAssessment.startDate ?? new Date(),
                                endDate: updatedAssessment.endDate ?? new Date(new Date().getTime() + 60 * 60 * 1000),
                            }
                        );
                        logger.info(`Successfully queued invitation email to newly added registered user: ${existingUser.email} (${existingUser.firstName} ${existingUser.lastName})`);
                        emailsQueued++;
                    } catch (error) {
                        logger.error(`Failed to send invitation email to newly added user ${userId}:`, {
                            error: error instanceof Error ? error.message : String(error),
                            stack: error instanceof Error ? error.stack : undefined
                        });
                        emailsFailed++;
                    }
                }

                logger.info(`Assessment update email summary:`, {
                    assessmentId: id,
                    totalNewUsers: newlyAddedUserIds.length,
                    emailsQueued,
                    emailsSkipped,
                    emailsFailed
                });
            } else {
                logger.info(`No newly added users to send invitation emails to (existing: ${existingAssignedUserIds.length}, new: ${assignedUserIds.length})`);
            }

            if (latestInvitedUsers && latestInvitedUsers.length > 0) {

                const reversedUsers = latestInvitedUsers.reverse();
                console.log("reversedUserIds", reversedUsers);
                for (const email of reversedUsers) {
                    try {
                        await this.sendInvitationToNonRegisteredUser(email, assessmentData);
                        logger.info(`Queued invitation email to non-registered user: ${email}`);

                    } catch (error) {
                        logger.warn(`Failed to process invited user ${email}:`, error);
                    }
                }
            }

            // Invalidate and update cache after successful update
            try {
                await assessmentCachedService.invalidateAssessmentCache(id);
                await assessmentCachedService.setAssessment(id, response);
                logger.debug(`Assessment cache invalidated and updated: ${id}`);
            } catch (cacheError) {
                logger.warn(`Failed to update assessment cache: ${cacheError}`);
            }

            return response;
        } catch (error) {
            logger.error(`Error updating assessment ${id}:`, error);
            throw error;
        }
    }

    async deleteAssessment(id: string): Promise<boolean> {
        try {
            const success = await this.assessmentRepository.delete(id);
            if (success) {
                logger.info(`Assessment deleted successfully: ${id}`);
                try {
                    logger.info(`Starting cache invalidation for deleted assessment: ${id}`);
                    await assessmentCachedService.invalidateAssessmentCache(id);
                    logger.info(`Assessment cache invalidated, now flushing all caches: ${id}`);
                    await assessmentCachedService.flushAllAssessmentCaches();
                    logger.info(`All assessment caches invalidated after deletion: ${id}`);
                } catch (cacheError) {
                    logger.error(`Failed to invalidate assessment cache: ${cacheError}`, { assessmentId: id, error: cacheError });
                }
            }
            return success;
        } catch (error) {
            logger.error(`Error deleting assessment ${id}:`, error);
            throw error;
        }
    }

    async activateAssessment(id: string): Promise<AssessmentResponseDto | null> {
        try {
            const assessment = await this.assessmentRepository.findById(id);
            if (!assessment) {
                return null;
            }

            // Check if assessment has assigned users
            if (assessment.assignedUsers.length === 0) {
                throw new Error('Cannot activate assessment without assigned users');
            }

            const updatedAssessment = await this.assessmentRepository.update(id, {
                status: AssessmentStatus.ACTIVE,
                startDate: getCurrentIndianTime(),
            });

            if (updatedAssessment) {
                // Send invitation emails to assigned users
                await this.sendAssessmentInvitations(updatedAssessment);
                logger.info(`Assessment activated: ${id}`);

                // Update cache after activation
                try {
                    const response = this.toAssessmentResponseDto(updatedAssessment);
                    await assessmentCachedService.setAssessment(id, response);
                    logger.debug(`Assessment cache updated after activation: ${id}`);
                } catch (cacheError) {
                    logger.warn(`Failed to update assessment cache after activation: ${cacheError}`);
                }
            }

            return updatedAssessment ? this.toAssessmentResponseDto(updatedAssessment) : null;
        } catch (error) {
            logger.error(`Error activating assessment ${id}:`, error);
            throw error;
        }
    }

    giveTypeOfCreateAssessment(assessment: IAssessmentDocument): CreateAssessmentDto {
        try {
            console.log("assessment", assessment.questions)
            const data: CreateAssessmentDto = {
                title: assessment.title,
                description: assessment.description ?? "",
                type: assessment.type,
                instruction: assessment.instruction ?? "",
                colleges: [],
                googleForm: assessment.googleForm,
                questions: assessment.questions || [],
                codingQuestions: assessment.codingQuestions || [], // Include coding questions for clone
                questionsToCreate: [],
                totalMarks: assessment.totalMarks,
                duration: assessment.duration,
                startDate: assessment.startDate ?? new Date(),
                endDate: assessment.endDate ?? new Date(new Date().getTime() + 60 * 60 * 1000),
                assignedUsers: [],
                invitedUsers: [],
                showResultsToUsers: assessment.showResultsToUsers ?? false,
            }


            return data;

        }
        catch (error) {
            logger.error(`Error giving type of create assessment ${assessment.title}:`, error);
            throw error;
        }
    }


    async cloneAssessment(id: string, userId: string): Promise<AssessmentResponseDto | null> {
        try {
            const assessment = await this.assessmentRepository.findByIdRaw(id);
            if (!assessment) {
                return null;
            }

            const createThis = this.giveTypeOfCreateAssessment(assessment);
            console.log("createThis", createThis)

            const created = await this.createCloneAssessment(createThis, userId);

            return created;
        } catch (error) {
            logger.error(`Error activating assessment ${id}:`, error);
            throw error;
        }
    }


    async deactivateAssessment(id: string): Promise<AssessmentResponseDto | null> {
        try {
            const updatedAssessment = await this.assessmentRepository.update(id, {
                status: AssessmentStatus.INACTIVE,
            });

            if (updatedAssessment) {
                logger.info(`Assessment deactivated: ${id}`);
            }

            return updatedAssessment ? this.toAssessmentResponseDto(updatedAssessment) : null;
        } catch (error) {
            logger.error(`Error deactivating assessment ${id}:`, error);
            throw error;
        }
    }

    async assignUsersToAssessment(assessmentId: string, userIds: string[]): Promise<AssessmentResponseDto | null> {
        try {
            // Validate users exist
            for (const userId of userIds) {
                const user = await this.userService.getUserById(userId);
                if (!user) {
                    throw new Error(`User ${userId} not found`);
                }
            }

            const updatedAssessment = await this.assessmentRepository.update(assessmentId, {
                assignedUsers: userIds,
            });

            if (updatedAssessment) {
                logger.info(`Users assigned to assessment ${assessmentId}: ${userIds.length} users`);
            }

            return updatedAssessment ? this.toAssessmentResponseDto(updatedAssessment) : null;
        } catch (error) {
            logger.error(`Error assigning users to assessment ${assessmentId}:`, error);
            throw error;
        }
    }

    async getAssessmentsForUser(userId: string): Promise<AssessmentResponseDto[]> {
        try {
            const assessments = await this.assessmentRepository.findByAssignedUser(userId);
            const data = assessments.map((assessment: IAssessmentDocument) => this.toAssessmentResponseDto(assessment));
            console.log("data", data);

            const updatedData = await Promise.all(data.map(async (assessment: AssessmentResponseDto) => {
                const isAssessmentTaken = await this.assessmentResultRepository.isAssessmentTaken(userId, assessment._id);
                let assessmentResultId: string | null = null;
                let assessmentState: any = null;

                if (isAssessmentTaken) {
                    const result = await this.assessmentResultRepository.getAssessmentResultFromAssessment(userId, assessment._id);
                    console.log("Result", result);
                    if (result?._id + "") {
                        assessmentResultId = result?._id + "";
                        if (result && result.status === 'in_progress') {
                            console.log("assessment.duration", assessment.duration)
                            // Calculate time remaining (using Indian time)
                            const assessmentDuration = assessment.duration * 60; // Convert to seconds
                            const now = getCurrentIndianTime();
                            console.log("now", now)
                            console.log("result.startTime", result.startTime)

                            // Convert start time to Indian time for proper comparison
                            const startTimeIndian = new Date(result.startTime.getTime() + (5.5 * 60 * 60 * 1000));
                            console.log("startTimeIndian", startTimeIndian)

                            const timeElapsed = Math.floor((now.getTime() - startTimeIndian.getTime()) / 1000);
                            console.log("timeElapsed", timeElapsed)
                            const timeRemaining = Math.max(0, assessmentDuration - timeElapsed);

                            // Check if time has expired
                            if (timeRemaining <= 0 && result.status === 'in_progress') {
                                // Auto-fail expired assessment
                                await this.assessmentResultRepository.update(result._id + "", {
                                    status: 'failed',
                                    endTime: now,
                                    duration: assessmentDuration,
                                    timeRemaining: 0
                                });
                                result.status = 'failed';
                                result.timeRemaining = 0;
                            }

                            assessmentState = {
                                status: result.status,
                                timeRemaining,
                                canContinue: result.status === 'in_progress',
                                isExpired: timeRemaining <= 0,
                                startTime: result.startTime,
                                responsesCount: result.responses?.length || 0
                            };
                        }
                    }
                }
                else {

                    console.log("assessment.duration", assessment.duration)
                    // Calculate time remaining (using Indian time)
                    const assessmentDuration = assessment.duration * 60; // Convert to seconds
                    const now = getCurrentIndianTime();
                    console.log("now", now)
                    console.log("assessment.startDate", assessment.startDate)

                    // Check if assessment end date has expired
                    let isExpired = false;
                    let timeRemaining = 0;

                    if (assessment.endDate) {
                        // If end date is set, check if it has passed
                        if (now.getTime() > assessment.endDate.getTime()) {
                            isExpired = true;
                            timeRemaining = 0;
                        } else {
                            // Calculate time remaining until end date
                            timeRemaining = Math.floor((assessment.endDate.getTime() - now.getTime()) / 1000);
                        }
                    } else {
                        // If no end date, calculate based on duration from start time
                        // Convert start date to Indian time for proper comparison
                        const startDateIndian = new Date(assessment.startDate!.getTime() + (5.5 * 60 * 60 * 1000));
                        console.log("startDateIndian", startDateIndian)

                        const timeElapsed = Math.floor((now.getTime() - startDateIndian.getTime()) / 1000);
                        console.log("timeElapsed", timeElapsed)
                        timeRemaining = Math.max(0, assessmentDuration - timeElapsed);
                        isExpired = timeRemaining <= 0;
                    }

                    // Always set assessmentState if expired, regardless of whether endDate exists
                    if (isExpired) {
                        assessmentState = {
                            status: 'expired',
                            timeRemaining: 0,
                            canContinue: false,
                            isExpired: true,
                            startTime: assessment.startDate,
                            responsesCount: 0
                        };
                    }

                    //                     68a39afdd6c06a8767ebadd6
                    // 68a39afdd6c06a8767ebadd7
                    // 68a39afdd6c06a8767ebadd8
                    // 68a39afdd6c06a8767ebadd9
                    // 68a39afdd6c06a8767ebadda
                    // 68a39afdd6c06a8767ebaddb
                    // 68a39afdd6c06a8767ebaddc


                    // For assessments not yet taken, we just need to check if they're expired


                }
                return {
                    ...assessment,
                    isTaken: isAssessmentTaken,
                    assessmentResultId: assessmentResultId,
                    assessmentState: assessmentState,
                };
            }));

            return updatedData as unknown as AssessmentResponseDto[];
        } catch (error) {
            logger.error(`Error getting assessments for user ${userId}:`, error);
            throw error;
        }
    }

    async getAvailableAssessmentsForUser(userId: string): Promise<AssessmentResponseDto[]> {
        try {
            const assessments = await this.assessmentRepository.findByAssignedUser(userId);
            // Filter only active assessments that the user can take
            const availableAssessments = assessments.filter(assessment =>
                assessment.status === AssessmentStatus.ACTIVE &&
                assessment.isActive &&
                (!assessment.startDate || assessment.startDate <= new Date()) &&
                (!assessment.endDate || assessment.endDate >= new Date())
            );
            return availableAssessments.map((assessment: IAssessmentDocument) => this.toAssessmentResponseDto(assessment));
        } catch (error) {
            logger.error(`Error getting available assessments for user ${userId}:`, error);
            throw error;
        }
    }

    async isUserAssigned(userId: string, assessment: any) {

        let isUserAssigned = false
        assessment.assignedUsers.map((ass: any) => {
            if (ass._id + "" === userId) {
                isUserAssigned = true;
            }
        })
        return isUserAssigned;
    }


    async getAssessmentForUserById(userId: string, assessmentId: string): Promise<AssessmentResponseDto | null> {
        try {
            const assessment = await this.assessmentRepository.findById(assessmentId);
            if (!assessment) {
                return null;
            }


            const isUserAssigned = await this.isUserAssigned(userId, assessment);
            // Check if user is assigned to this assessment
            if (!isUserAssigned) {
                return null;
            }

            const assessmentDto = this.toAssessmentResponseDto(assessment);

            // Get user-specific data
            const isAssessmentTaken = await this.assessmentResultRepository.isAssessmentTaken(userId, assessmentId);
            let assessmentResultId: string | null = null;
            let assessmentState: any = null;

            if (isAssessmentTaken) {
                const result = await this.assessmentResultRepository.getAssessmentResultFromAssessment(userId, assessmentId);
                if (result?._id) {
                    assessmentResultId = result._id.toString();
                    const existingResult = await this.assessmentResultRepository.findByUserAndAssessment(userId, assessmentId);
                    if (existingResult && existingResult.status === 'in_progress') {
                        // Calculate time remaining (using Indian time)
                        const assessmentDuration = assessment.duration * 60; // Convert to seconds
                        const now = getCurrentIndianTime();
                        const timeElapsed = Math.floor((now.getTime() - existingResult.startTime.getTime()) / 1000);
                        const timeRemaining = Math.max(0, assessmentDuration - timeElapsed);

                        // Check if time has expired
                        if (timeRemaining <= 0 && existingResult.status === 'in_progress') {
                            // Auto-fail expired assessment
                            await this.assessmentResultRepository.update(existingResult._id?.toString() || '', {
                                status: 'failed',
                                endTime: now,
                                duration: assessmentDuration,
                                timeRemaining: 0
                            });
                            existingResult.status = 'failed';
                            existingResult.timeRemaining = 0;
                        }

                        assessmentState = {
                            status: existingResult.status,
                            timeRemaining,
                            canContinue: existingResult.status === 'in_progress',
                            isExpired: timeRemaining <= 0,
                            startTime: existingResult.startTime,
                            responsesCount: existingResult.responses?.length || 0
                        };
                    }
                }
            }

            return {
                ...assessmentDto,
                isTaken: isAssessmentTaken,
                assessmentResultId: assessmentResultId,
                assessmentState: assessmentState,
            };
        } catch (error) {
            logger.error(`Error getting assessment ${assessmentId} for user ${userId}:`, error);
            throw error;
        }
    }



    async getMyAssessmentById(userId: string, assessmentId: string, isAdmin: boolean): Promise<any | null> {
        try {
            const assessment = await this.assessmentRepository.findById(assessmentId);
            console.log("assessment", assessment)

            if (!assessment) {
                return null;
            }


            const isUserAssigned = await this.isUserAssigned(userId, assessment);
            console.log("isUserAssigned", isUserAssigned, isAdmin)
            if (!isUserAssigned && !isAdmin) {
                return null;
            }

            const assessmentDto = this.toAssessmentResponseDto(assessment);

            // Get user-specific data
            const isAssessmentTaken = await this.assessmentResultRepository.isAssessmentTaken(userId, assessmentId);
            let assessmentResultId: string | null = null;
            let assessmentState: any = null;

            if (isAssessmentTaken) {
                const result = await this.assessmentResultRepository.getAssessmentResultFromAssessment(userId, assessmentId);
                if (result?._id) {
                    assessmentResultId = result._id.toString();
                    const existingResult = await this.assessmentResultRepository.findByUserAndAssessment(userId, assessmentId);
                    if (existingResult && existingResult.status === 'in_progress') {
                        // Calculate time remaining (using Indian time)
                        const assessmentDuration = assessment.duration * 60; // Convert to seconds
                        const now = getCurrentIndianTime();
                        const timeElapsed = Math.floor((now.getTime() - existingResult.startTime.getTime()) / 1000);
                        const timeRemaining = Math.max(0, assessmentDuration - timeElapsed);

                        // Check if time has expired
                        if (timeRemaining <= 0 && existingResult.status === 'in_progress') {
                            await this.assessmentResultRepository.update(existingResult._id?.toString() || '', {
                                status: 'failed',
                                endTime: now,
                                duration: assessmentDuration,
                                timeRemaining: 0
                            });
                            existingResult.status = 'failed';
                            existingResult.timeRemaining = 0;
                        }

                        assessmentState = {
                            status: existingResult.status,
                            timeRemaining,
                            canContinue: existingResult.status === 'in_progress',
                            isExpired: timeRemaining <= 0,
                            startTime: existingResult.startTime,
                            responsesCount: existingResult.responses?.length || 0
                        };
                    }
                }
            }

            const { assignedUsers, questions, codingQuestions, ...rest } = assessmentDto;
            return {
                ...rest,
                numberOfQuestions: questions?.length || 0,
                numberOfCodingQuestions: codingQuestions?.length || 0,
                isTaken: isAssessmentTaken,
                assessmentResultId: assessmentResultId,
                assessmentState: assessmentState,
            };
        } catch (error) {
            logger.error(`Error getting assessment ${assessmentId} for user ${userId}:`, error);
            throw error;
        }
    }

    async canUserTakeAssessment(userId: string, assessmentId: string): Promise<boolean> {
        try {
            const assessment = await this.assessmentRepository.findById(assessmentId);
            if (!assessment) {
                return false;
            }

            // Check if user is assigned to this assessment
            if (!assessment.assignedUsers.includes(userId)) {
                return false;
            }

            // Check if assessment is active
            if (assessment.status !== AssessmentStatus.ACTIVE || !assessment.isActive) {
                return false;
            }

            // Check if assessment is within time window (using Indian time)
            const now = getCurrentIndianTime();
            if (assessment.startDate && assessment.startDate > now) {
                return false;
            }
            if (assessment.endDate && assessment.endDate < now) {
                return false;
            }

            return true;
        } catch (error) {
            logger.error(`Error checking if user ${userId} can take assessment ${assessmentId}:`, error);
            return false;
        }
    }

    async searchAssessments(searchTerm: string, page: number = 1, limit: number = 10): Promise<{
        assessments: AssessmentResponseDto[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> {
        try {
            const options = { page, limit };
            const assessments = await this.assessmentRepository.searchAssessments(searchTerm, options);

            return {
                assessments: assessments.assessments.map((assessment: IAssessmentDocument) => this.toAssessmentResponseDto(assessment)),
                pagination: assessments.pagination
            };
        } catch (error) {
            logger.error(`Error searching assessments with term "${searchTerm}":`, error);
            throw error;
        }
    }

    private async createQuestionsInline(questionsData: CreateQuestionInlineDto[], adminId: string): Promise<QuestionResponseDto[]> {
        const createdQuestions: QuestionResponseDto[] = [];

        for (const questionData of questionsData) {
            try {
                const question = await this.questionService.createQuestion(questionData, adminId);
                if (question) {
                    createdQuestions.push(question);
                }
            } catch (error) {
                logger.error(`Error creating question inline:`, error);
                throw new Error(`Failed to create question: ${questionData.text}`);
            }
        }

        return createdQuestions;
    }

    private async sendAssessmentInvitations(assessment: IAssessmentDocument): Promise<void> {
        try {
            const emails: string[] = [];
            const assessmentData = {
                assessmentName: assessment.title,
                assessmentUrl: `${config.getUrlsConfig().assessmentsUrl}/${assessment._id}`,
                startTime: assessment.startDate ? formatIndianDate(assessment.startDate) : '',
                duration: `${assessment.duration} minutes`,
                instructions: assessment.description || ''
            };

            // Collect all user emails
            for (const userId of assessment.assignedUsers) {
                if (!userId) continue;
                const user = await this.userService.getUserById(userId);
                if (user) {
                    emails.push(user.email);
                }
            }

            // Queue all assessment invitations using EmailService
            if (emails.length > 0) {
                for (const email of emails) {
                    try {
                        await this.getEmailService().sendAssessmentInvitationEmail(
                            email,
                            'User', // Default name since we don't have user name here
                            {
                                assessmentId: (assessment._id as any).toString(),
                                assessmentTitle: assessmentData.assessmentName,
                                assessmentDescription: assessmentData.instructions,
                                assessmentType: 'Assessment',
                                duration: parseInt(assessmentData.duration),
                                instruction: assessmentData.instructions,
                                assessmentUrl: assessmentData.assessmentUrl
                            }
                        );
                    } catch (emailError) {
                        logger.warn(`Failed to send assessment invitation to ${email}:`, emailError);
                    }
                }
                logger.info(`Queued ${emails.length} assessment invitations for assessment: ${assessment._id}`);
            }
        } catch (error) {
            logger.error('Error queueing assessment invitations:', error);
            // Don't throw error here as it shouldn't fail the assessment activation
        }
    }

    private async sendInvitationToNonRegisteredUser(email: string, assessmentData: { title?: string; description?: string; duration?: number; totalMarks?: number; startDate?: Date; endDate?: Date }): Promise<void> {
        try {
            const registrationUrl = `${config.getUrlsConfig().registerUrl}/?email=${encodeURIComponent(email)}`;

            await this.getEmailService().sendAssessmentInvitationEmail(
                email,
                'User', // Default name for non-registered users
                {
                    assessmentId: 'new-assessment',
                    assessmentTitle: assessmentData.title || 'Assessment Invitation',
                    assessmentDescription: assessmentData.description,
                    assessmentType: 'Assessment',
                    duration: assessmentData.duration || 0,
                    instruction: assessmentData.description,
                    assessmentUrl: registrationUrl
                }
            );

            logger.info(`Queued invitation email to non-registered user: ${email}`);
        } catch (error) {
            logger.error(`Failed to queue invitation email to non-registered user ${email}:`, error);
        }
    }


    private async sendInvitationToRegisteredUser(email: string, userName: string, assessmentData: { _id: string, title?: string; description?: string; duration?: number; totalMarks?: number; startDate?: Date; endDate?: Date }): Promise<void> {
        try {
            const assessmentUrl = `${config.getUrlsConfig().assessmentsUrl}/${assessmentData._id}`;

            await this.getEmailService().sendAssessmentInvitationEmail(
                email,
                userName,
                {
                    assessmentId: assessmentData._id,
                    assessmentTitle: assessmentData.title || 'Assessment Invitation',
                    assessmentDescription: assessmentData.description,
                    assessmentType: 'Assessment',
                    duration: assessmentData.duration || 0,
                    instruction: assessmentData.description,
                    assessmentUrl: assessmentUrl
                }
            );

            logger.info(`Queued invitation email to registered user: ${email}`);
        } catch (error) {
            logger.error(`Failed to queue invitation email to registered user ${email}:`, error);
        }
    }

    private toAssessmentResponseDto(assessment: IAssessmentDocument): AssessmentResponseDto {
        const response: AssessmentResponseDto = {
                 _id: assessment._id.toString(),
            title: assessment.title,
            description: assessment.description ?? "",
            type: assessment.type,
            questions: assessment.questions as string[],
            codingQuestions: assessment.codingQuestions || [],
            totalMarks: assessment.totalMarks,
            duration: assessment.duration,
            status: assessment.status,
            createdBy: assessment.createdBy as string,
            assignedUsers: assessment.assignedUsers as string[],
            invitedUsers: (assessment.invitedUsers as string[]) || [],
            isActive: assessment.isActive,
            passPercentage: assessment.passPercentage ?? 60,
            showResultsToUsers: assessment.showResultsToUsers ?? false,
            createdAt: assessment.createdAt,
            updatedAt: assessment.updatedAt,
        };

        // Only add optional date fields if they exist
        if (assessment.startDate) response.startDate = assessment.startDate;
        if (assessment.endDate) response.endDate = assessment.endDate;

        // Note: Time fields (startTime, endTime) are handled separately in updateAssessment
        // and other methods that call this DTO converter

        return response;
    }

    /**
     * DTO converter for list views - returns counts instead of full arrays
     * This is optimized for getAllAssessments to avoid sending unnecessary data
     */
    private toAssessmentResponseDtoForList(assessment: any): any {
        return {
            _id: assessment._id as string,
            title: assessment.title,
            description: assessment.description ?? "",
            instruction: assessment.instruction,
            type: assessment.type,
            // Return counts instead of arrays
            questionsCount: assessment.questionsCount || (Array.isArray(assessment.questions) ? assessment.questions.length : 0),
            assignedUsersCount: assessment.assignedUsersCount || (Array.isArray(assessment.assignedUsers) ? assessment.assignedUsers.length : 0),
            invitedUsersCount: assessment.invitedUsersCount || (Array.isArray(assessment.invitedUsers) ? assessment.invitedUsers.length : 0),
            // Empty arrays to maintain compatibility
            questions: [],
            assignedUsers: [],
            invitedUsers: [],
            codingQuestions: assessment.codingQuestions || [],
            totalMarks: assessment.totalMarks,
            duration: assessment.duration,
            status: assessment.status,
            createdBy: assessment.createdBy,
            isActive: assessment.isActive,
            passPercentage: assessment.passPercentage ?? 60,
            showResultsToUsers: assessment.showResultsToUsers ?? false,
            googleForm: assessment.googleForm,
            createdAt: assessment.createdAt,
            updatedAt: assessment.updatedAt,
            // Optional date fields
            ...(assessment.startDate && { startDate: assessment.startDate }),
            ...(assessment.endDate && { endDate: assessment.endDate }),
        };
    }

    private toAssessmentWithQuestionsDto(assessment: IAssessmentDocument): AssessmentWithQuestionsDto {
        const response: AssessmentWithQuestionsDto = {
               _id: assessment._id.toString(),
            title: assessment.title,
            description: assessment.description ?? "",
            type: assessment.type,
            questions: assessment.questions as any[],
            googleForm: assessment.googleForm,
            codingQuestions: assessment.codingQuestions || [],
            totalMarks: assessment.totalMarks,
            duration: assessment.duration,
            status: assessment.status,
            createdBy: assessment.createdBy as any,
            assignedUsers: assessment.assignedUsers as any[],
            colleges: assessment.colleges as any[],
            invitedUsers: assessment.invitedUsers as any[],
            isActive: assessment.isActive,
            passPercentage: assessment.passPercentage ?? 60,
            showResultsToUsers: assessment.showResultsToUsers ?? false,
            createdAt: assessment.createdAt,
            updatedAt: assessment.updatedAt,
        };

        // Only add optional date fields if they exist
        if (assessment.startDate) response.startDate = assessment.startDate;
        if (assessment.endDate) response.endDate = assessment.endDate;

        // Note: Time fields (startTime, endTime) are handled separately in updateAssessment
        // and other methods that call this DTO converter

        return response;
    }


    async getAssignedUsers(assessmentId: string): Promise<string[]> {
        const assessment = await this.assessmentRepository.findByIdRaw(assessmentId);
        if (!assessment) {
            throw new Error('Assessment not found');
        }
        return assessment.assignedUsers;
    }

} 