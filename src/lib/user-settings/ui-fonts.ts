/** Values must match `data-font` selectors in `font.style.css`. */
export const UI_FONT_OPTIONS = [
	{ value: 'Adwaita-sans', label: 'Adwaita Sans' },
	{ value: 'Adwaita-mono', label: 'Adwaita Mono' },
	{ value: 'Roboto', label: 'Roboto' },
	{ value: 'Comic-relief', label: 'Comic Relief' },
	{ value: 'Pangolin', label: 'Pangolin' }
] as const;

export type UiFontValue = (typeof UI_FONT_OPTIONS)[number]['value'];
