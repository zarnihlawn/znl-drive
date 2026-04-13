<svelte:head>
	<title>Documentation · ZNL-DRIVE</title>
	<meta
		name="description"
		content="User manual, developer API reference, and contributor guide for ZNL-DRIVE."
	/>
</svelte:head>

<script lang="ts">
	import { localizeHref } from '$lib/paraglide/runtime';
	import {
		LucideBookOpen,
		LucideCode2,
		LucideFolderOpen,
		LucideGitBranch,
		LucideRocket
	} from '@lucide/svelte';
</script>

<div class="not-prose mx-auto max-w-4xl">
	<div class="mb-10">
		<h1 class="text-base-content mb-3 text-3xl font-bold tracking-tight">Documentation</h1>
		<p class="text-base-content/70 text-lg leading-relaxed">
			Everything you need to use ZNL-DRIVE effectively, integrate with the HTTP API, or contribute to
			the codebase.
		</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		<a
			href={localizeHref('/onboarding/docs/user')}
			class="d-card bg-base-200/50 border-base-200 hover:border-primary/40 rounded-box border shadow-sm transition-colors"
		>
			<div class="d-card-body">
				<LucideFolderOpen class="text-primary mb-2 size-10" aria-hidden="true" />
				<h2 class="d-card-title text-lg">User manual</h2>
				<p class="text-base-content/70 text-sm">
					Home, files, sharing, trash, public links, storage targets, and settings.
				</p>
			</div>
		</a>

		<a
			href={localizeHref('/onboarding/docs/developer')}
			class="d-card bg-base-200/50 border-base-200 hover:border-primary/40 rounded-box border shadow-sm transition-colors"
		>
			<div class="d-card-body">
				<LucideCode2 class="text-secondary mb-2 size-10" aria-hidden="true" />
				<h2 class="d-card-title text-lg">Developer</h2>
				<p class="text-base-content/70 text-sm">
					Authentication, REST endpoints, API keys, and error behavior.
				</p>
			</div>
		</a>

		<a
			href={localizeHref('/onboarding/docs/contribute')}
			class="d-card bg-base-200/50 border-base-200 hover:border-primary/40 rounded-box border shadow-sm transition-colors"
		>
			<div class="d-card-body">
				<LucideGitBranch class="text-accent mb-2 size-10" aria-hidden="true" />
				<h2 class="d-card-title text-lg">Contribute</h2>
				<p class="text-base-content/70 text-sm">
					Stack, repo layout, environment, workflows, and architecture.
				</p>
			</div>
		</a>
	</div>

	<div class="mt-12 rounded-box border border-base-200 bg-base-200/30 p-6">
		<h2 class="mb-3 flex items-center gap-2 text-lg font-semibold">
			<LucideRocket class="size-5" aria-hidden="true" />
			Quick start
		</h2>
		<ol class="text-base-content/80 list-inside list-decimal space-y-2 text-sm">
			<li>
				Open the <a class="d-link d-link-primary" href={localizeHref('/onboarding')}>product page</a>
				and sign in.
			</li>
			<li>Use <strong>Home</strong> for your files; switch <strong>Storage</strong> in the navbar when needed.</li>
			<li>
				Read <a class="d-link d-link-primary" href={localizeHref('/onboarding/docs/user/getting-started')}>Getting started</a> for
				the full tour.
			</li>
		</ol>
	</div>

	<p class="text-base-content/50 mt-8 flex items-center gap-2 text-xs">
		<LucideBookOpen class="size-3.5 shrink-0" aria-hidden="true" />
		Use the sidebar to jump between sections. On small screens, open the menu from the top bar.
	</p>
</div>
