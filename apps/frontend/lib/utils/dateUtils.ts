/**
 * Utility functions for date formatting in Indian timezone
 */

/**
 * Format a date string to Indian timezone (IST/UTC+5:30)
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string in Indian timezone
 */
export function formatToIndianTime(
    dateString: string | Date,
    options: Intl.DateTimeFormatOptions = {}
): string {
    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        // Convert UTC to IST by adding 5 hours and 30 minutes
        const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
        const istDate = new Date(date.getTime() + istOffset);

        // Default options for display
        const defaultOptions: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            ...options
        };

        // Format the IST date
        return new Intl.DateTimeFormat('en-IN', defaultOptions).format(istDate);
    } catch (error) {
        console.error('Error formatting date to Indian timezone:', error);
        return 'Invalid Date';
    }
}

/**
 * Format a date string to show only date in Indian timezone
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in Indian timezone
 */
export function formatToIndianDate(dateString: string | Date): string {
    return formatToIndianTime(dateString, {
        hour: undefined,
        minute: undefined,
        second: undefined,
        hour12: undefined
    });
}

/**
 * Format a date string to show only time in Indian timezone
 * @param dateString - ISO date string or Date object
 * @returns Formatted time string in Indian timezone
 */
export function formatToIndianTimeOnly(dateString: string | Date): string {
    return formatToIndianTime(dateString, {
        year: undefined,
        month: undefined,
        day: undefined
    });
}

/**
 * Get current date and time in Indian timezone
 * @returns Current date string in Indian timezone
 */
export function getCurrentIndianTime(): string {
    return formatToIndianTime(new Date());
}

/**
 * Convert a date to Indian timezone and return as Date object
 * @param dateString - ISO date string or Date object
 * @returns Date object in Indian timezone
 */
export function toIndianTimeZone(dateString: string | Date): Date {
    const date = new Date(dateString);
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    return new Date(date.getTime() + istOffset);
}
