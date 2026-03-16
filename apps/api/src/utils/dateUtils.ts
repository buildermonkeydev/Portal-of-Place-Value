/**
 * Utility functions for handling Indian date and time operations
 */

/**
 * Convert a datetime-local input (treated as IST) to UTC for database storage
 * This function takes a datetime that represents IST time and converts it to UTC
 * For example: "11:00 AM IST" becomes "05:30 AM UTC" for storage
 * @param date - The date to convert (treated as if it's in IST)
 * @returns Date in UTC (representing the IST time)
 */
export function toIndianTime(date: Date): Date {
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    // The input date is treated as IST, so we need to subtract the offset to get UTC
    return new Date(date.getTime() - istOffset);
}

/**
 * Convert a date from UTC to Indian Standard Time (IST) for display
 * This function is used when you want to display a UTC date as IST
 * @param utcDate - The date in UTC
 * @returns Date in IST
 */
export function fromIndianTime(utcDate: Date): Date {
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    // Convert from UTC to IST by adding the offset
    return new Date(utcDate.getTime() + istOffset);
}

/**
 * Parse datetime-local string as IST and convert to UTC
 * This is the correct function to use for your use case
 * @param datetimeString - String in format "2025-08-19T11:00"
 * @returns Date in UTC representing the IST time
 */
export function parseIST(datetimeString: string): Date {
    // Parse the datetime-local string
    const [datePart, timePart] = datetimeString.split('T');

    if (!datePart || !timePart) {
        throw new Error('Invalid datetime format');
    }

    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    if (!year || !month || !day || hours === undefined || minutes === undefined) {
        throw new Error('Invalid datetime components');
    }

    // Create a date object in IST timezone
    // We'll use the IST offset directly
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds

    // Create UTC date for the given IST time
    const utcTime = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);

    // Subtract IST offset to get the correct UTC time
    return new Date(utcTime - istOffset);
}

/**
 * Get current date and time in Indian Standard Time (IST)
 * @returns Current date in IST
 */
export function getCurrentIndianTime(): Date {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset);
}

/**
 * Parse a date string and convert it to Indian time
 * @param dateString - The date string to parse
 * @returns Date in IST
 */
export function parseIndianDate(dateString: string): Date {
    const date = new Date(dateString);
    return fromIndianTime(date);
}

/**
 * Format a date to Indian timezone string
 * @param date - The date to format (should be in UTC)
 * @returns Formatted date string in IST
 */
export function formatIndianDate(date: Date): string {
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

/**
 * Format a date to Indian date string (without time)
 * @param date - The date to format
 * @returns Formatted date string in IST
 */
export function formatIndianDateOnly(date: Date): string {
    return date.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Format a date to Indian time string (without date)
 * @param date - The date to format
 * @returns Formatted time string in IST
 */
export function formatIndianTimeOnly(date: Date): string {
    return date.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

/**
 * Check if a date is in the future (Indian time)
 * @param date - The date to check (in UTC)
 * @returns True if the date is in the future
 */
export function isFutureDate(date: Date): boolean {
    const now = new Date();
    return date > now;
}

/**
 * Check if a date is in the past (Indian time)
 * @param date - The date to check (in UTC)
 * @returns True if the date is in the past
 */
export function isPastDate(date: Date): boolean {
    const now = new Date();
    return date < now;
}

/**
 * Get the difference between two dates in milliseconds
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Difference in milliseconds
 */
export function getDateDifference(date1: Date, date2: Date): number {
    return date1.getTime() - date2.getTime();
}

/**
 * Add minutes to a date
 * @param date - The base date
 * @param minutes - Minutes to add
 * @returns New date
 */
export function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
}

/**
 * Subtract minutes from a date
 * @param date - The base date
 * @param minutes - Minutes to subtract
 * @returns New date
 */
export function subtractMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() - minutes * 60 * 1000);
}

