import { auth } from '$lib/server/auth';
import { appendChunk, readAssembled, removeSession } from '$lib/server/drive-upload-chunk-store';
import { persistSealedUpload } from '$lib/server/drive-upload-persist';
import { STORAGE_PROVIDERS, type StorageProviderId } from '$lib/model/storage-provider';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const MAX_BYTES = 100 * 1024 * 1024;

export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) throw error(401, 'Unauthorized');

	const formData = await request.formData();
	const chunkIndex = Number(formData.get('chunkIndex'));
	const chunkCount = Number(formData.get('chunkCount'));
	const uploadIdRaw = formData.get('uploadId');
	const uploadId = typeof uploadIdRaw === 'string' && uploadIdRaw.trim() !== '' ? uploadIdRaw.trim() : null;

	const chunkEntry = formData.get('chunk');
	if (!(chunkEntry instanceof File)) throw error(400, 'Missing chunk');

	const buf = Buffer.from(await chunkEntry.arrayBuffer());
	if (!Number.isInteger(chunkIndex) || !Number.isInteger(chunkCount) || chunkCount < 1) {
		throw error(400, 'Invalid chunk indices');
	}

	const userId = session.user.id;

	let init:
		| {
				fileName: string;
				mimeType: string;
				storageProvider: StorageProviderId;
				parentId: string | null;
		  }
		| undefined;

	if (chunkIndex === 0) {
		const sp = String(formData.get('storageProvider') ?? 'local');
		if (!STORAGE_PROVIDERS.includes(sp as StorageProviderId)) {
			throw error(400, 'Invalid storage provider');
		}
		const parentRaw = formData.get('parentId');
		let parentId: string | null = null;
		if (typeof parentRaw === 'string' && parentRaw.trim() !== '') {
			const p = z.string().uuid().safeParse(parentRaw.trim());
			if (!p.success) throw error(400, 'Invalid parent folder');
			parentId = p.data;
		}
		init = {
			fileName: String(formData.get('fileName') ?? 'unnamed'),
			mimeType: String(formData.get('mimeType') ?? 'application/octet-stream'),
			storageProvider: sp as StorageProviderId,
			parentId
		};
	}

	try {
		const { uploadId: sid, meta } = await appendChunk(
			userId,
			uploadId,
			chunkIndex,
			chunkCount,
			buf,
			init
		);

		if (meta.nextChunkIndex < meta.chunkCount) {
			return json({ uploadId: sid, done: false });
		}

		const plain = await readAssembled(userId, sid);
		await removeSession(userId, sid);

		if (plain.length > MAX_BYTES) {
			throw error(413, 'File too large');
		}

		const created = await persistSealedUpload(
			userId,
			meta.storageProvider,
			meta.parentId,
			plain,
			meta.fileName,
			meta.mimeType
		);

		return json({ ok: true, done: true, uploadId: sid, created: [created] });
	} catch (e) {
		const msg = e instanceof Error ? e.message : 'Chunk upload failed';
		if (msg.includes('Invalid chunk') || msg.includes('session') || msg.includes('Expected chunk')) {
			throw error(400, msg);
		}
		if (msg.includes('too large')) throw error(413, msg);
		console.error('[drive/upload/chunk]', e);
		throw error(500, msg);
	}
};
