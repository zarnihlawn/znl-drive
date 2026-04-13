<script lang="ts">
	import { highlightSearchParts } from '$lib/tool/highlight-search';

	let { text, query }: { text: string; query: string } = $props();

	const parts = $derived(highlightSearchParts(text, query));
</script>

{#each parts as part, i (i)}
	{#if part.match}
		<mark class="bg-warning/45 text-base-content rounded-sm px-0.5 [box-decoration-break:clone]"
			>{part.text}</mark>
	{:else}
		{part.text}
	{/if}
{/each}
