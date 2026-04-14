<script lang="ts">
	import { highlightSearchParts } from '$lib/tool/highlight-search';

	let { text, query }: { text: string; query: string } = $props();

	const parts = $derived(highlightSearchParts(text, query));
</script>

{#each parts as part, i (i)}
	{#if part.match}
		<mark class="rounded-sm bg-warning/45 [box-decoration-break:clone] px-0.5 text-base-content"
			>{part.text}</mark
		>
	{:else}
		{part.text}
	{/if}
{/each}
