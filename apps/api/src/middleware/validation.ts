import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { logger } from '../utils/logger';

export const validateRequest = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const { error, value } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
            });

            if (error) {
                const validationErrors = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value,
                }));

                logger.warn('Validation failed:', { errors: validationErrors, body: req.body });

                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors,
                    timestamp: new Date().toISOString(),
                });
                return;
            }

            // Replace request body with validated data
            req.body = value;
            next();
        } catch (error) {
            logger.error('Validation middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Validation error',
                timestamp: new Date().toISOString(),
            });
        }
    };
};

export const validateQuery = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const { error, value } = schema.validate(req.query, {
                abortEarly: false,
                stripUnknown: true,
            });

            if (error) {
                const validationErrors = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value,
                }));

                logger.warn('Query validation failed:', { errors: validationErrors, query: req.query });

                res.status(400).json({
                    success: false,
                    message: 'Query validation failed',
                    errors: validationErrors,
                    timestamp: new Date().toISOString(),
                });
                return;
            }

            // Replace request query with validated data
            req.query = value;
            next();
        } catch (error) {
            logger.error('Query validation middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Query validation error',
                timestamp: new Date().toISOString(),
            });
        }
    };
};

export const validateParams = (schema: Schema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const { error, value } = schema.validate(req.params, {
                abortEarly: false,
                stripUnknown: true,
            });

            if (error) {
                const validationErrors = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value,
                }));

                logger.warn('Params validation failed:', { errors: validationErrors, params: req.params });

                res.status(400).json({
                    success: false,
                    message: 'Parameters validation failed',
                    errors: validationErrors,
                    timestamp: new Date().toISOString(),
                });
                return;
            }

            // Replace request params with validated data
            req.params = value;
            next();
        } catch (error) {
            logger.error('Params validation middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Parameters validation error',
                timestamp: new Date().toISOString(),
            });
        }
    };
}; 