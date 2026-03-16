import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logger } from './logger';
import Config from '@repo/env-config';

const config = Config.getInstance();

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
    [key: string]: any;
}

export interface RefreshTokenPayload {
    userId: string;
    tokenId: string;
    type: 'refresh';
}

export interface ApiKeyPayload {
    userId: string;
    keyId: string;
    permissions: string[];
    type: 'api_key';
}

export interface TokenConfig {
    secret: string;
    expiresIn: string;
    issuer?: string;
    audience?: string;
}

export class SecretUtils {
    private static readonly DEFAULT_JWT_SECRET = config.getJWT().secret;
    private static readonly DEFAULT_REFRESH_SECRET = config.getJWT().refreshSecret; // Use same secret for refresh tokens
    private static readonly DEFAULT_API_KEY_SECRET = config.getJWT().refreshSecret; // Use same secret for API keys

    private static readonly DEFAULT_JWT_EXPIRES_IN = config.getJWT().expiresIn;
    private static readonly DEFAULT_REFRESH_EXPIRES_IN = config.getJWT().refreshExpiresIn;
    private static readonly DEFAULT_API_KEY_EXPIRES_IN = '30d';

    /**
     * Generate JWT access token
     */
    static generateAccessToken(payload: TokenPayload, config?: Partial<TokenConfig>): string {
        try {
            const tokenConfig: TokenConfig = {
                secret: config?.secret || this.DEFAULT_JWT_SECRET,
                expiresIn: config?.expiresIn || this.DEFAULT_JWT_EXPIRES_IN,
                issuer: config?.issuer || 'Bl-compiler-api',
                audience: config?.audience || 'Bl-compiler-users'
            };

            const token = jwt.sign(payload, tokenConfig.secret, {
                expiresIn: tokenConfig.expiresIn,
                issuer: tokenConfig.issuer,
                audience: tokenConfig.audience,
                algorithm: 'HS256'
            } as jwt.SignOptions);

            logger.info(`Access token generated for user: ${payload.userId}`);
            return token;
        } catch (error) {
            logger.error('Error generating access token:', error);
            throw new Error('Failed to generate access token');
        }
    }

    /**
     * Generate refresh token
     */
    static async generateRefreshToken(userId: string, config?: Partial<TokenConfig>): Promise<{ token: string; tokenId: string }> {
        try {
            const { v4: uuidv4 } = await import('uuid');
            const tokenId = uuidv4();
            const payload: RefreshTokenPayload = {
                userId,
                tokenId,
                type: 'refresh'
            };

            const tokenConfig: TokenConfig = {
                secret: config?.secret || this.DEFAULT_REFRESH_SECRET,
                expiresIn: config?.expiresIn || this.DEFAULT_REFRESH_EXPIRES_IN,
                issuer: config?.issuer || 'bl-compiler-api',
                audience: config?.audience || 'bl-compiler-users'
            };

            const token = jwt.sign(payload, tokenConfig.secret, {
                expiresIn: tokenConfig.expiresIn,
                issuer: tokenConfig.issuer,
                audience: tokenConfig.audience,
                algorithm: 'HS256'
            } as jwt.SignOptions);

            logger.info(`Refresh token generated for user: ${userId}`);
            return { token, tokenId };
        } catch (error) {
            logger.error('Error generating refresh token:', error);
            throw new Error('Failed to generate refresh token');
        }
    }

    /**
     * Generate API key
     */
    static async generateApiKey(userId: string, permissions: string[] = [], config?: Partial<TokenConfig>): Promise<{ apiKey: string; keyId: string }> {
        try {
            const { v4: uuidv4 } = await import('uuid');
            const keyId = uuidv4();
            const payload: ApiKeyPayload = {
                userId,
                keyId,
                permissions,
                type: 'api_key'
            };

            const tokenConfig: TokenConfig = {
                secret: config?.secret || this.DEFAULT_API_KEY_SECRET,
                expiresIn: config?.expiresIn || this.DEFAULT_API_KEY_EXPIRES_IN,
                issuer: config?.issuer || 'Bl-compiler-api',
                audience: config?.audience || 'Bl-compiler-api-users'
            };

            const apiKey = jwt.sign(payload, tokenConfig.secret, {
                expiresIn: tokenConfig.expiresIn,
                issuer: tokenConfig.issuer,
                audience: tokenConfig.audience,
                algorithm: 'HS256'
            } as jwt.SignOptions);

            logger.info(`API key generated for user: ${userId}`);
            return { apiKey, keyId };
        } catch (error) {
            logger.error('Error generating API key:', error);
            throw new Error('Failed to generate API key');
        }
    }

    /**
     * Verify JWT token
     */
    static verifyToken(token: string, secret?: string): any {
        try {
            const tokenSecret = secret || this.DEFAULT_JWT_SECRET;
            const decoded = jwt.verify(token, tokenSecret, {
                algorithms: ['HS256']
            });

            logger.debug('Token verified successfully');
            return decoded;
        } catch (error) {
            logger.error('Token verification failed:', error);
            throw new Error('Invalid token');
        }
    }

