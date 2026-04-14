import { resolve as resolveAppPath } from '$app/paths';
import { redirectToLoginSessionExpired } from '$lib/client/fetch-session';
import type { StorageProviderId } from '$lib/model/storage-provider';

/** Use multipart chunking above this size (bytes). */
export const UPLOAD_CHUNK_BYTES = 1024 * 1024; // 1 MiB

function postChunk(
	fd: FormData,
	onPartProgress: (loaded: number, total: number) => void,
	fileTotal: number,
	loadedSoFar: number
): Promise<{
	uploadId?: string;
	done?: boolean;
	ok?: boolean;
	created?: { id: string; name: string }[];
}> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.upload.addEventListener('progress', (e) => {
			if (e.lengthComputable) {
				onPartProgress(loadedSoFar + e.loaded, fileTotal);
			}
		});
		xhr.addEventListener('load', () => {
			if (xhr.status === 401) {
				redirectToLoginSessionExpired();
				reject(new Error('Session expired. Sign in again.'));
				return;
			}
			if (xhr.status >= 200 && xhr.status < 300) {
				try {
					resolve(JSON.parse(xhr.responseText || '{}'));
				} catch {
					resolve({});
				}
			} else {
				reject(new Error(xhr.responseText || `Chunk upload failed (${xhr.status})`));
			}
		});
		xhr.addEventListener('error', () => reject(new Error('Network error')));
		xhr.open('POST', resolveAppPath('/api/drive/upload/chunk'));
		xhr.withCredentials = true;
		xhr.send(fd);
	});
}

function postMultipart(
	fd: FormData,
	onProgress: (loaded: number, total: number) => void
): Promise<unknown> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.upload.addEventListener('progress', (e) => {
			if (e.lengthComputable) onProgress(e.loaded, e.total);
		});
		xhr.addEventListener('load', () => {
			if (xhr.status === 401) {
				redirectToLoginSessionExpired();
				reject(new Error('Session expired. Sign in again.'));
				return;
			}
			if (xhr.status >= 200 && xhr.status < 300) {
				try {
					resolve(JSON.parse(xhr.responseText || '{}'));
				} catch {
					resolve({ ok: true });
				}
			} else {
				reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
			}
		});
		xhr.addEventListener('error', () => reject(new Error('Network error')));
		xhr.open('POST', resolveAppPath('/api/drive/upload'));
		xhr.withCredentials = true;
		xhr.send(fd);
	});
}

async function uploadOneFileChunked(
	file: File,
	storageProvider: StorageProviderId,
	parentFolderId: string | null | undefined,
	onProgress: (loaded: number, total: number) => void
): Promise<void> {
	const chunkCount = Math.max(1, Math.ceil(file.size / UPLOAD_CHUNK_BYTES));
	let uploadId: string | undefined;
	let loaded = 0;

	for (let i = 0; i < chunkCount; i++) {
		const start = i * UPLOAD_CHUNK_BYTES;
		const end = Math.min(start + UPLOAD_CHUNK_BYTES, file.size);
		const slice = file.slice(start, end);
		const fd = new FormData();
		fd.append('chunkIndex', String(i));
		fd.append('chunkCount', String(chunkCount));
		fd.append('chunk', slice, file.name);
		fd.append('storageProvider', storageProvider);
		if (uploadId) fd.append('uploadId', uploadId);
		if (i === 0) {
			fd.append('fileName', file.name);
			fd.append('mimeType', file.type || 'application/octet-stream');
			if (parentFolderId) fd.append('parentId', parentFolderId);
		}

		const res = await postChunk(fd, onProgress, file.size, loaded);
		if (res.uploadId) uploadId = res.uploadId;
		loaded += end - start;
		onProgress(loaded, file.size);
		if (res.done && res.ok) return;
	}
}

/**
 * Multipart upload with progress. Large files are sent in 1 MiB chunks to `/api/drive/upload/chunk`.
 */
export function uploadFilesWithProgress(
	files: File[],
	storageProvider: StorageProviderId,
	onProgress: (loaded: number, total: number) => void,
	parentFolderId?: string | null
): Promise<{ ok: boolean }> {
	return new Promise((resolve, reject) => {
		const totalBytes = files.reduce((s, f) => s + f.size, 0);
		let doneBytes = 0;

		const run = async () => {
			for (const file of files) {
				if (file.size > UPLOAD_CHUNK_BYTES) {
					await uploadOneFileChunked(
						file,
						storageProvider,
						parentFolderId ?? undefined,
						(loaded, total) => {
							onProgress(doneBytes + loaded, totalBytes);
						}
					);
					doneBytes += file.size;
					onProgress(doneBytes, totalBytes);
				} else {
					const fd = new FormData();
					fd.append('storageProvider', storageProvider);
					if (parentFolderId) fd.append('parentId', parentFolderId);
					fd.append('file', file);
					await postMultipart(fd, (loaded, total) => {
						onProgress(doneBytes + loaded, totalBytes);
					});
					doneBytes += file.size;
					onProgress(doneBytes, totalBytes);
				}
			}
			resolve({ ok: true });
		};

		void run().catch(reject);
	});
}
