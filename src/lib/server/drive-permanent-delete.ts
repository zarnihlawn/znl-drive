import { db } from '$lib/server/db';
import { MainFileSchema } from '$lib/server/db/schema/main-schema/main.schema';
import { TigrisUtil } from '$lib/service/tigris.service.svelte';
import { eq, sql } from 'drizzle-orm';
import { rm, unlink } from 'node:fs/promises';

type SubtreeRow = {
	id: string;
	path: string;
	itemType: string;
	storageProvider: string;
};

/** All rows in the subtree rooted at `rootId` (same owner), for storage cleanup before DB cascade delete. */
export async function collectSubtreeRows(ownerId: string, rootId: string): Promise<SubtreeRow[]> {
	const result = (await db.execute(sql`
		WITH RECURSIVE sub AS (
			SELECT id, path, item_type::text AS item_type, storage_provider::text AS storage_provider
			FROM main_file
			WHERE id = ${rootId}::uuid AND owner_id = ${ownerId}
			UNION ALL
			SELECT m.id, m.path, m.item_type::text, m.storage_provider::text
			FROM main_file m
			INNER JOIN sub s ON m.parent_id = s.id
			WHERE m.owner_id = ${ownerId}
		)
		SELECT id, path, item_type, storage_provider FROM sub
	`)) as unknown as { rows?: SubtreeRow[] };
	return result.rows ?? [];
}

/**
 * Permanently remove storage blobs for a trashed item, then delete the DB row (children cascade).
 * Caller must ensure the row is trashed and owned by `ownerId`.
 */
export async function permanentDeleteTrashedItem(ownerId: string, rootId: string): Promise<void> {
	const rows = await collectSubtreeRows(ownerId, rootId);
	const root = rows.find((r) => r.id === rootId);
	if (!root) throw new Error('Subtree not found');

	if (root.storageProvider === 'local') {
		if (root.itemType === 'folder') {
			await rm(root.path, { recursive: true, force: true });
		} else {
			await unlink(root.path);
		}
	} else {
		for (const r of rows) {
			await TigrisUtil.deleteObject(r.path);
		}
	}

	await db.delete(MainFileSchema).where(eq(MainFileSchema.id, rootId));
}
