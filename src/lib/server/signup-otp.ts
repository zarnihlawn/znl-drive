import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

type SignupOtpPayload = {
	email: string;
	otpHash: string;
	expiresAt: number;
};

function getSecret(): string {
	const secret = env.BETTER_AUTH_SECRET;
	if (!secret) {
		throw new Error('Missing BETTER_AUTH_SECRET');
	}
	return secret;
}

function hmac(input: string): string {
	return createHmac('sha256', getSecret()).update(input).digest('base64url');
}

export function generateOtp(): string {
	return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashOtp(email: string, otp: string): string {
	return hmac(`signup-otp:${email}:${otp}`);
}

export function sealSignupOtpCookie(payload: SignupOtpPayload): string {
	const json = JSON.stringify(payload);
	const sig = hmac(json);
	return `${Buffer.from(json, 'utf8').toString('base64url')}.${sig}`;
}

export function unsealSignupOtpCookie(value: string): SignupOtpPayload | null {
	const [b64, sig] = value.split('.');
	if (!b64 || !sig) return null;
	let json: string;
	try {
		json = Buffer.from(b64, 'base64url').toString('utf8');
	} catch {
		return null;
	}
	const expected = hmac(json);
	try {
		if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
	} catch {
		return null;
	}
	try {
		return JSON.parse(json) as SignupOtpPayload;
	} catch {
		return null;
	}
}

