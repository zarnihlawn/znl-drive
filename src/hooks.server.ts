import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { isAuthPath } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';

/** Browsers often request `/favicon.ico` even when HTML points at `/favicon.svg`. */
const handleFavicon: Handle = ({ event, resolve }) => {
	if (event.url.pathname === '/favicon.ico') {
		return Response.redirect(new URL('/favicon.svg', event.url), 302);
	}
	return resolve(event);
};

/**
 * SvelteKit routes under `/api/auth/*` that must hit +server.ts instead of Better Auth’s catch-all handler.
 * Better Auth’s `svelteKitHandler` forwards every `/api/auth` request to `auth.handler`, which 404s unknown paths.
 */
const CUSTOM_API_AUTH_PATH_PREFIXES = [
	'/api/auth/login',
	'/api/auth/logout',
	'/api/auth/signup',
	'/api/auth/send-otp',
	'/api/auth/social'
] as const;

function isCustomApiAuthPath(pathname: string): boolean {
	return CUSTOM_API_AUTH_PATH_PREFIXES.some(
		(base) => pathname === base || pathname.startsWith(`${base}/`)
	);
}

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	if (building) {
		return resolve(event);
	}

	if (isCustomApiAuthPath(event.url.pathname)) {
		return resolve(event);
	}

	if (isAuthPath(event.url.toString(), auth.options)) {
		return auth.handler(event.request);
	}

	return resolve(event);
};

export const handle: Handle = sequence(handleFavicon, handleParaglide, handleBetterAuth);
