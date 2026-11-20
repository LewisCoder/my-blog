/**
 * 搜索浮层的会话状态：查询生命周期、结果状态与键盘选择。
 * 不依赖 DOM，通过注入的索引加载器取数据，可直接用 Node 测试运行器覆盖。
 */

import { MAX_QUERY_LENGTH, prepareIndex, search } from './search-core.js';

/**
 * @param {{ loadIndex: () => Promise<any[]>, onChange?: (state: any) => void }} options
 */
export function createSearchSession({ loadIndex, onChange = () => {} }) {
	/** @type {any} */
	let state = { status: 'empty', query: '', results: [], activeIndex: -1 };
	/** @type {any[] | null} */
	let records = null;
	/** @type {Promise<any[]> | null} */
	let indexPromise = null;
	let generation = 0;

	/** @param {any} patch */
	const setState = (patch) => {
		state = { ...state, ...patch };
		onChange(state);
	};

	const loadRecords = () => {
		if (records) return Promise.resolve(records);
		if (!indexPromise) {
			indexPromise = loadIndex()
				.then((data) => {
					records = prepareIndex(data);
					return records;
				})
				.catch((error) => {
					indexPromise = null;
					throw error;
				});
		}
		return indexPromise;
	};

	/**
	 * @param {string} query
	 * @param {any[]} data
	 */
	const finish = (query, data) => {
		const results = search(data, query);
		setState({
			status: results.length ? 'results' : 'none',
			query,
			results,
			activeIndex: results.length ? 0 : -1,
		});
	};

	return {
		getState() {
			return state;
		},
		/**
		 * @param {string} query
		 */
		async start(query) {
			const current = ++generation;
			const capped = String(query ?? '').slice(0, MAX_QUERY_LENGTH);
			if (!capped.trim()) {
				setState({ status: 'empty', query: '', results: [], activeIndex: -1 });
				return;
			}

			if (records) {
				finish(capped, records);
				return;
			}

			setState({ status: 'loading', query: capped, results: [], activeIndex: -1 });

			/** @type {any[]} */
			let data;
			try {
				data = await loadRecords();
			} catch {
				if (current === generation) setState({ status: 'error', results: [], activeIndex: -1 });
				return;
			}

			if (current !== generation) return;
			finish(capped, data);
		},
		async preload() {
			try {
				await loadRecords();
			} catch {
				// 预加载失败留给正式查询重试，不打扰读者
			}
		},
		/** @param {number} delta */
		moveActive(delta) {
			if (!state.results.length) return state;
			const next = (state.activeIndex + delta + state.results.length) % state.results.length;
			setState({ activeIndex: next });
			return state;
		},
		getActiveResult() {
			return state.results[state.activeIndex] ?? null;
		},
		reset() {
			generation += 1;
			setState({ status: 'empty', query: '', results: [], activeIndex: -1 });
		},
	};
}