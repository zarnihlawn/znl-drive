/** Mirrors `MasterStorageProviderSchema` (`master_storage_provider`) — keep in sync with master.schema.ts */
export const STORAGE_PROVIDERS = ['local', 'tigris'] as const;
export type StorageProviderId = (typeof STORAGE_PROVIDERS)[number];

export const STORAGE_PROVIDER_STORAGE_KEY = 'znl-drive:storage-provider';

export function storageProviderLabel(id: StorageProviderId): string {
	switch (id) {
		case 'local':
			return 'Local';
		case 'tigris':
			return 'Tigris';
		default:
			return id;
	}
}

export function parseStorageProvider(value: string | null | undefined): StorageProviderId | null {
	if (!value) return null;
	return STORAGE_PROVIDERS.includes(value as StorageProviderId)
		? (value as StorageProviderId)
		: null;
}
