import { AssessmentResult } from '../models/AssessmentResult';
import { IAssessmentResult, IAssessmentResultDocument } from '../../../core/types';
import { logger } from '../../../utils/logger';
import { ClientSession , FlattenMaps } from 'mongoose';

export class AssessmentResultRepository {
    async create(resultData: Partial<IAssessmentResultDocument>): Promise<IAssessmentResultDocument> {
        try {
            const result = new AssessmentResult(resultData);
            return await result.save();
        } catch (error) {
            logger.error('Error creating assessment result:', error);
            throw error;
        }
    }

async findById(id: string): Promise<FlattenMaps<IAssessmentResultDocument> | null> {
    try {
        return await AssessmentResult.findOne({ _id: id, isDeleted: { $ne: true } })
            .populate('assessmentId', 'title description duration')
            .populate('userId', 'firstName lastName email')
            .populate({
                path: 'responses.questionId',
                select: 'text type options marks section explanation'
            }).lean();
    } catch (error) {
        logger.error(`Error finding assessment result by ID ${id}:`, error);
        throw error;
    }
}
   async findByIdWithoutIsCorrect(id: string): Promise<any> {
    try {
        const result = await AssessmentResult.findOne({ _id: id, isDeleted: { $ne: true } })
            .populate('assessmentId', 'title description duration')
            .populate('userId', 'firstName lastName email')
            .populate({
                path: 'responses.questionId',
                select: 'text type options marks section explanation'
            }).lean();

        if (result && result.responses) {
            result.responses.forEach((response: any) => {
                if (response.questionId && response.questionId.options) {
                    response.questionId.options = response.questionId.options.map((option: any) => ({
                        text: option.text,
                        section: option?.section,
                        _id: option._id,
                    }));
                }
            });
        }

        return result;
    } catch (error) {
        logger.error(`Error finding assessment result by ID ${id}:`, error);
        throw error;
    }
}

