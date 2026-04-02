<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>Auth | ZNL-DRIVE</title>
</svelte:head>

<div class="my-app my-dotted-background-teal">
	<div class="my-main">
		{@render children?.()}
	</div>
</div>
