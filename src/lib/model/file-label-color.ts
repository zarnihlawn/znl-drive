/** Allowed `main_file.color` values — DaisyUI semantic + base. */
export const FILE_LABEL_COLORS = [
	'base',
	'primary',
	'secondary',
	'accent',
	'neutral',
	'info',
	'success',
	'warning',
	'error'
] as const;

export type FileLabelColorId = (typeof FILE_LABEL_COLORS)[number];

/** Text color for file/folder icons from label (no badge). */
export function fileLabelIconClass(color: string | null | undefined): string {
	if (color === null || color === undefined) {
		return 'text-base-content/60';
	}
	switch (color) {
		case 'base':
			return 'text-base-content/60';
		case 'primary':
			return 'text-primary';
		case 'secondary':
			return 'text-secondary';
		case 'accent':
			return 'text-accent';
		case 'neutral':
			return 'text-neutral';
		case 'info':
			return 'text-info';
		case 'success':
			return 'text-success';
		case 'warning':
			return 'text-warning';
		case 'error':
			return 'text-error';
		default:
			return 'text-base-content/60';
	}
}

export function fileLabelBadgeClass(color: string): string {
	switch (color) {
		case 'primary':
			return 'd-badge d-badge-primary';
		case 'secondary':
			return 'd-badge d-badge-secondary';
		case 'accent':
			return 'd-badge d-badge-accent';
		case 'neutral':
			return 'd-badge d-badge-neutral';
		case 'info':
			return 'd-badge d-badge-info';
		case 'success':
			return 'd-badge d-badge-success';
		case 'warning':
			return 'd-badge d-badge-warning';
		case 'error':
			return 'd-badge d-badge-error';
		default:
			return 'd-badge d-badge-ghost';
	}
}

export function fileLabelBorderClass(color: string | null | undefined): string {
	if (color === null || color === undefined) {
		return 'border-l-base-content/15';
	}
	switch (color) {
		case 'primary':
			return 'border-l-primary';
		case 'secondary':
			return 'border-l-secondary';
		case 'accent':
			return 'border-l-accent';
		case 'neutral':
			return 'border-l-neutral';
		case 'info':
			return 'border-l-info';
		case 'success':
			return 'border-l-success';
		case 'warning':
			return 'border-l-warning';
		case 'error':
			return 'border-l-error';
		default:
			return 'border-l-base-content/25';
	}
}
