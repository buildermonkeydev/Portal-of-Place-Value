import Joi from 'joi';

// Invite users by email list
export interface InviteUsersDto {
    emails: string[];
    message?: string;
}

// Validation schemas
export const inviteUsersSchema = Joi.object({
    emails: Joi.array()
        .items(Joi.string().email().required())
        .min(1)
        .required()
        .messages({
            'array.min': 'At least one email is required',
            'any.required': 'Emails array is required',
        }),
    message: Joi.string()
        .optional()
        .max(500)
        .messages({
            'string.max': 'Message cannot exceed 500 characters',
        }),
}); 