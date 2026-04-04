import { base } from '$app/paths';
import { fetchWithSession } from '$lib/client/fetch-session';
import type { FileLabelColorId } from '$lib/model/file-label-color';

export type PatchDriveFileBody = {
	isPinned?: boolean;
	isStarred?: boolean;
	name?: string;
	color?: FileLabelColorId | null;
	trashed?: boolean;
};

export async function patchDriveFile(id: string, body: PatchDriveFileBody): Promise<{ ok: boolean }> {
	const r = await fetchWithSession(`${base}/api/drive/files/${id}`, {
		method: 'PATCH',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!r.ok) {
		const t = await r.text();
		throw new Error(t || `Update failed (${r.status})`);
	}
	return (await r.json()) as { ok: boolean };
}

export async function permanentDeleteDriveFile(id: string): Promise<{ ok: boolean }> {
	const r = await fetchWithSession(`${base}/api/drive/files/${id}`, {
		method: 'DELETE'
	});
	if (!r.ok) {
		const t = await r.text();
		throw new Error(t || `Delete failed (${r.status})`);
	}
	return (await r.json()) as { ok: boolean };
}

export async function shareDriveFile(
	id: string,
	body: { targetEmail: string; permission?: 'read' | 'write'; canReshare?: boolean }
): Promise<{ ok: boolean; alreadyShared?: boolean }> {
	const r = await fetchWithSession(`${base}/api/drive/files/${id}/share`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!r.ok) {
		const t = await r.text();
		throw new Error(t || `Share failed (${r.status})`);
	}
	return (await r.json()) as { ok: boolean; alreadyShared?: boolean };
}

function filenameFromContentDisposition(header: string | null, fallback: string): string {
	if (!header) return fallback;
	const utf8 = /filename\*=(?:UTF-8'')?([^;\n]+)/i.exec(header);
	if (utf8?.[1]) {
		try {
			return decodeURIComponent(utf8[1].trim().replace(/^["']|["']$/g, ''));
		} catch {
			return utf8[1].trim().replace(/^["']|["']$/g, '');
		}
	}
	const ascii = /filename="([^"]+)"/i.exec(header) ?? /filename=([^;\n]+)/i.exec(header);
	if (ascii?.[1]) return ascii[1].trim().replace(/^["']|["']$/g, '');
	return fallback;
}

/** Triggers browser download via blob (cookie session). Files and folders (ZIP) use the server Content-Disposition name when present. */
export async function downloadDriveFileAsBlob(id: string, filenameFallback: string): Promise<void> {
	const r = await fetchWithSession(`${base}/api/drive/files/${id}/download`);
	if (!r.ok) {
		const t = await r.text();
		throw new Error(t || `Download failed (${r.status})`);
	}
	const blob = await r.blob();
	const name = filenameFromContentDisposition(
		r.headers.get('content-disposition'),
		filenameFallback
	);
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = name;
	a.rel = 'noopener';
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
