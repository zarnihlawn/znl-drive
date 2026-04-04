import { auth } from '$lib/server/auth';
import { openFileBuffer } from '$lib/server/drive-seal';
import { readStoredBlob } from '$lib/server/drive-load';
import { db } from '$lib/server/db';
import { MainFileSchema, MainFileShareSchema } from '$lib/server/db/schema/main-schema/main.schema';
import { error } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import type { RequestHandler } from './$types';

function contentDisposition(filename: string): string {
	const safe = filename.replace(/[\r\n"]/g, '_');
	const encoded = encodeURIComponent(filename);
	return `attachment; filename="${safe}"; filename*=UTF-8''${encoded}`;
}

export const GET: RequestHandler = async ({ request, params }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) throw error(401, 'Unauthorized');

	const id = params.id;
	if (!id) throw error(400, 'Missing id');

	const [row] = await db
		.select()
		.from(MainFileSchema)
		.where(and(eq(MainFileSchema.id, id), isNull(MainFileSchema.trashedAt)))
		.limit(1);

	if (!row) throw error(404, 'Not found');

	if (row.itemType === 'folder') {
		throw error(400, 'Folders cannot be downloaded');
	}

	let allowed = row.ownerId === session.user.id;

	if (!allowed && session.user.email) {
		const [share] = await db
			.select({ id: MainFileShareSchema.id })
			.from(MainFileShareSchema)
			.where(
				and(
					eq(MainFileShareSchema.fileId, id),
					eq(MainFileShareSchema.targetEmail, session.user.email.toLowerCase())
				)
			)
			.limit(1);
		allowed = !!share;
	}

	if (!allowed) throw error(403, 'Forbidden');

	let stored: Buffer;
	try {
		stored = await readStoredBlob(row.path, row.storageProvider);
	} catch (e) {
		console.error('[download] read failed', e);
		throw error(502, 'Failed to read file');
	}

	let body: Buffer;
	try {
		body = openFileBuffer(stored);
	} catch (e) {
		console.error('[download] decrypt/decompress failed', e);
		throw error(500, 'Failed to decode file');
	}

	return new Response(new Uint8Array(body), {
		headers: {
			'Content-Type': row.mimeType || 'application/octet-stream',
			'Content-Disposition': contentDisposition(row.name),
			'Content-Length': String(body.length),
			'Cache-Control': 'private, no-store'
		}
	});
};
