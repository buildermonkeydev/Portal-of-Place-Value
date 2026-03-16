/**
 * Extracts a human-readable error message from an API error response.
 * Handles:
 * - Joi validation errors (error.response.data.errors array)
 * - AppErrors (error.response.data.error.message)
 * - Standard API errors (error.response.data.message)
 * - Generic/Network errors
 */
export const getErrorMessage = (error: any, defaultMessage: string = 'Something went wrong'): string => {
    const apiResponse = error?.response?.data;

    // 1. Handle Joi validation errors
    if (apiResponse?.errors && Array.isArray(apiResponse.errors)) {
        return apiResponse.errors
            .map((err: any) => {
                if (err.field && err.message) {
                    return `${err.field}: ${err.message}`;
                }
                return err.message || '';
            })
            .filter(Boolean)
            .join('\n') || apiResponse.message || defaultMessage;
    }

    // 2. Handle AppError structure (success: false, error: { message, statusCode, ... })
    if (apiResponse?.error?.message) {
        return apiResponse.error.message;
    }

    // 3. Handle standard message field
    if (apiResponse?.message) {
        return apiResponse.message;
    }

    // 4. Handle generic axios error message or JavaScript error message
    return error?.message || defaultMessage;
};
