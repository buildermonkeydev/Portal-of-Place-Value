import Joi from 'joi';
import { QuestionType } from '../interface/Question';

export interface IQuestionOptionDto {
    text: string;
    isCorrect: boolean;
}

export interface CreateQuestionDto {
    text: string;
    type: QuestionType;
    options: IQuestionOptionDto[];
    marks: number;
    explanation?: string;
}

export interface UpdateQuestionDto extends Partial<CreateQuestionDto> {
    isActive?: boolean;
}

export interface QuestionResponseDto {
    _id: string;
    text: string;
    type: QuestionType;
    options: IQuestionOptionDto[];
    marks: number;
    explanation?: string;
    section?: string;
    createdBy: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Validation schemas
export const createQuestionSchema = Joi.object({
    text: Joi.string()
        .min(10)
        .max(1000)
        .required()
        .messages({
            'string.min': 'Question text must be at least 10 characters long',
            'string.max': 'Question text cannot exceed 1000 characters',
            'any.required': 'Question text is required',
        }),
    type: Joi.string()
        .valid(...Object.values(QuestionType))
        .required()
        .messages({
            'any.only': 'Invalid question type',
            'any.required': 'Question type is required',
        }),
    section: Joi.string().optional(),

    options: Joi.array()
        .items(Joi.object({
            text: Joi.string()
                .min(1)
                .max(500)
                .required()
                .messages({
                    'string.min': 'Option text must not be empty',
                    'string.max': 'Option text cannot exceed 500 characters',
                    'any.required': 'Option text is required',
                }),
            isCorrect: Joi.boolean()
                .required()
                .messages({
                    'any.required': 'Correct option flag is required',
                }),
        }))
        .min(2)
        .required()
        .custom((value, helpers) => {
            const correctOptions = value.filter((opt: any) => opt.isCorrect);
            if (correctOptions.length === 0) {
                return helpers.error('any.invalid', { message: 'At least one option must be correct' });
            }

            // Get the question type from the parent object
            const questionType = helpers.state.ancestors[0]?.type;
            if (questionType === 'single_choice' && correctOptions.length > 1) {
                return helpers.error('any.invalid', { message: 'Single choice questions can have only one correct option' });
            }

            return value;
        })
        .messages({
            'array.min': 'Question must have at least 2 options',
            'any.required': 'Question options are required',
            'any.invalid': 'Invalid option configuration',
        }),
    marks: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .required()
        .messages({
            'number.base': 'Marks must be a number',
            'number.integer': 'Marks must be an integer',
            'number.min': 'Marks must be at least 1',
            'number.max': 'Marks cannot exceed 100',
            'any.required': 'Marks are required',
        }),
    explanation: Joi.string()
        .max(1000)
        .optional()
        .allow("")
        .messages({
            'string.max': 'Explanation cannot exceed 1000 characters',
        }),
});

export const updateQuestionSchema = Joi.object({
    text: Joi.string()
        .min(10)
        .max(1000)
        .messages({
            'string.min': 'Question text must be at least 10 characters long',
            'string.max': 'Question text cannot exceed 1000 characters',
        }),
    type: Joi.string()
        .valid(...Object.values(QuestionType))
        .messages({
            'any.only': 'Invalid question type',
        }),
    section: Joi.string().optional(),

    options: Joi.array()
        .items(Joi.object({
            text: Joi.string()
                .min(1)
                .max(500)
                .required()
                .messages({
                    'string.min': 'Option text must not be empty',
                    'string.max': 'Option text cannot exceed 500 characters',
                    'any.required': 'Option text is required',
                }),
            isCorrect: Joi.boolean()
                .required()
                .messages({
                    'any.required': 'Correct option flag is required',
                }),
        }))
        .min(2)
        .messages({
            'array.min': 'Question must have at least 2 options',
        }),
    marks: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .messages({
            'number.base': 'Marks must be a number',
            'number.integer': 'Marks must be an integer',
            'number.min': 'Marks must be at least 1',
            'number.max': 'Marks cannot exceed 100',
        }),
    explanation: Joi.string()
        .max(1000)
        .optional()
        .allow("")
        .messages({
            'string.max': 'Explanation cannot exceed 1000 characters',
        }),
    isActive: Joi.boolean(),
});



export const questionQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    type: Joi.string().valid(...Object.values(QuestionType)),
    isActive: Joi.boolean(),
    search: Joi.string().min(1),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'marks', 'text'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
}); 