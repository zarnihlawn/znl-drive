import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

export function getSmtpTransport() {
	// Preferred config: explicit SMTP_* env vars
	const smtpHost = env.SMTP_HOST;
	const smtpPort = env.SMTP_PORT ? Number(env.SMTP_PORT) : undefined;
	const smtpUser = env.SMTP_USER;
	const smtpPass = env.SMTP_PASS;

	// Fallback config: Gmail app-password
	// (we cast to avoid tight typing on env keys)
	const gmailUser = (env as Record<string, string | undefined>).GMAIL_USER;
	const gmailAppPassword = (env as Record<string, string | undefined>).GMAIL_APP_PASSWORD;
	const gmailFrom = (env as Record<string, string | undefined>).SMTP_FROM ?? gmailUser;

	if (smtpHost && smtpPort && smtpUser && smtpPass) {
		const secure = smtpPort === 465;
		/** Port 587 uses STARTTLS; many SMTP providers require this explicitly. */
		const requireTLS = !secure && smtpPort === 587;

		return nodemailer.createTransport({
			host: smtpHost,
			port: smtpPort,
			secure,
			requireTLS,
			auth: { user: smtpUser, pass: smtpPass }
		});
	}

	// If SMTP_* isn't set, try Gmail.
	if (gmailUser && gmailAppPassword) {
		const host = 'smtp.gmail.com';
		const port = 587;
		return nodemailer.createTransport({
			host,
			port,
			secure: false,
			requireTLS: true,
			auth: {
				user: gmailUser,
				pass: gmailAppPassword
			}
		});
	}

	return null;
}

export function getFromAddress(): string | null {
	const smtpFrom = env.SMTP_FROM?.trim();
	if (smtpFrom) return smtpFrom;

	const gmailFrom = (env as Record<string, string | undefined>).GMAIL_USER;
	return gmailFrom ? gmailFrom.trim() : null;
}
