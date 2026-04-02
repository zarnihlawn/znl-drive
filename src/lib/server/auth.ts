import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import {
	AuthAccountSchema,
	AuthSessionSchema,
	AuthUserSchema,
	AuthVerificationSchema
} from '$lib/server/db/schema/auth-schema/auth.schema';
import { getFromAddress, getSmtpTransport } from '$lib/server/mailer';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: AuthUserSchema,
			session: AuthSessionSchema,
			account: AuthAccountSchema,
			verification: AuthVerificationSchema
		}
	}),
	emailAndPassword: {
		enabled: true,
		/** Session is created in our custom `/api/auth/signup` route via `signInEmail` after OTP. */
		autoSignIn: false,
		async sendResetPassword({ user, url }) {
			const transport = getSmtpTransport();
			const from = getFromAddress();
			if (!transport || !from) {
				throw new Error(
					'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.'
				);
			}

			await transport.sendMail({
				from,
				to: user.email,
				subject: 'Reset your password',
				text: `Reset your password using this link:\n\n${url}\n\nIf you did not request this, you can ignore this email.`
			});
		}
	},
	...(Object.keys({
		...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
			? {
					github: {
						clientId: env.GITHUB_CLIENT_ID,
						clientSecret: env.GITHUB_CLIENT_SECRET
					}
				}
			: {}),
		...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
			? {
					google: {
						clientId: env.GOOGLE_CLIENT_ID,
						clientSecret: env.GOOGLE_CLIENT_SECRET
					}
				}
			: {})
	}).length
		? {
				socialProviders: {
					...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
						? {
								github: {
									clientId: env.GITHUB_CLIENT_ID,
									clientSecret: env.GITHUB_CLIENT_SECRET
								}
							}
						: {}),
					...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
						? {
								google: {
									clientId: env.GOOGLE_CLIENT_ID,
									clientSecret: env.GOOGLE_CLIENT_SECRET
								}
							}
						: {})
				}
			}
		: {}),
	plugins: [
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
