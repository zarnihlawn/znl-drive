<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	type SignupDraft = {
		name: string;
		email: string;
		password: string;
	};

	let draft = $state<SignupDraft | null>(null);
	let otp = $state('');
	let error = $state<string | null>(null);
	let isSubmitting = $state(false);
	/** Shown when SMTP is not configured in dev (OTP is not emailed). */
	let devOtpHint = $state<string | null>(null);

	onMount(() => {
		const raw = sessionStorage.getItem('signup:draft');
		if (!raw) {
			goto(resolve(`/auth/signup`));
			return;
		}

		try {
			draft = JSON.parse(raw) as SignupDraft;
		} catch {
			sessionStorage.removeItem('signup:draft');
			goto(resolve(`/auth/signup`));
			return;
		}

		const devOtp = sessionStorage.getItem('signup:devOtp');
		if (devOtp) {
			devOtpHint = devOtp;
		}
	});

	function normalizedOtp(value: string) {
		return value.replace(/\D/g, '').slice(0, 6);
	}

	async function verifyAndCreateAccount(e: SubmitEvent) {
		e.preventDefault();
		error = null;
		if (!draft) return;

		const cleanedOtp = normalizedOtp(otp);
		if (cleanedOtp.length !== 6) {
			error = 'Please enter the 6-digit OTP.';
			return;
		}

		isSubmitting = true;
		try {
			// Mark OTP verified on server first (required before account creation).
			const verifyRes = await fetch(resolve(`/api/auth/signup/verify-otp`), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email: draft.email, otp: cleanedOtp })
			});
			if (!verifyRes.ok) {
				const text = await verifyRes.text().catch(() => '');
				const parsed = (() => {
					try {
						return JSON.parse(text) as { message?: string };
					} catch {
						return null;
					}
				})();
				error = (parsed?.message ?? text) || 'Invalid OTP. Please try again.';
				return;
			}

			const res = await fetch(resolve(`/api/auth/signup`), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					name: draft.name,
					email: draft.email,
					password: draft.password,
					otp: cleanedOtp
				})
			});

			if (!res.ok) {
				const text = await res.text().catch(() => '');
				const parsed = (() => {
					try {
						return JSON.parse(text) as { message?: string };
					} catch {
						return null;
					}
				})();
				error = (parsed?.message ?? text) || 'Signup failed. Please try again.';
				return;
			}

			sessionStorage.removeItem('signup:draft');
			sessionStorage.removeItem('signup:devOtp');
			await goto(resolve(`/home`));
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
				<legend class="my-ft-h1 d-fieldset-legend">Confirm OTP</legend>

				{#if error}
					<div class="d-alert d-alert-error">
						<span>{error}</span>
					</div>
				{/if}

				{#if devOtpHint}
					<div class="d-alert d-alert-info">
						<span
							>Dev mode: SMTP not configured, so this code was not emailed. Use:
							<span class="font-mono">{devOtpHint}</span></span
						>
					</div>
				{/if}

				{#if draft}
					<form class="flex flex-col gap-5" onsubmit={verifyAndCreateAccount}>
						<label for="otp">{draft.email}, we have sent an OTP to your email.</label>
						<input
							id="otp"
							type="text"
							class="d-input"
							placeholder="123456"
							inputmode="numeric"
							autocomplete="one-time-code"
							bind:value={otp}
							oninput={(e) => (otp = normalizedOtp((e.currentTarget as HTMLInputElement).value))}
						/>

						<button class="d-btn d-btn-primary" type="submit" disabled={isSubmitting}>
							{isSubmitting ? 'Creating account…' : 'Confirm'}
						</button>
					</form>
				{:else}
					<div class="d-loading d-loading-md d-loading-spinner" aria-label="Loading"></div>
				{/if}
			</fieldset>
		</div>
	</div>
</section>
