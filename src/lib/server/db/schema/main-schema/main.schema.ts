import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { MasterStorageProviderSchema } from '../master-schema/master.schema';
import { createUpdateTimestamp, uuidSchemaWrapper } from '../schema-wrapper';

export const MainFileSchema = pgTable('main_file', {
	...uuidSchemaWrapper,
	ownerId: text('owner_id').notNull(),
	parentId: integer('parent_id'),
	itemType: text('item_type').notNull().default('file'),
	isPinned: boolean('is_pinned').notNull().default(false),
	isStarred: boolean('is_starred').notNull().default(false),
	trashedAt: timestamp('trashed_at', { withTimezone: true }),
	color: text('color').notNull().default('base'),
	path: text('path').notNull(),
	name: text('name').notNull(),
	mimeType: text('mime_type').notNull(),
	sizeBytes: integer('size_bytes').notNull(),
	/** Postgres enum `master_storage_provider` — ties each object to a backend (local vs Tigris, etc.). */
	storageProvider: MasterStorageProviderSchema('storage_provider').notNull().default('local'),
	isEncrypted: boolean('is_encrypted').notNull().default(true),
	isCompressed: boolean('is_compressed').notNull().default(true),
	...createUpdateTimestamp
});

export const MainFileShareSchema = pgTable('main_file_share', {
	...uuidSchemaWrapper,
	fileId: integer('file_id').notNull(),
	ownerId: text('owner_id').notNull(),
	targetEmail: text('target_email').notNull(),
	permission: text('permission').notNull(),
	canReshare: boolean('can_reshare').notNull().default(false),
	...createUpdateTimestamp
});

export const MainFileActivitySchema = pgTable('main_file_activity', {
	...uuidSchemaWrapper,
	userId: text('user_id').notNull(),
	fileId: integer('file_id'),
	action: text('action').notNull(),
	...createUpdateTimestamp
});
