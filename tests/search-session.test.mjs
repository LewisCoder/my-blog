import test from 'node:test';
import assert from 'node:assert/strict';

import { createSearchSession } from '../src/scripts/search-session.js';

const raw = [
	{
		id: 'resume-project',
		title: '成控智能客服 Agent',
		description: '面向面试准备的项目陈述与追问指南。',
		tags: ['面试', 'Agent', '求职'],
		pubDate: '2026-11-17',
		url: '/blog/resume-project/',
		body: '构建智能客服系统，覆盖 Agent 与面试准备。',
	},
	{
		id: 'advanced-agents',
		title: '高级 Agent 能力指南',
		description: 'HITL、Checkpoint 与 Handoff 的接入方式。',
		tags: ['AI', 'Agent', 'HITL'],
		pubDate: '2026-11-17',
		url: '/blog/advanced-agents/',
		body: 'HITL 与 HandoffManager 的当前实现。',
	},
];

const createLoader = (records = raw) => {
	let calls = 0;
	return {
		calls: () => calls,
		load: () => {
			calls += 1;
			return Promise.resolve(records);
		},
	};
};

const createDeferredLoader = (records = raw) => {
	let calls = 0;
	/** @type {(value: any[]) => void} */
	let release = () => {};
	const pending = new Promise((resolve) => {
		release = resolve;
	});
	return {
		calls: () => calls,
		load: () => {
			calls += 1;
			return pending;
		},
		resolve: () => release(records),
	};
};

test('空查询不加载索引，状态为空', async () => {
	const loader = createLoader();
	const session = createSearchSession({ loadIndex: loader.load });

	assert.equal(session.getState().status, 'empty');

	await session.start('   ');

	assert.equal(session.getState().status, 'empty');
	assert.deepEqual(session.getState().results, []);
	assert.equal(loader.calls(), 0);
});

test('首次查询先进入加载中，索引返回后返回命中结果', async () => {
	const loader = createDeferredLoader();
	const session = createSearchSession({ loadIndex: loader.load });

	const pending = session.start('智能');

	assert.equal(session.getState().status, 'loading');
	assert.equal(session.getState().query, '智能');
	assert.equal(loader.calls(), 1);

	loader.resolve();
	await pending;

	const state = session.getState();
	assert.equal(state.status, 'results');
	assert.equal(state.query, '智能');
	assert.deepEqual(
		state.results.map((result) => result.id),
		['resume-project'],
	);
	assert.equal(state.activeIndex, 0);
});

test('无命中进入 none 状态且没有选中项', async () => {
	const loader = createLoader();
	const session = createSearchSession({ loadIndex: loader.load });

	await session.start('不存在的查询词');

	const state = session.getState();
	assert.equal(state.status, 'none');
	assert.deepEqual(state.results, []);
	assert.equal(state.activeIndex, -1);
});

test('索引加载失败进入 error，下一次查询重新加载', async () => {
	let calls = 0;
	let shouldFail = true;
	const loadIndex = () => {
		calls += 1;
		return shouldFail ? Promise.reject(new Error('boom')) : Promise.resolve(raw);
	};
	const session = createSearchSession({ loadIndex });

	await session.start('智能');
	assert.equal(session.getState().status, 'error');
	assert.equal(calls, 1);

	shouldFail = false;
	await session.start('智能');

	assert.equal(calls, 2);
	assert.equal(session.getState().status, 'results');
});

test('并发查询共享同一次索引加载', async () => {
	const loader = createDeferredLoader();
	const session = createSearchSession({ loadIndex: loader.load });

	const first = session.start('智能');
	const second = session.start('Agent 面试');

	assert.equal(loader.calls(), 1);

	loader.resolve();
	await Promise.all([first, second]);
	assert.equal(loader.calls(), 1);
	assert.equal(session.getState().query, 'Agent 面试');
	assert.deepEqual(
		session.getState().results.map((result) => result.id),
		['resume-project'],
	);
});

test('索引缓存后再次查询同步出结果，跳过加载态', async () => {
	const loader = createLoader();
	/** @type {any[]} */
	const states = [];
	const session = createSearchSession({
		loadIndex: loader.load,
		onChange: (state) => states.push(state),
	});

	await session.start('智能');
	states.length = 0;

	await session.start('Agent 面试');

	assert.equal(states[0].status, 'results');
	assert.equal(states[0].query, 'Agent 面试');
	assert.deepEqual(
		session.getState().results.map((result) => result.id),
		['resume-project'],
	);
	assert.equal(loader.calls(), 1);
});

test('方向键在结果间循环移动选中项', async () => {
	const session = createSearchSession({ loadIndex: createLoader().load });
	await session.start('Agent');

	assert.equal(session.getState().results.length, 2);
	assert.equal(session.getState().activeIndex, 0);

	session.moveActive(1);
	assert.equal(session.getState().activeIndex, 1);
	session.moveActive(1);
	assert.equal(session.getState().activeIndex, 0);
	session.moveActive(-1);
	assert.equal(session.getState().activeIndex, 1);
});

test('getActiveResult 返回当前选中结果，无结果时为 null', async () => {
	const session = createSearchSession({ loadIndex: createLoader().load });
	assert.equal(session.getActiveResult(), null);

	await session.start('Agent');
	assert.equal(session.getActiveResult().id, 'resume-project');

	await session.start('不存在的查询词');
	assert.equal(session.getActiveResult(), null);
});

test('reset 清空查询与结果，并忽略迟到的索引结果', async () => {
	const loader = createDeferredLoader();
	const session = createSearchSession({ loadIndex: loader.load });

	const pending = session.start('智能');
	session.reset();
	loader.resolve();
	await pending;

	const state = session.getState();
	assert.equal(state.status, 'empty');
	assert.equal(state.query, '');
	assert.deepEqual(state.results, []);
	assert.equal(state.activeIndex, -1);
});

test('查询长度截断到 120 个字符', async () => {
	const session = createSearchSession({ loadIndex: createLoader([]).load });

	await session.start('a'.repeat(500));

	assert.equal(session.getState().query.length, 120);
});

test('preload 提前加载索引，之后的查询不重复请求', async () => {
	const loader = createLoader();
	/** @type {any[]} */
	const states = [];
	const session = createSearchSession({
		loadIndex: loader.load,
		onChange: (state) => states.push(state),
	});

	await session.preload();
	states.length = 0;
	await session.start('智能');

	assert.equal(loader.calls(), 1);
	assert.equal(states[0].status, 'results');
	assert.deepEqual(
		session.getState().results.map((result) => result.id),
		['resume-project'],
	);
});

test('preload 失败不抛出，后续查询会重试', async () => {
	let calls = 0;
	const session = createSearchSession({
		loadIndex: () => {
			calls += 1;
			return calls === 1 ? Promise.reject(new Error('boom')) : Promise.resolve(raw);
		},
	});

	await session.preload();
	await session.start('智能');

	assert.equal(calls, 2);
	assert.equal(session.getState().status, 'results');
});