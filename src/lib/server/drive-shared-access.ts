import { db } from '$lib/server/db';
import { MainFileSchema, MainFileShareSchema } from '$lib/server/db/schema/main-schema/main.schema';
import { eq } from 'drizzle-orm';

function normEmail(email: string | null | undefined): string {
	return (email ?? '').trim().toLowerCase();
}

/** All `main_file.id` values this user has a direct share row for. */
export async function sharedRootIdsForRecipient(targetEmail: string): Promise<Set<string>> {
	const rows = await db
		.select({ fileId: MainFileShareSchema.fileId })
		.from(MainFileShareSchema)
		.where(eq(MainFileShareSchema.targetEmail, normEmail(targetEmail)));
	return new Set(rows.map((r) => r.fileId));
}

/**
 * True if `itemId` is in the subtree of a shared root (including the shared item itself).
 * Walks up the parent chain until root or a shared id is found.
 */
export async function canAccessSharedItem(
	targetEmail: string,
	itemId: string,
	cache?: Set<string>
): Promise<boolean> {
	const roots = cache ?? (await sharedRootIdsForRecipient(targetEmail));
	let id: string | null = itemId;
	const visited = new Set<string>();
	while (id && !visited.has(id)) {
		visited.add(id);
		if (roots.has(id)) return true;
		const [row] = await db
			.select({ parentId: MainFileSchema.parentId })
			.from(MainFileSchema)
			.where(eq(MainFileSchema.id, id))
			.limit(1);
		id = row?.parentId ?? null;
	}
	return false;
}
