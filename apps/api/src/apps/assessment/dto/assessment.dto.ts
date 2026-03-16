import Joi from 'joi';
import { QuestionType } from '../../questions/interface/Question';
import { AssessmentStatus, AssessmentType } from '../interface/Assessment';


export interface CreateQuestionInlineDto {
    text: string;
    type: QuestionType.MULTIPLE_CHOICE | QuestionType.SINGLE_CHOICE;
    options: {
        text: string;
        isCorrect: boolean;
    }[];
    marks: number;
    explanation?: string;
    section?: string;

}

export interface CreateAssessmentDto {
    title: string;
    description?: string;
    type: AssessmentType;
    instruction?: string;
    colleges?: {
        _id: string;
        branches?: {
            _id: string;
            name: string;
        }[];
        year?: number[];
    }[];
    questions?: string[]; // Question IDs (for MCQ questions)
    questionsToCreate?: CreateQuestionInlineDto[];
    codingQuestions?: { _id: string, section: string, score: number }[]; // Test IDs with section and score
    totalMarks: number;
    duration: number; // in minutes
    startDate?: Date;
    endDate?: Date;
    assignedUsers: string[] | 'all';
    invitedUsers?: string[];
    sendEmails?: boolean;
    googleForm?: string;
    passPercentage?: number;
    showResultsToUsers?: boolean;
}

export interface UpdateAssessmentDto extends Partial<CreateAssessmentDto> {
    status?: AssessmentStatus;
    isActive?: boolean;
}

export interface AssessmentResponseDto {
    _id: string;
    title: string;
    description?: string;
    type: AssessmentType;
    instruction?: string;

    questions: string[];
    codingQuestions: { _id: string, section: string, score: number }[];
    totalMarks: number;
    duration: number;
    status: AssessmentStatus;
    startDate?: Date;
    endDate?: Date;
    createdBy: string;
    assignedUsers: string[];
    colleges?: string[];
    invitedUsers?: string[];
    isActive: boolean;
    googleForm?: string;
    passPercentage?: number;
    showResultsToUsers: boolean;
    createdAt: Date;
    updatedAt: Date;
    isTaken?: boolean;
    assessmentResultId?: string | null;
    assessmentState?: {
        status: 'in_progress' | 'paused' | 'failed';
        timeRemaining: number;
        canContinue: boolean;
        isExpired: boolean;
        startTime: Date;
        responsesCount: number;
    } | null;
}

export interface AssessmentWithQuestionsDto extends Omit<AssessmentResponseDto, 'questions' | 'createdBy' | 'assignedUsers'> {
    questions: Array<{
        _id: string;
        text: string;
        type: string;
        options: Array<{
            text: string;
            isCorrect: boolean;
            _id: string;
        }>;
        marks: number;
        explanation?: string;
        createdBy: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createdBy: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        fullName: string;
    };
    assignedUsers: Array<{
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        fullName: string;
    }>;
}

// These DTOs are now in assessmentResult.dto.ts

