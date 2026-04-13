/**
 * Strip SvelteKit/Vite app base from a URL pathname (matches `paths.base`, no deprecated `$app/paths` `base`).
 */
export function pathWithoutBase(pathname: string): string {
	const raw = import.meta.env.BASE_URL ?? '/';
	const prefix = raw.endsWith('/') && raw.length > 1 ? raw.slice(0, -1) : raw === '/' ? '' : raw;
	let p = pathname;
	if (prefix && p.startsWith(prefix)) {
		p = p.slice(prefix.length) || '/';
	}
	if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
	return p || '/';
}
