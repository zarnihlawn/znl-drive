import { base } from '$app/paths';
import type { FileLabelColorId } from '$lib/model/file-label-color';

export type PatchDriveFileBody = {
	isPinned?: boolean;
	isStarred?: boolean;
	name?: string;
	color?: FileLabelColorId | null;
	trashed?: boolean;
};

export async function patchDriveFile(id: string, body: PatchDriveFileBody): Promise<{ ok: boolean }> {
	const r = await fetch(`${base}/api/drive/files/${id}`, {
		method: 'PATCH',
		credentials: 'include',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!r.ok) {
		const t = await r.text();
		throw new Error(t || `Update failed (${r.status})`);
	}
	return (await r.json()) as { ok: boolean };
}

export async function shareDriveFile(
	id: string,
	body: { targetEmail: string; permission?: 'read' | 'write'; canReshare?: boolean }
): Promise<{ ok: boolean; alreadyShared?: boolean }> {
	const r = await fetch(`${base}/api/drive/files/${id}/share`, {
		method: 'POST',
		credentials: 'include',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!r.ok) {
		const t = await r.text();
		throw new Error(t || `Share failed (${r.status})`);
	}
	return (await r.json()) as { ok: boolean; alreadyShared?: boolean };
}

/** Triggers browser download via blob (cookie session). */
export async function downloadDriveFileAsBlob(id: string, filename: string): Promise<void> {
	const r = await fetch(`${base}/api/drive/files/${id}/download`, { credentials: 'include' });
	if (!r.ok) {
		const t = await r.text();
		throw new Error(t || `Download failed (${r.status})`);
	}
	const blob = await r.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.rel = 'noopener';
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
