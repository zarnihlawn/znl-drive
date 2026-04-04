import { base, resolve } from '$app/paths';
import { canAccessSharedItem, sharedRootIdsForRecipient } from '$lib/server/drive-shared-access';
import { db } from '$lib/server/db';
import { MainFileSchema } from '$lib/server/db/schema/main-schema/main.schema';
import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

function pathWithoutBase(pathname: string): string {
	const p = pathname.slice(base.length) || '/';
	if (p.length > 1 && p.endsWith('/')) return p.slice(0, -1);
	return p;
}

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/auth/login');
	}

	const rel = pathWithoutBase(url.pathname);
	const isHomeFilesPage = rel === '/home';
	const isSharedPage = rel === '/home/shared';

	const folderParam = url.searchParams.get('folder');
	let currentFolder: {
		id: string;
		name: string;
		parentId: string | null;
		upHref: string;
	} | null = null;

	const email = locals.user.email?.trim().toLowerCase();

	if (folderParam && folderParam.trim() !== '') {
		const parsed = z.string().uuid().safeParse(folderParam.trim());
		if (!parsed.success) {
			throw redirect(303, isSharedPage ? resolve('/home/shared') : resolve('/home'));
		}

		if (isSharedPage) {
			if (!email) {
				throw redirect(303, resolve('/home/shared'));
			}
			const sharedRoots = await sharedRootIdsForRecipient(email);
			if (!(await canAccessSharedItem(email, parsed.data, sharedRoots))) {
				throw redirect(303, resolve('/home/shared'));
			}

			const [row] = await db
				.select({
					id: MainFileSchema.id,
					name: MainFileSchema.name,
					parentId: MainFileSchema.parentId,
					itemType: MainFileSchema.itemType
				})
				.from(MainFileSchema)
				.where(and(eq(MainFileSchema.id, parsed.data), isNull(MainFileSchema.trashedAt)))
				.limit(1);

			if (!row || row.itemType !== 'folder') {
				throw redirect(303, resolve('/home/shared'));
			}

			let upHref: string = resolve('/home/shared');
			if (row.parentId) {
				const canUp = await canAccessSharedItem(email, row.parentId, sharedRoots);
				upHref = canUp
					? `${resolve('/home/shared')}?folder=${encodeURIComponent(row.parentId)}`
					: resolve('/home/shared');
			}

			currentFolder = {
				id: row.id,
				name: row.name,
				parentId: row.parentId ?? null,
				upHref
			};
		} else if (isHomeFilesPage) {
			const [row] = await db
				.select({
					id: MainFileSchema.id,
					name: MainFileSchema.name,
					parentId: MainFileSchema.parentId,
					itemType: MainFileSchema.itemType
				})
				.from(MainFileSchema)
				.where(
					and(
						eq(MainFileSchema.id, parsed.data),
						eq(MainFileSchema.ownerId, locals.user.id),
						isNull(MainFileSchema.trashedAt)
					)
				)
				.limit(1);

			if (!row || row.itemType !== 'folder') {
				throw redirect(303, resolve('/home'));
			}

			const upHref: string = row.parentId
				? `${resolve('/home')}?folder=${encodeURIComponent(row.parentId)}`
				: resolve('/home');

			currentFolder = {
				id: row.id,
				name: row.name,
				parentId: row.parentId ?? null,
				upHref
			};
		}
	}

	return {
		user: locals.user ?? null,
		currentFolder,
		sharedView: isSharedPage
	};
};
