import { db } from '$lib/server/db';
import { MainFileSchema } from '$lib/server/db/schema/main-schema/main.schema';
import { userCanAccessFile } from '$lib/server/team-access';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export type MainFileRow = typeof MainFileSchema.$inferSelect;

export async function getMainFileIfAccessible(
	userId: string,
	id: string
): Promise<MainFileRow | null> {
	const [row] = await db.select().from(MainFileSchema).where(eq(MainFileSchema.id, id)).limit(1);
	if (!row) return null;
	if (!(await userCanAccessFile(userId, { ownerId: row.ownerId, teamId: row.teamId }))) {
		return null;
	}
	return row;
}

export async function requireMainFileForMutation(userId: string, id: string): Promise<MainFileRow> {
	const row = await getMainFileIfAccessible(userId, id);
	if (!row) throw error(404, 'File not found');
	return row;
}
