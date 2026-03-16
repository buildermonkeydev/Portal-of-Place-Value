import Joi from 'joi';
import { ITestCase, TestDifficulty, TestStatus } from '../interface/Test';

export interface ITestInputDto {
    value: string;
    order: number;
    inputFormat?: 'array' | 'string' | 'number' | 'object' | 'mixed';
    applicableLanguages?: number[];
}

export interface ITestCaseDto {
    inputs: ITestInputDto[];
    expectedOutput: string;
    isHidden: boolean;
    outputFormat?: 'array' | 'string' | 'number' | 'boolean' | 'object';
}

export interface CreateTestDto {
    title: string;
    description: string;
    problemStatement: string;
    difficulty: TestDifficulty;
    tags: string[];
    colleges?: {
        _id: string;
        branches?: {
            _id: string;
            name: string;
        }[];
        year?: number[];
    }[];
    assignedUsers?: string[];
    assignAllUsers?: boolean;
    testCases: ITestCaseDto[];
    constraints: string;
    allowedLanguages: number[];
    starterCode?: Record<string, string>; // Language ID (as string) -> starter code mapping
    executeCodeName: string; // Function/class name to execute (e.g., "threeSum", "Solution")
    status?: TestStatus;
}

export interface UpdateTestDto extends Partial<CreateTestDto> {
    isActive?: boolean;
}

