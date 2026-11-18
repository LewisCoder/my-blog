/**
 * 站内搜索的纯逻辑：归一化、分词、匹配、排序、摘要与高亮。
 * 不依赖 DOM，可直接用 Node 的测试运行器覆盖。
 */

export const MAX_QUERY_LENGTH = 120;

const FIELD_WEIGHTS = { title: 10, tags: 6, description: 3, body: 1 };

/** @param {unknown} text */
export function normalize(text) {
	return String(text ?? '')
		.normalize('NFKC')
		.toLowerCase();
}

/** 每次查询时检测，便于运行时覆盖验证降级路径。 */
export function hasSegmenter() {
	return typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function';
}

/**
 * 把查询切成匹配单位。优先使用中文分词器，缺失时降级为 bigram + 拉丁词。
 * @param {string} text
 * @param {boolean} [useSegmenter]
 * @returns {string[]}
 */
export function tokenize(text, useSegmenter = hasSegmenter()) {
	const source = normalize(text).slice(0, MAX_QUERY_LENGTH);
	if (!source.trim()) return [];

	/** @type {Set<string>} */
	const tokens = new Set();

	if (useSegmenter) {
		const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });
		for (const { segment } of segmenter.segment(source)) {
			const token = segment.trim();
			if (!token || /^[\p{P}\p{S}\s]+$/u.test(token)) continue;
			tokens.add(token);
		}
	} else {
		for (const word of source.match(/[a-z0-9]+/g) ?? []) tokens.add(word);
		for (const run of source.match(/[㐀-䶿一-鿿豈-﫿]+/g) ?? []) {
			if (run.length === 1) tokens.add(run);
			for (let i = 0; i < run.length - 1; i += 1) tokens.add(run.slice(i, i + 2));
		}
	}

	return [...tokens];
}

/**
 * 为一条索引记录预计算归一化副本，匹配时使用副本，展示时仍用原文。
 * @param {any} record
 */
export function prepareRecord(record) {
	const tags = Array.isArray(record.tags) ? record.tags : [];
	const description = record.description ?? '';
	const body = record.body ?? '';
	return {
		...record,
		description,
		body,
		tags,
		_norm: {
			title: normalize(record.title),
			description: normalize(description),
			tags: tags.map(normalize),
			body: normalize(body),
		},
	};
}

/** @param {any[]} records */
export function prepareIndex(records) {
	return records.map(prepareRecord);
}

/**
 * @param {string} haystack
 * @param {string} needle
 */
function countOccurrences(haystack, needle) {
	if (!needle) return 0;
	let count = 0;
	let from = 0;
	while (true) {
		const index = haystack.indexOf(needle, from);
		if (index === -1) return count;
		count += 1;
		from = index + needle.length;
	}
}

/**
 * @param {any[]} records
 * @param {string} query
 */
export function search(records, query) {
	const trimmed = String(query ?? '').slice(0, MAX_QUERY_LENGTH);
	const tokens = tokenize(trimmed);
	if (!tokens.length) return [];

	/** @type {any[]} */
	const results = [];

	for (const record of records) {
		const norm = record._norm ?? prepareRecord(record)._norm;
		const counts = { title: 0, description: 0, tags: 0, body: 0 };
		let allMatched = true;

		for (const token of tokens) {
			const titleCount = countOccurrences(norm.title, token);
			const descriptionCount = countOccurrences(norm.description, token);
			const tagCount = norm.tags.reduce((sum, tag) => sum + countOccurrences(tag, token), 0);
			const bodyCount = countOccurrences(norm.body, token);

			if (titleCount + descriptionCount + tagCount + bodyCount === 0) {
				allMatched = false;
				break;
			}

			counts.title += titleCount;
			counts.description += descriptionCount;
			counts.tags += tagCount;
			counts.body += bodyCount;
		}

		if (!allMatched) continue;

		const score =
			counts.title * FIELD_WEIGHTS.title +
			counts.tags * FIELD_WEIGHTS.tags +
			counts.description * FIELD_WEIGHTS.description +
			counts.body * FIELD_WEIGHTS.body;

		const { _norm, ...rest } = record;
		results.push({
			...rest,
			score,
			matchedTokens: tokens,
			snippet: buildSnippet(rest, tokens),
		});
	}

	results.sort(
		(a, b) =>
			b.score - a.score ||
			dateValue(b.pubDate) - dateValue(a.pubDate) ||
			String(a.id).localeCompare(String(b.id)),
	);

	return results;
}

/** @param {unknown} value */
function dateValue(value) {
	const time = Date.parse(String(value ?? ''));
	return Number.isNaN(time) ? 0 : time;
}

