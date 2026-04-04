import { permanentDeleteTrashedItem } from '$lib/server/drive-permanent-delete';
import { requireApiSession } from '$lib/server/require-api-session';
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
		color: z.union([colorEnum, z.null()]).optional(),
		trashed: z.boolean().optional()
	})
	.strict();

function sanitizeFileName(name: string): string {
	const t = name.trim().replace(/[/\\]/g, '_');
	return t.slice(0, 500) || 'unnamed';
}

export const PATCH: RequestHandler = async ({ request, params }) => {
	const session = await requireApiSession(request);

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
	if (body.color !== undefined) updates.color = body.color;
	if (body.trashed !== undefined) {
		updates.trashedAt = body.trashed ? new Date() : null;
	}

	await db.update(MainFileSchema).set(updates).where(eq(MainFileSchema.id, id));

	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request, params }) => {
	const session = await requireApiSession(request);

	const id = params.id;
	if (!id) throw error(400, 'Missing id');

	const [row] = await db
		.select({
			id: MainFileSchema.id,
			trashedAt: MainFileSchema.trashedAt
		})
		.from(MainFileSchema)
		.where(and(eq(MainFileSchema.id, id), eq(MainFileSchema.ownerId, session.user.id)))
		.limit(1);

	if (!row) throw error(404, 'Not found');
	if (!row.trashedAt) throw error(400, 'Only items in trash can be permanently deleted');

	try {
		await permanentDeleteTrashedItem(session.user.id, id);
	} catch (e) {
		console.error('[drive/files] permanent delete failed', e);
		throw error(500, 'Failed to delete permanently');
	}

	return json({ ok: true });
};
