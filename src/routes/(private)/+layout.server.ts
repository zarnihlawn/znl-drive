import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (locals.authUnavailable) {
		throw error(503, 'Service temporarily unavailable');
	}
	return {};
};
