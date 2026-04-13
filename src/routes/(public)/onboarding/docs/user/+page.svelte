<svelte:head>
	<title>User manual · Documentation · ZNL-DRIVE</title>
	<meta name="description" content="How to use ZNL-DRIVE: files, sharing, trash, public links, and settings." />
</svelte:head>

<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime';
	import {
		LucideFolderOpen,
		LucideHardDrive,
		LucideLink2,
		LucideSettings,
		LucideShare2,
		LucideTrash2,
		LucideUpload
	} from '@lucide/svelte';

	const pages = [
		{
			href: '/onboarding/docs/user/getting-started',
			title: 'Getting started',
			desc: 'Sign in, navigate Home, and learn the basics.',
			Icon: LucideFolderOpen
		},
		{
			href: '/onboarding/docs/user/files-and-folders',
			title: 'Files and folders',
			desc: 'Browse, labels, pin, star, and breadcrumbs.',
			Icon: LucideFolderOpen
		},
		{
			href: '/onboarding/docs/user/upload-and-download',
			title: 'Upload and download',
			desc: 'NEW menu, uploads, and downloading files or ZIPs.',
			Icon: LucideUpload
		},
		{
			href: '/onboarding/docs/user/shared',
			title: 'Shared with you',
			desc: 'What appears under Shared and how access works.',
			Icon: LucideShare2
		},
		{
			href: '/onboarding/docs/user/trash',
			title: 'Trash',
			desc: 'Moving items to trash and what it means.',
			Icon: LucideTrash2
		},
		{
			href: '/onboarding/docs/user/public-links',
			title: 'Public links',
			desc: 'Anonymous preview links and optional direct file URLs.',
			Icon: LucideLink2
		},
		{
			href: '/onboarding/docs/user/storage-providers',
			title: 'Storage providers',
			desc: 'Local vs cloud storage targets in the navbar.',
			Icon: LucideHardDrive
		},
		{
			href: '/onboarding/docs/user/settings',
			title: 'Settings',
			desc: 'Theme, font, text size, language, and search.',
			Icon: LucideSettings
		}
	] as const;
</script>

<div class="not-prose mx-auto max-w-4xl">
	<h1 class="text-base-content mb-2 text-3xl font-bold">User manual</h1>
	<p class="text-base-content/70 mb-10 text-lg">
		Learn how to use ZNL-DRIVE day to day: organize files, collaborate, and tune the app to your
		preferences.
	</p>

	<ul class="grid gap-3 sm:grid-cols-2">
		{#each pages as p (p.href)}
			<li>
				<a
					href={localizeHref(p.href)}
					class="d-card bg-base-200/40 border-base-200 hover:border-primary/30 flex h-full flex-row items-start gap-3 rounded-box border p-4 shadow-sm transition-colors"
				>
					<p.Icon class="text-primary mt-0.5 size-8 shrink-0" aria-hidden="true" />
					<div>
						<h2 class="font-semibold">{p.title}</h2>
						<p class="text-base-content/65 mt-1 text-sm">{p.desc}</p>
					</div>
				</a>
			</li>
		{/each}
	</ul>
</div>
