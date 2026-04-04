import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { MainFileSchema } from '$lib/server/db/schema/main-schema/main.schema';
import { FILE_LABEL_COLORS, type FileLabelColorId } from '$lib/model/file-label-color';

const colorEnum = z.enum(FILE_LABEL_COLORS as unknown as [FileLabelColorId, ...FileLabelColorId[]]);
import { error, json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const patchSchema = z
	.object({
		isPinned: z.boolean().optional(),
		isStarred: z.boolean().optional(),
		name: z.string().min(1).max(500).optional(),
		color: colorEnum.optional(),
		trashed: z.boolean().optional()
	})
	.strict();

function sanitizeFileName(name: string): string {
	const t = name.trim().replace(/[/\\]/g, '_');
	return t.slice(0, 500) || 'unnamed';
}

export const PATCH: RequestHandler = async ({ request, params }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) throw error(401, 'Unauthorized');

	const id = params.id;
	if (!id) throw error(400, 'Missing id');

	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		throw error(400, 'Invalid JSON');
	}

	const parsed = patchSchema.safeParse(raw);
	if (!parsed.success) {
		throw error(400, parsed.error.message);
	}
	const body = parsed.data;
	if (Object.keys(body).length === 0) {
		throw error(400, 'No fields to update');
	}

	const [row] = await db
		.select({ id: MainFileSchema.id })
		.from(MainFileSchema)
		.where(and(eq(MainFileSchema.id, id), eq(MainFileSchema.ownerId, session.user.id)))
		.limit(1);

	if (!row) throw error(404, 'File not found');

	const updates: Partial<typeof MainFileSchema.$inferInsert> = {};

	if (body.isPinned !== undefined) updates.isPinned = body.isPinned;
	if (body.isStarred !== undefined) updates.isStarred = body.isStarred;
	if (body.name !== undefined) updates.name = sanitizeFileName(body.name);
	if (body.color !== undefined) updates.color = body.color as FileLabelColorId;
	if (body.trashed !== undefined) {
		updates.trashedAt = body.trashed ? new Date() : null;
	}

	await db.update(MainFileSchema).set(updates).where(eq(MainFileSchema.id, id));

	return json({ ok: true });
};