    /**
     * Verify refresh token
     */
    static verifyRefreshToken(token: string, secret?: string): RefreshTokenPayload {
        try {
            const tokenSecret = secret || this.DEFAULT_REFRESH_SECRET;
            const decoded = jwt.verify(token, tokenSecret, {
                algorithms: ['HS256']
            }) as RefreshTokenPayload;

            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            logger.debug('Refresh token verified successfully');
            return decoded;
        } catch (error) {
            logger.error('Refresh token verification failed:', error);
            throw new Error('Invalid refresh token');
        }
    }

    /**
     * Verify API key
     */
    static verifyApiKey(apiKey: string, secret?: string): ApiKeyPayload {
        try {
            const tokenSecret = secret || this.DEFAULT_API_KEY_SECRET;
            const decoded = jwt.verify(apiKey, tokenSecret, {
                algorithms: ['HS256']
            }) as ApiKeyPayload;

            if (decoded.type !== 'api_key') {
                throw new Error('Invalid token type');
            }

            logger.debug('API key verified successfully');
            return decoded;
        } catch (error) {
            logger.error('API key verification failed:', error);
            throw new Error('Invalid API key');
        }
    }

    /**
     * Generate random secret key
     */
    static generateSecretKey(length: number = 32): string {
        try {
            const secret = crypto.randomBytes(length).toString('hex');
            logger.info(`Generated secret key of length: ${length}`);
            return secret;
        } catch (error) {
            logger.error('Error generating secret key:', error);
            throw new Error('Failed to generate secret key');
        }
    }

    /**
     * Generate secure random string
     */
    static generateRandomString(length: number = 16): string {
        try {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        } catch (error) {
            logger.error('Error generating random string:', error);
            throw new Error('Failed to generate random string');
        }
    }

    /**
     * Generate UUID v4
     */
    static async generateUUID(): Promise<string> {
        const { v4: uuidv4 } = await import('uuid');
        return uuidv4();
    }

    /**
     * Generate UUID v5 (namespace-based)
     */
    static async generateUUIDv5(name: string, namespace: string = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'): Promise<string> {
        const { v5: uuidv5 } = await import('uuid');
        return uuidv5(name, namespace);
    }

    /**
     * Hash password
     */
    static async hashPassword(password: string): Promise<string> {
        try {
            const salt = await bcrypt.genSalt(12);
            const hash = await bcrypt.hash(password, salt);
            logger.debug('Password hashed successfully');
            return hash;
        } catch (error) {
            logger.error('Error hashing password:', error);
            throw new Error('Failed to hash password');
        }
    }

    /**
     * Compare password with hash
     */
    static async comparePassword(password: string, hash: string): Promise<boolean> {
        try {
            const isMatch = await bcrypt.compare(password, hash);
            logger.debug('Password comparison completed');
            return isMatch;
        } catch (error) {
            logger.error('Error comparing password:', error);
            throw new Error('Failed to compare password');
        }
    }

    /**
     * Generate password reset token
     */
    static async generatePasswordResetToken(userId: string, expiresIn: string = '1h'): Promise<{ token: string; tokenId: string }> {
        try {
            const { v4: uuidv4 } = await import('uuid');
            const tokenId = uuidv4();
            const payload = {
                userId,
                tokenId,
                type: 'password_reset',
                iat: Math.floor(Date.now() / 1000)
            };

            const token = jwt.sign(payload, this.DEFAULT_JWT_SECRET, {
                expiresIn,
                algorithm: 'HS256'
            } as jwt.SignOptions);

            logger.info(`Password reset token generated for user: ${userId}`);
            return { token, tokenId };
        } catch (error) {
            logger.error('Error generating password reset token:', error);
            throw new Error('Failed to generate password reset token');
        }
    }

    /**
     * Generate email verification token
     */
    static async generateEmailVerificationToken(userId: string, email: string, expiresIn: string = '24h'): Promise<{ token: string; tokenId: string }> {
        try {
            const { v4: uuidv4 } = await import('uuid');
            const tokenId = uuidv4();
            const payload = {
                userId,
                email,
                tokenId,
                type: 'email_verification',
                iat: Math.floor(Date.now() / 1000)
            };

            const token = jwt.sign(payload, this.DEFAULT_JWT_SECRET as jwt.Secret, {
                expiresIn: expiresIn,
                algorithm: 'HS256'
            } as jwt.SignOptions);

            logger.info(`Email verification token generated for user: ${userId}`);
            return { token, tokenId };
        } catch (error) {
            logger.error('Error generating email verification token:', error);
            throw new Error('Failed to generate email verification token');
        }
    }

    /**
     * Decode token without verification (for debugging)
     */
    static decodeToken(token: string): any {
        try {
            const decoded = jwt.decode(token);
            return decoded;
        } catch (error) {
            logger.error('Error decoding token:', error);
            throw new Error('Failed to decode token');
        }
    }

    /**
     * Check if token is expired
     */
    static isTokenExpired(token: string): boolean {
        try {
            const decoded = jwt.decode(token) as any;
            if (!decoded || !decoded.exp) {
                return true;
            }

            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (error) {
            logger.error('Error checking token expiration:', error);
            return true;
        }
    }

    /**
     * Get token expiration time
     */
    static getTokenExpirationTime(token: string): Date | null {
        try {
            const decoded = jwt.decode(token) as any;
            if (!decoded || !decoded.exp) {
                return null;
            }

            return new Date(decoded.exp * 1000);
        } catch (error) {
            logger.error('Error getting token expiration time:', error);
            return null;
        }
    }
}

export default SecretUtils; 