/**
 * Convert 12-hour time format (HH:MM AM/PM) to 24-hour format
 * @param timeString - Time string in HH:MM AM/PM format (e.g., "11:00 AM", "2:30 PM")
 * @returns Time string in 24-hour format (HH:MM)
 */
export function convert12To24Hour(timeString: string): string {
    if (!timeString || typeof timeString !== 'string') {
        return timeString;
    }

    // Check if it's already in 24-hour format (no AM/PM)
    if (!timeString.includes('AM') && !timeString.includes('PM')) {
        return timeString;
    }

    // Parse time with AM/PM
    const timeMatch = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!timeMatch) {
        return timeString; // Return original if format doesn't match
    }

    const hoursStr = timeMatch[1];
    const minutesStr = timeMatch[2];
    const periodStr = timeMatch[3];

    if (!hoursStr || !minutesStr || !periodStr) {
        return timeString; // Return original if any part is missing
    }

    let hour = parseInt(hoursStr);
    const minute = parseInt(minutesStr);
    const period = periodStr.toUpperCase();

    // Convert to 24-hour format
    if (period === 'PM') {
        if (hour !== 12) {
            hour += 12; // Add 12 for PM (except 12 PM)
        }
    } else if (period === 'AM') {
        if (hour === 12) {
            hour = 0; // 12 AM becomes 00:00
        }
    }

    // Format as HH:MM with leading zeros
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Parse time string and return hours and minutes
 * @param timeString - Time string in HH:MM format
 * @returns Object with hours and minutes
 */
export function parseTimeString(timeString: string): { hours: number; minutes: number } | null {
    if (!timeString || typeof timeString !== 'string') {
        return null;
    }

    const [hours, minutes] = timeString.split(':');
    if (!hours || !minutes) {
        return null;
    }

    const hour = parseInt(hours);
    const minute = parseInt(minutes);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null;
    }

    return { hours: hour, minutes: minute };
}


export function convertISTtoUTC(datetimeString: string): Date {
    // Parse the datetime string
    const [datePart, timePart] = datetimeString.split('T');

    if (!datePart || !timePart) {
        throw new Error('Invalid datetime format. Expected: YYYY-MM-DDTHH:MM');
    }

    // Parse date components
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Validate components
    if (!year || !month || !day || hours === undefined || minutes === undefined) {
        throw new Error('Invalid datetime components');
    }

    // Create ISO string for IST time and parse it
    // Format: "2025-08-19T11:00:00+05:30"
    const istISOString = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00+05:30`;

    // Create Date object - this will automatically convert to UTC
    return new Date(istISOString);
}



/**
 * Simple date parser that saves datetime-local input as-is without timezone conversion
 * This will store the exact time the user entered
 */

/**
 * Parse datetime-local string and create Date object without timezone conversion
 * Input: "2025-08-19T11:00" -> Output: "2025-08-19T11:00:00.000Z"
 * @param datetimeString - String in format "2025-08-19T11:00"
 * @returns Date object representing the exact time entered
 */
export function parseDateTime(datetimeString: string): Date {
    // Parse the datetime-local string
    const [datePart, timePart] = datetimeString.split('T');

    if (!datePart || !timePart) {
        throw new Error('Invalid datetime format. Expected: YYYY-MM-DDTHH:MM');
    }

    // Parse date components
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    // Validate components
    if (!year || !month || !day || hours === undefined || minutes === undefined) {
        throw new Error('Invalid datetime components');
    }

    // Create Date object using Date.UTC (saves as-is without timezone conversion)
    // This will store exactly what the user entered: 11:00 -> 11:00:00.000Z
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
}


export function parseDateTimeLocal(datetimeString: string): Date {
    const [datePart, timePart] = datetimeString.split('T');

    if (!datePart || !timePart) {
        throw new Error('Invalid datetime format. Expected: YYYY-MM-DDTHH:MM');
    }

    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);

    if (!year || !month || !day || hours === undefined || minutes === undefined) {
        throw new Error('Invalid datetime components');
    }

    // Save exactly as entered - no timezone conversion
    return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
}