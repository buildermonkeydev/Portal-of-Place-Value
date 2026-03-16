import Joi from 'joi';
import { UserRole } from '../interface/User';

export interface BaseUserDto {
    email: string;
    firstName: string;
    lastName: string;
    mobileNumber: string;
    collegeName?: string;
    collegeId?: string;
    branchName?: string;
    branchId?: string;
    collegeYear: number;
    registrationNo: string;
    role?: UserRole;
}

// Create user DTO
export interface CreateUserDto extends BaseUserDto {
    password: string;
}

// Update user DTO
export interface PartialUpdateUserDto extends Partial<Omit<BaseUserDto, 'collegeName'>> {
    collegeName?: string;
    collegeId?: string;
    branchId?: string;
    password?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
}

// Update user DTO (for admin updates)
export interface UpdateUserDto extends PartialUpdateUserDto {
    role?: UserRole;
}

// Login DTO
export interface LoginDto {
    email: string;
    password: string;
}

// Change password DTO
export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

// Email verification DTO
export interface EmailVerificationDto {
    token: string;
}

// Forgot password DTO
export interface ForgotPasswordDto {
    email: string;
}

// Reset password DTO
export interface ResetPasswordDto {
    token: string;
    newPassword: string;
}

// User response DTO
export interface UserResponseDto {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    mobileNumber: string;
    college: {
        _id: string;
        name: string;
    };
    collegeYear: number;
    registrationNo: string;
    role: UserRole;
    isActive: boolean;
    isEmailVerified: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Validation schemas
export const createUserSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
    password: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'Password must be at least 6 characters long',
            'any.required': 'Password is required',
        }),
    firstName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': 'First name must be at least 2 characters long',
            'string.max': 'First name cannot exceed 50 characters',
            'any.required': 'First name is required',
        }),
    lastName: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': 'Last name must be at least 2 characters long',
            'string.max': 'Last name cannot exceed 50 characters',
            'any.required': 'Last name is required',
        }),
    mobileNumber: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .required()
        .messages({
            'string.pattern.base': 'Mobile number must be exactly 10 digits',
            'any.required': 'Mobile number is required',
        }),
    role: Joi.string()
        .valid(...Object.values(UserRole))
        .default(UserRole.STUDENT)
        .messages({
            'any.only': 'Invalid role value',
        }),
    collegeName: Joi.when('role', {
        is: UserRole.STUDENT,
        then: Joi.string()
            .min(2)
            .max(100)
            .optional() // Made optional because collegeId might be provided
            .messages({
                'string.min': 'College name must be at least 2 characters long',
                'string.max': 'College name cannot exceed 100 characters',
            }),
        otherwise: Joi.any().strip()
    }),
    collegeId: Joi.when('role', {
        is: UserRole.STUDENT,
        then: Joi.string().optional().allow('', null),
        otherwise: Joi.any().strip()
    }),
    branchName: Joi.when('role', {
        is: UserRole.STUDENT,
        then: Joi.string()
            .min(2)
            .max(100)
            .optional() // Made optional because branchId might be provided
            .messages({
                'string.min': 'Branch name must be at least 2 characters long',
                'string.max': 'Branch name cannot exceed 100 characters',
            }),
        otherwise: Joi.any().strip()
    }),
    branchId: Joi.when('role', {
        is: UserRole.STUDENT,
        then: Joi.string().optional().allow('', null),
        otherwise: Joi.any().strip()
    }),
    collegeYear: Joi.when('role', {
        is: UserRole.STUDENT,
        then: Joi.number()
            .integer()
            .min(1)
            .max(4)
            .required()
            .messages({
                'number.base': 'College year must be a number',
                'number.integer': 'College year must be a whole number',
                'number.min': 'College year must be at least 1',
                'number.max': 'College year cannot exceed 4',
                'any.required': 'College year is required',
            }),
        otherwise: Joi.any().strip()
    }),
    registrationNo: Joi.when('role', {
        is: UserRole.STUDENT,
        then: Joi.string()
            .min(1)
            .pattern(/^[A-Za-z0-9]+$/)
            .required()
            .messages({
                'string.base': 'Registration number must be a string',
                'string.min': 'Registration number is required',
                'string.max': 'Registration number cannot exceed 20 characters',
                'string.pattern.base': 'Registration number must contain only letters and numbers',
                'any.required': 'Registration number is required',
            }),
        otherwise: Joi.any().strip()
    }),
});

