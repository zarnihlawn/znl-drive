import { base } from '$app/paths';
import type { FileLabelColorId } from '$lib/model/file-label-color';

export type PatchDriveFileBody = {
	isPinned?: boolean;
	isStarred?: boolean;
	name?: string;
	color?: FileLabelColorId;
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