// Validation schemas
export const createAssessmentSchema = Joi.object({
    title: Joi.string()
        .min(5)
        .max(200)
        .required()
        .messages({
            'string.min': 'Assessment title must be at least 5 characters long',
            'string.max': 'Assessment title cannot exceed 200 characters',
            'any.required': 'Assessment title is required',
        }),
    type: Joi.string()
        .valid(...Object.values(AssessmentType))
        .default(AssessmentType.MCQ)
        .messages({
            'any.only': 'Assessment type must be mcq, coding, or mixed',
        }),
    colleges: Joi.array().items(
        Joi.object({
            _id: Joi.string().required().messages({
                'any.required': 'College ID is required',
                'string.base': 'College ID must be a string',
            }),
            branches: Joi.array().items(
                Joi.object({
                    _id: Joi.string().required().messages({
                        'any.required': 'Branch ID is required',
                        'string.base': 'Branch ID must be a string',
                    }),
                    name: Joi.string().required().messages({
                        'any.required': 'Branch name is required',
                        'string.base': 'Branch name must be a string',
                    }),
                })
            ).optional().messages({
                'array.base': 'Branches must be an array of branch objects',
            }),
            year: Joi.array().items(
                Joi.alternatives().try(
                    Joi.number().integer().min(1).max(10),
                    Joi.string().regex(/^([1-9]|10)$/).message('Year must be a number between 1 and 10')
                )
            )
                .optional()
                .messages({
                    'array.base': 'Year must be an array of numbers or strings',
                }),
        })
    )
        .optional()
        .messages({
            'array.base': 'Colleges must be an array of college objects',
        }),
    description: Joi.string()
        .max(1000)
        .optional(),
    instruction: Joi.string()
        .optional(),

    questions: Joi.array()
        .items(Joi.string())
        .optional()
        .messages({
            'array.base': 'Questions must be an array of question IDs',
        }),
    questionsToCreate: Joi.array()
        .items(Joi.object({
            text: Joi.string()
                .min(10)
                .max(1000)
                .required()
                .messages({
                    'string.min': 'Question text must be at least 10 characters long',
                    'string.max': 'Question text cannot exceed 1000 characters',
                    'any.required': 'Question text is required',
                }),
            section: Joi.string().optional(),
            type: Joi.string()
                .valid('single_choice', 'multiple_choice')
                .required()
                .messages({
                    'any.only': 'Question type must be single_choice or multiple_choice',
                    'any.required': 'Question type is required',
                }),
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
                .messages({
                    'array.min': 'Question must have at least 2 options',
                    'any.required': 'Question options are required',
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
                .allow('')
                .optional()
                .messages({
                    'string.max': 'Explanation cannot exceed 1000 characters',
                }),
        }))
        .optional()
        .messages({
            'array.base': 'Questions to create must be an array',
        }),
    codingQuestions: Joi.array().items(
        Joi.object({
            _id: Joi.string().required().messages({
                'any.required': 'Test ID is required for coding question',
                'string.base': 'Test ID must be a string',
            }),
            section: Joi.string().required().messages({
                'any.required': 'Section is required for coding question',
                'string.base': 'Section must be a string',
            }),
            score: Joi.number().integer().min(0).required().messages({
                'any.required': 'Score is required for coding question',
                'number.base': 'Score must be a number',
                'number.integer': 'Score must be an integer',
                'number.min': 'Score must be at least 0',
            }),
        })
    )
        .optional()
        .messages({
            'array.base': 'Coding questions must be an array',
        }),
    totalMarks: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
            'number.base': 'Total marks must be a number',
            'number.integer': 'Total marks must be an integer',
            'number.min': 'Total marks must be at least 0',
        }),
    duration: Joi.number()
        .integer()
        .min(1)
        .max(480)
        .required()
        .messages({
            'number.base': 'Duration must be a number',
            'number.integer': 'Duration must be an integer',
            'number.min': 'Duration must be at least 1 minute',
            'number.max': 'Duration cannot exceed 8 hours (480 minutes)',
            'any.required': 'Duration is required',
        }),
    startDate: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Start date must be in format YYYY-MM-DDTHH:MM',
        }),
    endDate: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
        .optional()
        .messages({
            'string.pattern.base': 'End date must be in format YYYY-MM-DDTHH:MM',
            'date.min': 'End date must be after start date',
        }),
    assignedUsers: Joi.alternatives().try(
        Joi.string().valid('all').messages({
            'any.only': 'assignedUsers must be either an array of user IDs or "all"',
        }),
        Joi.array()
            .items(Joi.string())
            .optional()
            .messages({
                'array.min': 'Assessment must be assigned to at least 1 user',
                'array.base': 'assignedUsers must be an array of user IDs or "all"',
            })
    ).required().messages({
        'any.required': 'Assigned users are required',
        'alternatives.any': 'assignedUsers must be either an array of user IDs or "all"',
    }),
    invitedUsers: Joi.array()
        .items(Joi.string().email().messages({
            'string.email': 'Each invited user must be a valid email address',
        }))
        .optional()
        .messages({
            'array.base': 'invitedUsers must be an array of email addresses',
        }),
    sendEmails: Joi.boolean()
        .optional()
        .default(true)
        .messages({
            'boolean.base': 'sendEmails must be a boolean value',
        }),
    googleForm: Joi.string()
        .uri()
        .optional()
        .messages({
            'string.uri': 'Google Form must be a valid URL',
        }),
    passPercentage: Joi.number()
        .min(0)
        .max(100)
        .optional()
        .default(60)
        .messages({
            'number.base': 'Pass percentage must be a number',
            'number.min': 'Pass percentage must be at least 0',
            'number.max': 'Pass percentage cannot exceed 100',
        }),
    showResultsToUsers: Joi.boolean()
        .default(false)
        .messages({
            'boolean.base': 'showResultsToUsers must be a boolean value',
        }),
});

