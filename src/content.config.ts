import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 从 `src/content/blog/` 目录加载全部 Markdown 文章。
const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
	// 用 Zod 校验文章 Frontmatter
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// 将字符串自动转换为 Date 对象
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});

export const collections = { blog };