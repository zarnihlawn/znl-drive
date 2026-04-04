import { auth } from '$lib/server/auth';
import { error, isHttpError } from '@sveltejs/kit';

/**
 * Session for API routes: **401** if not signed in; **503** if auth/database is unreachable (instead of 500).
 */
export async function requireApiSession(request: Request) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) throw error(401, 'Unauthorized');
		return session;
	} catch (e) {
		if (isHttpError(e)) throw e;
		console.error('[requireApiSession] session lookup failed', e);
		throw error(503, 'Service temporarily unavailable');
	}
}
