<script lang="ts">
	import { resolve } from '$app/paths';
	import { fetchWithSession } from '$lib/client/fetch-session';
	import { pathWithoutBase } from '$lib/url/path-without-base';
	import { resolveHref } from '$lib/url/resolve-href';
	import { page } from '$app/state';
	import { daisyDropdown } from '$lib/actions/daisy-dropdown';
	import { uploadFilesWithProgress } from '$lib/client/upload-drive';
	import { StatusColorEnum } from '$lib/model/enum/color.enum';
	import { STORAGE_PROVIDERS, type StorageProviderId, storageProviderLabel } from '$lib/model/storage-provider';
	import { bumpDriveListRefresh } from '$lib/state/drive-refresh.svelte';
	import {
		driveStorage,
		hydrateStorageProviderFromStorage,
		setCurrentStorageProvider
	} from '$lib/state/storage-provider.svelte';
	import { toastService } from '$lib/service/toast.service.svelte';
	import { getUserInitials } from '$lib/tool/user-initials';
	import {
		LucideArrowLeft,
		LucideClock,
		LucideFolderPlus,
		LucideHouse,
		LucideLayoutDashboard,
		LucidePlus,
		LucideShare,
		LucideTrash,
		LucideUpload
	} from '@lucide/svelte';
	import { onMount } from 'svelte';

	let { data, children } = $props();

	const initials = $derived(getUserInitials(data.user));

	let uploadDialog = $state<HTMLDialogElement | null>(null);
	let newFolderDialog = $state<HTMLDialogElement | null>(null);
	let fileInputEl = $state<HTMLInputElement | null>(null);
	let pickerFiles = $state<File[]>([]);
	let uploadProgress = $state(0);
	let uploading = $state(false);
	let newFolderName = $state('');
	let creatingFolder = $state(false);

	onMount(() => {
		hydrateStorageProviderFromStorage();
	});

	function onStorageProviderSelect(e: Event) {
		const v = (e.currentTarget as HTMLSelectElement).value as StorageProviderId;
		setCurrentStorageProvider(v);
		toastService.addToast(`Storage target: ${storageProviderLabel(v)}`, StatusColorEnum.INFO);
	}

	function openUploadDialog() {
		pickerFiles = [];
		uploadProgress = 0;
		if (fileInputEl) fileInputEl.value = '';
		uploadDialog?.showModal();
	}

	function openUploadDialogFromMenu() {
		openUploadDialog();
	}

	function openNewFolderDialog() {
		newFolderName = '';
		queueMicrotask(() => newFolderDialog?.showModal());
	}

	async function submitNewFolder() {
		const name = newFolderName.trim();
		if (!name) {
			toastService.addToast('Enter a folder name', StatusColorEnum.WARNING);
			return;
		}
		creatingFolder = true;
		try {
			const r = await fetchWithSession(resolve('/api/drive/folders'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name,
					storageProvider: driveStorage.current,
					...(data.currentFolder ? { parentId: data.currentFolder.id } : {})
				})
			});
			if (!r.ok) throw new Error(await r.text());
			bumpDriveListRefresh();
			toastService.addToast('Folder created', StatusColorEnum.SUCCESS);
			newFolderDialog?.close();
			newFolderName = '';
		} catch (e) {
			toastService.addToast(
				e instanceof Error ? e.message : 'Failed to create folder',
				StatusColorEnum.ERROR
			);
		} finally {
			creatingFolder = false;
		}
	}

	function onPickFiles(e: Event) {
		const l = (e.currentTarget as HTMLInputElement).files;
		pickerFiles = l && l.length ? Array.from(l) : [];
	}

	async function runUpload() {
		if (!pickerFiles.length) return;
		uploading = true;
		uploadProgress = 0;
		try {
			await uploadFilesWithProgress(
				pickerFiles,
				driveStorage.current,
				(loaded, total) => {
					uploadProgress = total ? Math.round((100 * loaded) / total) : 0;
				},
				data.currentFolder?.id ?? null
			);
			bumpDriveListRefresh();
			toastService.addToast('Upload complete', StatusColorEnum.SUCCESS);
			uploadDialog?.close();
			pickerFiles = [];
			if (fileInputEl) fileInputEl.value = '';
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Upload failed';
			toastService.addToast(msg, StatusColorEnum.ERROR);
		} finally {
			uploading = false;
			uploadProgress = 0;
		}
	}

	type BreadcrumbItem = { href: string | null; label: string; isLast: boolean };

	function formatBreadcrumbLabel(segment: string): string {
		try {
			const decoded = decodeURIComponent(segment);
			return decoded.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
		} catch {
			return segment;
		}
	}

	const breadcrumbs = $derived.by((): BreadcrumbItem[] => {
		if (data.trashView) {
			return [
				{ href: resolve('/home'), label: 'Home', isLast: false },
				{ href: null, label: 'Trash', isLast: true }
			];
		}
		if (data.sharedView) {
			if (data.currentFolder) {
				return [
					{ href: resolve('/home'), label: 'Home', isLast: false },
					{ href: resolve('/home/shared'), label: 'Shared', isLast: false },
					{ href: null, label: data.currentFolder.name, isLast: true }
				];
			}
			return [
				{ href: resolve('/home'), label: 'Home', isLast: false },
				{ href: null, label: 'Shared', isLast: true }
			];
		}
		if (data.currentFolder) {
			return [
				{ href: resolve('/home'), label: 'Home', isLast: false },
				{ href: null, label: data.currentFolder.name, isLast: true }
			];
		}

		const segments = pathWithoutBase(page.url.pathname).split('/').filter(Boolean);
		if (segments.length === 0 || (segments.length === 1 && segments[0] === 'home')) {
			return [{ href: null, label: 'Home', isLast: true }];
		}

		if (segments[0] === 'home' && segments.length >= 2) {
			const crumbs: BreadcrumbItem[] = [
				{ href: resolve('/home'), label: 'Home', isLast: false }
			];
			for (let i = 1; i < segments.length; i++) {
				const isLast = i === segments.length - 1;
				const pathToHere = '/' + segments.slice(0, i + 1).join('/');
				crumbs.push({
					href: isLast ? null : resolveHref(pathToHere),
					label: formatBreadcrumbLabel(segments[i]),
					isLast
				});
			}
			return crumbs;
		}

		return segments.map((segment, i) => ({
			href:
				i === segments.length - 1 ? null : resolveHref('/' + segments.slice(0, i + 1).join('/')),
			label: formatBreadcrumbLabel(segment),
			isLast: i === segments.length - 1
		}));
	});

	const upFolderHref = $derived.by(() => {
		if (!data.currentFolder) {
			if (data.trashView) return resolve('/home/trash');
			return data.sharedView ? resolve('/home/shared') : resolve('/home');
		}
		return data.currentFolder.upHref;
	});

	/** Heading: current folder name or last URL segment. */
	const pageTitle = $derived.by(() => {
		if (data.trashView) return 'Trash';
		if (data.sharedView) return data.currentFolder?.name ?? 'Shared';
		if (data.currentFolder) return data.currentFolder.name;
		const segments = pathWithoutBase(page.url.pathname).split('/').filter(Boolean);
		const last = segments.at(-1);
		if (!last) return 'Home';
		return formatBreadcrumbLabel(last);
	});

	const newActionsDisabled = $derived(Boolean(data.sharedView || data.trashView));
	const newActionsTooltip = $derived(
		data.trashView
			? 'New folders and uploads are only available in Home, not in Trash.'
			: data.sharedView
				? 'New folders and uploads are only available in Home, not in Shared.'
				: ''
	);