export interface TestResponseDto {
    _id: string;
    title: string;
    problemStatement: string;
    difficulty: TestDifficulty;
    tags: string[];
    testCases: ITestCase[];
    constraints: string;
    allowedLanguages: number[];
    starterCode: Record<string, string>; // Language ID (as string) -> starter code mapping
    executeCodeName: string;
    status: TestStatus;
    createdBy: string | { firstName: string; lastName: string; email: string };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TestListResponseDto {
    _id: string;
    title: string;
    description: string;
    difficulty: TestDifficulty;
    tags: string[];
    allowedLanguages: number[];
    status: TestStatus;
    createdBy: string | { firstName: string; lastName: string; email: string };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TestSubmissionDto {
    sourceCode: string;
    languageId: number;
}

export interface TestSubmissionResponseDto {
    _id: string;
    testId: string;
    userId: string;
    sourceCode: string;
    languageId: number;
    testResults: Array<{
        testCaseId: string;
        passed: boolean;
        actualOutput?: string;
        expectedOutput: string;
        executionTime?: number;
        memoryUsed?: number;
        errorMessage?: string;
    }>;
    totalTestCases: number;
    passedTestCases: number;
    score: number;
    executionTime: number;
    submittedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface TestQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    difficulty?: TestDifficulty;
    tags?: string[] | undefined;
    status?: TestStatus;
    createdBy?: string;
    sortBy?: 'title' | 'difficulty' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

export interface TestSubmissionQueryParams {
    page?: number;
    limit?: number;
    testId?: string;
    userId?: string;
    sortBy?: 'submittedAt' | 'score' | 'executionTime';
    sortOrder?: 'asc' | 'desc';
    startDate?: Date;
    endDate?: Date;
}

// Validation schemas
const testInputSchema = Joi.object({
    value: Joi.string().required().trim().messages({
        'string.empty': 'Input value is required',
        'any.required': 'Input value is required'
    }),
    order: Joi.number().integer().min(1).required().messages({
        'number.min': 'Input order must be at least 1',
        'any.required': 'Input order is required'
    }),
    inputFormat: Joi.string().valid('array', 'string', 'number', 'object', 'mixed').optional(),
    applicableLanguages: Joi.array().items(Joi.number()).optional()
});

const testCaseSchema = Joi.object({
    inputs: Joi.array().items(testInputSchema).min(1).required().messages({
        'array.min': 'At least one input is required for each test case',
        'any.required': 'Test case inputs are required'
    }),
    expectedOutput: Joi.string().required().trim().messages({
        'string.empty': 'Test case expected output is required',
        'any.required': 'Test case expected output is required'
    }),
    isHidden: Joi.boolean().default(false),
    outputFormat: Joi.string().valid('array', 'string', 'number', 'boolean', 'object').optional(),
});



export const createTestSchema = Joi.object({
    title: Joi.string().required().trim().max(200).messages({
        'string.empty': 'Test title is required',
        'string.max': 'Title cannot exceed 200 characters',
        'any.required': 'Test title is required'
    }),
    problemStatement: Joi.string().required().trim().max(10000).messages({
        'string.empty': 'Problem statement is required',
        'string.max': 'Problem statement cannot exceed 10000 characters',
        'any.required': 'Problem statement is required'
    }),
    difficulty: Joi.string().valid(...Object.values(TestDifficulty)).required().messages({
        'any.only': 'Difficulty must be one of: easy, medium, hard',
        'any.required': 'Difficulty is required'
    }),
    tags: Joi.array().items(Joi.string().trim().max(50)).min(1).required().messages({
        'array.min': 'At least one tag is required',
        'any.required': 'Tags are required'
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
    assignedUsers: Joi.array().items(Joi.string()).optional().messages({
        'array.base': 'Assigned users must be an array of user IDs',
    }),
    assignAllUsers: Joi.boolean().optional(),
    testCases: Joi.array().items(testCaseSchema).min(1).required().messages({
        'array.min': 'At least one test case is required',
        'any.required': 'Test cases are required'
    }),
    constraints: Joi.string().required().trim().max(2000).messages({
        'string.empty': 'Constraints are required',
        'string.max': 'Constraints cannot exceed 2000 characters',
        'any.required': 'Constraints are required'
    }),
    allowedLanguages: Joi.array().items(Joi.number()).min(1).required().messages({
        'array.min': 'At least one programming language must be allowed',
        'any.required': 'Allowed languages are required'
    }),
    starterCode: Joi.object().pattern(Joi.string(), Joi.string().trim().max(5000)).optional().messages({
        'object.pattern': 'Starter code must be a valid language ID to code mapping'
    }),
    executeCodeName: Joi.string().required().trim().max(100).messages({
        'string.empty': 'Execute code name is required',
        'string.max': 'Execute code name cannot exceed 100 characters',
        'any.required': 'Execute code name is required'
    }),
    status: Joi.string().valid(...Object.values(TestStatus)).optional()
});

export const updateTestSchema = Joi.object({
    title: Joi.string().trim().max(200).optional(),
    problemStatement: Joi.string().trim().max(10000).optional(),
    difficulty: Joi.string().valid(...Object.values(TestDifficulty)).optional(),
    tags: Joi.array().items(Joi.string().trim().max(50)).optional(),
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
    assignedUsers: Joi.array().items(Joi.string()).optional().messages({
        'array.base': 'Assigned users must be an array of user IDs',
    }),
    assignAllUsers: Joi.boolean().optional(),
    testCases: Joi.array().items(testCaseSchema).optional(),
    constraints: Joi.string().trim().max(2000).optional(),
    allowedLanguages: Joi.array().items(Joi.number()).optional(),
    starterCode: Joi.object().pattern(Joi.string(), Joi.string().trim().max(5000)).optional().messages({
        'object.pattern': 'Starter code must be a valid language ID to code mapping'
    }),
    executeCodeName: Joi.string().trim().max(100).optional().messages({
        'string.max': 'Execute code name cannot exceed 100 characters'
    }),
    status: Joi.string().valid(...Object.values(TestStatus)).optional(),
    isActive: Joi.boolean().optional()
});

export const testQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().trim().allow("").optional(),
    difficulty: Joi.string().valid(...Object.values(TestDifficulty)).optional(),
    tags: Joi.string().optional(),
    status: Joi.string().valid(...Object.values(TestStatus)).optional(),
    createdBy: Joi.string().optional(),
    sortBy: Joi.string().valid('title', 'difficulty', 'createdAt', 'updatedAt').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
});

export const testSubmissionSchema = Joi.object({
    sourceCode: Joi.string().required().trim().messages({
        'string.empty': 'Source code is required',
        'any.required': 'Source code is required'
    }),
    languageId: Joi.number().required().messages({
        'any.required': 'Language ID is required'
    })
});
