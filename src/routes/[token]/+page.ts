import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
	const token = params.token;
	const r = await fetch(`/api/public/share/${token}`);
	if (!r.ok) {
		const text = await r.text();
		return {
			sharePayload: null,
			shareError: text || r.statusText || 'Not found'
		};
	}
	const sharePayload = (await r.json()) as {
		ok: true;
		token: string;
		item: {
			id: string;
			ownerId: string;
			itemType: string;
			name: string;
			mimeType: string;
			sizeBytes: number;
			updatedAt: string;
			storageProvider: string;
		};
	};
	return { sharePayload, shareError: null as string | null };
};
