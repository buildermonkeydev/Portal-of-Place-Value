import { Assessment } from '../models/Assessment';
import { IAssessmentDocument } from '../../../core/types';
import { logger } from '../../../utils/logger';
import { ClientSession } from 'mongoose';

export class AssessmentRepository {
    async create(assessmentData: Partial<IAssessmentDocument>): Promise<IAssessmentDocument> {
        try {
            const assessment = new Assessment(assessmentData);
            return await assessment.save();
        } catch (error) {
            logger.error('Error creating assessment', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async findById(id: string): Promise<IAssessmentDocument | null> {
        try {
            return await Assessment.findById(id)
                .populate('createdBy', '_id firstName lastName email')
                .populate('assignedUsers', '_id firstName lastName email')
                .populate('questions');
        } catch (error) {
            logger.error(`Error finding assessment by ID ${id}:`, error);
            throw error;
        }
    }


    async findByIdRaw(id: string): Promise<IAssessmentDocument | null> {
        try {
            return await Assessment.findById(id)
        } catch (error) {
            logger.error(`Error finding assessment by ID ${id}:`, error);
            throw error;
        }
    }
    async findByCreator(creatorId: string): Promise<IAssessmentDocument[]> {
        try {
            return await Assessment.find({ createdBy: creatorId, isActive: true })
                .sort({ createdAt: -1 })
                .populate('assignedUsers', 'firstName lastName email');
        } catch (error) {
            logger.error(`Error finding assessments by creator ${creatorId}:`, error);
            throw error;
        }
    }

    async findByAssignedUser(userId: string): Promise<IAssessmentDocument[]> {
        try {
            return await Assessment.find({
                assignedUsers: userId,
            })
                .sort({ createdAt: -1 })
                .populate('createdBy', 'firstName lastName email');
        } catch (error) {
            logger.error(`Error finding assessments for user ${userId}:`, error);
            throw error;
        }
    }
    async findByAssignedUserActive(userId: string): Promise<IAssessmentDocument[]> {
        try {
            return await Assessment.find({
                assignedUsers: userId,
                isActive: true,
                status: "active"
            })
                .sort({ createdAt: -1 })
                .populate('createdBy', 'firstName lastName email');
        } catch (error) {
            logger.error(`Error finding assessments for user ${userId}:`, error);
            throw error;
        }
    }

    async findByInvitedUser(email: string): Promise<IAssessmentDocument[]> {
        try {
            return await Assessment.find({
                invitedUsers: email,
                isActive: true
            })
                .sort({ createdAt: -1 });
        } catch (error) {
            logger.error(`Error finding assessments for invited user ${email}:`, error);
            throw error;
        }
    }

    async update(id: string, updateData: Partial<IAssessmentDocument>): Promise<IAssessmentDocument | null> {
        try {
            return await Assessment.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: new Date() },
                { new: true, runValidators: true }
            )
                .populate('createdBy', 'firstName lastName email')
                .populate('assignedUsers', 'firstName lastName email')
                .populate('questions');
        } catch (error) {
            logger.error(`Error updating assessment ${id}:`, error);
            throw error;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const result = await Assessment.findByIdAndDelete(id);
            return !!result;
        } catch (error) {
            logger.error(`Error deleting assessment ${id}:`, error);
            throw error;
        }
    }

    async removeUserFromAssignments(userId: string, session?: ClientSession): Promise<number> {
        try {
            const options: any = {};
            if (session) {
                options.session = session;
            }
            const result = await Assessment.updateMany(
                { assignedUsers: userId },
                { $pull: { assignedUsers: userId } },
                options
            );

            const modifiedCount = (result as any).modifiedCount ?? (result as any).nModified ?? 0;

            if (modifiedCount > 0) {
                logger.info(`Removed user ${userId} from ${modifiedCount} assessment assignment(s)`);
            }

            return modifiedCount;
        } catch (error) {
            logger.error(`Error removing user ${userId} from assessment assignments:`, error);
            throw error;
        }
    }

    async getAssessmentsWithPagination(filter: any = {}, options: { page: number; limit: number }) {
        try {
            const { page, limit } = options;
            const skip = (page - 1) * limit;

            // Build filter query
            const filterQuery: any = {};
            if (filter.status) filterQuery.status = filter.status;
            if (filter.isActive !== undefined) filterQuery.isActive = filter.isActive;
            if (filter.createdBy) filterQuery.createdBy = filter.createdBy;
            if (filter.assignedUser) filterQuery.assignedUsers = filter.assignedUser;

            // Handle search - search in title, description, and instruction
            if (filter.search) {
                const searchRegex = { $regex: filter.search, $options: 'i' };
                filterQuery.$or = [
                    { title: searchRegex },
                    { description: searchRegex },
                    { instruction: searchRegex }
                ];
            }

            // Get total count
            const total = await Assessment.countDocuments(filterQuery);

            // Get assessments with pagination - exclude arrays to avoid unnecessary data
            const assessments = await Assessment.find(filterQuery)
                .select('_id title description instruction type totalMarks duration status startDate endDate createdBy isActive passPercentage showResultsToUsers createdAt updatedAt googleForm codingQuestions questions assignedUsers invitedUsers')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', '_id firstName lastName email')
                .lean(); // Use lean() for better performance

            // Transform to include counts instead of full arrays
            const assessmentsWithCounts = assessments.map((assessment: any) => ({
                ...assessment,
                questionsCount: Array.isArray(assessment.questions) ? assessment.questions.length : 0,
                assignedUsersCount: Array.isArray(assessment.assignedUsers) ? assessment.assignedUsers.length : 0,
                invitedUsersCount: Array.isArray(assessment.invitedUsers) ? assessment.invitedUsers.length : 0,
                // Replace arrays with empty arrays to avoid sending unnecessary data
                questions: [],
                assignedUsers: [],
                invitedUsers: []
            }));

            // Calculate pagination info
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            return {
                assessments: assessmentsWithCounts,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage,
                    hasPrevPage,
                },
            };
        } catch (error) {
            logger.error('Error getting assessments with pagination:', error);
            throw error;
        }
    }

