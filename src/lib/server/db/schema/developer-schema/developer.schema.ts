import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createUpdateTimestamp, uuidSchemaWrapper } from '../schema-wrapper';

export const DeveloperApiKeySchema = pgTable('developer_api_key', {
	...uuidSchemaWrapper,
	userId: text('user_id').notNull(),
	name: text('name').notNull(),
	keyPrefix: text('key_prefix').notNull(),
	keyHash: text('key_hash').notNull(),
	last4: text('last4').notNull(),
	isRevoked: boolean('is_revoked').notNull().default(false),
	lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
	revokedAt: timestamp('revoked_at', { withTimezone: true }),
	...createUpdateTimestamp
});
