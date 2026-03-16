import Joi from 'joi';

export interface QuestionAnswerDto {
    questionId: string;
    section?: string;
    selectedOptions: string[];
    timeSpent: number;
}

export interface SubmitAssessmentDto {
    assessmentId: string;
    responses: QuestionAnswerDto[];
}

export interface StartAssessmentDto {
    assessmentId: string;
}

export interface SectionScoreDto {
    sectionName: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    questionsCount: number;
}

export interface AssessmentResultResponseDto {
    _id: string;
    assessmentId: string;
    userId: string;
    responses: {
        questionId: string;
        section?: string;
        selectedOptions: string[];
        isCorrect: boolean;
        marksObtained: number;
        timeSpent: number;
    }[];
    sectionScores: SectionScoreDto[];
    totalMarksObtained: number;
    totalMarksPossible: number;
    percentage: number;
    startTime: Date;
    endTime?: Date;
    duration: number;
    status: 'in_progress' | 'completed' | 'abandoned';
    createdAt: Date;
    updatedAt: Date;
}

export interface AssessmentStatisticsDto {
    totalAssignedUsers: number;
    totalStarted: number;
    totalCompleted: number;
    totalAbandoned: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    completionRate: number;
    averageTimeSpent: number;
}

// Validation schemas
export const startAssessmentSchema = Joi.object({
    assessmentId: Joi.string()
        .required()
        .messages({
            'any.required': 'Assessment ID is required',
        }),
});

export const submitAssessmentSchema = Joi.object({
    assessmentId: Joi.string()
        .required()
        .messages({
            'any.required': 'Assessment ID is required',
        }),
    responses: Joi.array()
        .items(Joi.object({
            questionId: Joi.string()
                .required()
                .messages({
                    'any.required': 'Question ID is required',
                }),
            section: Joi.string().optional(),
            selectedOptions: Joi.array()
                .items(Joi.string())
                .optional()
                .messages({
                    'array.base': 'Selected options must be an array',
                }),
            timeSpent: Joi.number()
                .integer()
                .min(0)
                .optional()
                .default(0)
                .messages({
                    'number.base': 'Time spent must be a number',
                    'number.integer': 'Time spent must be an integer',
                    'number.min': 'Time spent cannot be negative',
                }),
        }))
        .optional()
        .messages({
            'array.base': 'Responses must be an array',
        }),
});

export const saveAnswerSchema = Joi.object({
    assessmentId: Joi.string()
        .required()
        .messages({
            'any.required': 'Assessment ID is required',
        }),
    questionId: Joi.string()
        .required()
        .messages({
            'any.required': 'Question ID is required',
        }),
    section: Joi.string().optional(),
    selectedOptions: Joi.array()
        .items(Joi.string())
        .optional(),
});

export const submitCodingSolutionSchema = Joi.object({

    testId: Joi.string()
        .required()
        .messages({
            'any.required': 'Test ID is required',
        }),
    sourceCode: Joi.string()
        .required()
        .messages({
            'any.required': 'Source code is required',
        }),
    languageId: Joi.number()
        .required()
        .messages({
            'any.required': 'Language ID is required',
        }),
    assessmentId: Joi.string()
        .optional(),

    section: Joi.string().optional(),
})

export const assessmentResultQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('in_progress', 'completed', 'abandoned'),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'totalMarksObtained', 'percentage'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

export const assessmentResultDateRangeQuerySchema = Joi.object({
    startDate: Joi.string()
        .isoDate()
        .required()
        .messages({
            'string.base': 'Start date must be a string',
            'string.isoDate': 'Start date must be a valid ISO-8601 date',
            'any.required': 'Start date is required',
        }),
    endDate: Joi.string()
        .isoDate()
        .required()
        .messages({
            'string.base': 'End date must be a string',
            'string.isoDate': 'End date must be a valid ISO-8601 date',
            'any.required': 'End date is required',
        }),
    forReports: Joi.string().valid('true', 'false', '1', '0').optional()
        .messages({
            'any.only': 'forReports must be either true, false, 1, or 0',
        }),
})
    .custom((value, helpers) => {
        const startDate = new Date(value.startDate);
        const endDate = new Date(value.endDate);

        // Validate that startDate <= endDate
        if (startDate.getTime() > endDate.getTime()) {
            return helpers.error('any.custom', {
                message: 'Start date must be less than or equal to end date',
            });
        }

        // Validate maximum span of 365 days
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 365) {
            return helpers.error('any.custom', {
                message: 'Date range cannot exceed 365 days',
            });
        }

        return value;
    })
    .messages({
        'any.custom': '{{#label}} validation failed',
    });

// Extended schema for date-range route with pagination and sort/filter params
export const assessmentResultDateRangeWithPaginationQuerySchema = assessmentResultDateRangeQuerySchema.keys({
    page: Joi.number().integer().min(1).optional().default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be at least 1',
        }),
    limit: Joi.number().integer().min(1).max(100).optional().default(10)
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100',
        }),
    status: Joi.string().valid('in_progress', 'completed', 'abandoned').optional()
        .messages({
            'any.only': 'Status must be one of: in_progress, completed, abandoned',
        }),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'totalMarksObtained', 'percentage', 'startTime', 'endTime').optional().default('createdAt')
        .messages({
            'any.only': 'SortBy must be one of: createdAt, updatedAt, totalMarksObtained, percentage, startTime, endTime',
        }),
    sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc')
        .messages({
            'any.only': 'SortOrder must be either asc or desc',
        }),
    forReports: Joi.string().valid('true', 'false').optional()
        .messages({
            'any.only': 'forReports must be either true or false',
        }),
}); 