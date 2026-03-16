import apiClient from './client';
import { User } from '@/lib/types';

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    mobileNumber: string;
    collegeName: string;
    collegeYear: number;
    registrationNo: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        accessToken: string;
        refreshToken: string;
    };
    timestamp: string;
}

export interface EmailVerificationData {
    token: string;
}

export interface ForgotPasswordData {
    email: string;
}

export interface ResetPasswordData {
    token: string;
    newPassword: string;
}

export const authAPI = {
    login: async (data: LoginData): Promise<AuthResponse> => {
        const response = await apiClient.post('/api/v1/auth/login', data);
        return response.data;
    },

    register: async (data: RegisterData): Promise<{ message: string }> => {
        const response = await apiClient.post('/api/v1/auth/register', data);
        return response.data;
    },

    verifyEmail: async (data: EmailVerificationData): Promise<{ message: string }> => {
        const response = await apiClient.post('/api/v1/auth/verify-email', data);
        return response.data;
    },

    resendVerification: async (email: string): Promise<{ message: string }> => {
        const response = await apiClient.post('/api/v1/auth/resend-verification', { email });
        return response.data;
    },

    forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
        const response = await apiClient.post('/api/v1/auth/forgot-password', data);
        return response.data;
    },

    resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
        const response = await apiClient.post('/api/v1/auth/reset-password', data);
        return response.data;
    },

    getProfile: async (): Promise<User> => {
        const response = await apiClient.get('/api/v1/auth/profile');
        return response.data.data;
    },

    updateProfile: async (data: Partial<User>): Promise<User> => {
        const response = await apiClient.put('/api/v1/user/profile', data);
        return response.data.data;
    },

    refreshToken: async (refreshToken: string): Promise<{ data: { accessToken: string } }> => {
        const response = await apiClient.post('/api/v1/auth/refresh-token', { refreshToken });
        return response.data;
    },
}; 