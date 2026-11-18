import type { APIRoute } from 'astro';
import { getPublishedPosts } from '../utils/posts';
import { markdownToSearchText, type SearchIndexRecord } from '../utils/search-index';
import { withBase } from '../utils/url';

/** 构建期生成站内搜索索引：只包含已发布文章。 */
export const GET: APIRoute = async () => {
	const posts = await getPublishedPosts();
	const index: SearchIndexRecord[] = posts.map((post) => ({
		id: post.id,
		title: post.data.title,
		description: post.data.description,
		tags: post.data.tags,
		pubDate: post.data.pubDate.toISOString().slice(0, 10),
		url: withBase(`/blog/${post.id}/`),
		body: markdownToSearchText(post.body ?? ''),
	}));

	return new Response(JSON.stringify(index), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};