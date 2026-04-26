import { db } from '$lib/server/db';
import { MainFileSchema } from '$lib/server/db/schema/main-schema/main.schema';
import {
	TeamInviteSchema,
	TeamMemberSchema,
	TeamSchema
} from '$lib/server/db/schema/main-schema/team.schema';
import { findUsersByEmails, isTeamMember } from '$lib/server/team-access';
import {
	localPathNewFolderAtRoot,
	tigrisKeyNewFolderAtRootTeam
} from '$lib/server/drive-storage-layout';
import { localTeamUploadDir } from '$lib/server/local-drive-path';
import { TigrisUtil } from '$lib/service/tigris.service.svelte';
import type { StorageProviderId } from '$lib/model/storage-provider';
import { mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';

function safeTeamName(name: string): string {
	const t = name.trim().replace(/[/\\]/g, '_');
	return t.slice(0, 200) || 'Team';
}

function normalizeEmail(e: string): string {
	return e.trim().toLowerCase();
}

/**
 * Create team row, root folder, owner membership, optional members + pending invites.
 */
export async function createTeamWithRoot(params: {
	creatorId: string;
	creatorEmail: string | null | undefined;
	name: string;
	storageProvider: StorageProviderId;
	inviteEmails: string[];
}): Promise<{ teamId: string; name: string; rootFolderId: string; addedMembers: number; pendingInvites: number }> {
	const teamId = randomUUID();
	const rootFolderId = randomUUID();
	const sp = params.storageProvider;
	const cleanName = safeTeamName(params.name);
	const myEmail = params.creatorEmail?.trim().toLowerCase() ?? '';

	if (sp === 'local') {
		const teamDir = localTeamUploadDir(teamId);
		const diskPath = localPathNewFolderAtRoot(teamDir, rootFolderId);
		await mkdir(diskPath, { recursive: true });

		await db.insert(TeamSchema).values({
			id: teamId,
			name: cleanName,
			createdByUserId: params.creatorId,
			rootFolderId: null,
			storageProvider: sp
		});

		await db.insert(MainFileSchema).values({
			id: rootFolderId,
			ownerId: params.creatorId,
			teamId,
			parentId: null,
			itemType: 'folder',
			path: diskPath,
			name: cleanName,
			mimeType: 'inode/directory',
			sizeBytes: 0,
			storageProvider: 'local',
			isPinned: false,
			isStarred: false,
			trashedAt: null,
			isEncrypted: false,
			isCompressed: false,
			color: null
		});
	} else {
		const objectKey = tigrisKeyNewFolderAtRootTeam(teamId, rootFolderId);
		try {
			await TigrisUtil.upload(objectKey, Buffer.alloc(0), {
				contentType: 'application/octet-stream'
			});
		} catch (e) {
			console.error('[createTeam] Tigris upload failed', e);
			throw new Error('Tigris folder create failed. Check TIGRIS_* env vars and bucket access.');
		}

		await db.insert(TeamSchema).values({
			id: teamId,
			name: cleanName,
			createdByUserId: params.creatorId,
			rootFolderId: null,
			storageProvider: sp
		});

		await db.insert(MainFileSchema).values({
			id: rootFolderId,
			ownerId: params.creatorId,
			teamId,
			parentId: null,
			itemType: 'folder',
			path: objectKey,
			name: cleanName,
			mimeType: 'inode/directory',
			sizeBytes: 0,
			storageProvider: 'tigris',
			isPinned: false,
			isStarred: false,
			trashedAt: null,
			isEncrypted: false,
			isCompressed: false,
			color: null
		});
	}

	await db
		.update(TeamSchema)
		.set({ rootFolderId })
		.where(eq(TeamSchema.id, teamId));

	await db.insert(TeamMemberSchema).values({
		teamId,
		userId: params.creatorId,
		role: 'owner'
	});

	const uniqueInvites = [
		...new Set(
			params.inviteEmails
				.map((e) => normalizeEmail(e))
				.filter((e) => e.length > 0 && e !== myEmail)
		)
	];
	let addedMembers = 0;
	let pendingInvites = 0;
	if (uniqueInvites.length) {
		const byEmail = await findUsersByEmails(uniqueInvites);
		for (const em of uniqueInvites) {
			const u = byEmail.get(em);
			if (u) {
				if (u.id === params.creatorId) continue;
				if (await isTeamMember(u.id, teamId)) continue;
				await db.insert(TeamMemberSchema).values({
					teamId,
					userId: u.id,
					role: 'member'
				});
				addedMembers += 1;
			} else {
				await db.insert(TeamInviteSchema).values({
					teamId,
					email: em,
					status: 'pending'
				});
				pendingInvites += 1;
			}
		}
	}

	return { teamId, name: cleanName, rootFolderId, addedMembers, pendingInvites };
}
