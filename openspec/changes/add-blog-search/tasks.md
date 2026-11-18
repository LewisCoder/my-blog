# Tasks

## 1. 构建期索引

- [x] 1.1 在 `src/utils/search-index.ts` 实现 Markdown 去标记：去除围栏、标题符、强调符、链接与图片语法、HTML 标签，保留代码文本与标识符；验证：`npm run build` 后检查 `dist/search-index.json`，`body` 中不含 ``` 与 `##`，且含 `HandoffManager`（来自 advanced-agents-guide 的代码块）。
- [x] 1.2 在 `src/pages/search-index.json.ts` 实现静态端点，使用 `getPublishedPosts()` 产出 `id/title/description/tags/pubDate/url/body` 字段，其中 `url` 经 `withBase()` 生成；验证：`npm run build` 后 `dist/search-index.json` 存在、含 3 篇已发布文章，且记录的 `url` 为 `/blog/<id>/`。
- [x] 1.3 验证草稿隔离：临时新增一篇 `draft: true` 的文章（含唯一查询词），构建后确认索引中无其记录，随后删除该临时文件。
- [x] 1.4 验证索引体积：执行 `gzip -c dist/search-index.json | wc -c`，结果不超过 30720 字节；若超出，依次压缩连续空白、去除代码注释后重测；仍超出则停止实现并向用户报告，不得删减正文内容。

## 2. 搜索页骨架与导航

- [x] 2.1 新增 `src/pages/search.astro`（终端风格骨架：`// search`、`$ grep "…" ./posts`、输入框、结果容器、状态提示容器）与占位 `src/scripts/blog-search.ts`（空初始化），页面以 `<script>` 导入占位脚本；验证：`npm run dev` 下 `/search/` 正常渲染、控制台无错误，且网络面板未请求索引。
- [x] 2.2 在 `src/components/Header.astro` 的「标签」与「关于」之间新增「搜索」导航项（使用 `HeaderLink` 与 `withBase()`）；验证：桌面与移动端导航可见，当前页 active 样式正确。

## 3. 客户端搜索逻辑

- [x] 3.1 在 `src/scripts/blog-search.ts` 实现查询与索引字段两侧的归一化（NFKC + 小写）与分词（查询时检测 `Intl.Segmenter`，优先分词；缺失时降级为汉字 bigram + 拉丁词切分）；验证：在 `/search/` 分别搜索「agent」「ＡＧＥＮＴ」「Agent」，三者结果一致；临时把某篇文章正文改成全角「ＡＧＥＮＴ」后构建，半角查询仍能命中，随后还原。
- [x] 3.2 实现 AND 匹配与加权排序（标题×10、标签×6、摘要×3、正文×1，同分按 `pubDate` 倒序、再按 `id` 升序）；验证：搜索「智能」命中《成控智能客服 Agent》，搜索「Agent 面试」仅返回《成控智能客服 Agent》；同一查询连续刷新 3 次，结果顺序完全一致且同日期时按 id 升序。
- [x] 3.3 实现上下文文本与高亮：正文命中优先截取命中位置前后约 60–80 字符；正文无命中时使用文章摘要；标题与标签中的命中同样高亮；所有文本先转义再插入 `<mark>`；验证：搜索「智能」时上下文包含该词及前后文；搜索「求职」时展示该篇摘要并高亮标签；搜索 `<script>` 时以文本形式显示且无元素被构造。
- [x] 3.4 实现索引懒加载（首次聚焦、输入或带 `q` 深链时请求一次、内存缓存）与三态文案（空查询 / 加载中 / 无结果）；验证：首次打开 `/search/` 时网络面板无索引请求，输入后出现且只出现一次；直接打开 `/search/?q=智能` 时立即请求索引并出结果。
- [x] 3.5 实现 `?q=` 同步（`replaceState`、空查询移除、120 字符上限与深链截断）与键盘交互（Enter 打开首条、Esc 清空并保持焦点）；验证：输入后 URL 出现 `q`；打开超长 `q` 链接时只执行前 120 个字符；按 Enter 进入首篇文章；按 Esc 清空且焦点仍在输入框。
- [x] 3.6 验证分词降级路径：在浏览器控制台于查询前覆盖 `Intl.Segmenter = undefined`（实现为查询时检测），输入「智能」「Agent 面试」；验证：结果与正常路径一致，控制台无错误。

## 4. 可访问性与文档

- [x] 4.1 补齐可访问性：输入框可见 label、结果计数 `aria-live="polite"`、结果为可聚焦原生链接；验证：Tab 可从输入框移动到首条结果，浏览器可访问性树中能读到结果数量。
- [x] 4.2 更新 `README.md` 的目录结构与「自定义」说明，记录搜索页、索引生成方式与查询长度上限；验证：README 中描述的路径、命令与实际一致。

## 5. 集成验收

- [x] 5.1 执行 `npm run build`，验证构建成功、`dist/search/` 与 `dist/search-index.json` 存在，既有列表、标签、文章、RSS 路由照常生成，且 `dist/sitemap-0.xml` 包含 `/search/`。
- [x] 5.2 按 `specs/blog-search/spec.md` 的场景逐条走查（入口、范围、字段、中文匹配、归一化、排序、呈现、安全、状态、深链、键盘、性能、既有输出），全部通过。
- [x] 5.3 检查 `package.json` 与 `package-lock.json` 无新增依赖，构建脚本未改动（新增 `npm test` 脚本，仅调用 Node 内置测试运行器）；验证：`package-lock.json` 无变化，`build` 脚本不变。

## Workflow follow-up

- 评审通过后归档变更，并验证归档结果。