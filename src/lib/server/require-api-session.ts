import { auth } from '$lib/server/auth';
import { tryResolveUserFromDeveloperApiKey } from '$lib/server/developer-api-key';
import { error, isHttpError } from '@sveltejs/kit';

/** Minimal user shape used by drive APIs (cookie session or developer API key). */
export type DriveApiSession = {
	user: {
		id: string;
		email?: string | null;
		name?: string | null;
	};
};

/**
 * Authenticate for drive APIs: **cookie session** or **developer API key** (`Authorization: Bearer znldv_…` or `X-API-Key`).
 * **401** if neither is valid; **503** if auth/database is unreachable.
 */
export async function requireApiSession(request: Request): Promise<DriveApiSession> {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (session?.user) {
			return {
				user: {
					id: session.user.id,
					email: session.user.email,
					name: session.user.name
				}
			};
		}
		const fromKey = await tryResolveUserFromDeveloperApiKey(request);
		if (fromKey) {
			return {
				user: {
					id: fromKey.id,
					email: fromKey.email,
					name: fromKey.name
				}
			};
		}
		throw error(401, 'Unauthorized');
	} catch (e) {
		if (isHttpError(e)) throw e;
		console.error('[requireApiSession] session lookup failed', e);
		throw error(503, 'Service temporarily unavailable');
	}
}

/** Browser session only (no API key). Use for developer settings and key management. */
export async function requireCookieApiSession(request: Request) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) throw error(401, 'Unauthorized');
		return session;
	} catch (e) {
		if (isHttpError(e)) throw e;
		console.error('[requireCookieApiSession] session lookup failed', e);
		throw error(503, 'Service temporarily unavailable');
	}
}
