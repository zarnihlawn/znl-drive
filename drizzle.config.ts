import { defineConfig } from 'drizzle-kit';

/**
 * Env is not loaded here — use Node’s built-in loader when invoking drizzle-kit, e.g.
 * `node --env-file=.env node_modules/drizzle-kit/bin.cjs push` (see `package.json` db:* scripts).
 * The SvelteKit app uses `$env/dynamic/private` / Vite’s env handling instead of dotenv.
 */
if (!process.env.DATABASE_URL) {
	throw new Error(
		'DATABASE_URL is not set. Use `pnpm db:*` (loads .env via node --env-file), or export DATABASE_URL.'
	);
}

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: process.env.DATABASE_URL },
	verbose: true,
	strict: true
});
