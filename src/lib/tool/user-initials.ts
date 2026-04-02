/** Two-letter initials from name (e.g. "Ada Lovelace" → "AL") or email local-part. */
export function getUserInitials(
	user: { name?: string | null; email?: string | null } | null | undefined
): string {
	if (!user) return '?';
	const name = user.name?.trim();
	if (name) {
		const parts = name.split(/\s+/).filter(Boolean);
		if (parts.length >= 2) {
			const a = parts[0]?.[0];
			const b = parts[parts.length - 1]?.[0];
			if (a && b) return `${a}${b}`.toUpperCase();
		}
		return name.slice(0, 2).toUpperCase();
	}
	const email = user.email?.trim();
	if (email) {
		const local = email.split('@')[0] ?? '';
		return local.slice(0, 2).toUpperCase() || '?';
	}
	return '?';
}
