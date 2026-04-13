export type HighlightPart = { text: string; match: boolean };

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Split `text` into segments; `match` is true where a whitespace-separated term from `query` matches (case-insensitive). */
export function highlightSearchParts(text: string, query: string): HighlightPart[] {
	const raw = query.trim();
	if (!raw) return [{ text, match: false }];
	const terms = [...new Set(raw.split(/\s+/).filter(Boolean))];
	if (terms.length === 0) return [{ text, match: false }];
	const sorted = [...terms].sort((a, b) => b.length - a.length);
	const re = new RegExp(sorted.map(escapeRegExp).join('|'), 'gi');
	const out: HighlightPart[] = [];
	let last = 0;
	const s = text;
	let m: RegExpExecArray | null;
	re.lastIndex = 0;
	while ((m = re.exec(s)) !== null) {
		if (m.index > last) {
			out.push({ text: s.slice(last, m.index), match: false });
		}
		out.push({ text: m[0], match: true });
		last = m.index + m[0].length;
	}
	if (last < s.length) {
		out.push({ text: s.slice(last), match: false });
	}
	return out.length > 0 ? out : [{ text, match: false }];
}
