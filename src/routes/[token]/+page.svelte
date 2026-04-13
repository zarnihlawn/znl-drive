<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { resolveHref } from '$lib/url/resolve-href';
	import { formatBytes } from '$lib/tool/format-bytes';

	type PublicItem = {
		id: string;
		ownerId: string;
		itemType: string;
		name: string;
		mimeType: string;
		sizeBytes: number;
		updatedAt: string;
		storageProvider: string;
	};

	type Payload = { ok: true; token: string; item: PublicItem };

	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let data = $state<Payload | null>(null);
	let fullPageUrl = $state('');
	let directFileAbsolute = $state('');

	$effect(() => {
		const token = page.params.token;
		if (!token) return;
		let cancelled = false;
		loading = true;
		loadError = null;
		data = null;

		void (async () => {
			try {
				const r = await fetch(resolveHref(`/api/public/share/${token}`));
				if (!r.ok) throw new Error((await r.text()) || r.statusText);
				const payload = (await r.json()) as Payload;
				if (!cancelled) data = payload;
			} catch (e) {
				if (!cancelled) loadError = e instanceof Error ? e.message : 'Not found';
			} finally {
				if (!cancelled) loading = false;
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	const isImage = $derived(Boolean(data?.item.itemType === 'file' && data?.item.mimeType?.startsWith('image/')));
	const rawUrl = $derived(data ? resolveHref(`/api/public/files/${data.token}`) : '');

	$effect(() => {
		if (!browser) {
			fullPageUrl = '';
			directFileAbsolute = '';
			return;
		}
		if (!data) {
			fullPageUrl = '';
			directFileAbsolute = '';
			return;
		}
		fullPageUrl = window.location.href;
		directFileAbsolute = new URL(rawUrl, window.location.origin).href;
	});
</script>

<section class="mx-auto w-full max-w-3xl px-4 py-10">
	<div class="d-card border border-base-content/10 bg-base-100 shadow-sm">
		<div class="d-card-body gap-5">
			<div class="flex flex-col gap-1">
				<h1 class="text-xl font-bold break-words">{data?.item.name ?? 'Shared item'}</h1>
				<p class="text-base-content/70 text-sm">Public link. Download is available below.</p>
				{#if fullPageUrl}
					<div class="space-y-1">
						<div class="text-base-content/60 text-xs">This page (full URL)</div>
						<input
							type="text"
							readonly
							class="d-input d-input-bordered d-input-sm w-full font-mono text-xs"
							value={fullPageUrl}
						/>
					</div>
				{/if}
			</div>

			{#if loading}
				<div class="d-skeleton h-32 w-full"></div>
			{:else if loadError}
				<div class="d-alert d-alert-error">
					<span>{loadError}</span>
				</div>
			{:else if data}
				<div class="grid gap-2 text-sm sm:grid-cols-2">
					<div class="text-base-content/60">Type</div>
					<div class="font-medium">{data.item.itemType}</div>

					<div class="text-base-content/60">MIME</div>
					<div class="font-medium break-words">{data.item.mimeType || 'unknown'}</div>

					<div class="text-base-content/60">Size</div>
					<div class="font-medium">{formatBytes(data.item.sizeBytes)}</div>

					<div class="text-base-content/60">Updated</div>
					<div class="font-medium">{data.item.updatedAt.slice(0, 10)}</div>
				</div>

				{#if isImage}
					<div class="rounded-box border border-base-200 bg-base-200/30 p-3">
						<img
							src={rawUrl}
							alt={data.item.name}
							class="max-h-[70vh] w-full object-contain"
							loading="lazy"
						/>
						<p class="text-base-content/60 mt-2 text-xs break-all">
							Direct file URL:
							<a class="d-link d-link-primary" href={rawUrl} target="_blank" rel="noreferrer"
								>{directFileAbsolute || rawUrl}</a
							>
						</p>
					</div>
				{/if}

				<div class="flex flex-wrap items-center gap-2">
					<a class="d-btn d-btn-primary" href={rawUrl}>Download</a>
					<a class="d-btn d-btn-ghost" href={resolve('/(public)/onboarding')}>Back to ZNL-DRIVE</a>
				</div>
			{/if}
		</div>
	</div>
</section>
