import { Request } from 'express';
import { IUser, UserRole } from '../../apps/users/interface/User';

// JWT types
export interface JwtPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

// Request with user
export interface AuthenticatedRequest extends Request {
    user?: IUser;
} 