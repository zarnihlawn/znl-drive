<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	onMount(() => {
		goto(resolve(`/auth/signup/verify`));
	});
</script>

<section class="m-auto max-w-xl">
	<div class="d-card border border-base-content/10 bg-base-100 shadow-sm">
		<div class="d-card-body space-y-5">
			<fieldset class="d-fieldset w-xs rounded-box border border-base-300 bg-base-200 p-4">
				<legend class="my-ft-h1 d-fieldset-legend">Redirecting…</legend>
				<div class="flex items-center gap-3">
					<div class="d-loading d-loading-spinner d-loading-md" aria-label="Loading"></div>
					<span>Taking you to OTP verification.</span>
				</div>
			</fieldset>
		</div>
	</div>
</section>
