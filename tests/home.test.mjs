import test from 'node:test';
import assert from 'node:assert/strict';

import { getHomeStats, getLatestPosts, getPopularTopics } from '../src/utils/home.ts';

test('首页统计汇总文章数、去重标签数与总阅读时长', () => {
	const posts = [
		{
			id: 'chinese-post',
			data: { pubDate: new Date('2026-11-18'), tags: ['Java', '后端'] },
			// 800 个汉字，按 400 字/分钟计为 2 分钟
			body: '字'.repeat(800),
		},
		{
			id: 'english-post',
			data: { pubDate: new Date('2026-11-17'), tags: ['Java', 'Agent'] },
			// 200 个英文词，按 200 词/分钟计为 1 分钟
			body: Array.from({ length: 200 }, () => 'agent').join(' '),
		},
		{
			id: 'empty-post',
			data: { pubDate: new Date('2026-11-16'), tags: ['Java'] },
			// 没有正文时仍计 1 分钟
		},
	];

	assert.deepEqual(getHomeStats(posts), {
		postCount: 3,
		tagCount: 3,
		readingMinutes: 4,
	});

	assert.deepEqual(getHomeStats([]), {
		postCount: 0,
		tagCount: 0,
		readingMinutes: 0,
	});
});

test('热门标签按文章数倒序、同数按名称升序排列', () => {
	const posts = [
		{ id: 'a', data: { pubDate: new Date('2026-11-18'), tags: ['Java', 'Agent'] } },
		{ id: 'b', data: { pubDate: new Date('2026-11-17'), tags: ['Java', 'Agent'] } },
		{ id: 'c', data: { pubDate: new Date('2026-11-16'), tags: ['Java', 'Spring'] } },
		{ id: 'd', data: { pubDate: new Date('2026-11-15'), tags: ['Rust'] } },
	];

	assert.deepEqual(getPopularTopics(posts), [
		{ tag: 'Java', count: 3 },
		{ tag: 'Agent', count: 2 },
		{ tag: 'Rust', count: 1 },
		{ tag: 'Spring', count: 1 },
	]);
});

test('热门标签只返回指定数量', () => {
	const posts = [
		{ id: 'a', data: { pubDate: new Date('2026-11-18'), tags: ['Java', 'Agent'] } },
		{ id: 'b', data: { pubDate: new Date('2026-11-17'), tags: ['Java', 'Agent'] } },
		{ id: 'c', data: { pubDate: new Date('2026-11-16'), tags: ['Java', 'Spring'] } },
	];

	assert.deepEqual(getPopularTopics(posts, 2), [
		{ tag: 'Java', count: 3 },
		{ tag: 'Agent', count: 2 },
	]);
});

test('最新文章按发布时间倒序，同日按 id 升序', () => {
	const posts = [
		{ id: 'b', data: { pubDate: new Date('2026-11-17'), tags: [] } },
		{ id: 'c', data: { pubDate: new Date('2026-11-18'), tags: [] } },
		{ id: 'a', data: { pubDate: new Date('2026-11-17'), tags: [] } },
	];

	assert.deepEqual(
		getLatestPosts(posts).map((post) => post.id),
		['c', 'a', 'b'],
	);
});

test('最新文章只返回指定数量', () => {
	const posts = [
		{ id: 'b', data: { pubDate: new Date('2026-11-17'), tags: [] } },
		{ id: 'c', data: { pubDate: new Date('2026-11-18'), tags: [] } },
		{ id: 'a', data: { pubDate: new Date('2026-11-17'), tags: [] } },
	];

	assert.deepEqual(
		getLatestPosts(posts, 2).map((post) => post.id),
		['c', 'a'],
	);
});