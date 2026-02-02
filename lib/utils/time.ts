/**
 * Utilities for Peru timezone (America/Lima, GMT-5)
 * All dates in DB are stored in UTC. These functions help convert between Peru time and UTC.
 */

export const PERU_TIMEZONE = "America/Lima";
export const PERU_UTC_OFFSET = -5; // Peru is UTC-5

/**
 * Get current date/time in Peru timezone
 */
export function getPeruNow(): Date {
	const now = new Date();
	return new Date(now.toLocaleString("en-US", { timeZone: PERU_TIMEZONE }));
}

/**
 * Get start of today in Peru (00:00:00 Peru time), returned as UTC Date for DB queries
 */
export function getPeruTodayStart(): Date {
	const now = new Date();
	const peruNowStr = now.toLocaleString("en-US", { timeZone: PERU_TIMEZONE });
	const peruNow = new Date(peruNowStr);

	// Create midnight Peru time
	const peruMidnight = new Date(
		peruNow.getFullYear(),
		peruNow.getMonth(),
		peruNow.getDate(),
		0,
		0,
		0,
		0,
	);

	// Add 5 hours to convert Peru time to UTC (Peru is UTC-5, so UTC is 5 hours ahead)
	return new Date(peruMidnight.getTime() - PERU_UTC_OFFSET * 60 * 60 * 1000);
}

/**
 * Get start of current week (Monday 00:00 Peru time), returned as UTC Date for DB queries
 */
export function getPeruWeekStart(): Date {
	const now = new Date();
	const peruNowStr = now.toLocaleString("en-US", { timeZone: PERU_TIMEZONE });
	const peruNow = new Date(peruNowStr);

	const dayOfWeek = peruNow.getDay(); // 0 = Sunday, 1 = Monday

	// Days to go back to Monday
	const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

	// Create Monday 00:00 (midnight) Peru time
	const monday = new Date(peruNow);
	monday.setDate(peruNow.getDate() + daysToMonday);
	monday.setHours(0, 0, 0, 0);

	// Convert Peru time to UTC (add 5 hours)
	return new Date(monday.getTime() - PERU_UTC_OFFSET * 60 * 60 * 1000);
}

/**
 * Get ISO week number for Peru date
 */
export function getPeruISOWeek(date: Date = new Date()): { year: number; week: number } {
	const peruDateStr = date.toLocaleString("en-US", { timeZone: PERU_TIMEZONE });
	const peruDate = new Date(peruDateStr);

	const yearStart = new Date(peruDate.getFullYear(), 0, 1);
	const weekNumber = Math.ceil(
		((peruDate.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7,
	);

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

/**
 * Format relative time (e.g., "2m ago", "3h ago", "5d ago")
 * @param utcDate - Date in UTC (as stored in DB)
 */
export function formatRelativeTime(utcDate: Date | string): string {
	const now = new Date();
	const commitDate = new Date(utcDate);

	const diffInMs = now.getTime() - commitDate.getTime();
	const diffInSeconds = Math.floor(diffInMs / 1000);

	if (diffInSeconds < 0) {
		return "just now";
	}

	if (diffInSeconds < 60) {
		return "just now";
	}

	const diffInMinutes = Math.floor(diffInSeconds / 60);
	if (diffInMinutes < 60) {
		return `${diffInMinutes}m ago`;
	}

	const diffInHours = Math.floor(diffInMinutes / 60);
	if (diffInHours < 24) {
		return `${diffInHours}h ago`;
	}

	const diffInDays = Math.floor(diffInHours / 24);
	if (diffInDays < 30) {
		return `${diffInDays}d ago`;
	}

	const diffInMonths = Math.floor(diffInDays / 30);
	return `${diffInMonths}mo ago`;
}
