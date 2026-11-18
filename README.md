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
npm test         # 运行搜索逻辑单元测试
```

## 目录结构

```text
src/
├── assets/             # 图片与字体
├── components/         # 公共组件（页头、页脚、文章卡片等）
├── content/blog/       # 博客文章（Markdown）
├── layouts/            # BaseLayout / BlogPost 布局
├── pages/              # 路由页面（首页、文章列表、详情、标签、搜索、关于、404）
├── scripts/            # 客户端脚本（站内搜索）
├── styles/global.css   # Tailwind 入口与主题配置
├── utils/              # 文章查询、URL 与索引构建工具
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
tags: ['AI', '随笔']
draft: false
---

正文内容……
```

- `title`、`description`、`pubDate` 为必填项
- `updatedDate`、`heroImage` 为可选项（`heroImage` 需引用 `src/assets/` 下的图片）
- `tags` 为标签数组，会自动生成 `/tags/` 标签页
- `draft: true` 的草稿不会出现在列表、标签页和 RSS 中
- 文件名即 URL：`hello-world.md` → `/blog/hello-world/`

文章页会自动生成目录（TOC）、阅读时长、上一篇/下一篇导航，代码块支持一键复制；给代码块写行号区间（如 ` ```js {2-3} `）可高亮对应行。

保存后首页、文章列表、RSS 与站内搜索索引会自动更新。

## 站内搜索

搜索页位于 `/search/`，完全在浏览器本地执行，没有后端服务。

- 构建时由 `src/pages/search-index.json.ts` 生成 `dist/search-index.json`，收录全部已发布文章的标题、摘要、标签、日期、链接与去除 Markdown 标记后的正文
- 打开搜索页时不加载索引，首次聚焦输入框或输入查询词时才按需请求，之后缓存在内存中
- 支持中文分词（`Intl.Segmenter`，不支持时降级为汉字 bigram）与多个查询词 AND 匹配；结果按标题、标签、摘要、正文加权排序
- 查询词最长 120 个字符，并同步到 URL 的 `?q=` 参数，可直接分享搜索结果
- 草稿与关于页不会进入索引

## 自定义

- 站点名称、描述、作者：修改 `src/consts.ts`
- 站点域名（影响 RSS 与 sitemap）：修改 `astro.config.mjs` 中的 `site`
- 导航菜单：修改 `src/components/Header.astro`
- 关于页内容：修改 `src/pages/about.astro`
- 配色与排版：直接调整各 `.astro` 文件中的 Tailwind 类名，或修改 `src/styles/global.css` 中的主题变量

## 部署

`npm run build` 后，`dist/` 目录即为完整静态站点，可部署到 Vercel、Netlify、GitHub Pages 或任意静态服务器（如 Nginx）。

### GitHub Pages

推送到 `main` 分支后，`.github/workflows/deploy.yml` 会自动构建并发布到 GitHub Pages：

<https://zhongliwen.com/>

站点使用自定义域名，域名由 `public/CNAME` 指定。首次使用需在仓库 **Settings → Pages → Build and deployment** 中把 **Source** 设为 **GitHub Actions**。仓库需为公开（Public），免费的 GitHub Pages 才能对外访问。