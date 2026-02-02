/**
 * Utilities for Peru timezone (America/Lima, GMT-5)
 */

export const PERU_TIMEZONE = "America/Lima";

/**
 * Get current date/time in Peru timezone
 */
export function getPeruNow(): Date {
	return new Date(new Date().toLocaleString("en-US", { timeZone: PERU_TIMEZONE }));
}

/**
 * Get start of today in Peru timezone (00:00:00)
 */
export function getPeruTodayStart(): Date {
	const now = getPeruNow();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * Get end of today in Peru timezone (23:59:59)
 */
export function getPeruTodayEnd(): Date {
	const now = getPeruNow();
	return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
}

/**
 * Get start of current week in Peru timezone (Monday 12:00 PM)
 */
export function getPeruWeekStart(): Date {
	const now = getPeruNow();
	const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
	const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

	const monday = new Date(now);
	monday.setDate(now.getDate() + daysToMonday);
	monday.setHours(12, 0, 0, 0); // Monday 12:00 PM

	return monday;
}

/**
 * Get end of current week in Peru timezone (Next Monday 11:59:59 AM)
 */
export function getPeruWeekEnd(): Date {
	const weekStart = getPeruWeekStart();
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekStart.getDate() + 7);
	weekEnd.setHours(11, 59, 59, 999); // Next Monday 11:59 AM

	return weekEnd;
}

/**
 * Get ISO week number for Peru date
 */
export function getPeruISOWeek(date: Date = getPeruNow()): { year: number; week: number } {
	const peruDate = new Date(date.toLocaleString("en-US", { timeZone: PERU_TIMEZONE }));
	const yearStart = new Date(Date.UTC(peruDate.getFullYear(), 0, 1));
	const weekNumber = Math.ceil(((peruDate.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

	return {
		year: peruDate.getFullYear(),
		week: weekNumber,
	};
}

/**
 * Format date for Peru timezone
 */
export function formatPeruDate(date: Date): string {
	return date.toLocaleString("en-US", {
		timeZone: PERU_TIMEZONE,
		dateStyle: "medium",
		timeStyle: "short",
	});
}
