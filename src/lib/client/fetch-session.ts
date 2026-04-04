import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

let redirecting = false;

/** Call when an API returns 401 — sends the user to login (replaces history). */
export function redirectToLoginSessionExpired(): void {
	if (!browser || redirecting) return;
	redirecting = true;
	const target = `${resolve('/auth/login')}?reason=session`;
	void goto(target, { replaceState: true, invalidateAll: true }).finally(() => {
		redirecting = false;
	});
}

/**
 * `fetch` with cookies; on **401** from the app, redirects to login so the UI never stays on a broken state.
 * Other errors are left to the caller.
 */
export async function fetchWithSession(
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<Response> {
	const r = await fetch(input, { credentials: 'include', ...init });
	if (r.status === 401) {
		redirectToLoginSessionExpired();
	}
	return r;
}
