import { deLocalizeHref } from '$lib/paraglide/runtime';

/** Public documentation base path (`(public)/onboarding/docs`). */
export const DOCS_ROOT = '/onboarding/docs';

export type DocsNavItem = {
	title: string;
	/** Canonical path without locale prefix, e.g. `/onboarding/docs/user/getting-started` */
	path: string;
	children?: DocsNavItem[];
};

/** Single source of truth for docs sidebar and breadcrumbs. */
export const DOCS_NAV: DocsNavItem[] = [
	{ title: 'Overview', path: DOCS_ROOT },
	{
		title: 'User manual',
		path: `${DOCS_ROOT}/user`,
		children: [
			{ title: 'Getting started', path: `${DOCS_ROOT}/user/getting-started` },
			{ title: 'Files and folders', path: `${DOCS_ROOT}/user/files-and-folders` },
			{ title: 'Upload and download', path: `${DOCS_ROOT}/user/upload-and-download` },
			{ title: 'Shared with you', path: `${DOCS_ROOT}/user/shared` },
			{ title: 'Trash', path: `${DOCS_ROOT}/user/trash` },
			{ title: 'Public links', path: `${DOCS_ROOT}/user/public-links` },
			{ title: 'Storage providers', path: `${DOCS_ROOT}/user/storage-providers` },
			{ title: 'Settings', path: `${DOCS_ROOT}/user/settings` }
		]
	},
	{
		title: 'Developer',
		path: `${DOCS_ROOT}/developer`,
		children: [
			{ title: 'Authentication', path: `${DOCS_ROOT}/developer/authentication` },
			{ title: 'REST API reference', path: `${DOCS_ROOT}/developer/rest-api` },
			{ title: 'Errors', path: `${DOCS_ROOT}/developer/errors` }
		]
	},
	{
		title: 'Contribute',
		path: `${DOCS_ROOT}/contribute`,
		children: [
			{ title: 'Stack', path: `${DOCS_ROOT}/contribute/stack` },
			{ title: 'Repository layout', path: `${DOCS_ROOT}/contribute/repo-layout` },
			{ title: 'Environment and database', path: `${DOCS_ROOT}/contribute/env-and-db` },
			{ title: 'Workflows', path: `${DOCS_ROOT}/contribute/workflows` },
			{ title: 'Architecture', path: `${DOCS_ROOT}/contribute/architecture` }
		]
	}
];

export type FlatNavEntry = { title: string; path: string; depth: number };

export function flattenDocsNav(items: DocsNavItem[] = DOCS_NAV, depth = 0): FlatNavEntry[] {
	const out: FlatNavEntry[] = [];
	for (const item of items) {
		out.push({ title: item.title, path: item.path, depth });
		if (item.children?.length) {
			out.push(...flattenDocsNav(item.children, depth + 1));
		}
	}
	return out;
}

/** De-localized pathname, e.g. `/ja/onboarding/docs/user` → `/onboarding/docs/user` */
export function docsCanonicalPath(pathname: string): string {
	return deLocalizeHref(pathname);
}

/** Active if current path equals this item or is a deeper segment under it. */
export function isDocsNavItemActive(canonicalPathname: string, itemPath: string): boolean {
	return (
		canonicalPathname === itemPath ||
		(itemPath !== DOCS_ROOT && canonicalPathname.startsWith(itemPath + '/'))
	);
}

export function findDocsBreadcrumbChain(
	targetCanonical: string,
	items: DocsNavItem[] = DOCS_NAV,
	chain: DocsNavItem[] = []
): DocsNavItem[] | null {
	for (const item of items) {
		const next = [...chain, item];
		if (item.path === targetCanonical) return next;
		if (item.children?.length) {
			const found = findDocsBreadcrumbChain(targetCanonical, item.children, next);
			if (found) return found;
		}
	}
	return null;
}
