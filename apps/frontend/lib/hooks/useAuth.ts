import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authAPI, LoginData, RegisterData, EmailVerificationData } from '@/lib/api/auth';
import { getAccessToken, setTokens, clearTokens, setRouter } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';
import { useEffect } from 'react';

export const useAuth = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    // Set router reference for API client
    useEffect(() => {
        setRouter(router);
    }, [router]);

    // Check if token exists in localStorage
    const hasToken = typeof window !== 'undefined' && getAccessToken();

    // Check if we're on an auth page to prevent unnecessary API calls
    const isAuthPage = typeof window !== 'undefined' && (
        window.location.pathname === '/login' ||
        window.location.pathname === '/register' ||
        window.location.pathname === '/verify-email'
    );

    const { data: user, isLoading: isLoadingUser, error: userError } = useQuery({
        queryKey: ['user'],
        queryFn: authAPI.getProfile,
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!hasToken && !isAuthPage, // Only run query if token exists and not on auth pages
    });

    // Handle authentication errors
    useEffect(() => {
        if (userError && (userError as any)?.response?.status === 401) {
            // If profile fetch fails with 401, clear invalid token and user data
            clearTokens();
            queryClient.removeQueries({ queryKey: ['user'] });
        }
    }, [userError, queryClient]);

    const loginMutation = useMutation({
        mutationFn: authAPI.login,
        onSuccess: (data) => {
            // Store both access and refresh tokens
            setTokens(data.data.accessToken, data.data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            queryClient.setQueryData(['user'], data.data.user);

            if (data.data.user.role === "admin") {
                router.push('/admin');
            } else {
                router.push('/dashboard');
            }
        },
    });

    const registerMutation = useMutation({
        mutationFn: authAPI.register,
        onSuccess: () => {
            router.push('/login?message=Registration successful! Please check your email for verification.');
        },
    });

    const verifyEmailMutation = useMutation({
        mutationFn: authAPI.verifyEmail,
        onSuccess: () => {
            router.push('/login?message=Email verified successfully! You can now login.');
        },
    });

    const resendVerificationMutation = useMutation({
        mutationFn: authAPI.resendVerification,
    });

    const forgotPasswordMutation = useMutation({
        mutationFn: authAPI.forgotPassword,
    });

    const resetPasswordMutation = useMutation({
        mutationFn: authAPI.resetPassword,
    });

    const updateProfileMutation = useMutation({
        mutationFn: authAPI.updateProfile,
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(['user'], updatedUser);
        },
    });

    const logout = () => {
        clearTokens();
        queryClient.removeQueries({ queryKey: ['user'] });
        router.push('/login');
    };

    return {
        user,
        isLoadingUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === UserRole.ADMIN,
        login: loginMutation.mutate,
        register: registerMutation.mutate,
        verifyEmail: verifyEmailMutation.mutate,
        resendVerification: resendVerificationMutation.mutate,
        forgotPassword: forgotPasswordMutation.mutate,
        resetPassword: resetPasswordMutation.mutate,
        updateProfile: updateProfileMutation.mutate,
        logout,
        loginError: loginMutation.error,
        registerError: registerMutation.error,
        forgotPasswordError: forgotPasswordMutation.error,
        resetPasswordError: resetPasswordMutation.error,
        updateProfileError: updateProfileMutation.error,
        isLoggingIn: loginMutation.isPending,
        isRegistering: registerMutation.isPending,
        isVerifying: verifyEmailMutation.isPending,
        isForgotPasswordPending: forgotPasswordMutation.isPending,
        isResetPasswordPending: resetPasswordMutation.isPending,
        isUpdatingProfile: updateProfileMutation.isPending,
    };
}; 