    async searchAssessments(searchTerm: string, options: { page: number; limit: number }): Promise<{
        assessments: IAssessmentDocument[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> {
        try {
            const { page, limit } = options;
            const skip = (page - 1) * limit;

            // Create search query
            const searchQuery = {
                $and: [
                    { isActive: true },
                    {
                        $or: [
                            { title: { $regex: searchTerm, $options: 'i' } },
                            { description: { $regex: searchTerm, $options: 'i' } },
                        ],
                    },
                ],
            };

            // Get total count
            const total = await Assessment.countDocuments(searchQuery);

            // Get assessments with pagination
            const assessments = await Assessment.find(searchQuery)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'firstName lastName email')
                .populate('assignedUsers', 'firstName lastName email');

            return {
                assessments,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error(`Error searching assessments with term "${searchTerm}":`, error);
            throw error;
        }
    }

    async getActiveAssessments(): Promise<IAssessmentDocument[]> {
        try {
            return await Assessment.find({
                status: 'active',
                isActive: true
            })
                .sort({ startDate: 1 })
                .populate('createdBy', 'firstName lastName email')
                .populate('assignedUsers', 'firstName lastName email');
        } catch (error) {
            logger.error('Error getting active assessments:', error);
            throw error;
        }
    }

    async getAssessmentsByStatus(status: string): Promise<IAssessmentDocument[]> {
        try {
            return await Assessment.find({ status, isActive: true })
                .sort({ createdAt: -1 })
                .populate('createdBy', 'firstName lastName email')
                .populate('assignedUsers', 'firstName lastName email');
        } catch (error) {
            logger.error(`Error getting assessments by status ${status}:`, error);
            throw error;
        }
    }

    async countAssessmentsByCreator(creatorId: string): Promise<number> {
        try {
            return await Assessment.countDocuments({ createdBy: creatorId, isActive: true });
        } catch (error) {
            logger.error(`Error counting assessments by creator ${creatorId}:`, error);
            throw error;
        }
    }

    async getAssessmentsWithQuestions(assessmentIds: string[]): Promise<IAssessmentDocument[]> {
        try {
            return await Assessment.find({ _id: { $in: assessmentIds } })
                .populate('questions')
                .populate('createdBy', 'firstName lastName email');
        } catch (error) {
            logger.error('Error finding assessments with questions:', error);
            throw error;
        }
    }

    /**
     * Get assessment statistics
     */
    async getAssessmentStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        completed: number;
        upcoming: number;
    }> {
        try {
            const [total, active, inactive] = await Promise.all([
                Assessment.countDocuments({}),
                Assessment.countDocuments({ isActive: true, status: 'active' }),
                Assessment.countDocuments({ isActive: false })
            ]);

            const now = new Date();
            const completed = await Assessment.countDocuments({
                endDate: { $lt: now },
                status: 'active'
            });

            const upcoming = await Assessment.countDocuments({
                startDate: { $gt: now },
                status: 'active'
            });

            return {
                total,
                active,
                inactive,
                completed,
                upcoming
            };
        } catch (error) {
            logger.error('Error getting assessment statistics:', error);
            throw error;
        }
    }

    /**
     * Get recent assessments
     */
    async getRecentAssessments(limit: number = 5): Promise<IAssessmentDocument[]> {
        try {
            return await Assessment.find({})
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('createdBy', 'firstName lastName email')
                .populate('assignedUsers', 'firstName lastName email');
        } catch (error) {
            logger.error('Error getting recent assessments:', error);
            throw error;
        }
    }
} 