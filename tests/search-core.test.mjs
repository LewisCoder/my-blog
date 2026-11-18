import test from 'node:test';
import assert from 'node:assert/strict';

import {
	MAX_QUERY_LENGTH,
	escapeHtml,
	highlight,
	normalize,
	prepareIndex,
	search,
	tokenize,
} from '../src/scripts/search-core.js';

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
	{
		id: 'ai-workflow',
		title: 'AI 工作流项目建设 Todo',
		description: 'dev-flow 建设任务清单。',
		tags: ['AI', '工作流', 'Agent'],
		pubDate: '2026-11-17',
		url: '/blog/ai-workflow/',
		body: '工作流编排与智能体协作。',
	},
];

const index = prepareIndex(raw);
const ids = (results) => results.map((item) => item.id);

test('归一化忽略大小写与全半角', () => {
	assert.equal(normalize('ＡＧＥＮＴ'), 'agent');
	assert.equal(normalize('Agent'), 'agent');
});

test('降级分词为中文 bigram 与拉丁词', () => {
	const tokens = tokenize('智能客服 Agent', false);
	assert.ok(tokens.includes('智能'));
	assert.ok(tokens.includes('能客'));
	assert.ok(tokens.includes('客服'));
	assert.ok(tokens.includes('agent'));
});

test('正文全角字符可被半角查询命中', () => {
	const fixture = prepareIndex([
		{ id: 'fullwidth', title: '全角', description: '', tags: [], pubDate: '2026-11-17', body: '正文提到 ＡＧＥＮＴ。' },
	]);
	const [result] = search(fixture, 'agent');
	assert.deepEqual(ids([result]), ['fullwidth']);
	assert.equal(result.snippet.source, 'body');
	assert.deepEqual(ids(search(fixture, 'ＡＧＥＮＴ')), ['fullwidth']);
});

test('全角与大小写差异不影响高亮定位', () => {
	assert.equal(highlight('正文提到 ＡＧＥＮＴ。', ['agent']), '正文提到 <mark>ＡＧＥＮＴ</mark>。');
	assert.equal(highlight('Use Agent now', ['AGENT']), 'Use <mark>Agent</mark> now');
});

test('多个查询词 AND 匹配', () => {
	assert.deepEqual(ids(search(index, 'Agent 面试')), ['resume-project']);
	assert.ok(ids(search(index, 'Agent')).length > 1);
});

test('无空格中文查询可命中正文', () => {
	const results = search(index, '智能');
	assert.ok(ids(results).includes('resume-project'));
	assert.ok(ids(results).includes('ai-workflow'));
});

test('标题命中排在正文命中之前', () => {
	const fixture = prepareIndex([
		{ id: 'body-only', title: '乙', description: '', tags: [], pubDate: '2026-11-17', body: 'alpha' },
		{ id: 'title-hit', title: 'alpha', description: '', tags: [], pubDate: '2026-11-17', body: '' },
	]);
	assert.deepEqual(ids(search(fixture, 'alpha')), ['title-hit', 'body-only']);
});

test('同分同日期按 id 升序稳定排序', () => {
	const fixture = prepareIndex([
		{ id: 'z-post', title: '同名', description: '共同词', tags: [], pubDate: '2026-11-17', body: '' },
		{ id: 'a-post', title: '同名', description: '共同词', tags: [], pubDate: '2026-11-17', body: '' },
	]);
	assert.deepEqual(ids(search(fixture, '共同词')), ['a-post', 'z-post']);
});

test('正文命中时摘要围绕命中位置', () => {
	const [result] = search(index, '智能');
	assert.equal(result.snippet.source, 'body');
	assert.equal(result.snippet.hasMatch, true);
	assert.ok(result.snippet.text.includes('智能'));
});

test('仅标签命中时退回文章摘要', () => {
	const [result] = search(index, '求职');
	assert.equal(result.snippet.source, 'description');
	assert.equal(result.snippet.hasMatch, false);
	assert.ok(result.snippet.text.startsWith('面向面试准备'));
});

test('高亮先转义再插入 mark', () => {
	const html = highlight('Use <script> now', ['<script>']);
	assert.ok(html.includes('&lt;script&gt;'));
	assert.ok(html.includes('<mark>'));
	assert.ok(!html.includes('<script>'));
});

test('正常高亮中文命中的词', () => {
	assert.equal(highlight('智能客服 Agent', ['智能']), '<mark>智能</mark>客服 Agent');
});

test('转义 HTML 特殊字符', () => {
	assert.equal(escapeHtml('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
});

test('查询长度被限制', () => {
	assert.equal(MAX_QUERY_LENGTH, 120);
	assert.doesNotThrow(() => search(index, 'a'.repeat(500)));
});

test('空查询返回空结果', () => {
	assert.deepEqual(search(index, '   '), []);
});

test('摘要长度受控', () => {
	const long = prepareIndex([
		{
			id: 'long',
			title: '长文',
			description: '摘要',
			tags: [],
			pubDate: '2026-11-17',
			body: `${'前'.repeat(200)}目标词${'后'.repeat(200)}`,
		},
	]);
	const [result] = search(long, '目标词');
	assert.ok(result.snippet.text.length <= 90, result.snippet.text.length);
	assert.ok(result.snippet.text.includes('目标词'));
});