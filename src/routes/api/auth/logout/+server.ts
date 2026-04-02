import { auth } from '$lib/server/auth';
import { redirect, error } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { RequestHandler } from '@sveltejs/kit';

/**
 * Custom logout endpoint (same pattern as `/api/auth/login`).
 * Must stay on the hooks allowlist so Better Auth’s `/api/auth/*` handler does not swallow it.
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		await auth.api.signOut({ headers: request.headers });
	} catch (e) {
		console.error('[api/auth/logout]', e);
		throw error(500, 'Failed to sign out');
	}

	const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
	if (wantsJson) {
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'content-type': 'application/json' }
		});
	}

	throw redirect(303, resolve('/auth/login'));
};
