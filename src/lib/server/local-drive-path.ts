import { homedir } from 'node:os';
import { join } from 'node:path';

const DIR_NAME = 'znl-drive';

/** Per-user directory under `~/Documents/znl-drive/` (created with `mkdir` on upload). */
export function localUserUploadDir(userId: string): string {
	return join(homedir(), 'Documents', DIR_NAME, userId);
}

/** Team files live under `~/Documents/znl-drive/teams/<teamId>/`. */
export function localTeamUploadDir(teamId: string): string {
	return join(homedir(), 'Documents', DIR_NAME, 'teams', teamId);
}
