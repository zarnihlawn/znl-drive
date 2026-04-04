/** Increment `tick` after uploads so +page refetches the file list. */
export const driveListRefresh = $state({ tick: 0 });

export function bumpDriveListRefresh(): void {
	driveListRefresh.tick += 1;
}
