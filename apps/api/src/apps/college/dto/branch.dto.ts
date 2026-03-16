import Joi from 'joi';

// Base branch DTO
export interface BaseBranchDto {
    name: string;
}

// Create branch DTO
export interface CreateBranchDto extends BaseBranchDto { }

// Update branch DTO
export interface UpdateBranchDto extends Partial<BaseBranchDto> { }

// Bulk import branch DTO
export interface BulkImportBranchDto {
    name: string;
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
        .messages({
            'string.min': 'Branch name must be at least 2 characters long',
            'string.max': 'Branch name cannot exceed 100 characters',
        }),
});

export const bulkImportBranchSchema = Joi.object({
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

// Query parameters schema
export const branchQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().min(1).max(100).optional(),
    sortBy: Joi.string().optional().valid('name', 'createdAt', 'updatedAt').default('name'),
    sortOrder: Joi.string().optional().valid('asc', 'desc').default('asc'),
}); 