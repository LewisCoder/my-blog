import { MAX_QUERY_LENGTH, escapeHtml, highlight, prepareIndex, search } from './search-core.js';
import { withBase } from '../utils/url';
import type { SearchIndexRecord } from '../utils/search-index';

interface SearchResult extends SearchIndexRecord {
	score: number;
	matchedTokens: string[];
	snippet: { text: string; source: 'body' | 'description'; hasMatch: boolean };
}

const input = document.querySelector<HTMLInputElement>('#search-input');
const statusEl = document.querySelector<HTMLElement>('#search-status');
const resultsEl = document.querySelector<HTMLOListElement>('#search-results');

if (input && statusEl && resultsEl) {
	let records: SearchResult[] | null = null;
	let indexPromise: Promise<SearchResult[]> | null = null;
	let currentQuery = '';
	let debounceId: number | undefined;

	const setStatus = (html: string) => {
		statusEl.innerHTML = html;
	};

	const renderEmpty = () => {
		resultsEl.replaceChildren();
		setStatus('<span class="text-accent">$</span> grep: 输入查询词开始搜索');
	};

	const renderLoading = () => {
		resultsEl.replaceChildren();
		setStatus('<span class="text-accent">$</span> grep: loading index…');
	};

	const renderNoResults = () => {
		resultsEl.replaceChildren();
		setStatus('grep: no matches found');
	};

	const renderError = () => {
		resultsEl.replaceChildren();
		statusEl.replaceChildren();
		const message = document.createElement('span');
		message.textContent = 'grep: index load failed · ';
		const retry = document.createElement('button');
		retry.type = 'button';
		retry.textContent = 'retry';
		retry.className =
			'rounded border border-edge px-2 py-0.5 font-mono text-[11px] text-slate-400 transition-colors hover:border-accent/40 hover:text-accent';
		retry.addEventListener('click', () => {
			indexPromise = null;
			void runSearch(currentQuery);
		});
		statusEl.append(message, retry);
	};

	const renderResults = (results: SearchResult[]) => {
		const tokens = results[0]?.matchedTokens ?? [];
		const fragment = document.createDocumentFragment();

		results.forEach((result, index) => {
			const item = document.createElement('li');
			const link = document.createElement('a');
			link.href = result.url;
			link.dataset.result = 'true';
			link.className =
				'group grid gap-2 rounded-xl border border-edge bg-panel/40 p-4 no-underline backdrop-blur transition hover:border-accent/40 hover:bg-panel/70';

			const tags = result.tags
				.map((tag) => `#${highlight(tag, tokens)}`)
				.join('<span class="mx-1 text-slate-700">·</span>');

			link.innerHTML = `
				<div class="flex items-baseline gap-3 font-mono">
					<span class="text-[11px] text-slate-600">${String(index + 1).padStart(2, '0')}</span>
					<span class="text-sm font-medium text-slate-100 transition-colors group-hover:text-accent">${highlight(
						result.title,
						tokens,
					)}</span>
				</div>
				<div class="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-slate-500">
					<time datetime="${escapeHtml(result.pubDate)}">${escapeHtml(result.pubDate)}</time>
					${tags ? `<span class="text-slate-700">·</span><span>${tags}</span>` : ''}
				</div>
				<p class="font-mono text-xs leading-6 text-slate-400">${highlight(result.snippet.text, tokens)}</p>
			`;

			item.append(link);
			fragment.append(item);
		});

		resultsEl.replaceChildren(fragment);
		setStatus(`<span class="text-accent">─</span> ${results.length} 条结果 <span class="text-accent">─</span>`);
	};

	const loadIndex = async (): Promise<SearchResult[]> => {
		if (records) return records;
		if (!indexPromise) {
			indexPromise = fetch(withBase('/search-index.json'))
				.then((response) => {
					if (!response.ok) throw new Error(`HTTP ${response.status}`);
					return response.json() as Promise<SearchIndexRecord[]>;
				})
				.then((data) => {
					records = prepareIndex(data) as SearchResult[];
					return records;
				})
				.catch((error) => {
					indexPromise = null;
					throw error;
				});
		}
		return indexPromise;
	};

	const syncUrl = (query: string) => {
		const url = new URL(window.location.href);
		if (query.trim()) {
			url.searchParams.set('q', query);
		} else {
			url.searchParams.delete('q');
		}
		window.history.replaceState(null, '', url);
	};

	const runSearch = async (query: string) => {
		currentQuery = query;
		syncUrl(query);

		if (!query.trim()) {
			renderEmpty();
			return;
		}

		renderLoading();
		try {
			const data = await loadIndex();
			if (currentQuery !== query) return;

			const results = search(data, query) as SearchResult[];
			if (!results.length) {
				renderNoResults();
				return;
			}
			renderResults(results);
		} catch {
			if (currentQuery === query) renderError();
		}
	};

	input.addEventListener('input', () => {
		const value = input.value.slice(0, MAX_QUERY_LENGTH);
		if (input.value !== value) input.value = value;
		window.clearTimeout(debounceId);
		debounceId = window.setTimeout(() => void runSearch(value), 120);
	});

	input.addEventListener('focus', () => {
		void loadIndex().catch(() => undefined);
	});

	input.addEventListener('keydown', (event) => {
		if (event.key === 'Enter') {
			const first = resultsEl.querySelector<HTMLAnchorElement>('a[data-result="true"]');
			if (first) {
				event.preventDefault();
				window.location.assign(first.href);
			}
		}

		if (event.key === 'Escape') {
			event.preventDefault();
			window.clearTimeout(debounceId);
			input.value = '';
			void runSearch('');
			input.focus();
		}
	});

	const params = new URLSearchParams(window.location.search);
	const initialQuery = (params.get('q') ?? '').slice(0, MAX_QUERY_LENGTH).trim();

	if (initialQuery) {
		input.value = initialQuery;
		void runSearch(initialQuery);
	} else {
		renderEmpty();
	}

// 桌面视口自动聚焦；移动端不聚焦，避免打开页面即弹出软键盘
	if (window.matchMedia('(min-width: 768px)').matches) {
		input.focus();
	}
}