<script lang="ts">
	import { browser } from '$app/environment';
	import { resolve } from '$app/paths';
	import { fetchWithSession } from '$lib/client/fetch-session';
	import { resolveHref } from '$lib/url/resolve-href';
	import { page } from '$app/state';
	import { patchDriveFile, permanentDeleteDriveFile } from '$lib/client/drive-file';
	import {
		fileLabelBorderClass,
		fileLabelIconClass,
		type FileLabelColorId
	} from '$lib/model/file-label-color';
	import type { StorageProviderId } from '$lib/model/storage-provider';
	import { storageProviderLabel } from '$lib/model/storage-provider';
	import { StatusColorEnum } from '$lib/model/enum/color.enum';
	import { bumpDriveListRefresh, driveListRefresh } from '$lib/state/drive-refresh.svelte';
	import { driveStorage } from '$lib/state/storage-provider.svelte';
	import { toastService } from '$lib/service/toast.service.svelte';
	import { formatBytes } from '$lib/tool/format-bytes';
	import { LucideFile, LucideFolder, LucideRotateCcw, LucideTrash2 } from '@lucide/svelte';

	type ApiRow = {
		id: string;
		name: string;
		itemType: string;
		sizeBytes: number;
		updatedAt: string;
		trashedAt: string;
		purgeAt: string;
		storageProvider: StorageProviderId;
		isPinned: boolean;
		isStarred: boolean;
		color: string | null;
		parentId: string | null;
		ownerName: string;
	};

	type TrashItem = {
		id: string;
		name: string;
		itemType: 'file' | 'folder';
		sizeBytes: number | null;
		updatedAt: string;
		trashedAt: string;
		purgeAt: string;
		storageProvider: StorageProviderId;
		color: FileLabelColorId | string | null;
		parentId: string | null;
		ownerName: string;
	};

	let rows = $state<TrashItem[]>([]);
	let trashRetentionDays = $state(30);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let busyId = $state<string | null>(null);

	function mapRow(f: ApiRow): TrashItem {
		return {
			id: f.id,
			name: f.name,
			itemType: f.itemType === 'folder' ? 'folder' : 'file',
			sizeBytes: f.sizeBytes,
			updatedAt: f.updatedAt.slice(0, 10),
			trashedAt: f.trashedAt.slice(0, 10),
			purgeAt: f.purgeAt,
			storageProvider: f.storageProvider,
			color: f.color as FileLabelColorId | null,
			parentId: f.parentId ?? null,
			ownerName: f.ownerName
		};
	}

	function daysUntilPurge(purgeIso: string): number {
		const end = new Date(purgeIso).getTime();
		const now = Date.now();
		return Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));
	}

	function purgeLabel(purgeIso: string): string {
		const d = daysUntilPurge(purgeIso);
		if (d === 0) return 'Removes today';
		if (d === 1) return 'Removes in 1 day';
		return `Removes in ${d} days`;
	}

	async function loadTrash() {
		loading = true;
		loadError = null;
		try {
			const qs = new URLSearchParams({ storageProvider: driveStorage.current });
			const r = await fetchWithSession(`${resolveHref('/api/drive/trash')}?${qs}`);
			if (!r.ok) {
				const t = await r.text();
				throw new Error(t || r.statusText);
			}
			const payload = (await r.json()) as { files: ApiRow[]; trashRetentionDays?: number };
			if (typeof payload.trashRetentionDays === 'number') {
				trashRetentionDays = payload.trashRetentionDays;
			}
			rows = payload.files.map(mapRow);
		} catch (e) {
			loadError = e instanceof Error ? e.message : 'Failed to load trash';
			rows = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (!browser) return;
		void driveListRefresh.tick;
		void driveStorage.current;
		void page.url.pathname;
		void loadTrash();
	});

	async function onRestore(item: TrashItem) {
		busyId = item.id;
		try {
			await patchDriveFile(item.id, { trashed: false });
			bumpDriveListRefresh();
			toastService.addToast('Restored to your drive', StatusColorEnum.SUCCESS);
			await loadTrash();
		} catch (e) {
			toastService.addToast(e instanceof Error ? e.message : 'Restore failed', StatusColorEnum.ERROR);
		} finally {
			busyId = null;
		}
	}

	async function onDeleteForever(item: TrashItem) {
		if (
			!confirm(
				`Permanently delete “${item.name}”${item.itemType === 'folder' ? ' and everything inside it' : ''}? This cannot be undone.`
			)
		) {
			return;
		}
		busyId = item.id;
		try {
			await permanentDeleteDriveFile(item.id);
			bumpDriveListRefresh();
			toastService.addToast('Permanently deleted', StatusColorEnum.SUCCESS);
			await loadTrash();
		} catch (e) {
			toastService.addToast(
				e instanceof Error ? e.message : 'Permanent delete failed',
				StatusColorEnum.ERROR
			);
		} finally {
			busyId = null;
		}
	}

	const sortedRows = $derived(rows.slice().sort((a, b) => a.name.localeCompare(b.name)));
