<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	let { status = 500, error } = $props<{
		status?: number;
		error: Error & { message?: string };
	}>();

	const message = $derived(
		error?.message?.trim() ||
			(status === 404 ? 'This page could not be found.' : 'Something went wrong.')
	);

	function goHome() {
		void goto(resolve('/'), { replaceState: false });
	}

	function goBack() {
		if (browser && window.history.length > 1) {
			window.history.back();
		} else {
			goHome();
		}
	}

	function goLogin() {
		void goto(`${resolve('/auth/login')}?reason=session`, { replaceState: false });
	}
</script>

<div class="bg-base-200 flex min-h-screen flex-col items-center justify-center px-4 py-16">
	<div class="d-card border-base-300 bg-base-100 w-full max-w-lg border shadow-lg">
		<div class="d-card-body gap-6 text-center">
			<div>
				<p class="text-base-content/60 text-sm font-medium tracking-wide uppercase">Error</p>
				<p class="text-primary text-5xl font-bold tabular-nums">{status}</p>
				<h1 class="mt-2 text-xl font-semibold">{message}</h1>
				{#if page.url?.pathname}
					<p class="text-base-content/50 mt-2 break-all text-xs">{page.url.pathname}</p>
				{/if}
			</div>

			{#if status === 401}
				<p class="text-base-content/70 text-sm">
					Your session may have expired. Sign in again to continue.
				</p>
			{:else if status === 503}
				<p class="text-base-content/70 text-sm">
					The service or database is temporarily unavailable. Try again in a moment.
				</p>
			{/if}

			<div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
				<button type="button" class="d-btn d-btn-primary" onclick={goHome}> Home </button>
				<button type="button" class="d-btn d-btn-outline" onclick={goBack}> Back </button>
				{#if status === 401 || status === 403}
					<button type="button" class="d-btn d-btn-secondary" onclick={goLogin}> Sign in </button>
				{/if}
			</div>
		</div>
	</div>
</div>
