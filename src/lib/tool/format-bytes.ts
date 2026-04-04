/** Human-readable file size (binary units). */
export function formatBytes(bytes: number | null | undefined): string {
	if (bytes == null) return '—';
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
	let n = bytes;
	let i = 0;
	while (n >= 1024 && i < units.length - 1) {
		n /= 1024;
		i++;
	}
	const digits = i === 0 ? 0 : n >= 10 || i === 1 ? 1 : 2;
	return `${n.toFixed(digits)} ${units[i]}`;
}
