import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit does not load .env automatically — same as running any Node CLI without Vite
config({ path: '.env' });

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set (add it to .env or export it in your shell)');
}

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: process.env.DATABASE_URL },
	verbose: true,
	strict: true
});
