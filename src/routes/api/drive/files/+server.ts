import { auth } from '$lib/server/auth';
import { sumSubtreeFileBytesForFolders } from '$lib/server/drive-folder-size';
import { db } from '$lib/server/db';
import { AuthUserSchema } from '$lib/server/db/schema/auth-schema/auth.schema';
import { MainFileSchema } from '$lib/server/db/schema/main-schema/main.schema';
import { STORAGE_PROVIDERS, type StorageProviderId } from '$lib/model/storage-provider';
import { error, json } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import type { RequestHandler } from './$types';

function ownerDisplayName(name: string | null | undefined, email: string): string {
	const n = name?.trim();
	return n || email;
}

export const GET: RequestHandler = async ({ request, url }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) throw error(401, 'Unauthorized');

	const raw = url.searchParams.get('storageProvider') ?? 'local';
	if (!STORAGE_PROVIDERS.includes(raw as StorageProviderId)) {
		throw error(400, 'Invalid storage provider');
	}
	const storageProvider = raw as StorageProviderId;

	const parentParam = url.searchParams.get('parentId') ?? url.searchParams.get('folder');
	let parentFilter;
	if (parentParam && parentParam.trim() !== '') {
		const parsed = z.string().uuid().safeParse(parentParam.trim());
		if (!parsed.success) throw error(400, 'Invalid folder id');
		parentFilter = eq(MainFileSchema.parentId, parsed.data);
	} else {
		parentFilter = isNull(MainFileSchema.parentId);
	}

	const rows = await db
		.select({
			id: MainFileSchema.id,
			name: MainFileSchema.name,
			itemType: MainFileSchema.itemType,
			sizeBytes: MainFileSchema.sizeBytes,
			updatedAt: MainFileSchema.updatedAt,
			storageProvider: MainFileSchema.storageProvider,
			isPinned: MainFileSchema.isPinned,
			isStarred: MainFileSchema.isStarred,
			color: MainFileSchema.color,
			parentId: MainFileSchema.parentId,
			ownerName: AuthUserSchema.name,
			ownerEmail: AuthUserSchema.email
		})
		.from(MainFileSchema)
		.innerJoin(AuthUserSchema, eq(MainFileSchema.ownerId, AuthUserSchema.id))
		.where(
			and(
				eq(MainFileSchema.ownerId, session.user.id),
				eq(MainFileSchema.storageProvider, storageProvider),
				isNull(MainFileSchema.trashedAt),
				parentFilter
			)
		);

	const folderIds = rows.filter((r) => r.itemType === 'folder').map((r) => r.id);
	const subtreeBytes = await sumSubtreeFileBytesForFolders(
		folderIds,
		session.user.id,
		storageProvider
	);

	return json({
		files: rows.map((r) => ({
			id: r.id,
			name: r.name,
			itemType: r.itemType,
			sizeBytes: r.itemType === 'folder' ? (subtreeBytes.get(r.id) ?? 0) : r.sizeBytes,
			updatedAt: r.updatedAt.toISOString(),
			storageProvider: r.storageProvider,
			isPinned: r.isPinned,
			isStarred: r.isStarred,
			color: r.color,
			parentId: r.parentId ?? null,
			ownerName: ownerDisplayName(r.ownerName, r.ownerEmail)
		}))
	});
};