export const updateUserSchema = Joi.object({
    email: Joi.string()
        .email()
        .messages({
            'string.email': 'Please provide a valid email address',
        }),
    password: Joi.string()
        .min(6)
        .messages({
            'string.min': 'Password must be at least 6 characters long',
        }),
    firstName: Joi.string()
        .min(2)
        .max(50)
        .messages({
            'string.min': 'First name must be at least 2 characters long',
            'string.max': 'First name cannot exceed 50 characters',
        }),
    lastName: Joi.string()
        .min(2)
        .max(50)
        .messages({
            'string.min': 'Last name must be at least 2 characters long',
            'string.max': 'Last name cannot exceed 50 characters',
        }),
    mobileNumber: Joi.string()
        .pattern(/^[0-9]{10}$/)
        .messages({
            'string.pattern.base': 'Mobile number must be exactly 10 digits',
        }),
    collegeName: Joi.when('role', {
        is: UserRole.STUDENT,
        then: Joi.string()
            .min(2)
            .max(100)
            .messages({
                'string.min': 'College name must be at least 2 characters long',
                'string.max': 'College name cannot exceed 100 characters',
            }),
        otherwise: Joi.any().strip()
    }),
    collegeId: Joi.when('role', {
        is: UserRole.STUDENT,
        then: Joi.string().optional().allow('', null).messages({
            'string.base': 'College ID must be a string',
        }),
        otherwise: Joi.any().strip()
    }),
    branchId: Joi.when('role', {
        is: UserRole.STUDENT,
        then: Joi.string().optional().allow('', null).messages({
            'string.base': 'Branch ID must be a string',
        }),
        otherwise: Joi.any().strip()
    }),
    collegeYear: Joi.when('role', {
        is: UserRole.STUDENT,
        then: Joi.number()
            .integer()
            .min(1)
            .max(4)
            .messages({
                'number.base': 'College year must be a number',
                'number.integer': 'College year must be a whole number',
                'number.min': 'College year must be at least 1',
                'number.max': 'College year cannot exceed 4',
            }),
        otherwise: Joi.any().strip()
    }),
    registrationNo: Joi.when('role', {
        is: UserRole.STUDENT,
        then: Joi.string()
            .min(1)
            .max(20)
            .pattern(/^[A-Za-z0-9]+$/)
            .messages({
                'string.base': 'Registration number must be a string',
                'string.min': 'Registration number is required',
                'string.max': 'Registration number cannot exceed 20 characters',
                'string.pattern.base': 'Registration number must contain only letters and numbers',
            }),
        otherwise: Joi.any().strip()
    }),
    role: Joi.string()
        .valid(...Object.values(UserRole))
        .messages({
            'any.only': 'Invalid role value',
        }),
    isActive: Joi.boolean(),
    isEmailVerified: Joi.boolean(),
});

export const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Password is required',
        }),
});

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'any.required': 'Current password is required',
        }),
    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'New password must be at least 6 characters long',
            'any.required': 'New password is required',
        }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Passwords do not match',
            'any.required': 'Password confirmation is required',
        }),
});

// Query parameters schema
export const userQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    role: Joi.string().valid(...Object.values(UserRole)).optional(),
    isActive: Joi.boolean().optional(),
    search: Joi.string().min(1).max(100).optional().custom((value, helpers) => {
        // Additional validation to prevent problematic values
        if (value === '{}' || value === 'null' || value === 'undefined') {
            return helpers.error('any.invalid');
        }
        return value;
    }, 'search validation').messages({
        'any.invalid': 'Search parameter contains invalid value',
        'string.min': 'Search parameter must be at least 1 character long',
        'string.max': 'Search parameter cannot exceed 100 characters'
    }),
    sortBy: Joi.string().optional().valid('createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'collegeName', 'collegeYear', 'registrationNo').default('createdAt'),
    sortOrder: Joi.string().optional().valid('asc', 'desc').default('desc'),
});

// Email verification schema
export const emailVerificationSchema = Joi.object({
    token: Joi.string()
        .required()
        .messages({
            'any.required': 'Verification token is required',
        }),
});

// Forgot password schema
export const forgotPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
        }),
});

// Reset password schema
export const resetPasswordSchema = Joi.object({
    token: Joi.string()
        .required()
        .messages({
            'any.required': 'Reset token is required',
        }),
    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            'string.min': 'New password must be at least 6 characters long',
            'any.required': 'New password is required',
        }),
});

// Admin operation schemas
export const updateUserRoleSchema = Joi.object({
    role: Joi.string()
        .valid(...Object.values(UserRole))
        .required()
        .messages({
            'any.only': 'Invalid role value',
            'any.required': 'Role is required',
        }),
});

export const bulkDeleteUsersSchema = Joi.object({
    userIds: Joi.array()
        .items(Joi.string())
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one user ID is required',
            'any.required': 'User IDs are required',
        }),
});

export const bulkUpdateUserRolesSchema = Joi.object({
    userIds: Joi.array()
        .items(Joi.string())
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one user ID is required',
            'any.required': 'User IDs are required',
        }),
    role: Joi.string()
        .valid(...Object.values(UserRole))
        .required()
        .messages({
            'any.only': 'Invalid role value',
            'any.required': 'Role is required',
        }),
});

export const bulkAssignAssessmentSchema = Joi.object({
    userIds: Joi.array()
        .items(Joi.string())
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one user ID is required',
            'any.required': 'User IDs are required',
        }),
    assessmentId: Joi.string()
        .required()
        .messages({
            'any.required': 'Assessment ID is required',
        }),
});

