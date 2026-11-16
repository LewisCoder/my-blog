---
title: '用 Astro + Tailwind 搭建一个纯静态博客'
description: '记录这个博客的技术栈、目录结构与部署方式，供同样想搭博客的朋友参考。'
pubDate: '2026-11-10'
heroImage: '../../assets/blog-placeholder-2.jpg'
---

这个博客没有数据库、没有后端服务，所有文章都是仓库里的 Markdown 文件，构建后得到一组纯静态页面。下面记录一下具体的做法。

## 技术栈

| 技术 | 作用 |
| --- | --- |
| Astro | 静态站点构建、路由、内容集合 |
| TypeScript | 类型检查与更好的编辑器提示 |
| Tailwind CSS | 原子化样式 |
| Markdown | 文章内容 |

## 内容集合

Astro 的内容集合（Content Collections）负责读取 `src/content/blog/` 下的 Markdown 文件，并用 Zod 校验 Frontmatter：

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
		}),
});
```

字段类型写错时，构建阶段就会直接报错，不用担心发布出去才发现问题。

## 常用命令

```bash
npm install      # 安装依赖
npm run dev      # 本地开发，默认 http://localhost:4321
npm run build    # 构建静态站点到 dist/
npm run preview  # 本地预览构建结果
```

## 部署

`npm run build` 之后，`dist/` 目录就是完整的静态站点，可以部署到任何静态托管服务：

- Vercel / Netlify：导入仓库即可，构建命令填 `npm run build`
- GitHub Pages：将 `dist/` 推送到 Pages 分支
- 自己的服务器：把 `dist/` 交给 Nginx 之类的静态服务器

## 小结

少了数据库和运维，博客的维护成本几乎为零：写 Markdown、提交、推送，剩下的交给构建流程。对个人博客来说，这已经足够了。