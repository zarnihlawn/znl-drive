import type { StorageProviderId } from '$lib/model/storage-provider';
import { db } from '$lib/server/db';
import { MainFileSchema } from '$lib/server/db/schema/main-schema/main.schema';
import { error } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

/** Parent folder row for nesting storage paths (same owner, provider, folder, not trashed). */
export async function resolveParentFolderForUser(
	ownerId: string,
	storageProvider: StorageProviderId,
	parentIdRaw: unknown
): Promise<{ id: string; path: string } | null> {
	if (parentIdRaw === undefined || parentIdRaw === null || parentIdRaw === '') return null;
	if (typeof parentIdRaw !== 'string') throw error(400, 'Invalid parent folder');
	const parsed = z.string().uuid().safeParse(parentIdRaw.trim());
	if (!parsed.success) throw error(400, 'Invalid parent folder id');

	const [row] = await db
		.select({ id: MainFileSchema.id, path: MainFileSchema.path })
		.from(MainFileSchema)
		.where(
			and(
				eq(MainFileSchema.id, parsed.data),
				eq(MainFileSchema.ownerId, ownerId),
				eq(MainFileSchema.storageProvider, storageProvider),
				eq(MainFileSchema.itemType, 'folder'),
				isNull(MainFileSchema.trashedAt)
			)
		)
		.limit(1);

	if (!row) throw error(400, 'Parent folder not found');
	return { id: row.id, path: row.path };
}
