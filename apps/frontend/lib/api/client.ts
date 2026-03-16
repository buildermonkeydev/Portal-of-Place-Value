import axios from 'axios';

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://backend.blcompiler.com";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";


// Store router reference for navigation
let router: any = null;
export const setRouter = (nextRouter: any) => {
    router = nextRouter;
};

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Utility functions for token management
export const getAccessToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('accessToken');
    }
    return null;
};

export const getRefreshToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('refreshToken');
    }
    return null;
};

export const setTokens = (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }
};

export const clearTokens = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    }
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const accessToken = getAccessToken();
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            // Check if we're already on a login page to avoid redirect loops
            const isOnLoginPage = typeof window !== 'undefined' &&
                (window.location.pathname === '/login' ||
                    window.location.pathname === '/register' ||
                    window.location.pathname === '/forgot-password' ||
                    window.location.pathname === '/reset-password');

            const refreshToken = getRefreshToken();
            if (refreshToken) {
                try {
                    // Attempt to refresh the token
                    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
                        refreshToken
                    });

                    const { accessToken } = response.data.data;
                    setTokens(accessToken, refreshToken);

                    // Retry the original request with new token
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, clear tokens and redirect to login
                    clearTokens();
                    if (!isOnLoginPage && router) {
                        router.push('/login');
                    } else if (!isOnLoginPage) {
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token, clear all auth data
                clearTokens();
                if (!isOnLoginPage && router) {
                    router.push('/login');
                } else if (!isOnLoginPage) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient; 