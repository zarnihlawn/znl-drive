<script lang="ts">
	import { browser } from '$app/environment';
	import { base } from '$app/paths';
	import { patchDriveFile, type PatchDriveFileBody } from '$lib/client/drive-file';
	import { uploadFilesWithProgress } from '$lib/client/upload-drive';
	import {
		FILE_LABEL_COLORS,
		fileLabelBadgeClass,
		fileLabelBorderClass,
		type FileLabelColorId
	} from '$lib/model/file-label-color';
	import type { StorageProviderId } from '$lib/model/storage-provider';
	import { storageProviderLabel } from '$lib/model/storage-provider';
	import { StatusColorEnum } from '$lib/model/enum/color.enum';
	import { bumpDriveListRefresh, driveListRefresh } from '$lib/state/drive-refresh.svelte';
	import { driveStorage } from '$lib/state/storage-provider.svelte';
	import { toastService } from '$lib/service/toast.service.svelte';
	import { formatBytes } from '$lib/tool/format-bytes';
	import {
		LucideEllipsisVertical,
		LucideFile,
		LucidePin,
		LucideStar,
		LucideTrash2
	} from '@lucide/svelte';
	import { onMount, tick } from 'svelte';

	type ApiFile = {
		id: string;
		name: string;
		itemType: string;
		sizeBytes: number;
		updatedAt: string;
		storageProvider: StorageProviderId;
		isPinned: boolean;
		isStarred: boolean;
		color: string;
		parentId: number | null;
	};

	type DriveItem = {
		id: string;
		name: string;
		itemType: 'file' | 'folder';
		sizeBytes: number | null;
		updatedAt: string;
		storageProvider: StorageProviderId;
		pinned: boolean;
		starred: boolean;
		color: FileLabelColorId | string;
		parentId: string | null;
	};

	let rows = $state<DriveItem[]>([]);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let fileDragDepth = $state(0);
	let dropUploading = $state(false);
	let dropProgress = $state(0);
	let busyId = $state<string | null>(null);

	let renameDialogEl = $state<HTMLDialogElement | null>(null);
	let renameTarget = $state<DriveItem | null>(null);
	let draftName = $state('');

	let colorDialogEl = $state<HTMLDialogElement | null>(null);
	let colorTarget = $state<DriveItem | null>(null);

	/** One floating menu (no Popover API — avoids ghost menus at 0,0 and stuck open state). */
	let openFileActionsId = $state<string | null>(null);
	let fileActionsMenuPosition = $state<{ top: number; left: number } | null>(null);

	function closeFileActionsMenu() {
		openFileActionsId = null;
		fileActionsMenuPosition = null;
	}

	function computeMenuPlacement(btn: HTMLElement, menuWidth: number, menuHeight: number) {
		const rect = btn.getBoundingClientRect();
		const gap = 6;
		let left = rect.right - menuWidth;
		left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
		const spaceBelow = window.innerHeight - rect.bottom - gap;
		const spaceAbove = rect.top - gap;
		let top: number;
		if (menuHeight <= spaceBelow || spaceBelow >= spaceAbove) {
			top = rect.bottom + gap;
		} else {
			top = rect.top - menuHeight - gap;
		}
		top = Math.max(8, Math.min(top, window.innerHeight - menuHeight - 8));
		return { top, left };
	}

	async function toggleFileActionsMenu(itemId: string, btn: HTMLButtonElement) {
		if (busyId === itemId) return;
		if (openFileActionsId === itemId) {
			closeFileActionsMenu();
			return;
		}
		openFileActionsId = itemId;
		fileActionsMenuPosition = computeMenuPlacement(btn, 208, 140);
		await tick();
		const menuEl = document.getElementById('file-actions-menu-float');
		if (menuEl) {
			fileActionsMenuPosition = computeMenuPlacement(btn, menuEl.offsetWidth, menuEl.offsetHeight);
		}
	}

	function onDocumentEscape(e: KeyboardEvent) {
		if (e.key !== 'Escape') return;
		closeFileActionsMenu();
	}

	function onDocumentPointerDownCloseMenu(e: PointerEvent) {
		const menu = document.getElementById('file-actions-menu-float');
		if (!menu) return;
		const t = e.target;
		if (!t || !(t instanceof Node)) return;
		if (menu.contains(t)) return;
		const openFor = menu.getAttribute('data-open-for');
		if (!openFor) return;
		const trigger = document.getElementById(`file-actions-btn-${openFor}`);
		if (trigger?.contains(t)) return;
		closeFileActionsMenu();
	}

	onMount(() => {
		const onResize = () => closeFileActionsMenu();
		window.addEventListener('resize', onResize);
		document.addEventListener('keydown', onDocumentEscape, true);
		document.addEventListener('pointerdown', onDocumentPointerDownCloseMenu, true);
		return () => {
			window.removeEventListener('resize', onResize);
			document.removeEventListener('keydown', onDocumentEscape, true);
			document.removeEventListener('pointerdown', onDocumentPointerDownCloseMenu, true);
		};
	});

	function mapRow(f: ApiFile): DriveItem {
		return {
			id: f.id,
			name: f.name,
			itemType: f.itemType === 'folder' ? 'folder' : 'file',
			sizeBytes: f.sizeBytes,
			updatedAt: f.updatedAt.slice(0, 10),
			storageProvider: f.storageProvider,
			pinned: f.isPinned,
			starred: f.isStarred,
			color: f.color as FileLabelColorId,
			parentId: f.parentId != null ? String(f.parentId) : null
		};
	}

	async function loadFiles() {
		loading = true;
		loadError = null;
		try {
			const r = await fetch(
				`${base}/api/drive/files?storageProvider=${encodeURIComponent(driveStorage.current)}`,
				{ credentials: 'include' }
			);
			if (!r.ok) {
				const t = await r.text();
				throw new Error(t || r.statusText);
			}
			const data = (await r.json()) as { files: ApiFile[] };
			rows = data.files.map(mapRow);
		} catch (e) {
			loadError = e instanceof Error ? e.message : 'Failed to load files';
			rows = [];
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (!browser) return;
		void driveListRefresh.tick;
		void driveStorage.current;
		void loadFiles();
	});

	const rootRows = $derived(rows.slice().sort((a, b) => a.name.localeCompare(b.name)));

	const pinnedRows = $derived(rootRows.filter((r) => r.pinned));
	const starredRows = $derived(rootRows.filter((r) => r.starred && !r.pinned));
	const otherRows = $derived(rootRows.filter((r) => !r.pinned && !r.starred));

	const fileActionsMenuItem = $derived(
		openFileActionsId ? (rows.find((r) => r.id === openFileActionsId) ?? null) : null
	);

	function colorLabel(c: string): string {
		return c.charAt(0).toUpperCase() + c.slice(1);
	}

	async function runPatch(id: string, body: PatchDriveFileBody, successMsg?: string) {
		busyId = id;
		try {
			await patchDriveFile(id, body);
			bumpDriveListRefresh();
			if (successMsg) toastService.addToast(successMsg, StatusColorEnum.SUCCESS);
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Update failed';
			toastService.addToast(msg, StatusColorEnum.ERROR);
		} finally {
			busyId = null;
		}
	}

	function openRename(item: DriveItem) {
		closeFileActionsMenu();
		renameTarget = item;
		draftName = item.name;
		queueMicrotask(() => renameDialogEl?.showModal());
	}

	function closeRename() {
		renameDialogEl?.close();
		renameTarget = null;
		draftName = '';
	}

	async function submitRename() {
		if (!renameTarget) return;
		const name = draftName.trim();
		if (!name) {
			toastService.addToast('Name cannot be empty', StatusColorEnum.WARNING);
			return;
		}
		await runPatch(renameTarget.id, { name }, 'Renamed');
		closeRename();
	}

	async function onTrash(item: DriveItem) {
		closeFileActionsMenu();
		if (!confirm(`Move “${item.name}” to trash?`)) return;
		await runPatch(item.id, { trashed: true }, 'Moved to trash');
	}

	function openColorModal(item: DriveItem) {
		closeFileActionsMenu();
		colorTarget = item;
		queueMicrotask(() => colorDialogEl?.showModal());
	}

	async function pickColor(c: FileLabelColorId) {
		if (!colorTarget) return;
		await runPatch(colorTarget.id, { color: c }, 'Label updated');
		colorDialogEl?.close();
	}

	async function uploadDroppedFiles(fileList: File[]) {
		if (!fileList.length) return;
		dropUploading = true;
		dropProgress = 0;
		try {
			await uploadFilesWithProgress(fileList, driveStorage.current, (loaded, total) => {
				dropProgress = total ? Math.round((100 * loaded) / total) : 0;
			});
			bumpDriveListRefresh();
			toastService.addToast(`Uploaded ${fileList.length} file(s)`, StatusColorEnum.SUCCESS);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Upload failed';
			toastService.addToast(msg, StatusColorEnum.ERROR);
		} finally {
			dropUploading = false;
			dropProgress = 0;
			fileDragDepth = 0;
		}
	}

	function onDropCard(e: DragEvent) {
		e.preventDefault();
		const dt = e.dataTransfer;
		if (!dt?.files?.length) return;
		void uploadDroppedFiles(Array.from(dt.files));
	}

	function onCardDragEnter(e: DragEvent) {
		if (e.dataTransfer?.types.includes('Files')) {
			e.preventDefault();
			fileDragDepth += 1;
		}
	}

	function onCardDragLeave(e: DragEvent) {
		if (e.dataTransfer?.types.includes('Files')) {
			fileDragDepth = Math.max(0, fileDragDepth - 1);
		}
	}
