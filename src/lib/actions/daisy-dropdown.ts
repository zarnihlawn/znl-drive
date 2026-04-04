import type { Action } from 'svelte/action';

function blurDropdownTrigger(root: HTMLElement) {
	const trigger = root.querySelector<HTMLElement>(':scope > [tabindex="0"]');
	trigger?.blur();
	const ae = document.activeElement;
	if (ae && root.contains(ae) && ae instanceof HTMLElement) ae.blur();
}

/**
 * DaisyUI `d-dropdown`: close on outside pointerdown (blur `:focus-within`) and after a menu
 * `a` / `button` is activated so the panel does not stay open behind modals.
 */
export const daisyDropdown: Action<HTMLElement> = (root) => {
	function onDocPointerDown(e: PointerEvent) {
		const t = e.target;
		if (!t || !(t instanceof Node) || root.contains(t)) return;
		blurDropdownTrigger(root);
	}
	function onMenuClick(e: Event) {
		const interactive = (e.target as HTMLElement | null)?.closest?.('a, button');
		if (!interactive || !root.contains(interactive)) return;
		queueMicrotask(() => blurDropdownTrigger(root));
	}
	const menu = root.querySelector('ul');
	document.addEventListener('pointerdown', onDocPointerDown, true);
	menu?.addEventListener('click', onMenuClick, true);
	return {
		destroy() {
			document.removeEventListener('pointerdown', onDocPointerDown, true);
			menu?.removeEventListener('click', onMenuClick, true);
		}
	};
};