</script>

<div class="flex min-h-0 flex-1 flex-col gap-6 pb-8">
	<div class="d-alert d-alert-warning shrink-0 shadow-sm">
		<div class="flex flex-col gap-1">
			<span class="font-semibold">Trash retention</span>
			<span class="text-sm">
				Items stay here for <strong>{trashRetentionDays} days</strong>, then are removed automatically.
				Restore anything you still need, or delete it forever now.
			</span>
		</div>
	</div>

	<p class="text-base-content/70 shrink-0 text-sm">
		List matches the storage provider in the header. Restored items return to their original location. Permanent
		deletion frees storage immediately.
	</p>

	{#if loading && rows.length === 0}
		<div class="d-skeleton h-40 w-full"></div>
	{:else if loadError}
		<div class="d-alert d-alert-error">
			<span>{loadError}</span>
		</div>
	{/if}

	<div class="d-card border-base-300 bg-base-100 flex min-h-0 flex-1 flex-col border shadow-sm">
		<div class="d-card-body flex min-h-0 flex-1 flex-col p-0">
			<div class="min-h-0 flex-1 overflow-auto">
				<table class="d-table-zebra d-table w-full min-w-[56rem]">
					<thead>
						<tr class="border-base-300 border-b">
							<th class="min-w-[12rem]">Name</th>
							<th class="w-28">Size</th>
							<th class="w-36">Modified</th>
							<th class="w-36">Trashed</th>
							<th class="min-w-[9rem]">Auto-remove</th>
							<th class="w-32">Storage</th>
							<th class="min-w-[7rem]">Owner</th>
							<th class="w-44 text-center">Actions</th>
						</tr>
					</thead>
					<tbody>
						<tr class="bg-base-200/60 hover:bg-base-200/60">
							<td colspan="8" class="py-2 text-xs font-semibold tracking-wide uppercase">
								<span class="text-base-content/80">Trash</span>
							</td>
						</tr>
						{#if sortedRows.length === 0 && !loading}
							<tr>
								<td colspan="8" class="text-base-content/60 py-8 text-center">
									Trash is empty for {storageProviderLabel(driveStorage.current)}.
									<a href={resolve('/home')} class="link link-primary">Back to Home</a>
								</td>
							</tr>
						{:else}
							{#each sortedRows as item (item.id)}
								<tr class="hover:bg-info/50 border-l-4 transition-colors {fileLabelBorderClass(item.color)}">
									<td>
										<span class="inline-flex min-w-0 max-w-full items-center gap-2">
											{#if item.itemType === 'folder'}
												<LucideFolder
													class="size-5 shrink-0 {fileLabelIconClass(item.color)}"
													aria-hidden="true"
												/>
											{:else}
												<LucideFile
													class="size-5 shrink-0 {fileLabelIconClass(item.color ?? 'base')}"
													aria-hidden="true"
												/>
											{/if}
											<span class="font-medium truncate">{item.name}</span>
										</span>
									</td>
									<td class="text-base-content/80 tabular-nums">{formatBytes(item.sizeBytes)}</td>
									<td class="text-base-content/80">{item.updatedAt}</td>
									<td class="text-base-content/80">{item.trashedAt}</td>
									<td class="text-base-content/80 text-sm">{purgeLabel(item.purgeAt)}</td>
									<td class="text-sm">{storageProviderLabel(item.storageProvider)}</td>
									<td class="text-base-content/80 max-w-[8rem] truncate text-sm" title={item.ownerName}>
										{item.ownerName}
									</td>
									<td class="text-center">
										<div class="flex flex-wrap items-center justify-center gap-1">
											<button
												type="button"
												class="d-btn d-btn-ghost d-btn-sm gap-1"
												disabled={busyId === item.id}
												onclick={() => void onRestore(item)}
											>
												<LucideRotateCcw class="size-3.5" aria-hidden="true" />
												Restore
											</button>
											<button
												type="button"
												class="d-btn d-btn-ghost d-btn-sm gap-1 text-error"
												disabled={busyId === item.id}
												onclick={() => void onDeleteForever(item)}
											>
												<LucideTrash2 class="size-3.5" aria-hidden="true" />
												Delete
											</button>
										</div>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
