import { resolveHref } from '$lib/url/resolve-href';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	throw redirect(308, resolveHref(`/${params.token}`));
};
