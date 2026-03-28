<script lang="ts">
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import './layout.css';
	import Favicon from '$lib/asset/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/x-icon" href={Favicon} />
	<title>ZNL-DRIVE</title>
</svelte:head>
{@render children()}

<div style="display:none">
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })}>{locale}</a>
	{/each}
</div>