export const updateAssessmentSchema = Joi.object({
    title: Joi.string()
        .min(5)
        .max(200)
        .messages({
            'string.min': 'Assessment title must be at least 5 characters long',
            'string.max': 'Assessment title cannot exceed 200 characters',
        }),
    description: Joi.string()
        .max(1000)
        .allow("")
        .optional()
        .messages({
            'string.max': 'Description cannot exceed 1000 characters',
        }),
    instruction: Joi.string()
        .max(1000)
        .optional()
        .messages({
            'string.max': 'Instruction cannot exceed 1000 characters',
        }),
    type: Joi.string()
        .valid(...Object.values(AssessmentType))
        .default(AssessmentType.MCQ)
        .messages({
            'any.only': 'Assessment type must be mcq, coding, or mixed',
        }),
    colleges: Joi.array().items(
        Joi.object({
            _id: Joi.string().required().messages({
                'any.required': 'College ID is required',
                'string.base': 'College ID must be a string',
            }),
            branches: Joi.array().items(
                Joi.object({
                    _id: Joi.string().required().messages({
                        'any.required': 'Branch ID is required',
                        'string.base': 'Branch ID must be a string',
                    }),
                    name: Joi.string().required().messages({
                        'any.required': 'Branch name is required',
                        'string.base': 'Branch name must be a string',
                    }),
                })
            ).optional().messages({
                'array.base': 'Branches must be an array of branch objects',
            }),
            year: Joi.array().items(
                Joi.alternatives().try(
                    Joi.number().integer().min(1).max(10),
                    Joi.string().regex(/^([1-9]|10)$/).message('Year must be a number between 1 and 10')
                )
            )
                .optional()
                .messages({
                    'array.base': 'Year must be an array of numbers or strings',
                }),
        })
    )
        .optional()
        .messages({
            'array.base': 'Colleges must be an array of college objects',
        }),
    questions: Joi.array()
        .items(Joi.string())
        .optional()
        .messages({
            'array.base': 'Questions must be an array of question IDs',
        }),
    questionsToCreate: Joi.array()
        .items(Joi.object({
            text: Joi.string()
                .min(10)
                .max(1000)
                .required()
                .messages({
                    'string.min': 'Question text must be at least 10 characters long',
                    'string.max': 'Question text cannot exceed 1000 characters',
                    'any.required': 'Question text is required',
                }),
            section: Joi.string().optional(),
            type: Joi.string()
                .valid('single_choice', 'multiple_choice')
                .required()
                .messages({
                    'any.only': 'Question type must be single_choice or multiple_choice',
                    'any.required': 'Question type is required',
                }),
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
                .allow("")
                .optional()
                .messages({
                    'string.max': 'Explanation cannot exceed 1000 characters',
                }),
        }))
        .optional()
        .messages({
            'array.base': 'Questions to create must be an array',
        }),
    totalMarks: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
            'number.base': 'Total marks must be a number',
            'number.integer': 'Total marks must be an integer',
            'number.min': 'Total marks must be at least 0',
        }),
    duration: Joi.number()
        .integer()
        .min(1)
        .max(480)
        .messages({
            'number.base': 'Duration must be a number',
            'number.integer': 'Duration must be an integer',
            'number.min': 'Duration must be at least 1 minute',
            'number.max': 'Duration cannot exceed 8 hours (480 minutes)',
        }),
    startDate: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Start date must be in format YYYY-MM-DDTHH:MM',
        }),
    endDate: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
        .optional()
        .messages({
            'string.pattern.base': 'End date must be in format YYYY-MM-DDTHH:MM',
            'date.min': 'End date must be after start date',
        }),
    assignedUsers: Joi.alternatives().try(
        Joi.string().valid('all').messages({
            'any.only': 'assignedUsers must be either an array of user IDs or "all"',
        }),
        Joi.array()
            .items(Joi.string())
            .optional()
            .messages({
                'array.min': 'Assessment must be assigned to at least 1 user',
                'array.base': 'assignedUsers must be an array of user IDs or "all"',
            })
    ).messages({
        'alternatives.any': 'assignedUsers must be either an array of user IDs or "all"',
    }),
    invitedUsers: Joi.array()
        .items(Joi.string().email().messages({
            'string.email': 'Each invited user must be a valid email address',
        }))
        .optional()
        .messages({
            'array.base': 'invitedUsers must be an array of email addresses',
        }),
    status: Joi.string()
        .valid(...Object.values(AssessmentStatus))
        .messages({
            'any.only': 'Invalid status value',
        }),
    isActive: Joi.boolean(),
    codingQuestions: Joi.array().items(
        Joi.object({
            _id: Joi.string().required().messages({
                'any.required': 'Test ID is required for coding question',
                'string.base': 'Test ID must be a string',
            }),
            section: Joi.string().required().messages({
                'any.required': 'Section is required for coding question',
                'string.base': 'Section must be a string',
            }),
            score: Joi.number().integer().min(0).required().messages({
                'any.required': 'Score is required for coding question',
                'number.base': 'Score must be a number',
                'number.integer': 'Score must be an integer',
                'number.min': 'Score must be at least 0',
            }),
        })
    )
        .optional()
        .messages({
            'array.base': 'Coding questions must be an array',
        }),
    googleForm: Joi.string()
        .uri()
        .optional()
        .messages({
            'string.uri': 'Google Form must be a valid URL',
        }),
    passPercentage: Joi.number()
        .min(0)
        .max(100)
        .optional()
        .messages({
            'number.base': 'Pass percentage must be a number',
            'number.min': 'Pass percentage must be at least 0',
            'number.max': 'Pass percentage cannot exceed 100',
        }),
    showResultsToUsers: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'showResultsToUsers must be a boolean value',
        }),
});


export const assessmentQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid(...Object.values(AssessmentStatus)),
    isActive: Joi.boolean(),
    search: Joi.string().min(1),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'startDate', 'endDate'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
}); 