export const importUsersSchema = Joi.object({
    users: Joi.array()
        .items(Joi.object({
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address',
                    'any.required': 'Email is required',
                }),
            firstName: Joi.string()
                .min(2)
                .max(50)
                .required()
                .messages({
                    'string.min': 'First name must be at least 2 characters long',
                    'string.max': 'First name cannot exceed 50 characters',
                    'any.required': 'First name is required',
                }),
            lastName: Joi.string()
                .min(2)
                .max(50)
                .required()
                .messages({
                    'string.min': 'Last name must be at least 2 characters long',
                    'string.max': 'Last name cannot exceed 50 characters',
                    'any.required': 'Last name is required',
                }),
            mobileNumber: Joi.string()
                .pattern(/^[0-9]{10}$/)
                .required()
                .messages({
                    'string.pattern.base': 'Mobile number must be exactly 10 digits',
                    'any.required': 'Mobile number is required',
                }),
            role: Joi.string()
                .valid(...Object.values(UserRole))
                .default(UserRole.STUDENT)
                .messages({
                    'any.only': 'Invalid role value',
                }),
            collegeName: Joi.when('role', {
                is: UserRole.STUDENT,
                then: Joi.string()
                    .min(2)
                    .max(100)
                    .required()
                    .messages({
                        'string.min': 'College name must be at least 2 characters long',
                        'string.max': 'College name cannot exceed 100 characters',
                        'any.required': 'College name is required',
                    }),
                otherwise: Joi.any().strip()
            }),
            branchName: Joi.when('role', {
                is: UserRole.STUDENT,
                then: Joi.string()
                    .min(2)
                    .max(100)
                    .required()
                    .messages({
                        'string.min': 'Branch name must be at least 2 characters long',
                        'string.max': 'Branch name cannot exceed 100 characters',
                        'any.required': 'Branch name is required',
                    }),
                otherwise: Joi.any().strip()
            }),
            collegeYear: Joi.when('role', {
                is: UserRole.STUDENT,
                then: Joi.number()
                    .integer()
                    .min(1)
                    .max(4)
                    .required()
                    .messages({
                        'number.base': 'College year must be a number',
                        'number.integer': 'College year must be a whole number',
                        'number.min': 'College year must be at least 1',
                        'number.max': 'College year cannot exceed 4',
                        'any.required': 'College year is required',
                    }),
                otherwise: Joi.any().strip()
            }),
            registrationNo: Joi.when('role', {
                is: UserRole.STUDENT,
                then: Joi.string()
                    .min(1)
                    .max(20)
                    .pattern(/^[A-Za-z0-9]+$/)
                    .required()
                    .messages({
                        'string.base': 'Registration number must be a string',
                        'string.min': 'Registration number is required',
                        'string.max': 'Registration number cannot exceed 20 characters',
                        'string.pattern.base': 'Registration number must contain only letters and numbers',
                        'any.required': 'Registration number is required',
                    }),
                otherwise: Joi.any().strip()
            }),
        }))
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one user is required',
            'any.required': 'Users are required',
        }),
});

// Bulk disable users with filters schema
export const bulkDisableUsersWithFiltersSchema = Joi.object({
    collegeId: Joi.string()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'College ID must be a string',
        }),
    branchId: Joi.string()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Branch ID must be a string',
        }),
    branchIds: Joi.array()
        .items(Joi.string())
        .optional()
        .allow(null)
        .messages({
            'array.base': 'Branch IDs must be an array',
        }),
    collegeYear: Joi.number()
        .integer()
        .min(1)
        .max(4)
        .optional()
        .allow(null)
        .messages({
            'number.base': 'College year must be a number',
            'number.integer': 'College year must be a whole number',
            'number.min': 'College year must be at least 1',
            'number.max': 'College year cannot exceed 4',
        }),
    collegeYears: Joi.array()
        .items(Joi.number().integer().min(1).max(4))
        .optional()
        .allow(null)
        .messages({
            'array.base': 'College years must be an array',
        }),
}).or('collegeId', 'branchId', 'branchIds', 'collegeYear', 'collegeYears')
    .messages({
        'object.missing': 'At least one filter must be provided',
    });

// Bulk enable users with filters schema (reuse same structure)
export const bulkEnableUsersWithFiltersSchema = Joi.object({
    collegeId: Joi.string()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'College ID must be a string',
        }),
    branchId: Joi.string()
        .optional()
        .allow(null, '')
        .messages({
            'string.base': 'Branch ID must be a string',
        }),
    branchIds: Joi.array()
        .items(Joi.string())
        .optional()
        .allow(null)
        .messages({
            'array.base': 'Branch IDs must be an array',
        }),
    collegeYear: Joi.number()
        .integer()
        .min(1)
        .max(4)
        .optional()
        .allow(null)
        .messages({
            'number.base': 'College year must be a number',
            'number.integer': 'College year must be a whole number',
            'number.min': 'College year must be at least 1',
            'number.max': 'College year cannot exceed 4',
        }),
    collegeYears: Joi.array()
        .items(Joi.number().integer().min(1).max(4))
        .optional()
        .allow(null)
        .messages({
            'array.base': 'College years must be an array',
        }),
}).or('collegeId', 'branchId', 'branchIds', 'collegeYear', 'collegeYears')
    .messages({
        'object.missing': 'At least one filter must be provided',
    }); 