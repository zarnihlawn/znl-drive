import { permanentDeleteTrashedItem } from '$lib/server/drive-permanent-delete';
import { TRASH_RETENTION_DAYS } from '$lib/server/drive-trash-constants';
import { db } from '$lib/server/db';
import { MainFileSchema } from '$lib/server/db/schema/main-schema/main.schema';
import { and, eq, isNotNull, lt } from 'drizzle-orm';

/**
 * Permanently deletes all trashed items older than {@link TRASH_RETENTION_DAYS}.
 * Safe to run repeatedly (idempotent per row). Call from a scheduled job (e.g. daily).
 */
export async function purgeExpiredTrashItems(): Promise<{ purged: number; skipped: number }> {
	const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);

	const candidates = await db
		.select({ id: MainFileSchema.id, ownerId: MainFileSchema.ownerId })
		.from(MainFileSchema)
		.where(and(isNotNull(MainFileSchema.trashedAt), lt(MainFileSchema.trashedAt, cutoff)));

	let purged = 0;
	let skipped = 0;

	for (const c of candidates) {
		const [still] = await db
			.select({ id: MainFileSchema.id, trashedAt: MainFileSchema.trashedAt })
			.from(MainFileSchema)
			.where(eq(MainFileSchema.id, c.id))
			.limit(1);

		if (!still?.trashedAt) {
			skipped += 1;
			continue;
		}

		try {
			await permanentDeleteTrashedItem(c.ownerId, c.id);
			purged += 1;
		} catch {
			skipped += 1;
		}
	}

	return { purged, skipped };
}
