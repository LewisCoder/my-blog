import { MAX_QUERY_LENGTH, escapeHtml, highlight } from './search-core.js';
import { createSearchSession } from './search-session.js';
import type { SearchIndexRecord } from '../utils/search-index';
import { withBase } from '../utils/url';

interface SearchResult extends SearchIndexRecord {
	score: number;
	matchedTokens: string[];
	snippet: { text: string; source: 'body' | 'description'; hasMatch: boolean };
}

interface SearchState {
	status: 'empty' | 'loading' | 'results' | 'none' | 'error';
	query: string;
	results: SearchResult[];
	activeIndex: number;
}

const dialogNode = document.querySelector<HTMLDialogElement>('[data-search-dialog]');
const inputNode = document.querySelector<HTMLInputElement>('#search-input');
const statusNode = document.querySelector<HTMLElement>('#search-status');
const resultsNode = document.querySelector<HTMLOListElement>('#search-results');
const triggers = document.querySelectorAll<HTMLElement>('[data-search-open]');

if (dialogNode && inputNode && statusNode && resultsNode) {
	const dialog = dialogNode;
	const input = inputNode;
	const statusEl = statusNode;
	const resultsEl = resultsNode;
	const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
	document.querySelectorAll<HTMLElement>('[data-search-shortcut]').forEach((el) => {
		el.textContent = isMac ? '⌘' : 'Ctrl';
	});

	let debounceId: number | undefined;

	const session = createSearchSession({
		loadIndex: async () => {
			const response = await fetch(withBase('/search-index.json'));
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			return response.json();
		},
		onChange: (state: SearchState) => render(state),
	});

	const setStatus = (html: string) => {
		statusEl.innerHTML = html;
	};

	const hideResults = () => {
		resultsEl.replaceChildren();
		resultsEl.classList.add('hidden');
		input.removeAttribute('aria-activedescendant');
	};

	function renderEmpty() {
		hideResults();
		setStatus('<span class="text-accent">$</span> grep: 输入查询词开始搜索');
	}

	function renderLoading() {
		hideResults();
		setStatus('<span class="text-accent">$</span> grep: loading index…');
	}

	function renderNoResults() {
		hideResults();
		setStatus('grep: no matches found');
	}

	function renderError() {
		hideResults();
		statusEl.replaceChildren();
		const message = document.createElement('span');
		message.textContent = 'grep: index load failed · ';
		const retry = document.createElement('button');
		retry.type = 'button';
		retry.textContent = 'retry';
		retry.className =
			'rounded border border-edge px-2 py-0.5 font-mono text-[11px] text-slate-400 transition-colors hover:border-accent/40 hover:text-accent';
		retry.addEventListener('click', () => {
			void session.start(session.getState().query);
		});
		statusEl.append(message, retry);
	}

	function renderResults(state: SearchState) {
		const tokens = state.results[0]?.matchedTokens ?? [];
		const fragment = document.createDocumentFragment();

		state.results.forEach((result, index) => {
			const item = document.createElement('li');
			const link = document.createElement('a');
			const active = index === state.activeIndex;

			link.href = result.url;
			link.id = `search-result-${index}`;
			link.dataset.result = 'true';
			if (active) link.dataset.active = 'true';
			link.className = `group grid gap-1.5 rounded-lg border p-3 no-underline transition ${
				active
					? 'border-accent/50 bg-accent/10'
					: 'border-transparent hover:border-edge hover:bg-panel-2/60'
			}`;

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
				<p class="line-clamp-2 font-mono text-xs leading-6 text-slate-400">${highlight(
					result.snippet.text,
					tokens,
				)}</p>
			`;

			item.append(link);
			fragment.append(item);
		});

		resultsEl.replaceChildren(fragment);
		resultsEl.classList.remove('hidden');
		input.setAttribute('aria-activedescendant', `search-result-${state.activeIndex}`);
		setStatus(
			`<span class="text-accent">─</span> ${state.results.length} 条结果 <span class="text-accent">─</span>`,
		);

		resultsEl
			.querySelector<HTMLElement>('[data-active="true"]')
			?.scrollIntoView({ block: 'nearest' });
	}

	function render(state: SearchState) {
		switch (state.status) {
			case 'empty':
				renderEmpty();
				break;
			case 'loading':
				renderLoading();
				break;
			case 'none':
				renderNoResults();
				break;
			case 'error':
				renderError();
				break;
			case 'results':
				renderResults(state);
				break;
		}
	}

	const syncUrl = (query: string) => {
		const url = new URL(window.location.href);
		if (query.trim()) {
			url.searchParams.set('q', query);
		} else {
			url.searchParams.delete('q');
		}
		window.history.replaceState(null, '', url);
	};

	const openDialog = (query = '', { focusInput = true } = {}) => {
		if (!dialog.open) dialog.showModal();
		input.value = query;
		void session.start(query);
		void session.preload();
		syncUrl(query);
		if (focusInput) {
			input.focus();
			input.select();
		}
	};

	const closeDialog = () => {
		if (dialog.open) dialog.close();
	};

	dialog.addEventListener('close', () => {
		window.clearTimeout(debounceId);
		session.reset();
		syncUrl('');
		input.value = '';
		triggers[0]?.focus({ preventScroll: true });
	});

	dialog.addEventListener('click', (event) => {
		if (event.target === dialog) closeDialog();
	});

	dialog.querySelector<HTMLElement>('[data-search-close]')?.addEventListener('click', closeDialog);

	triggers.forEach((trigger) => {
		trigger.addEventListener('click', () => openDialog());
	});

	document.addEventListener('keydown', (event) => {
		if (event.defaultPrevented) return;
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			if (dialog.open) {
				closeDialog();
			} else {
				openDialog();
			}
		}
	});

	input.addEventListener('input', () => {
		const value = input.value.slice(0, MAX_QUERY_LENGTH);
		if (input.value !== value) input.value = value;
		window.clearTimeout(debounceId);
		debounceId = window.setTimeout(() => {
			syncUrl(value);
			void session.start(value);
		}, 120);
	});

	input.addEventListener('keydown', (event) => {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			if (!session.getState().results.length) return;
			event.preventDefault();
			session.moveActive(event.key === 'ArrowDown' ? 1 : -1);
			return;
		}

		if (event.key === 'Enter') {
			const current = input.value.slice(0, MAX_QUERY_LENGTH).trim();
			if (session.getState().query !== current) {
				// 防抖尚未结束：先执行当前输入，避免打开旧结果
				event.preventDefault();
				window.clearTimeout(debounceId);
				syncUrl(current);
				void session.start(current);
				return;
			}

			const active = session.getActiveResult() as SearchResult | null;
			if (!active) return;
			event.preventDefault();
			window.location.assign(active.url);
			return;
		}

		if (event.key === 'Escape') {
			event.preventDefault();
			closeDialog();
		}
	});

	const params = new URLSearchParams(window.location.search);
	const initialQuery = (params.get('q') ?? '').slice(0, MAX_QUERY_LENGTH).trim();
	if (initialQuery) {
		openDialog(initialQuery, { focusInput: window.matchMedia('(min-width: 768px)').matches });
	}
}