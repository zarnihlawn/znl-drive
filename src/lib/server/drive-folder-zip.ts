import { readStoredBlob } from '$lib/server/drive-load';
import { openFileBuffer } from '$lib/server/drive-seal';
import { db } from '$lib/server/db';
import type { StorageProviderId } from '$lib/model/storage-provider';
import { sql } from 'drizzle-orm';
import JSZip from 'jzip';

function sanitizeZipSegment(name: string): string {
	return name.replace(/[/\\]/g, '_').trim() || 'unnamed';
}

type SubtreeRow = {
	id: string;
	parent_id: string | null;
	name: string;
	item_type: string;
	path: string;
	storage_provider: string;
};

/**
 * Recursively collect all rows under `rootFolderId` (same owner + storage provider, not trashed).
 */
async function collectSubtreeRows(rootFolderId: string): Promise<SubtreeRow[]> {
	const result = (await db.execute(sql`
		WITH RECURSIVE sub AS (
			SELECT
				id,
				parent_id,
				name,
				item_type::text AS item_type,
				path,
				storage_provider,
				owner_id
			FROM main_file
			WHERE id = ${rootFolderId}::uuid
				AND trashed_at IS NULL
			UNION ALL
			SELECT
				m.id,
				m.parent_id,
				m.name,
				m.item_type::text,
				m.path,
				m.storage_provider,
				m.owner_id
			FROM main_file m
			INNER JOIN sub s ON m.parent_id = s.id
				AND m.owner_id = s.owner_id
				AND m.storage_provider = s.storage_provider
			WHERE m.trashed_at IS NULL
		)
		SELECT id, parent_id, name, item_type, path, storage_provider FROM sub
	`)) as unknown as { rows?: SubtreeRow[] };
	return result.rows ?? [];
}

/** Path inside the zip: relative to the folder root (no leading folder name). */
function zipRelativePath(
	rows: SubtreeRow[],
	rootFolderId: string,
	fileId: string
): string {
	const map = new Map(rows.map((r) => [r.id, r]));
	const parts: string[] = [];
	let id: string | null = fileId;
	while (id && id !== rootFolderId) {
		const n = map.get(id);
		if (!n) break;
		parts.push(sanitizeZipSegment(n.name));
		id = n.parent_id;
	}
	parts.reverse();
	return parts.join('/');
}

/**
 * Build a ZIP of all files under `rootFolderId` (decrypted). Empty folder yields an empty ZIP.
 */
export async function buildFolderZipBuffer(rootFolderId: string): Promise<Buffer> {
	const rows = await collectSubtreeRows(rootFolderId);
	const root = rows.find((r) => r.id === rootFolderId);
	if (!root || root.item_type !== 'folder') {
		throw new Error('Not a folder or not found');
	}

	const files = rows.filter((r) => r.item_type === 'file');
	const zip = new JSZip();
	const used = new Set<string>();

	for (const f of files) {
		const rel = zipRelativePath(rows, rootFolderId, f.id);
		if (!rel) continue;

		let unique = rel;
		let suffix = 2;
		while (used.has(unique)) {
			const dot = rel.lastIndexOf('.');
			const base = dot > 0 ? rel.slice(0, dot) : rel;
			const ext = dot > 0 ? rel.slice(dot) : '';
			unique = `${base}_${suffix}${ext}`;
			suffix += 1;
		}
		used.add(unique);

		const stored = await readStoredBlob(f.path, f.storage_provider as StorageProviderId);
		const plain = openFileBuffer(stored);
		zip.file(unique, plain);
	}

	// jzip bundles JSZip 2.x — synchronous `generate`, no `generateAsync`
	const out = zip.generate({
		type: 'nodebuffer',
		compression: 'DEFLATE'
	}) as Buffer | Uint8Array;
	return Buffer.isBuffer(out) ? out : Buffer.from(out);
}
