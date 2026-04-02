<script lang="ts">
	import { base } from '$app/paths';
	import { resolve } from '$app/paths';

	let email = $state('');
	let isSubmitting = $state(false);
	let isSuccess = $state(false);

	async function requestReset(e: SubmitEvent) {
		e.preventDefault();
		isSuccess = false;
		isSubmitting = true;

		try {
			await fetch(`${base}/api/auth/request-password-reset`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, redirectTo: `${base}/auth/reset-password` })
			});
		} finally {
			isSubmitting = false;
			isSuccess = true;
		}
	}
</script>

<section class="m-auto max-w-xl">
	<div class="d-card border border-base-content/10 bg-base-100 shadow-sm">
		<div class="d-card-body space-y-5">
			<fieldset class="d-fieldset w-xs rounded-box border border-base-300 bg-base-200 p-4">
				<legend class="my-ft-h1 d-fieldset-legend">Forgot password</legend>

				<form class="flex flex-col gap-5" onsubmit={requestReset}>
					{#if isSuccess}
						<div class="d-alert d-alert-success">
							<span>
								If an account exists for that email, we’ve sent a password reset link. Please check your
								inbox.
							</span>
						</div>
					{/if}

					<input
						type="email"
						class="d-input"
						placeholder="Email"
						autocomplete="email"
						bind:value={email}
						required
					/>

					<button class="d-btn d-btn-primary" type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Sending…' : 'Send reset link'}
					</button>

					<a class="d-link d-link-primary text-sm" href={resolve(`/auth/login`)}>Back to login</a>
				</form>
			</fieldset>
		</div>
	</div>
</section>

