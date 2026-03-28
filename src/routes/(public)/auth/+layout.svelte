<script lang="ts">
	let { children } = $props();
</script>

<svelte:head>
	<title>Auth | ZNL-DRIVE</title>
</svelte:head>

<div class="my-web my-dotted-background-teal">
	<div class="my-app">
		{@render children?.()}
	</div>
</div>
