import { browser } from '$app/environment';
import type { DaisyTheme } from '$lib/user-settings/daisy-themes';
import { DAISYUI_THEMES } from '$lib/user-settings/daisy-themes';
import type { UiFontValue } from '$lib/user-settings/ui-fonts';
import { UI_FONT_OPTIONS } from '$lib/user-settings/ui-fonts';

export const THEME_STORAGE_KEY = 'theme';
export const FONT_STORAGE_KEY = 'font';
export const FONT_SCALE_STORAGE_KEY = 'uiFontScale';

const FONT_VALUES = new Set<string>(UI_FONT_OPTIONS.map((f) => f.value));
const THEME_SET = new Set<string>(DAISYUI_THEMES);

export const FONT_SCALE_PRESETS = [
	{ value: 0.875, label: 'Smaller' },
	{ value: 1, label: 'Default' },
	{ value: 1.125, label: 'Larger' },
	{ value: 1.25, label: 'Largest' }
] as const;

function clampScale(n: number): number {
	if (Number.isNaN(n)) return 1;
	return Math.min(1.5, Math.max(0.75, n));
}

export function isValidTheme(t: string): t is DaisyTheme {
	return THEME_SET.has(t);
}

export function isValidFont(t: string): t is UiFontValue {
	return FONT_VALUES.has(t);
}

export function applyTheme(theme: string): void {
	if (!browser || !isValidTheme(theme)) return;
	document.documentElement.setAttribute('data-theme', theme);
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {
		/* ignore */
	}
}

export function applyFont(font: string): void {
	if (!browser || !isValidFont(font)) return;
	document.documentElement.setAttribute('data-font', font);
	try {
		localStorage.setItem(FONT_STORAGE_KEY, font);
	} catch {
		/* ignore */
	}
}

export function applyFontScale(scale: number): void {
	if (!browser) return;
	const s = clampScale(scale);
	document.documentElement.style.setProperty('--app-font-scale', String(s));
	try {
		localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(s));
	} catch {
		/* ignore */
	}
}

export function readStoredFontScale(): number {
	if (!browser) return 1;
	try {
		const raw = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
		if (!raw) return 1;
		return clampScale(parseFloat(raw));
	} catch {
		return 1;
	}
}
