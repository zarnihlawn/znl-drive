import { SignUpBodyEmailInterface } from '$lib/model/interface/auth.interface';
import { auth } from '$lib/server/auth';
import { hashOtp, unsealSignupOtpCookie } from '$lib/server/signup-otp';
import { dev } from '$app/environment';
import { error, json, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { APIError } from 'better-auth';
import type { RequestHandler } from './$types';

function getAuthErrorMessage(e: unknown): string {
	if (e instanceof APIError) {
		const body = e.body as { message?: string } | undefined;
		return (typeof body?.message === 'string' && body.message) || e.message || 'Request failed';
	}
	if (e instanceof Error && e.message) return e.message;
	return String(e);
}

async function readSignupBody(request: Request): Promise<unknown> {
	const type = request.headers.get('content-type') ?? '';
	if (type.includes('application/json')) return await request.json();
	const form = await request.formData();
	return {
		name: String(form.get('name') ?? ''),
		email: String(form.get('email') ?? ''),
		password: String(form.get('password') ?? ''),
		otp: String(form.get('otp') ?? form.get('OTP') ?? '')
	};
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await readSignupBody(request).catch(() => null);
	const parsed = SignUpBodyEmailInterface.safeParse(body);
	if (!parsed.success) throw error(400, 'Invalid signup data');

	const { name } = parsed.data;
	const email = parsed.data.email.toLowerCase().trim();
	const { password, otp } = parsed.data;

	const sealedCookie = cookies.get('signup_otp');
	if (!sealedCookie) throw error(400, 'OTP expired. Please request a new one.');

	const sealed = unsealSignupOtpCookie(sealedCookie);
	if (!sealed) throw error(400, 'OTP expired. Please request a new one.');
	if (sealed.email !== email) throw error(400, 'OTP does not match this email.');
	if (Date.now() > sealed.expiresAt) throw error(400, 'OTP expired. Please request a new one.');

	if (hashOtp(email, otp) !== sealed.otpHash) throw error(401, 'Invalid OTP');

	// Require explicit OTP verification step (server-checked).
	const verified = cookies.get('signup_otp_verified');
	if (verified !== String(sealed.expiresAt)) {
		throw error(403, 'OTP not verified. Please verify the OTP first.');
	}

	// Create account, then sign in (needs request headers so session cookies apply in SvelteKit).
	const authHeaders = request.headers;
	try {
		await auth.api.signUpEmail({
			body: {
				name,
				email,
				password,
				callbackURL: resolve('/home')
			},
			headers: authHeaders
		});
		await auth.api.signInEmail({
			body: {
				email,
				password,
				callbackURL: resolve('/home')
			},
			headers: authHeaders
		});
	} catch (e: unknown) {
		console.error('[signup]', e);
		const message = getAuthErrorMessage(e);
		if (/exist|already|duplicate|USER_ALREADY_EXISTS/i.test(message)) {
			throw error(409, 'An account with this email already exists. Please log in instead.');
		}
		throw error(
			500,
			dev ? `Signup failed: ${message}` : 'Failed to create account. Please try again.'
		);
	}

	// Cleanup OTP cookies after successful signup
	cookies.delete('signup_otp', { path: '/' });
	cookies.delete('signup_otp_verified', { path: '/' });

	const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
	if (wantsJson) return json({ success: true });

	throw redirect(303, resolve('/home'));
};
