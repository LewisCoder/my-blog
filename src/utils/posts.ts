import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

/** 只返回已发布（非草稿）的文章，按发布时间倒序。 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
	const posts = await getCollection('blog', ({ data }) => !data.draft);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** 收集全部标签及其文章数，按文章数倒序、名称升序排列。 */
export function collectTags(posts: BlogPost[]): { tag: string; count: number }[] {
	const counts = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.data.tags) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}
	return [...counts.entries()]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'));
}