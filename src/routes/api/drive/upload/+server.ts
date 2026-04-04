import { persistSealedUpload, safeUploadFileName } from '$lib/server/drive-upload-persist';
import { requireApiSession } from '$lib/server/require-api-session';
import { STORAGE_PROVIDERS, type StorageProviderId } from '$lib/model/storage-provider';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const MAX_BYTES = 100 * 1024 * 1024;

/**
 * Multipart upload (small files / multi-file). Large files use `POST /api/drive/upload/chunk`.
 */
export const POST: RequestHandler = async ({ request }) => {
	const session = await requireApiSession(request);

	const formData = await request.formData();
	const providerRaw = String(formData.get('storageProvider') ?? 'local');
	if (!STORAGE_PROVIDERS.includes(providerRaw as StorageProviderId)) {
		throw error(400, 'Invalid storage provider');
	}
	const provider = providerRaw as StorageProviderId;

	const files = formData.getAll('file').filter((v): v is File => v instanceof File);
	if (!files.length) throw error(400, 'No files');

	const userId = session.user.id;
	const parentIdRaw = formData.get('parentId');
	const created: { id: string; name: string }[] = [];

	for (const file of files) {
		const plain = Buffer.from(await file.arrayBuffer());
		if (plain.length > MAX_BYTES) {
			throw error(413, `File too large: ${file.name}`);
		}

		try {
			const row = await persistSealedUpload(
				userId,
				provider,
				parentIdRaw,
				plain,
				safeUploadFileName(file.name),
				file.type || 'application/octet-stream'
			);
			created.push(row);
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Upload failed';
			console.error('[drive/upload]', e);
			throw error(500, msg);
		}
	}

	return json({ ok: true, created });
};
