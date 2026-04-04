import { resolve } from '$app/paths';

export type SendOtpResult = { ok: true; devOtp?: string } | { ok: false; message: string };

export async function sendOtpToEmail(email: string): Promise<SendOtpResult> {
	try {
		const response = await fetch(resolve('/api/auth/signup/send-otp'), {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ email })
		});

		if (!response.ok) {
			const message = await response.text().catch(() => '');
			return { ok: false, message: message || 'Failed to send OTP. Please try again.' };
		}

		const data = (await response.json().catch(() => ({}))) as { devOtp?: string };
		return { ok: true, devOtp: data.devOtp };
	} catch {
		return { ok: false, message: 'Network error. Please try again.' };
	}
}
