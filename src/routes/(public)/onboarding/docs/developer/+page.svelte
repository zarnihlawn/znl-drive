<svelte:head>
	<title>Developer · Documentation · ZNL-DRIVE</title>
	<meta name="description" content="Authentication, REST API catalog, and errors for ZNL-DRIVE integrations." />
</svelte:head>

<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime';
	import { LucideKeyRound, LucideListTree, LucideTriangleAlert } from '@lucide/svelte';

	const cards = [
		{
			href: '/onboarding/docs/developer/authentication',
			title: 'Authentication',
			desc: 'Cookie sessions, developer API keys (`znldv_…`), and when Bearer vs browser-only applies.',
			Icon: LucideKeyRound
		},
		{
			href: '/onboarding/docs/developer/rest-api',
			title: 'REST API reference',
			desc: 'Method and path catalog for `api/auth`, `api/drive`, `api/developer`, `api/public`, and cron.',
			Icon: LucideListTree
		},
		{
			href: '/onboarding/docs/developer/errors',
			title: 'Errors',
			desc: 'Typical 401, 403, 503 responses across drive and developer routes.',
			Icon: LucideTriangleAlert
		}
	] as const;
</script>

<div class="not-prose mx-auto max-w-4xl">
	<h1 class="text-base-content mb-2 text-3xl font-bold">Developer</h1>
	<p class="text-base-content/70 mb-10 text-lg">
		Integrate with ZNL-DRIVE over HTTP: authenticate like the web app or with a developer API key, then
		call the drive JSON and binary endpoints.
	</p>

	<ul class="grid gap-4 sm:grid-cols-3">
		{#each cards as c (c.href)}
			<li>
				<a
					href={localizeHref(c.href)}
					class="d-card bg-base-200/40 border-base-200 hover:border-secondary/40 flex h-full flex-col rounded-box border p-5 shadow-sm transition-colors"
				>
					<c.Icon class="text-secondary mb-3 size-9" aria-hidden="true" />
					<h2 class="text-lg font-semibold">{c.title}</h2>
					<p class="text-base-content/65 mt-2 text-sm">{c.desc}</p>
				</a>
			</li>
		{/each}
	</ul>
</div>
