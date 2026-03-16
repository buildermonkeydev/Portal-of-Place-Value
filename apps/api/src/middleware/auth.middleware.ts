import { Response, NextFunction } from 'express';
import Config from '@repo/env-config';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../apps/users/repository/UserRepository';
import { IRequest, JwtPayload, UserRole } from '../core/types';
import { logger } from '../utils/logger';

const userRepository = new UserRepository();



export const authenticateToken = async (
    req: IRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token is required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        const secret = Config.getInstance().getJWT().secret;

        try {
            const decoded = jwt.verify(token, secret) as JwtPayload;

            // Get user from database
            const user = await userRepository.findById(decoded.userId);
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'User not found',
                    timestamp: new Date().toISOString(),
                });
                return;
            }

            // Check if user is active
            if (!user.isActive) {
                res.status(401).json({
                    success: false,
                    message: 'Account is deactivated',
                    timestamp: new Date().toISOString(),
                });
                return;
            }

            // Attach user to request
            req.user = user;
            next();
        } catch (jwtError) {
            logger.error('JWT verification failed:', jwtError);
            res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
                timestamp: new Date().toISOString(),
            });
        }
    } catch (error) {
        logger.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed',
            timestamp: new Date().toISOString(),
        });
    }
};

export const authorizeRoles = (...roles: UserRole[]) => {
    return (req: IRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        next();
    };
};

export const requireAdmin = authorizeRoles(UserRole.ADMIN);