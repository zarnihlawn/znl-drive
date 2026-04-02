<script lang="ts">
	import { goto } from '$app/navigation';
	import { base, resolve } from '$app/paths';
	import { togglePasswordVisibility } from '$lib/tool/password.tool';
	import { LucideEye, LucideEyeClosed } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let token = $state<string | null>(null);
	let tokenMissing = $state(false);

	let newPassword = $state('');
	let confirmPassword = $state('');
	let isNewPasswordVisible = $state(false);
	let isConfirmPasswordVisible = $state(false);

	let error = $state<string | null>(null);
	let isSubmitting = $state(false);

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		const t = params.get('token');
		if (!t) {
			tokenMissing = true;
			return;
		}
		token = t;
	});

	async function resetPassword(e: SubmitEvent) {
		e.preventDefault();
		error = null;

		if (!token) {
			error = 'Missing reset token. Please request a new password reset link.';
			return;
		}

		if (newPassword !== confirmPassword) {
			error = 'Passwords do not match.';
			return;
		}

		isSubmitting = true;
		try {
			const res = await fetch(`${base}/api/auth/reset-password`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ newPassword, token })
			});

			if (!res.ok) {
				const message =
					(await res.json().catch(() => null))?.message ??
					(await res.text().catch(() => '')) ??
					'';
				error = message || 'Failed to reset password. Please try again.';
				return;
			}

			await goto(resolve(`/auth/login?reset=1`));
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<section class="m-auto max-w-xl">
	<div class="d-card border border-base-content/10 bg-base-100 shadow-sm">
		<div class="d-card-body space-y-5">
			<fieldset class="d-fieldset w-xs rounded-box border border-base-300 bg-base-200 p-4">
				<legend class="my-ft-h1 d-fieldset-legend">Reset password</legend>

				{#if tokenMissing}
					<div class="d-alert d-alert-error">
						<span>Missing reset token.</span>
					</div>
					<a class="d-link d-link-primary text-sm" href={resolve(`/auth/forget-password`)}
						>Request a new link</a
					>
				{:else}
					<form class="flex flex-col gap-5" onsubmit={resetPassword}>
						{#if error}
							<div class="d-alert d-alert-error">
								<span>{error}</span>
							</div>
						{/if}

						<div class="d-join">
							<input
								type={isNewPasswordVisible ? 'text' : 'password'}
								class="d-input d-join-item"
								placeholder="New password"
								autocomplete="new-password"
								bind:value={newPassword}
								required
							/>
							<button
								type="button"
								class="d-btn d-join-item d-btn-primary"
								onclick={() =>
									(isNewPasswordVisible = togglePasswordVisibility(isNewPasswordVisible))}
								aria-label={isNewPasswordVisible ? 'Hide password' : 'Show password'}
							>
								{#if isNewPasswordVisible}
									<LucideEye class="size-6" />
								{:else}
									<LucideEyeClosed class="size-6" />
								{/if}
							</button>
						</div>

						<div class="d-join">
							<input
								type={isConfirmPasswordVisible ? 'text' : 'password'}
								class="d-input d-join-item"
								placeholder="Confirm new password"
								autocomplete="new-password"
								bind:value={confirmPassword}
								required
							/>
							<button
								type="button"
								class="d-btn d-join-item d-btn-primary"
								onclick={() =>
									(isConfirmPasswordVisible = togglePasswordVisibility(isConfirmPasswordVisible))}
								aria-label={isConfirmPasswordVisible ? 'Hide password' : 'Show password'}
							>
								{#if isConfirmPasswordVisible}
									<LucideEye class="size-6" />
								{:else}
									<LucideEyeClosed class="size-6" />
								{/if}
							</button>
						</div>

						<button class="d-btn d-btn-primary" type="submit" disabled={isSubmitting}>
							{isSubmitting ? 'Resetting…' : 'Reset password'}
						</button>

						<a class="d-link d-link-primary text-sm" href={resolve(`/auth/login`)}>Back to login</a>
					</form>
				{/if}
			</fieldset>
		</div>
	</div>
</section>

