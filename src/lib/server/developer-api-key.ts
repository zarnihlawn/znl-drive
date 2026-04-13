import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { AuthUserSchema } from '$lib/server/db/schema/auth-schema/auth.schema';
import { DeveloperApiKeySchema } from '$lib/server/db/schema/developer-schema/developer.schema';
import { and, desc, eq } from 'drizzle-orm';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const KEY_REGEX = /^znldv_([a-zA-Z0-9]{12})_(.+)$/;

function apiKeyPepper(): string {
	return env.BETTER_AUTH_SECRET ?? 'znl-drive-dev-api-key-pepper';
}

export function hashDeveloperApiKeySecret(prefix: string, secret: string): string {
	return createHmac('sha256', apiKeyPepper()).update(prefix).update('\0').update(secret).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
	try {
		const ba = Buffer.from(a, 'hex');
		const bb = Buffer.from(b, 'hex');
		if (ba.length !== bb.length) return false;
		return timingSafeEqual(ba, bb);
	} catch {
		return false;
	}
}

export function parseDeveloperApiKeyFromRequest(request: Request): string | null {
	const auth = request.headers.get('authorization');
	if (auth?.toLowerCase().startsWith('bearer ')) {
		const t = auth.slice(7).trim();
		if (t.startsWith('znldv_')) return t;
	}
	const x = request.headers.get('x-api-key');
	if (x?.trim().startsWith('znldv_')) return x.trim();
	return null;
}

export type DeveloperApiUser = {
	id: string;
	email: string | null;
	name: string | null;
};

export async function tryResolveUserFromDeveloperApiKey(
	request: Request
): Promise<DeveloperApiUser | null> {
	const raw = parseDeveloperApiKeyFromRequest(request);
	if (!raw) return null;
	const m = raw.match(KEY_REGEX);
	if (!m) return null;
	const prefix = m[1];
	const secret = m[2];

	const [row] = await db
		.select({
			keyId: DeveloperApiKeySchema.id,
			keyHash: DeveloperApiKeySchema.keyHash,
			userId: DeveloperApiKeySchema.userId,
			email: AuthUserSchema.email,
			name: AuthUserSchema.name,
			devMode: AuthUserSchema.developerModeEnabled
		})
		.from(DeveloperApiKeySchema)
		.innerJoin(AuthUserSchema, eq(AuthUserSchema.id, DeveloperApiKeySchema.userId))
		.where(
			and(eq(DeveloperApiKeySchema.keyPrefix, prefix), eq(DeveloperApiKeySchema.isRevoked, false))
		)
		.limit(1);

	if (!row || !row.devMode) return null;

	const digest = hashDeveloperApiKeySecret(prefix, secret);
	if (!safeEqualHex(row.keyHash, digest)) return null;

	await db
		.update(DeveloperApiKeySchema)
		.set({ lastUsedAt: new Date() })
		.where(eq(DeveloperApiKeySchema.id, row.keyId));

	return { id: row.userId, email: row.email, name: row.name };
}

function randomPrefix12(): string {
// 12 URL-safe chars
	let s = '';
	while (s.length < 12) {
		s += randomBytes(9).toString('base64url').replace(/[^a-zA-Z0-9]/g, '');
	}
	return s.slice(0, 12);
}

export async function createDeveloperApiKey(
	userId: string,
	displayName: string
): Promise<{ id: string; plaintextKey: string; keyPrefix: string; last4: string; name: string }> {
	const name = displayName.trim();
	if (!name) throw new Error('App name is required');

	let lastErr: unknown;
	for (let attempt = 0; attempt < 5; attempt++) {
		const prefix = randomPrefix12();
		const secret = randomBytes(32).toString('base64url');
		const fullKey = `znldv_${prefix}_${secret}`;
		const keyHash = hashDeveloperApiKeySecret(prefix, secret);
		const last4 = secret.slice(-4);
		try {
			const [inserted] = await db
				.insert(DeveloperApiKeySchema)
				.values({
					userId,
					name,
					keyPrefix: prefix,
					keyHash,
					last4
				})
				.returning({ id: DeveloperApiKeySchema.id });
			return {
				id: inserted.id,
				plaintextKey: fullKey,
				keyPrefix: prefix,
				last4,
				name
			};
		} catch (e) {
			lastErr = e;
			if (attempt < 4) continue;
		}
	}
	throw lastErr instanceof Error ? lastErr : new Error('Failed to create API key');
}

export async function listDeveloperApiKeysForUser(userId: string) {
	return db
		.select({
			id: DeveloperApiKeySchema.id,
			name: DeveloperApiKeySchema.name,
			keyPrefix: DeveloperApiKeySchema.keyPrefix,
			last4: DeveloperApiKeySchema.last4,
			createdAt: DeveloperApiKeySchema.createdAt,
			lastUsedAt: DeveloperApiKeySchema.lastUsedAt,
			isRevoked: DeveloperApiKeySchema.isRevoked
		})
		.from(DeveloperApiKeySchema)
		.where(eq(DeveloperApiKeySchema.userId, userId))
		.orderBy(desc(DeveloperApiKeySchema.createdAt));
}

export async function revokeDeveloperApiKey(userId: string, keyId: string): Promise<boolean> {
	const now = new Date();
	const res = await db
		.update(DeveloperApiKeySchema)
		.set({ isRevoked: true, revokedAt: now })
		.where(
			and(
				eq(DeveloperApiKeySchema.id, keyId),
				eq(DeveloperApiKeySchema.userId, userId),
				eq(DeveloperApiKeySchema.isRevoked, false)
			)
		)
		.returning({ id: DeveloperApiKeySchema.id });
	return res.length > 0;
}

export async function getDeveloperModeEnabled(userId: string): Promise<boolean> {
	const [row] = await db
		.select({ v: AuthUserSchema.developerModeEnabled })
		.from(AuthUserSchema)
		.where(eq(AuthUserSchema.id, userId))
		.limit(1);
	return row?.v ?? false;
}

export async function setDeveloperModeEnabled(userId: string, enabled: boolean): Promise<void> {
	await db
		.update(AuthUserSchema)
		.set({ developerModeEnabled: enabled })
		.where(eq(AuthUserSchema.id, userId));
}
