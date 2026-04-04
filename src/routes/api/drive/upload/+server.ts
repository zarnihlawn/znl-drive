import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { MainFileSchema } from '$lib/server/db/schema/main-schema/main.schema';
import { localUserUploadDir } from '$lib/server/local-drive-path';
import { TigrisUtil } from '$lib/service/tigris.service.svelte';
import { STORAGE_PROVIDERS, type StorageProviderId } from '$lib/model/storage-provider';
import { error, json } from '@sveltejs/kit';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from './$types';

const MAX_BYTES = 100 * 1024 * 1024; // align with MulterService default

function safeFileName(name: string): string {
	const trimmed = name.trim().replace(/[/\\]/g, '_');
	return trimmed.slice(0, 220) || 'unnamed';
}

/**
 * SvelteKit uses the Fetch `Request` + `FormData` API (not Express `multer`).
 * Local saves under `~/Documents/znl-drive/<userId>/`; Tigris uses `TigrisUtil.upload`.
 */
export const POST: RequestHandler = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) throw error(401, 'Unauthorized');

	const formData = await request.formData();
	const providerRaw = String(formData.get('storageProvider') ?? 'local');
	if (!STORAGE_PROVIDERS.includes(providerRaw as StorageProviderId)) {
		throw error(400, 'Invalid storage provider');
	}
	const provider = providerRaw as StorageProviderId;

	const files = formData.getAll('file').filter((v): v is File => v instanceof File);
	if (!files.length) throw error(400, 'No files');

	const userId = session.user.id;
	const created: { id: string; name: string }[] = [];

	for (const file of files) {
		const buf = Buffer.from(await file.arrayBuffer());
		if (buf.length > MAX_BYTES) {
			throw error(413, `File too large: ${file.name}`);
		}

		const id = randomUUID();
		const name = safeFileName(file.name);
		const mimeType = file.type || 'application/octet-stream';

		if (provider === 'local') {
			const userDir = localUserUploadDir(userId);
			await mkdir(userDir, { recursive: true });
			const diskPath = join(userDir, `${id}-${name}`);
			await writeFile(diskPath, buf);

			await db.insert(MainFileSchema).values({
				id,
				ownerId: userId,
				parentId: null,
				itemType: 'file',
				path: diskPath,
				name,
				mimeType,
				sizeBytes: buf.length,
				storageProvider: 'local',
				isPinned: false,
				isStarred: false,
				trashedAt: null,
				isEncrypted: false,
				isCompressed: false
			});
		} else {
			const objectKey = `users/${userId}/${id}/${name}`;
			try {
				await TigrisUtil.upload(objectKey, buf, { contentType: mimeType });
			} catch (e) {
				console.error('[drive/upload] Tigris upload failed', e);
				throw error(
					502,
					'Tigris upload failed. Check TIGRIS_* env vars and bucket access.'
				);
			}

			await db.insert(MainFileSchema).values({
				id,
				ownerId: userId,
				parentId: null,
				itemType: 'file',
				path: objectKey,
				name,
				mimeType,
				sizeBytes: buf.length,
				storageProvider: 'tigris',
				isPinned: false,
				isStarred: false,
				trashedAt: null,
				isEncrypted: false,
				isCompressed: false
			});
		}

		created.push({ id, name });
	}

	return json({ ok: true, created });
};
