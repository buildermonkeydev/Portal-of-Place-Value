import Joi from 'joi';

// Base college DTO
export interface BaseCollegeDto {
    name: string;
    branches?: Array<{
        name: string;
    }>;
}

// Create college DTO
export interface CreateCollegeDto extends BaseCollegeDto { }

// Update college DTO
export interface UpdateCollegeDto extends Partial<BaseCollegeDto> { }

// Create branch DTO
export interface CreateBranchDto {
    name: string;
}

// Update branch DTO
export interface UpdateBranchDto {
    name: string;
}

// Add branch to college DTO
export interface AddBranchToCollegeDto {
    collegeId: string;
    branchName: string;
}

// Bulk import college DTO
export interface BulkImportCollegeDto {
    name: string;
    branches?: string[];
}

// Bulk import response DTO
export interface BulkImportResponseDto {
    success: boolean;
    message: string;
    imported: number;
    failed: number;
    errors?: string[];
}

// Validation schemas
export const createCollegeSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'College name must be at least 2 characters long',
            'string.max': 'College name cannot exceed 100 characters',
            'any.required': 'College name is required',
        }),
    branches: Joi.array().items(
        Joi.object({
            name: Joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    'string.min': 'Branch name must be at least 2 characters long',
                    'string.max': 'Branch name cannot exceed 100 characters',
                    'any.required': 'Branch name is required',
                }),
        })
    ).min(1).required().messages({
        'array.min': 'At least one branch is required',
        'any.required': 'Branches are required',
    }),
});

export const updateCollegeSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .messages({
            'string.min': 'College name must be at least 2 characters long',
            'string.max': 'College name cannot exceed 100 characters',
        }),
    branches: Joi.array().items(
        Joi.object({
            _id: Joi.string(),
            name: Joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    'string.min': 'Branch name must be at least 2 characters long',
                    'string.max': 'Branch name cannot exceed 100 characters',
                    'any.required': 'Branch name is required',
                }),
        })
    ).min(1).required().messages({
        'array.min': 'At least one branch is required',
        'any.required': 'Branches are required',
    }),
});

export const createBranchSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Branch name must be at least 2 characters long',
            'string.max': 'Branch name cannot exceed 100 characters',
            'any.required': 'Branch name is required',
        }),
});

export const updateBranchSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Branch name must be at least 2 characters long',
            'string.max': 'Branch name cannot exceed 100 characters',
            'any.required': 'Branch name is required',
        }),
});

export const addBranchToCollegeSchema = Joi.object({
    collegeId: Joi.string()
        .required()
        .messages({
            'any.required': 'College ID is required',
        }),
    branchName: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Branch name must be at least 2 characters long',
            'string.max': 'Branch name cannot exceed 100 characters',
            'any.required': 'Branch name is required',
        }),
});

export const bulkImportCollegeSchema = Joi.object({
    colleges: Joi.array().items(
        Joi.object({
            name: Joi.string()
                .min(2)
                .max(100)
                .required()
                .messages({
                    'string.min': 'College name must be at least 2 characters long',
                    'string.max': 'College name cannot exceed 100 characters',
                    'any.required': 'College name is required',
                }),
            branches: Joi.array().items(
                Joi.string()
                    .min(2)
                    .max(100)
                    .messages({
                        'string.min': 'Branch name must be at least 2 characters long',
                        'string.max': 'Branch name cannot exceed 100 characters',
                    })
            ).min(1).required().messages({
                'array.min': 'At least one branch is required',
                'any.required': 'Branches are required',
            }),
        })
    ).min(1).required().messages({
        'array.min': 'At least one college is required',
        'any.required': 'Colleges are required',
    }),
});

// Query parameters schema
export const collegeQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().min(1).max(100).optional(),
    sortBy: Joi.string().optional().valid('name', 'createdAt', 'updatedAt').default('name'),
    sortOrder: Joi.string().optional().valid('asc', 'desc').default('asc'),
}); 