# 我的博客

基于 **Astro + TypeScript + Tailwind CSS** 的个人博客。文章使用本地 Markdown 文件管理，没有数据库、没有后端服务，构建后是一组纯静态页面。

## 技术栈

- [Astro](https://astro.build/) —— 静态站点构建、路由、内容集合
- TypeScript —— 严格类型检查
- Tailwind CSS v4 —— 原子化样式（含 `@tailwindcss/typography` 文章排版）
- Markdown —— 文章内容

## 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器，默认 http://localhost:4321
npm run build    # 构建静态站点到 dist/
npm run preview  # 本地预览构建结果
```

## 目录结构

```text
src/
├── assets/             # 图片与字体
├── components/         # 公共组件（页头、页脚、文章卡片等）
├── content/blog/       # 博客文章（Markdown）
├── layouts/            # BaseLayout / BlogPost 布局
├── pages/              # 路由页面（首页、文章列表、详情、关于、404）
├── styles/global.css   # Tailwind 入口与主题配置
├── consts.ts           # 站点名称、描述、作者
└── content.config.ts   # 内容集合与 Frontmatter 校验
```

## 写新文章

在 `src/content/blog/` 目录下新建一个 `.md` 文件：

```markdown
---
title: '文章标题'
description: '一句话摘要，会显示在列表页'
pubDate: '2026-11-16'
updatedDate: '2026-11-20'
heroImage: '../../assets/blog-placeholder-1.jpg'
---

正文内容……
```

- `title`、`description`、`pubDate` 为必填项
- `updatedDate`、`heroImage` 为可选项（`heroImage` 需引用 `src/assets/` 下的图片）
- 文件名即 URL：`hello-world.md` → `/blog/hello-world/`

保存后首页、文章列表与 RSS 会自动更新。

## 自定义

- 站点名称、描述、作者：修改 `src/consts.ts`
- 站点域名（影响 RSS 与 sitemap）：修改 `astro.config.mjs` 中的 `site`
- 导航菜单：修改 `src/components/Header.astro`
- 关于页内容：修改 `src/pages/about.astro`
- 配色与排版：直接调整各 `.astro` 文件中的 Tailwind 类名，或修改 `src/styles/global.css` 中的主题变量

## 部署

`npm run build` 后，`dist/` 目录即为完整静态站点，可部署到 Vercel、Netlify、GitHub Pages 或任意静态服务器（如 Nginx）。