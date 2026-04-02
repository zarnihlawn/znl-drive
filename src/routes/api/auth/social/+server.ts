import { auth } from '$lib/server/auth';
import { json, error, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { RequestHandler } from './$types';

type Provider = 'github' | 'google';

function parseProvider(input: unknown): Provider | null {
	if (typeof input !== 'string') return null;
	const v = input.toLowerCase().trim();
	if (v === 'github' || v === 'google') return v;
	return null;
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const provider = parseProvider(body?.provider);
	if (!provider) throw error(400, 'Missing or invalid provider');

	const callbackURL =
		typeof body?.callbackURL === 'string' && body.callbackURL
			? body.callbackURL
			: resolve('/home');

	try {
		const result = await auth.api.signInSocial({
			headers: request.headers,
			body: {
				provider,
				callbackURL,
				disableRedirect: false
			}
		});

		// Better Auth returns { url, redirect, ... } when redirecting to OAuth.
		const url = (result as { url?: string }).url;
		if (typeof url === 'string') {
			return json({ url, redirect: true });
		}

		// In case cookies/session were created without a redirect URL.
		return json({ redirect: false });
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : 'Social sign-in failed';
		throw error(500, message);
	}
};

// Optional convenience: GET /api/auth/social?provider=github
export const GET: RequestHandler = async ({ url, request }) => {
	const provider = parseProvider(url.searchParams.get('provider'));
	if (!provider) throw error(400, 'Missing or invalid provider');

	const callbackURL = url.searchParams.get('callbackURL') ?? resolve('/home');

	const result = await auth.api.signInSocial({
		headers: request.headers,
		body: {
			provider,
			callbackURL,
			disableRedirect: false
		}
	});

	const signInUrl = (result as { url?: string }).url;
	if (typeof signInUrl === 'string') {
		throw redirect(303, signInUrl);
	}

	throw redirect(303, callbackURL);
};

