import { getDeveloperModeEnabled, revokeDeveloperApiKey } from '$lib/server/developer-api-key';
import { requireCookieApiSession } from '$lib/server/require-api-session';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ request, params }) => {
	const session = await requireCookieApiSession(request);
	if (!(await getDeveloperModeEnabled(session.user.id))) {
		throw error(403, 'Enable developer mode first');
	}
	const id = params.id;
	if (!id) throw error(400, 'Missing id');
	const ok = await revokeDeveloperApiKey(session.user.id, id);
	if (!ok) throw error(404, 'Key not found');
	return json({ ok: true });
};
