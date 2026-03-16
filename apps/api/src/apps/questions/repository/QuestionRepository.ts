import { logger } from "../../../utils/logger";
import { IQuestionDocument } from "../interface/Question";
import { Question } from "../models/Question";


export class QuestionRepository {
    async create(questionData: Partial<IQuestionDocument>): Promise<IQuestionDocument> {
        try {
            const question = new Question(questionData);
            return await question.save();
        } catch (error) {
            logger.error('Error creating question', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async findById(id: string): Promise<IQuestionDocument | null> {
        try {
            return await Question.findById(id);
        } catch (error) {
            logger.error('Error finding question by ID', `id: ${id}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async findByCreator(creatorId: string): Promise<IQuestionDocument[]> {
        try {
            return await Question.find({ createdBy: creatorId, isActive: true }).sort({ createdAt: -1 });
        } catch (error) {
            logger.error('Error finding questions by creator', `creatorId: ${creatorId}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async findByIds(ids: string[]): Promise<IQuestionDocument[]> {
        try {
            return await Question.find({ _id: { $in: ids }, isActive: true });
        } catch (error) {
            logger.error('Error finding questions by IDs', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async update(id: string, updateData: Partial<IQuestionDocument>): Promise<IQuestionDocument | null> {
        try {
            return await Question.findByIdAndUpdate(
                id,
                { ...updateData, updatedAt: new Date() },
                { new: true, runValidators: true }
            );
        } catch (error) {
            logger.error('Error updating question', `id: ${id}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const result = await Question.findByIdAndDelete(id);
            return !!result;
        } catch (error) {
            logger.error('Error deleting question', `id: ${id}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async getQuestionsWithPagination(filter: any = {}, options: { page: number; limit: number }) {
        try {
            const { page, limit } = options;
            const skip = (page - 1) * limit;

            // Build filter query
            const filterQuery: any = {};
            if (filter.type) filterQuery.type = filter.type;
            if (filter.isActive !== undefined) filterQuery.isActive = filter.isActive;
            if (filter.createdBy) filterQuery.createdBy = filter.createdBy;

            // Get total count
            const total = await Question.countDocuments(filterQuery);

            // Get questions with pagination
            const questions = await Question.find(filterQuery)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'firstName lastName email');

            // Calculate pagination info
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            return {
                questions,
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
            logger.error('Error getting questions with pagination', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async searchQuestions(searchTerm: string, options: { page: number; limit: number }) {
        try {
            const { page, limit } = options;
            const skip = (page - 1) * limit;

            // Create search query
            const searchQuery = {
                $and: [
                    { isActive: true },
                    {
                        $or: [
                            { text: { $regex: searchTerm, $options: 'i' } },
                            { explanation: { $regex: searchTerm, $options: 'i' } },
                        ],
                    },
                ],
            };

            // Get total count
            const total = await Question.countDocuments(searchQuery);

            // Get questions with pagination
            const questions = await Question.find(searchQuery)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'firstName lastName email');

            return questions;
        } catch (error) {
            logger.error('Error searching questions', `searchTerm: ${searchTerm}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async getActiveQuestions(): Promise<IQuestionDocument[]> {
        try {
            return await Question.find({ isActive: true }).sort({ createdAt: -1 });
        } catch (error) {
            logger.error('Error getting active questions', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async getQuestionsByType(type: string): Promise<IQuestionDocument[]> {
        try {
            return await Question.find({ type, isActive: true }).sort({ createdAt: -1 });
        } catch (error) {
            logger.error('Error getting questions by type', `type: ${type}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async countQuestionsByCreator(creatorId: string): Promise<number> {
        try {
            return await Question.countDocuments({ createdBy: creatorId, isActive: true });
        } catch (error) {
            logger.error('Error counting questions by creator', `creatorId: ${creatorId}`, error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    async getQuestionsForAssessment(questionIds: string[]): Promise<IQuestionDocument[]> {
        try {
            return await Question.find({ _id: { $in: questionIds }, isActive: true });
        } catch (error) {
            logger.error('Error finding questions for assessment', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }

    /**
     * Get question statistics
     */
    async getQuestionStats(): Promise<{
        total: number;
        byType: { [key: string]: number };
    }> {
        try {
            const total = await Question.countDocuments({});

            // Get counts by type
            const typeStats = await Question.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } }
            ]);

            const byType: { [key: string]: number } = {};
            typeStats.forEach(stat => {
                byType[stat._id] = stat.count;
            });

            return {
                total,
                byType
            };
        } catch (error) {
            logger.error('Error getting question statistics', '', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
} 