# Proposal

## Why

读者目前只能按时间列表或标签浏览文章，无法直接定位正文中的术语（如「智能客服」「Pagefind」）。站点部署在 GitHub Pages 纯静态托管、没有后端，需要在不引入外部搜索服务的前提下提供站内搜索。

## What Changes

- 新增独立搜索页 `/search/`，页头导航加入口，进入后输入框自动聚焦。
- 构建时生成 `/search-index.json`：仅含已发布文章的标题、摘要、标签、发布日期、URL 与正文纯文本（保留代码标识符）。
- 浏览器端零依赖搜索：`Intl.Segmenter` 中文分词，缺失时降级为汉字 bigram + 子串匹配；多个查询词 AND 匹配；标题/标签/摘要/正文加权排序；命中上下文摘要与高亮。
- 查询同步到 `?q=` 深链（上限 120 字符）；Enter 打开首条结果，Esc 清空并保持焦点；空查询与无结果使用终端式文案。
- 不新增 npm 依赖，不改变构建脚本。
- 明确不做：自动补全、搜索历史、按标签筛选、拼音搜索、搜索统计、分页。

## Capabilities

### New Capabilities

- `blog-search`: 站内文章搜索的可观察行为——索引内容边界、中文查询匹配与排序、结果呈现、空状态、深链与键盘交互。

### Modified Capabilities

（无）

## Impact

- 新增：`src/pages/search.astro`（搜索页）、`src/pages/search-index.json.ts`（构建期索引端点）、搜索匹配与渲染脚本。
- 修改：`src/components/Header.astro`（新增导航项）。
- 依赖：无新增运行时或构建期依赖。
- 产物：新增 `/search/` 页面与 `/search-index.json`；索引预算 ≤30KB gzip。
- 现有文章列表、标签页与 RSS 行为不变；sitemap 按现有规则新增 `/search/`；草稿继续不进入搜索结果与这些输出。