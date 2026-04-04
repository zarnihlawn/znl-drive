import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { MainFileSchema } from '$lib/server/db/schema/main-schema/main.schema';
import { STORAGE_PROVIDERS, type StorageProviderId } from '$lib/model/storage-provider';
import { error, json } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, url }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) throw error(401, 'Unauthorized');

	const raw = url.searchParams.get('storageProvider') ?? 'local';
	if (!STORAGE_PROVIDERS.includes(raw as StorageProviderId)) {
		throw error(400, 'Invalid storage provider');
	}
	const storageProvider = raw as StorageProviderId;

	const rows = await db
		.select()
		.from(MainFileSchema)
		.where(
			and(
				eq(MainFileSchema.ownerId, session.user.id),
				eq(MainFileSchema.storageProvider, storageProvider),
				isNull(MainFileSchema.trashedAt),
				isNull(MainFileSchema.parentId)
			)
		);

	return json({
		files: rows.map((r) => ({
			id: r.id,
			name: r.name,
			itemType: r.itemType,
			sizeBytes: r.sizeBytes,
			updatedAt: r.updatedAt.toISOString(),
			storageProvider: r.storageProvider,
			isPinned: r.isPinned,
			isStarred: r.isStarred,
			color: r.color,
			parentId: r.parentId
		}))
	});
};
