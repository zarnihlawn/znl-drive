import { resolveParentFolderForUser } from '$lib/server/drive-parent';
import {
	localPathNewFileAtRoot,
	localPathNewFileInsideFolder,
	tigrisKeyNewFileAtRoot,
	tigrisKeyNewFileInsideFolder
} from '$lib/server/drive-storage-layout';
import { sealFileBuffer } from '$lib/server/drive-seal';
import { db } from '$lib/server/db';
import { MainFileSchema } from '$lib/server/db/schema/main-schema/main.schema';
import { localUserUploadDir } from '$lib/server/local-drive-path';
import { TigrisUtil } from '$lib/service/tigris.service.svelte';
import type { StorageProviderId } from '$lib/model/storage-provider';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const MAX_BYTES = 100 * 1024 * 1024;

export function safeUploadFileName(name: string): string {
	const trimmed = name.trim().replace(/[/\\]/g, '_');
	return trimmed.slice(0, 220) || 'unnamed';
}

export async function persistSealedUpload(
	userId: string,
	provider: StorageProviderId,
	parentIdRaw: unknown,
	plain: Buffer,
	originalFileName: string,
	mimeType: string
): Promise<{ id: string; name: string }> {
	if (plain.length > MAX_BYTES) {
		throw new Error(`File too large (max ${MAX_BYTES} bytes)`);
	}

	const sealed = sealFileBuffer(plain);
	const parentFolder = await resolveParentFolderForUser(userId, provider, parentIdRaw);
	const id = randomUUID();
	const name = safeUploadFileName(originalFileName);
	const stored = sealed.buffer;

	if (provider === 'local') {
		const userDir = localUserUploadDir(userId);
		await mkdir(userDir, { recursive: true });
		const diskPath = parentFolder
			? localPathNewFileInsideFolder(parentFolder.path, id, name)
			: localPathNewFileAtRoot(userDir, id, name);
		await mkdir(parentFolder ? parentFolder.path : userDir, { recursive: true });
		await writeFile(diskPath, stored);

		await db.insert(MainFileSchema).values({
			id,
			ownerId: userId,
			parentId: parentFolder?.id ?? null,
			itemType: 'file',
			path: diskPath,
			name,
			mimeType,
			sizeBytes: sealed.originalSize,
			storageProvider: 'local',
			isPinned: false,
			isStarred: false,
			trashedAt: null,
			isEncrypted: true,
			isCompressed: true,
			color: 'base'
		});
	} else {
		const objectKey = parentFolder
			? tigrisKeyNewFileInsideFolder(parentFolder.path, id, name)
			: tigrisKeyNewFileAtRoot(userId, id, name);
		await TigrisUtil.upload(objectKey, stored, {
			contentType: 'application/octet-stream'
		});

		await db.insert(MainFileSchema).values({
			id,
			ownerId: userId,
			parentId: parentFolder?.id ?? null,
			itemType: 'file',
			path: objectKey,
			name,
			mimeType,
			sizeBytes: sealed.originalSize,
			storageProvider: 'tigris',
			isPinned: false,
			isStarred: false,
			trashedAt: null,
			isEncrypted: true,
			isCompressed: true,
			color: 'base'
		});
	}

	return { id, name };
}
