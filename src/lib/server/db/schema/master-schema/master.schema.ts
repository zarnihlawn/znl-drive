import { pgEnum } from 'drizzle-orm/pg-core';

export const MasterItemTypeSchema = pgEnum('master_item_type', ['file', 'folder']);

export const MasterFilePermissionSchema = pgEnum('master_file_permission', ['read', 'write', 'admin']);

export const MasterFileActionSchema = pgEnum('master_file_action', ['upload', 'download', 'access']);

export const MasterFileTypeSchema = pgEnum('master_file_type', [
	'image',
	'video',
	'audio',
	'document',
	'other'
]);

export const MasterFileExtensionSchema = pgEnum('master_file_extension', [
	'jpg',
  'zip',
	'jpeg',
	'png',
	'gif',
	'bmp'
]);

export const MasterStorageProviderSchema = pgEnum('master_storage_provider', ['local', 'tigris']);
