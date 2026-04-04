import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

/** Only for module init when env is missing (e.g. Docker build). `neon()` requires user@host/path — see @neondatabase/serverless validation. */
const PLACEHOLDER_DATABASE_URL =
	'postgresql://build:build@placeholder.invalid/postgres';

const databaseUrl = env.DATABASE_URL;
if (!databaseUrl) {
	console.warn(
		'DATABASE_URL is not set; database access will fail until it is configured (e.g. Fly secrets / .env).'
	);
}

const client = neon(databaseUrl ?? PLACEHOLDER_DATABASE_URL);

export const db = drizzle(client, { schema });
