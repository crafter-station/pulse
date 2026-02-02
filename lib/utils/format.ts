export function formatNumber(num: number): string {
	if (num >= 1000000) {
		return `${(num / 1000000).toFixed(1)}M`;
	}
	if (num >= 1000) {
		const k = num / 1000;
		// Remove trailing .0 for cleaner display (1000 -> 1k not 1.0k)
		return k % 1 === 0 ? `${Math.floor(k)}k` : `${k.toFixed(1)}k`;
	}
	return num.toString();
}
