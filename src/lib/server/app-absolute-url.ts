/**
 * Full URL including origin and Vite `BASE_URL` (SvelteKit `paths.base`).
 * Do not use `$app/paths` `resolve()` here: from deep server modules it can return a
 * relative path (`../../../../...`), which produces broken strings like
 * `http://localhost:5173../../../../api/...`.
 */
export function appAbsoluteUrlFromRequest(requestUrl: string, pathname: string): string {
	const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
	const origin = new URL(requestUrl).origin;
	const rawBase = import.meta.env.BASE_URL ?? '/';
	const base =
		rawBase.endsWith('/') && rawBase.length > 1
			? rawBase.slice(0, -1)
			: rawBase === '/'
				? ''
				: rawBase;
	return `${origin}${base}${path}`;
}