/**
 * 归一化并记录每个归一化字符对应的原文区间，便于把命中位置映射回原文。
 * @param {string} text
 */
function normalizeWithMap(text) {
	let normalized = '';
	/** @type {{ start: number, end: number }[]} */
	const map = [];
	let originalIndex = 0;
	for (const char of text) {
		const part = normalize(char);
		for (let i = 0; i < part.length; i += 1) {
			map.push({ start: originalIndex, end: originalIndex + char.length });
		}
		normalized += part;
		originalIndex += char.length;
	}
	return { normalized, map };
}

/**
 * @param {string} text
 * @param {string[]} tokens
 */
function findFirstMatch(text, tokens) {
	const { normalized, map } = normalizeWithMap(text);
	/** @type {{ index: number, length: number } | null} */
	let best = null;
	for (const token of tokens) {
		const needle = normalize(token);
		if (!needle) continue;
		const index = normalized.indexOf(needle);
		if (index === -1) continue;
		if (!best || index < best.index) best = { index, length: needle.length };
	}
	if (!best) return null;
	const first = map[best.index];
	const last = map[best.index + best.length - 1];
	return { index: first.start, length: last.end - first.start };
}

/**
 * @param {any} record
 * @param {string[]} tokens
 * @param {number} [maxLength]
 */
export function buildSnippet(record, tokens, maxLength = 80) {
	const body = String(record.body ?? '');
	const bodyMatch = findFirstMatch(body, tokens);
	if (bodyMatch) {
		return {
			text: sliceAround(body, bodyMatch.index, bodyMatch.length, maxLength),
			source: 'body',
			hasMatch: true,
		};
	}

	const description = String(record.description ?? '');
	const descriptionMatch = findFirstMatch(description, tokens);
	if (descriptionMatch) {
		return {
			text: sliceAround(description, descriptionMatch.index, descriptionMatch.length, maxLength),
			source: 'description',
			hasMatch: true,
		};
	}

	return {
		text: truncate(description, maxLength),
		source: 'description',
		hasMatch: false,
	};
}

/**
 * @param {string} text
 * @param {number} index
 * @param {number} length
 * @param {number} maxLength
 */
function sliceAround(text, index, length, maxLength) {
	const target = Math.max(40, maxLength);
	const before = Math.floor(target * 0.4);
	let start = Math.max(0, index - before);
	let end = Math.min(text.length, Math.max(index + length, start + target));
	if (end - start < target) start = Math.max(0, end - target);

	let snippet = text.slice(start, end).trim();
	if (start > 0) snippet = `…${snippet}`;
	if (end < text.length) snippet = `${snippet}…`;
	return snippet;
}

/**
 * @param {string} text
 * @param {number} maxLength
 */
function truncate(text, maxLength) {
	if (text.length <= maxLength) return text.trim();
	return `${text.slice(0, maxLength).trim()}…`;
}

/** @param {unknown} text */
export function escapeHtml(text) {
	return String(text ?? '').replace(
		/[&<>"']/g,
		(char) =>
			/** @type {Record<string, string>} */ ({
				'&': '&amp;',
				'<': '&lt;',
				'>': '&gt;',
				'"': '&quot;',
				"'": '&#39;',
			})[char],
	);
}

/**
 * 先转义原文，再对命中片段插入 <mark>，避免 XSS。
 * @param {string} text
 * @param {string[]} tokens
 */
export function highlight(text, tokens) {
	const source = String(text ?? '');
	const { normalized, map } = normalizeWithMap(source);
	const needles = [...new Set(tokens.map(normalize).filter(Boolean))];

	/** @type {[number, number][]} */
	const ranges = [];
	for (const needle of needles) {
		let from = 0;
		while (true) {
			const index = normalized.indexOf(needle, from);
			if (index === -1) break;
			ranges.push([map[index].start, map[index + needle.length - 1].end]);
			from = index + Math.max(1, needle.length);
		}
	}

	if (!ranges.length) return escapeHtml(source);

	ranges.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
	/** @type {[number, number][]} */
	const merged = [];
	for (const range of ranges) {
		const last = merged[merged.length - 1];
		if (last && range[0] < last[1]) {
			last[1] = Math.max(last[1], range[1]);
		} else {
			merged.push([...range]);
		}
	}

	let output = '';
	let cursor = 0;
	for (const [start, end] of merged) {
		output += escapeHtml(source.slice(cursor, start));
		output += `<mark>${escapeHtml(source.slice(start, end))}</mark>`;
		cursor = end;
	}
	output += escapeHtml(source.slice(cursor));
	return output;
}