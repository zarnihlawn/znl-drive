import { readFile } from 'node:fs/promises';
import { TigrisUtil } from '$lib/service/tigris.service.svelte';
import type { StorageProviderId } from '$lib/model/storage-provider';

async function streamToBuffer(stream: ReadableStream<Uint8Array> | null): Promise<Buffer> {
	if (!stream) throw new Error('Empty stream');
	const reader = stream.getReader();
	const chunks: Buffer[] = [];
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value?.length) chunks.push(Buffer.from(value));
		}
	} finally {
		reader.releaseLock();
	}
	return Buffer.concat(chunks);
}

/** Raw bytes as stored on disk or in object storage (may be sealed). */
export async function readStoredBlob(
	path: string,
	storageProvider: StorageProviderId
): Promise<Buffer> {
	if (storageProvider === 'local') {
		return readFile(path);
	}
	const stream = await TigrisUtil.downloadStream(path);
	return streamToBuffer(stream);
}