</script>

<div class="my-app flex min-h-screen flex-col">
	<div class="d-navbar bg-base-100 shadow-sm">
		<div class="d-navbar-start">
			<a class="d-btn text-xl d-btn-ghost" href={resolve('/home')}>ZNL-DRIVE</a>
		</div>
		<div class="d-navbar-center">
			<input
				type="search"
				placeholder="Search"
				class="d-input-bordered d-input w-full max-w-md"
				autocomplete="off"
			/>
		</div>
		<div class="d-navbar-end gap-3 sm:gap-4">
			<select
				class="d-select-bordered d-select max-w-[12rem] min-w-[10rem]"
				value={driveStorage.current}
				onchange={onStorageProviderSelect}
				aria-label="Storage provider"
			>
				{#each STORAGE_PROVIDERS as provider (provider)}
					<option value={provider}>{storageProviderLabel(provider)}</option>
				{/each}
			</select>
			<div class="d-dropdown d-dropdown-end" use:daisyDropdown>
				<div tabindex="0" role="button" class="d-btn d-avatar d-btn-circle d-btn-ghost m-1">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100"
					>
						<span class="text-lg font-bold select-none">{initials}</span>
					</div>
				</div>
				<ul
					tabindex="-1"
					class="d-dropdown-content d-menu bg-base-100 rounded-box z-1 mt-1 w-52 p-2 shadow-sm"
				>
					<li>
						<a class="justify-between" href={resolve('/home')}>
							Profile
							<span class="d-badge">New</span>
						</a>
					</li>
					<li><a href={resolve('/home')}>Settings</a></li>
					<li>
						<form method="POST" action={resolve(`/api/auth/logout`)}>
							<button type="submit" class="w-full text-left">Logout</button>
						</form>
					</li>
				</ul>
			</div>
		</div>
	</div>
	<main class="my-main flex min-h-0 flex-1 flex-col">
		<div class="flex min-h-0 flex-1 px-5 py-5">
			<!-- Sidebar -->
			<aside class="flex h-full w-64 shrink-0 flex-col">
				<!-- NEW: folder or upload (disabled on Shared / Trash with tooltip) -->
				{#if newActionsDisabled}
					<div class="d-tooltip d-tooltip-bottom w-full" data-tip={newActionsTooltip}>
						<button
							type="button"
							class="d-btn d-btn-wide d-btn-primary m-1 w-full max-w-full cursor-not-allowed opacity-50"
							disabled
						>
							<LucidePlus class="size-4 shrink-0" aria-hidden="true" />
							NEW
						</button>
					</div>
				{:else}
					<div class="d-dropdown d-dropdown-bottom w-full" use:daisyDropdown>
						<div tabindex="0" role="button" class="d-btn d-btn-wide d-btn-primary m-1 w-full max-w-full">
							<LucidePlus class="size-4 shrink-0" aria-hidden="true" />
							NEW
						</div>
						<ul
							tabindex="-1"
							class="d-dropdown-content d-menu bg-base-100 rounded-box z-1 mt-1 w-full min-w-[12rem] max-w-full p-2 shadow-sm"
						>
							<li>
								<button type="button" class="w-full justify-start gap-2" onclick={openNewFolderDialog}>
									<LucideFolderPlus class="size-4 shrink-0" aria-hidden="true" />
									New folder
								</button>
							</li>
							<li>
								<button type="button" class="w-full justify-start gap-2" onclick={openUploadDialogFromMenu}>
									<LucideUpload class="size-4 shrink-0" aria-hidden="true" />
									Upload file
								</button>
							</li>
						</ul>
					</div>
				{/if}

				<dialog bind:this={uploadDialog} class="d-modal">
					<div class="d-modal-box max-w-lg">
						<h3 class="d-font-title text-lg font-bold">Upload files</h3>
						<p class="text-base-content/70 py-2 text-sm">
							Using storage: <strong>{storageProviderLabel(driveStorage.current)}</strong>
							— local files go to <code class="text-xs">~/Documents/znl-drive/</code>; Tigris uses your
							bucket.
						</p>
						<input
							bind:this={fileInputEl}
							type="file"
							multiple
							class="d-file-input d-file-input-bordered w-full max-w-full"
							onchange={onPickFiles}
						/>
						{#if pickerFiles.length > 0}
							<p class="text-base-content/80 py-2 text-sm">{pickerFiles.length} file(s) selected</p>
						{/if}
						{#if uploading}
							<progress class="d-progress d-progress-info mt-3 w-full" value={uploadProgress} max="100"
							></progress>
							<p class="text-base-content/60 mt-1 text-xs">{uploadProgress}%</p>
						{/if}
						<div class="d-modal-action">
							<form method="dialog">
								<button type="submit" class="d-btn" disabled={uploading}>Cancel</button>
							</form>
							<button
								type="button"
								class="d-btn d-btn-primary"
								disabled={!pickerFiles.length || uploading}
								onclick={runUpload}
							>
								{uploading ? 'Uploading…' : 'Upload'}
							</button>
						</div>
					</div>
				</dialog>

				<dialog bind:this={newFolderDialog} class="d-modal">
					<div class="d-modal-box max-w-md">
						<h3 class="d-font-title text-lg font-bold">New folder</h3>
						<p class="text-base-content/70 py-2 text-sm">
							Storage: <strong>{storageProviderLabel(driveStorage.current)}</strong>
						</p>
						<label class="d-form-control w-full">
							<span class="d-label-text">Folder name</span>
							<input
								type="text"
								class="d-input d-input-bordered w-full"
								bind:value={newFolderName}
								disabled={creatingFolder}
								placeholder="My folder"
								onkeydown={(e) => e.key === 'Enter' && void submitNewFolder()}
							/>
						</label>
						<div class="d-modal-action">
							<form method="dialog">
								<button type="submit" class="d-btn" disabled={creatingFolder}>Cancel</button>
							</form>
							<button
								type="button"
								class="d-btn d-btn-primary"
								disabled={creatingFolder || !newFolderName.trim()}
								onclick={() => void submitNewFolder()}
							>
								{creatingFolder ? 'Creating…' : 'Create'}
							</button>
						</div>
					</div>
				</dialog>

				<span class="d-divider"></span>

				<!-- Pages -->
				<div class="flex flex-col gap-2">
					<a
						class="d-btn d-btn-wide d-btn-ghost d-btn-outline d-btn-primary"
						href={resolve('/home')}
					>
						<LucideHouse class="size-4" />
						Home</a
					>
					<a
						class="d-btn d-btn-wide d-btn-ghost d-btn-outline d-btn-secondary"
						href={resolve('/home/shared')}
					>
						<LucideShare class="size-4" />
						Shared</a
					>
					<a
						class="d-btn d-btn-wide d-btn-ghost d-btn-outline d-btn-accent"
						href={resolve('/home/recent')}
					>
						<LucideClock class="size-4" />
						Recent</a
					>
					<a
						class="d-btn d-btn-wide d-btn-ghost d-btn-outline d-btn-error"
						href={resolve('/home/trash')}
					>
						<LucideTrash class="size-4" />
						Trash</a
					>
					<a
						class="d-btn d-btn-wide d-btn-ghost d-btn-outline d-btn-success"
						href={resolve('/home/dashboard')}
					>
						<LucideLayoutDashboard class="size-4" />
						Dashboard</a
					>
				</div>
			</aside>
			<!-- Main Content -->
			<div class="flex min-h-0 min-w-0 flex-1 flex-col px-5">
				<div class="flex shrink-0 justify-between rounded-lg bg-base-100 p-4">
				<div>
					<div class="mb-2 flex flex-wrap items-center gap-2">
						{#if data.currentFolder}
							<a class="d-btn d-btn-ghost d-btn-sm gap-1 shrink-0" href={upFolderHref}>
								<LucideArrowLeft class="size-4" aria-hidden="true" />
								Up
							</a>
						{/if}
						<h1 class="text-2xl font-bold">{pageTitle}</h1>
					</div>
					<nav class="d-breadcrumbs min-w-0 pr-2 italic" aria-label="Breadcrumb">
						<ul>
							{#each breadcrumbs as crumb, i (String(i) + (crumb.href ?? '') + crumb.label)}
								<li>
									{#if crumb.isLast}
										<span aria-current="page">{crumb.label}</span>
									{:else if crumb.href}
										<a href={crumb.href}>{crumb.label}</a>
									{:else}<nav class="d-breadcrumbs min-w-0 pr-2 italic" aria-label="Breadcrumb">
										<ul>
											{#each breadcrumbs as crumb, i (String(i) + (crumb.href ?? '') + crumb.label)}
												<li>
													{#if crumb.isLast}
														<span aria-current="page">{crumb.label}</span>
													{:else if crumb.href}
														<a href={crumb.href}>{crumb.label}</a>
													{:else}
														<span>{crumb.label}</span>
													{/if}
												</li>
											{/each}
										</ul>
									</nav>
										<span>{crumb.label}</span>
									{/if}
								</li>
							{/each}
						</ul>
					</nav>
				</div>
					<div
						class="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-6 gap-y-2 text-sm"
					>
						<span class="font-medium text-sm text-error">{storageProviderLabel(driveStorage.current)}</span>
					</div>
				</div>
				<div class="flex min-h-0 flex-1 flex-col pt-4">
					{@render children?.()}
				</div>
			</div>
		</div>
	</main>
</div>

