import { localUserUploadDir } from '$lib/server/local-drive-path';
import type { StorageProviderId } from '$lib/model/storage-provider';
import { appendFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export type ChunkUploadMeta = {
	fileName: string;
	mimeType: string;
	storageProvider: StorageProviderId;
	parentId: string | null;
	chunkCount: number;
	nextChunkIndex: number;
};

function sessionDir(userId: string, uploadId: string) {
	return join(localUserUploadDir(userId), '.upload-parts', uploadId);
}

export function dataPath(userId: string, uploadId: string) {
	return join(sessionDir(userId, uploadId), 'data.bin');
}

export function metaPath(userId: string, uploadId: string) {
	return join(sessionDir(userId, uploadId), 'meta.json');
}

export async function readMeta(userId: string, uploadId: string): Promise<ChunkUploadMeta | null> {
	try {
		const raw = await readFile(metaPath(userId, uploadId), 'utf8');
		return JSON.parse(raw) as ChunkUploadMeta;
	} catch {
		return null;
	}
}

/**
 * First chunk (`uploadId` absent): creates session. Later chunks must pass same `uploadId`.
 * Returns updated meta (`nextChunkIndex` is index of next expected chunk).
 */
export async function appendChunk(
	userId: string,
	uploadId: string | null,
	chunkIndex: number,
	chunkCount: number,
	chunk: Buffer,
	init?: {
		fileName: string;
		mimeType: string;
		storageProvider: StorageProviderId;
		parentId: string | null;
	}
): Promise<{ uploadId: string; meta: ChunkUploadMeta }> {
	if (chunkIndex < 0 || chunkIndex >= chunkCount) {
		throw new Error('Invalid chunk index');
	}

	let id = uploadId;
	if (chunkIndex === 0 && !id) {
		if (!init) throw new Error('Missing file metadata for first chunk');
		id = randomUUID();
		await mkdir(sessionDir(userId, id), { recursive: true });
		const meta: ChunkUploadMeta = {
			...init,
			chunkCount,
			nextChunkIndex: 0
		};
		await writeFile(metaPath(userId, id), JSON.stringify(meta), 'utf8');
		await writeFile(dataPath(userId, id), chunk);
		meta.nextChunkIndex = 1;
		await writeFile(metaPath(userId, id), JSON.stringify(meta), 'utf8');
		return { uploadId: id, meta };
	}

	if (!id) throw new Error('uploadId required after first chunk');

	const meta = await readMeta(userId, id);
	if (!meta) throw new Error('Upload session not found');
	if (meta.chunkCount !== chunkCount) {
		throw new Error('chunkCount mismatch');
	}
	if (chunkIndex !== meta.nextChunkIndex) {
		throw new Error(`Expected chunk ${meta.nextChunkIndex}, got ${chunkIndex}`);
	}

	if (chunkIndex === 0) {
		await writeFile(dataPath(userId, id), chunk);
	} else {
		await appendFile(dataPath(userId, id), chunk);
	}
	meta.nextChunkIndex = chunkIndex + 1;
	await writeFile(metaPath(userId, id), JSON.stringify(meta), 'utf8');
	return { uploadId: id, meta };
}

export async function readAssembled(userId: string, uploadId: string): Promise<Buffer> {
	return readFile(dataPath(userId, uploadId));
}

export async function removeSession(userId: string, uploadId: string): Promise<void> {
	try {
		await rm(sessionDir(userId, uploadId), { recursive: true, force: true });
	} catch {
		/* ignore */
	}
}
