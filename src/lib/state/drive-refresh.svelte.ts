/** Increment `tick` after uploads so +page refetches the file list. */
export const driveListRefresh = $state({ tick: 0 });

const reloadListeners = new Set<() => void>();

/**
 * Re-register a client-side reload callback (e.g. refetch `/api/drive/files`).
 * Use from `onMount` only, not from top-level or `$effect`, to avoid fetch during SSR.
 */
export function registerDriveListReload(fn: () => void): () => void {
	reloadListeners.add(fn);
	return () => reloadListeners.delete(fn);
}

export function bumpDriveListRefresh(): void {
	driveListRefresh.tick += 1;
	for (const fn of reloadListeners) {
		try {
			fn();
		} catch (e) {
			console.error('[driveListRefresh]', e);
		}
	}
}