</script>

<div class="flex min-h-0 flex-1 flex-col gap-6 pb-8">
	<p class="text-base-content/70 shrink-0 text-sm">
		List is filtered by the storage provider in the header. Drag files from your computer onto the table to
		upload with progress (same pipeline as <strong>NEW</strong>). Local storage writes under
		<code class="text-xs">~/Documents/znl-drive/&lt;your-user-id&gt;/</code> (multipart handled on the server via
		FormData; Express multer is not used in SvelteKit handlers).
	</p>

	{#if loading && rows.length === 0}
		<div class="d-skeleton h-40 w-full"></div>
	{:else if loadError}
		<div class="d-alert d-alert-error">
			<span>{loadError}</span>
		</div>
	{/if}

	{#if dropUploading}
		<div class="d-alert d-alert-info">
			<span>Uploading… {dropProgress}%</span>
			<progress class="d-progress d-progress-info mt-2 w-full" value={dropProgress} max="100"></progress>
		</div>
	{/if}

	<div
		class="d-card border-base-300 bg-base-100 flex min-h-0 flex-1 flex-col border shadow-sm transition-colors {fileDragDepth > 0
			? 'border-info/50 bg-info/5'
			: ''}"
		role="region"
		aria-label="Files"
		ondragenter={onCardDragEnter}
		ondragleave={onCardDragLeave}
		ondragover={(e) => {
			if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
		}}
		ondrop={onDropCard}
	>
		<div class="d-card-body flex min-h-0 flex-1 flex-col p-0">
			<div class="min-h-0 flex-1 overflow-auto" onscroll={closeFileActionsMenu}>
				<table class="d-table-zebra d-table w-full min-w-[52rem]">
					<thead>
						<tr class="border-base-300 border-b">
							<th class="min-w-[14rem]">Name</th>
							<th class="w-28">Size</th>
							<th class="w-36">Modified</th>
							<th class="w-32">Storage</th>
							<th class="w-24 text-center">Pin</th>
							<th class="w-24 text-center">Star</th>
							<th class="w-28">Label</th>
							<th class="w-14 text-center"></th>
						</tr>
					</thead>
					<tbody>
						{#if pinnedRows.length > 0}
							<tr class="bg-base-200/60 hover:bg-base-200/60">
								<td colspan="8" class="text-base-content/80 py-2 text-xs font-semibold tracking-wide uppercase">
									<span class="inline-flex items-center gap-2">
										<LucidePin class="size-3.5" aria-hidden="true" />
										Pinned
									</span>
								</td>
							</tr>
							{#each pinnedRows as item (item.id)}
								<tr
									class="hover:bg-info/50 border-l-4 transition-colors {fileLabelBorderClass(item.color)}"
								>
									{@render fileRowCells(item)}
								</tr>
							{/each}
						{/if}

						{#if starredRows.length > 0}
							<tr class="bg-base-200/60 hover:bg-base-200/60">
								<td colspan="8" class="text-base-content/80 py-2 text-xs font-semibold tracking-wide uppercase">
									<span class="inline-flex items-center gap-2">
										<LucideStar class="size-3.5" aria-hidden="true" />
										Starred
									</span>
								</td>
							</tr>
							{#each starredRows as item (item.id)}
								<tr
									class="hover:bg-info/50 border-l-4 transition-colors {fileLabelBorderClass(item.color)}"
								>
									{@render fileRowCells(item)}
								</tr>
							{/each}
						{/if}

						<tr class="bg-base-200/60 hover:bg-base-200/60">
							<td colspan="8" class="text-base-content/80 py-2 text-xs font-semibold tracking-wide uppercase">
								All files
							</td>
						</tr>
						{#if rootRows.length === 0 && !loading}
							<tr>
								<td colspan="8" class="text-base-content/60 py-8 text-center">
									No files for {storageProviderLabel(driveStorage.current)} yet. Use <strong>NEW</strong> or
									drag files here.
								</td>
							</tr>
						{:else}
							{#each otherRows as item (item.id)}
								<tr
									class="hover:bg-info/50 border-l-4 transition-colors {fileLabelBorderClass(item.color)}"
								>
									{@render fileRowCells(item)}
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>

{#if openFileActionsId && fileActionsMenuPosition && fileActionsMenuItem}
	<ul
		id="file-actions-menu-float"
		data-open-for={fileActionsMenuItem.id}
		role="menu"
		class="d-menu bg-base-100 fixed z-[999] m-0 w-52 rounded-box border border-base-200 p-2 shadow-md"
		style="top: {fileActionsMenuPosition.top}px; left: {fileActionsMenuPosition.left}px;"
	>
		<li role="none">
			<button type="button" role="menuitem" onclick={() => openRename(fileActionsMenuItem)}>Rename…</button>
		</li>
		<li role="none">
			<button type="button" role="menuitem" onclick={() => openColorModal(fileActionsMenuItem)}
			>Label color…</button>
		</li>
		<li role="none">
			<button
				type="button"
				role="menuitem"
				class="text-error"
				onclick={() => void onTrash(fileActionsMenuItem)}
			>
				<span class="inline-flex items-center gap-2">
					<LucideTrash2 class="size-4 shrink-0" aria-hidden="true" />
					Move to trash
				</span>
			</button>
		</li>
	</ul>
{/if}

<dialog bind:this={renameDialogEl} class="d-modal" onclose={closeRename}>
	<div class="d-modal-box max-w-lg">
		<h3 class="d-font-title text-lg font-bold">Rename</h3>
		<label class="d-form-control mt-3 w-full">
			<span class="d-label-text">File name</span>
			<input
				type="text"
				class="d-input d-input-bordered w-full"
				bind:value={draftName}
				disabled={busyId !== null}
				onkeydown={(e) => e.key === 'Enter' && void submitRename()}
			/>
		</label>
		<div class="d-modal-action">
			<form method="dialog">
				<button type="submit" class="d-btn" disabled={busyId !== null}>Cancel</button>
			</form>
			<button
				type="button"
				class="d-btn d-btn-primary"
				disabled={busyId !== null}
				onclick={() => void submitRename()}
			>
				Save
			</button>
		</div>
	</div>
</dialog>

<dialog bind:this={colorDialogEl} class="d-modal" onclose={() => (colorTarget = null)}>
	<div class="d-modal-box max-w-md">
		<h3 class="d-font-title text-lg font-bold">Label color</h3>
		{#if colorTarget}
			<p class="text-base-content/70 py-2 text-sm">{colorTarget.name}</p>
		{/if}
		<div class="mt-3 flex flex-wrap gap-2">
			{#each FILE_LABEL_COLORS as c (c)}
				<button
					type="button"
					class="{fileLabelBadgeClass(c)} cursor-pointer"
					disabled={busyId !== null || !colorTarget}
					onclick={() => void pickColor(c)}
				>
					{colorLabel(c)}
				</button>
			{/each}
		</div>
		<div class="d-modal-action">
			<form method="dialog">
				<button type="submit" class="d-btn" disabled={busyId !== null}>Close</button>
			</form>
		</div>
	</div>
</dialog>

{#snippet fileRowCells(item: DriveItem)}
	<td>
		<span class="inline-flex items-center gap-2">
			<LucideFile class="text-base-content/60 size-5 shrink-0" aria-hidden="true" />
			<span class="font-medium">{item.name}</span>
		</span>
	</td>
	<td class="text-base-content/80 tabular-nums">{formatBytes(item.sizeBytes)}</td>
	<td class="text-base-content/80">{item.updatedAt}</td>
	<td class="text-sm">{storageProviderLabel(item.storageProvider)}</td>
	<td class="text-center">
		<button
			type="button"
			class="d-btn d-btn-ghost d-btn-sm d-btn-square"
			aria-pressed={item.pinned}
			aria-label={item.pinned ? 'Unpin' : 'Pin'}
			disabled={busyId === item.id}
			onclick={() => void runPatch(item.id, { isPinned: !item.pinned })}
		>
			<LucidePin class="size-4 {item.pinned ? 'text-primary' : 'text-base-content/30'}" />
		</button>
	</td>
	<td class="text-center">
		<button
			type="button"
			class="d-btn d-btn-ghost d-btn-sm d-btn-square"
			aria-pressed={item.starred}
			aria-label={item.starred ? 'Unstar' : 'Star'}
			disabled={busyId === item.id}
			onclick={() => void runPatch(item.id, { isStarred: !item.starred })}
		>
			<LucideStar
				class="size-4 {item.starred ? 'text-warning fill-warning' : 'text-base-content/30'}"
			/>
		</button>
	</td>
	<td>
		<span class={fileLabelBadgeClass(item.color)}>{colorLabel(item.color)}</span>
	</td>
	<td class="text-center">
		<button
			type="button"
			id={`file-actions-btn-${item.id}`}
			class="d-btn d-btn-ghost d-btn-sm d-btn-square m-1"
			aria-label="File actions"
			aria-haspopup="menu"
			aria-expanded={openFileActionsId === item.id}
			disabled={busyId === item.id}
			onclick={(e) => void toggleFileActionsMenu(item.id, e.currentTarget as HTMLButtonElement)}
		>
			<LucideEllipsisVertical class="size-4" />
		</button>
	</td>
{/snippet}
