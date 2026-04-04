import { base } from '$app/paths';
import type { StorageProviderId } from '$lib/model/storage-provider';

/**
 * Multipart upload with XMLHttpRequest so we get `upload.onprogress`.
 * Uses session cookies (same-origin).
 */
export function uploadFilesWithProgress(
	files: File[],
	storageProvider: StorageProviderId,
	onProgress: (loaded: number, total: number) => void
): Promise<{ ok: boolean }> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		const fd = new FormData();
		fd.append('storageProvider', storageProvider);
		for (const f of files) {
			fd.append('file', f);
		}

		xhr.upload.addEventListener('progress', (e) => {
			if (e.lengthComputable) onProgress(e.loaded, e.total);
		});
		xhr.addEventListener('load', () => {
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
		xhr.open('POST', `${base}/api/drive/upload`);
		xhr.withCredentials = true;
		xhr.send(fd);
	});
}
