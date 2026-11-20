import { getReadingTime } from './reading-time.ts';

/** 首页只需要这些字段，便于在不依赖 astro:content 的环境中测试。 */
export interface HomePost {
	id: string;
	data: {
		pubDate: Date;
		tags: readonly string[];
	};
	body?: string;
}

export interface HomeStats {
	postCount: number;
	tagCount: number;
	readingMinutes: number;
}

/** 汇总首页展示的文章数、去重标签数与总阅读时长。 */
export function getHomeStats(posts: readonly HomePost[]): HomeStats {
	const tags = new Set<string>();
	let readingMinutes = 0;

	for (const post of posts) {
		for (const tag of post.data.tags) tags.add(tag);
		readingMinutes += getReadingTime(post.body);
	}

	return { postCount: posts.length, tagCount: tags.size, readingMinutes };
}

export interface Topic {
	tag: string;
	count: number;
}

/** 收集标签及其文章数，按文章数倒序、名称升序排列。 */
export function getPopularTopics(
	posts: readonly HomePost[],
	limit = Number.POSITIVE_INFINITY,
): Topic[] {
	const counts = new Map<string, number>();

	for (const post of posts) {
		for (const tag of post.data.tags) {
			counts.set(tag, (counts.get(tag) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'))
		.slice(0, limit);
}

/** 按发布时间倒序排列文章，同一天按 id 升序，保证输出稳定。 */
export function getLatestPosts<T extends HomePost>(
	posts: readonly T[],
	limit = Number.POSITIVE_INFINITY,
): T[] {
	return [...posts]
		.sort(
			(a, b) =>
				b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id),
		)
		.slice(0, limit);
}