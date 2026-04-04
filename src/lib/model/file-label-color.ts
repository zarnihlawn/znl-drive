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

/** Daisy badge modifier for a compact label cell. */
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

export function fileLabelBorderClass(color: string): string {
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
