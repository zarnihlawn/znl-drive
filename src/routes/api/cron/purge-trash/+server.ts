import { purgeExpiredTrashItems } from '$lib/server/drive-trash-purge';
import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Scheduled trash purge. Set `CRON_SECRET` and call with:
 * `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/cron/purge-trash`
 */
export const POST: RequestHandler = async ({ request }) => {
	const secret = env.CRON_SECRET;
	if (!secret?.trim()) {
		throw error(503, 'CRON_SECRET is not configured');
	}

	const auth = request.headers.get('authorization');
	if (auth !== `Bearer ${secret.trim()}`) {
		throw error(401, 'Unauthorized');
	}

	const result = await purgeExpiredTrashItems();
	return json(result);
};