    async findByUserAndAssessment(userId: string, resultId: string): Promise<any | null> {
        try {
            return await AssessmentResult.findOne({ userId, _id: resultId, isDeleted: { $ne: true } })
                .populate('assessmentId', 'title description googleForm')
                .populate('userId', 'firstName lastName email')
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation'
                });
        } catch (error) {
            logger.error(`Error finding assessment result for user ${userId} and assessment ${resultId}:`, error);
            throw error;
        }
    }

    async findByUserAndAssessmentWithIsCorrect(userId: string, assessmentId: string): Promise<any | null> {
        try {
            return await AssessmentResult.findOne({ userId, assessmentId: assessmentId, isDeleted: { $ne: true } })
                .populate('assessmentId', 'title description googleForm')
                .populate('userId', 'firstName lastName email')
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation isCorrect'
                })
                .populate({
                    path: 'codingQuestions.testId',
                    select: 'title'
                });
        } catch (error) {
            logger.error(`Error finding assessment result for user ${userId} and assessment ${assessmentId}:`, error);
            throw error;
        }
    }

    async findByUserAndAssessmentNormal(userId: string, assessmentId: string): Promise<any | null> {
        try {
            return await AssessmentResult.findOne({
                userId,
                $or: [
                    { assessmentId: assessmentId },
                    { _id: assessmentId }
                ],
                isDeleted: { $ne: true }
            })

        } catch (error) {
            logger.error(`Error finding assessment result for user ${userId} and assessment ${assessmentId}:`, error);
            throw error;
        }
    }

    async findByUser(userId: string): Promise<IAssessmentResultDocument[]> {
        try {
            return await AssessmentResult.find({
                userId,
                isDeleted: { $ne: true },
                assessmentId: { $ne: null } // Exclude results with null assessmentId (orphaned results)
            })
                .populate('assessmentId', 'title description showResultsToUsers')
                .populate('userId', 'firstName lastName email')
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation'
                })
                .sort({ createdAt: -1 });
        } catch (error) {
            logger.error(`Error finding assessment results for user ${userId}:`, error);
            throw error;
        }
    }

    async findByAssessment(assessmentId: string): Promise<IAssessmentResultDocument[]> {
        try {
            return await AssessmentResult.find({ assessmentId, isDeleted: { $ne: true } })
                .populate('assessmentId', 'title description')
                .populate('userId', 'firstName lastName email')
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation'
                })
                .sort({ createdAt: -1 });
        } catch (error) {
            logger.error(`Error finding assessment results for assessment ${assessmentId}:`, error);
            throw error;
        }
    }

    async findByAssessmentWithCollegeInfo(assessmentId: string): Promise<IAssessmentResultDocument[]> {
        try {
            const results = await AssessmentResult.find({ assessmentId, isDeleted: { $ne: true } })
                .populate('assessmentId', 'title description colleges')
                .populate({
                    path: 'userId',
                    select: 'firstName lastName email registrationNo college branch collegeYear',
                    populate: {
                        path: 'college._id',
                        model: 'College',
                        select: 'name'
                    }
                })
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation correctAnswer'
                })
                .populate({
                    path: 'codingQuestions.testId',
                    select: 'title problemStatement'
                })
                .sort({ createdAt: -1 });

            // Ensure we always return an array, never null
            return results || [];
        } catch (error) {
            logger.error(`Error finding assessment results with college info for assessment ${assessmentId}:`, error);
            throw error;
        }
    }

    async update(id: string, updateData: Partial<IAssessmentResultDocument>): Promise<IAssessmentResultDocument | null> {
        try {
            return await AssessmentResult.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: new Date() },
                { new: true, runValidators: true }
            )
                .populate('assessmentId', 'title description')
                .populate('userId', 'firstName lastName email')
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation'
                });
        } catch (error) {
            logger.error(`Error updating assessment result ${id}:`, error);
            throw error;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const result = await AssessmentResult.findByIdAndDelete(id);
            return !!result;
        } catch (error) {
            logger.error(`Error deleting assessment result ${id}:`, error);
            throw error;
        }
    }

    async getResultsWithPagination(filter: any = {}, options: { page: number; limit: number }) {
        try {
            const { page, limit } = options;
            const skip = (page - 1) * limit;

            // Build filter query
            const filterQuery: any = { isDeleted: { $ne: true } };
            if (filter.status) filterQuery.status = filter.status;
            if (filter.userId) filterQuery.userId = filter.userId;
            if (filter.assessmentId) filterQuery.assessmentId = filter.assessmentId;

            // Get total count
            const total = await AssessmentResult.countDocuments(filterQuery);

            // Get results with pagination
            const results = await AssessmentResult.find(filterQuery)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('assessmentId', 'title description')
                .populate('userId', 'firstName lastName email')
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation'
                });

            // Calculate pagination info
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            return {
                results,
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
            logger.error('Error getting assessment results with pagination:', error);
            throw error;
        }
    }

    async getCompletedResults(assessmentId: string): Promise<IAssessmentResultDocument[]> {
        try {
            return await AssessmentResult.find({
                assessmentId,
                status: 'completed',
                isDeleted: { $ne: true }
            })
                .populate('userId', 'firstName lastName email')
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation'
                })
                .sort({ totalMarksObtained: -1 });
        } catch (error) {
            logger.error(`Error getting completed results for assessment ${assessmentId}:`, error);
            throw error;
        }
    }

    async getInProgressResults(assessmentId: string): Promise<IAssessmentResultDocument[]> {
        try {
            return await AssessmentResult.find({
                assessmentId,
                status: 'in_progress',
                isDeleted: { $ne: true }
            })
                .populate('userId', 'firstName lastName email')
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation'
                })
                .sort({ startTime: 1 });
        } catch (error) {
            logger.error(`Error getting in-progress results for assessment ${assessmentId}:`, error);
            throw error;
        }
    }

    async getAllInProgressResults(): Promise<IAssessmentResultDocument[]> {
        try {
            return await AssessmentResult.find({
                status: 'in_progress',
                isDeleted: { $ne: true }
            })
                .populate('userId', 'firstName lastName email')
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation'
                })
                .sort({ startTime: 1 });
        } catch (error) {
            logger.error('Error getting all in-progress results:', error);
            throw error;
        }
    }

    async getTopPerformers(assessmentId: string, limit: number = 10): Promise<IAssessmentResultDocument[]> {
        try {
            return await AssessmentResult.find({
                assessmentId,
                status: 'completed',
                isDeleted: { $ne: true }
            })
                .populate('userId', 'firstName lastName email')
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation'
                })
                .sort({ totalMarksObtained: -1, duration: 1 })
                .limit(limit);
        } catch (error) {
            logger.error(`Error getting top performers for assessment ${assessmentId}:`, error);
            throw error;
        }
    }
    async getAssessmentResultFromAssessment(userId: string, assessmentId: string): Promise<IAssessmentResult | null> {
        try {
            const result = await AssessmentResult.findOne({ userId, assessmentId, isDeleted: { $ne: true } }).lean<IAssessmentResult>();
            return result;
        } catch (error) {
            logger.error(`Error getting assessment result ID for user ${userId} and assessment ${assessmentId}:`, error);
            throw error;
        }
    }

    async isAssessmentTaken(userId: string, assessmentId: string): Promise<boolean> {
        try {
            const result = await AssessmentResult.findOne({ userId, assessmentId, isDeleted: { $ne: true } });
            return !!result;
        } catch (error) {
            logger.error(`Error checking if assessment ${assessmentId} is taken by user ${userId}:`, error);
            throw error;
        }
    }

    async getAverageScore(assessmentId: string): Promise<number> {
        try {
            const results = await AssessmentResult.find({
                assessmentId,
                status: 'completed',
                isDeleted: { $ne: true }
            });

            if (results.length === 0) {
                return 0;
            }

            const totalScore = results.reduce((sum, result) => sum + result.totalMarksObtained, 0);
            return totalScore / results.length;
        } catch (error) {
            logger.error(`Error calculating average score for assessment ${assessmentId}:`, error);
            throw error;
        }
    }

    async getCompletionRate(assessmentId: string): Promise<number> {
        try {
            const totalAssigned = await AssessmentResult.countDocuments({ assessmentId, isDeleted: { $ne: true } });
            const completed = await AssessmentResult.countDocuments({
                assessmentId,
                status: 'completed',
                isDeleted: { $ne: true }
            });

            if (totalAssigned === 0) {
                return 0;
            }

            return (completed / totalAssigned) * 100;
        } catch (error) {
            logger.error(`Error calculating completion rate for assessment ${assessmentId}:`, error);
            throw error;
        }
    }

    async getResultsByDateRange(
        assessmentId: string,
        startDate: Date,
        endDate: Date
    ): Promise<IAssessmentResultDocument[]> {
        try {
            return await AssessmentResult.find({
                assessmentId,
                createdAt: { $gte: startDate, $lte: endDate },
                isDeleted: { $ne: true }
            })
                .populate('userId', 'firstName lastName email')
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation'
                })
                .sort({ createdAt: -1 });
        } catch (error) {
            logger.error(`Error getting results by date range for assessment ${assessmentId}:`, error);
            throw error;
        }
    }

    /**
     * Get recent assessment results
     */
    async getRecentResults(limit: number = 5): Promise<IAssessmentResultDocument[]> {
        try {
            return await AssessmentResult.find({ isDeleted: { $ne: true } })
                .sort({ createdAt: -1 })
                .limit(limit)
                .populate('assessmentId', 'title description')
                .populate('userId', 'firstName lastName email')
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation'
                });
        } catch (error) {
            logger.error('Error getting recent results:', error);
            throw error;
        }
    }

    async findByIdWithDetails(resultId: string): Promise<IAssessmentResultDocument | null> {
        try {
            return await AssessmentResult.findOne({ _id: resultId, isDeleted: { $ne: true } })
                .populate('assessmentId', 'title description totalMarks duration showResultsToUsers')
                .populate({
                    path: 'userId',
                    select: '_id firstName lastName email registrationNo college branch collegeYear',
                    populate: {
                        path: 'college._id',
                        model: 'College',
                        select: 'name'
                    }
                })
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation correctAnswer'
                })
                .populate({
                    path: 'codingQuestions.testId',
                    select: 'title problemStatement'
                });
        } catch (error) {
            logger.error(`Error finding assessment result with details ${resultId}:`, error);
            throw error;
        }
    }

    async softDeleteByUser(userId: string, deletedAt: Date, session?: ClientSession): Promise<number> {
        try {
            const options: any = {};
            if (session) {
                options.session = session;
            }

            const result = await AssessmentResult.updateMany(
                { userId, isDeleted: { $ne: true } },
                { $set: { isDeleted: true, deletedAt } },
                options
            );

            const modifiedCount = (result as any).modifiedCount ?? (result as any).nModified ?? 0;

            if (modifiedCount > 0) {
                logger.info(`Soft deleted ${modifiedCount} assessment result(s) for user ${userId}`);
            }

            return modifiedCount;
        } catch (error) {
            logger.error(`Error soft deleting assessment results for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Get results by user and date range (for report generation)
     */
    async getResultsByUserAndDateRange(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<IAssessmentResultDocument[]> {
        try {
            return await AssessmentResult.find({
                userId,
                createdAt: { $gte: startDate, $lte: endDate },
                isDeleted: { $ne: true },
                assessmentId: { $ne: null } // Exclude results with null assessmentId (orphaned results)
            })
                .populate('assessmentId', 'title description totalMarks duration showResultsToUsers')
                .populate({
                    path: 'userId',
                    select: 'firstName lastName email registrationNo college branch collegeYear',
                    populate: {
                        path: 'college._id',
                        model: 'College',
                        select: 'name'
                    }
                })
                .populate({
                    path: 'responses.questionId',
                    select: 'text type options marks section explanation correctAnswer'
                })
                .sort({ createdAt: -1 });
        } catch (error) {
            logger.error(`Error getting results by user and date range for user ${userId}:`, error);
            throw error;
        }
    }
} 