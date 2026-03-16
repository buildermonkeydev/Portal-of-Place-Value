import { CreateQuestionInlineDto } from "../../assessment/dto/assessment.dto";
import { QuestionResponseDto, UpdateQuestionDto } from "../dto/question.dto";
import { QuestionRepository } from "../repository/QuestionRepository";
import { logger } from "../../../utils/logger";
import { IQuestionDocument } from "../interface/Question";


export class QuestionService {
    private questionRepository: QuestionRepository;

    constructor(questionRepository: QuestionRepository) {
        this.questionRepository = questionRepository;
    }

    async createQuestion(questionData: CreateQuestionInlineDto, adminId: string): Promise<QuestionResponseDto> {
        try {
            // Validate question data
            this.validateQuestionData(questionData);

            // Create new question
            const newQuestion = await this.questionRepository.create({
                ...questionData,
                createdBy: adminId,
                type: questionData.type,
            });

            // Convert to response DTO
            const questionResponse = this.toQuestionResponseDto(newQuestion);

            logger.info(`Question created successfully by admin ${adminId}: ${questionResponse._id}`);
            return questionResponse;
        } catch (error) {
            logger.error('Error creating question:', error);
            throw error;
        }
    }

    async getQuestionById(id: string): Promise<QuestionResponseDto | null> {
        try {
            const question = await this.questionRepository.findById(id);
            if (!question) {
                return null;
            }

            return this.toQuestionResponseDto(question);
        } catch (error) {
            logger.error(`Error getting question by ID ${id}:`, error);
            throw error;
        }
    }

    async getAllQuestions(page: number = 1, limit: number = 10, filter: any = {}) {
        try {
            const options = { page, limit };
            const result = await this.questionRepository.getQuestionsWithPagination(filter, options);

            return {
                questions: result.questions.map(question => this.toQuestionResponseDto(question)),
                pagination: result.pagination,
            };
        } catch (error) {
            logger.error('Error getting all questions:', error);
            throw error;
        }
    }

    async updateQuestion(id: string, questionData: UpdateQuestionDto): Promise<QuestionResponseDto | null> {
        try {
            // Check if question exists
            const existingQuestion = await this.questionRepository.findById(id);
            if (!existingQuestion) {
                return null;
            }

            // If updating options, validate the new data
            if (questionData.options) {
                this.validateQuestionOptions(questionData.options, questionData.type || existingQuestion.type);
            }

            // Update question
            const updatedQuestion = await this.questionRepository.update(id, questionData);
            if (!updatedQuestion) {
                return null;
            }

            return this.toQuestionResponseDto(updatedQuestion);
        } catch (error) {
            logger.error(`Error updating question ${id}:`, error);
            throw error;
        }
    }

    async deleteQuestion(id: string): Promise<boolean> {
        try {
            const success = await this.questionRepository.delete(id);
            if (success) {
                logger.info(`Question deleted successfully: ${id}`);
            }
            return success;
        } catch (error) {
            logger.error(`Error deleting question ${id}:`, error);
            throw error;
        }
    }

    async searchQuestions(searchTerm: string, page: number = 1, limit: number = 10) {
        try {
            const options = { page, limit };
            const questions = await this.questionRepository.searchQuestions(searchTerm, options);

            return questions.map(question => this.toQuestionResponseDto(question));
        } catch (error) {
            logger.error(`Error searching questions with term "${searchTerm}":`, error);
            throw error;
        }
    }

    async toggleQuestionStatus(id: string): Promise<boolean> {
        try {
            const question = await this.questionRepository.findById(id);
            if (!question) {
                return false;
            }

            const updatedQuestion = await this.questionRepository.update(id, {
                isActive: !question.isActive
            });

            if (updatedQuestion) {
                logger.info(`Question status toggled: ${id} - ${updatedQuestion.isActive ? 'Active' : 'Inactive'}`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error(`Error toggling question status ${id}:`, error);
            throw error;
        }
    }

    async getQuestionsByIds(questionIds: string[]): Promise<QuestionResponseDto[]> {
        try {
            const questions = await this.questionRepository.findByIds(questionIds);
            return questions.map(question => this.toQuestionResponseDto(question));
        } catch (error) {
            logger.error(`Error getting questions by IDs:`, error);
            throw error;
        }
    }

    private validateQuestionData(questionData: CreateQuestionInlineDto): void {
        // Validate options
        if (questionData.options.length < 2) {
            throw new Error('Question must have at least 2 options');
        }

        const correctOptions = questionData.options.filter(opt => opt.isCorrect);
        if (correctOptions.length === 0) {
            throw new Error('Question must have at least one correct option');
        }

        // Validate single choice questions
        if (questionData.type === 'single_choice' && correctOptions.length > 1) {
            throw new Error('Single choice questions can have only one correct option');
        }

        // Validate marks
        if (questionData.marks < 1 || questionData.marks > 100) {
            throw new Error('Marks must be between 1 and 100');
        }
    }

    private validateQuestionOptions(options: any[], type: string): void {
        if (options.length < 2) {
            throw new Error('Question must have at least 2 options');
        }

        const correctOptions = options.filter(opt => opt.isCorrect);
        if (correctOptions.length === 0) {
            throw new Error('Question must have at least one correct option');
        }

        if (type === 'single_choice' && correctOptions.length > 1) {
            throw new Error('Single choice questions can have only one correct option');
        }
    }

    private toQuestionResponseDto(question: IQuestionDocument): QuestionResponseDto {
        const dto: QuestionResponseDto = {
            _id: question._id as string,
            text: question.text,
            type: question.type,
            options: question.options,
            marks: question.marks,
            explanation: question.explanation || '',
            createdBy: question.createdBy as string,
            isActive: question.isActive,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
        };

        if (question.section) {
            dto.section = question.section;
        }

        return dto;
    }
} 