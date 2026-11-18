---
title: 'AI 工作流项目建设 Todo（选型：OpenSpec + mattpocock/skills）'
description: '从 ONES 需求流入到飞书审批闸门：选定 OpenSpec 与 mattpocock/skills 分工后，把 15~22 人日的 AI 工作流建设拆成 8 个阶段，附出口标准、三条纪律与风险对策。'
pubDate: '2026-11-18'
heroImage: '../../assets/blog-placeholder-5.jpg'
tags: ['AI', '工作流', 'Agent', 'OpenSpec']
---

> **B点目标**：需求从 ONES 流进来，产物在 git 里生长，决策以飞书卡片形式流到我面前，代码和部署在 agent 侧完成。
> 我每天的工作 = 回答五个问题、签三次字、裁决一次例外，每周让系统变聪明一点。
>
> **选型分工**（一个产物只有一个主人）：
> - **OpenSpec**：产物与流程骨架（changes/ 四件套 + 活规格 specs/ + 归档回写）
> - **mattpocock/skills**：质量原语（grilling / tdd / domain-modeling / diagnosing-bugs / handoff / retro）
> - **现有 cc-\*\*\***：内网执行能力（cc-代码审查跨模型、cc-上预发 Keones、lark-\* PRD/通知）
>
> **主线**：原版装好 → 试点需求①原版走通 → 按摩擦点定制 → 飞书接走人的闸门 → SDK 接走指挥 → 终验。
> **总量级**：约 15~22 人日（选型后比自研路线省约 1/3），每天 1~2 小时，横跨 5~7 周。
>
> **用法**：完成一项勾一项；每阶段达成"出口标准"才进下一阶段。
> **环境已验证**：node v24.10.0 ✓；内网 npm 镜像有 @fission-ai/openspec@2.1.0、skills@1.9.0 ✓。

## 总览

| 阶段 | 目标 | 量级 | 状态 |
|------|------|------|------|
| P0 安装与配置 | 两家原版装好，配置决策落地 | 0.5~1 天 | ⬜ 未开始 |
| P1 原版试点 | 需求①用原版全链走通，收集摩擦点 | 2~3 天 | ⬜ 未开始 |
| P2 定制清单 + 闸门协议 | 摩擦点排序，补 OpenSpec 不管的硬闸门 | 1~2 天 | ⬜ 未开始 |
| P3 内网定制 | 审查 Spec 轴 / tdd 适配 / 中文 / commit 自动化 | 3~4 天 | ⬜ 未开始 |
| P4 知识层 | glossary/ADR 落位 + 活规格冷启动 | 1~2 天 | ⬜ 未开始 |
| P5 飞书闸门通道 | 人不开终端也能审批 | 2~3 天 | ⬜ 未开始 |
| P6 Conductor 服务化 | 指挥搬出 Claude Code，常驻运行 | 3~5 天 | ⬜ 未开始 |
| P7 终验与推广 | 两个硬标准验收，转入稳态运营 | 2 天+持续 | ⬜ 未开始 |

---

## P0 安装与配置（0.5~1 天）

- [ ] `npm install -g @fission-ai/openspec@latest`（内网镜像已验证有包）
- [ ] 在 thaumas 里 `! openspec init`（交互式，选 Claude Code；生成 openspec/ + 四个 /openspec-* skill）
- [ ] `! openspec config profile` 切 expanded（多出 verify-change / onboard / ff-change），然后 `openspec update`
- [ ] `! npx skills@latest add mattpocock/skills -a claude-code`（**选 npx 可编辑路线，不选 plugin，二者只装一个**；作用域选用户级 ~/.claude/skills）
- [ ] 运行 `/setup-matt-pocock-skills`，三个问题这样答：
  - issue tracker → **local files**（ONES 以后再接）
  - triage labels → 随意（triage 不用）
  - docs 位置 → **openspec/**（glossary.md、adr/ 与规格同目录树）
- [ ] 确认技能取舍生效：不用 to-spec（与 openspec-propose 重叠）、不用 triage/wayfinder（依赖 tracker）、暂缓 to-tickets/implement-spec
- [ ] 验证触发：随便开个话头确认 /grill-me、/openspec-propose、/retro 都能被正确唤起
- [ ] 选定**试点需求①**：中等大小、边界清晰、不紧急
- [ ] 确认外部依赖（为 P5/P6 铺路，可并行）：ONES 需求 API 有无；飞书审批权限够不够（不够降级 lark-im 卡片回复）

**出口标准**：
- [ ] 两家 skill 都能触发，openspec/ 目录就位，配置决策落盘
- [ ] 试点需求①确定

## P1 原版试点（2~3 天，先不改任何东西）

按顺序对需求①实跑，**全程记录摩擦点**：

- [ ] `/grill-me`：贴飞书 PRD（或 lark-doc 拉取），拷问至边界/异常/口径清晰
- [ ] `/openspec-propose 50563174-xxx`：变更名带 ONES 需求号；生成 proposal/specs/design/tasks 四件套
- [ ] 人工审四件套：AC 确认、方案拍板（暂时用对话确认，这就是闸门的雏形）
- [ ] `/openspec-apply-change`：按 tasks 逐项实现，tdd 原语参与
- [ ] `bash .claude/skills/cc-代码审查/scripts/review.sh`：跨模型审查 → 修复 → 复审至清零
- [ ] cc-上预发 → 预发验收
- [ ] `/openspec-archive-change`：归档 + delta 回写活规格
- [ ] `/retro`：产出改进清单
- [ ] 摩擦点记录（边跑边记）：grilling 哪些问题对 Java 后端无效？tasks 粒度合适吗？审查缺 Spec 轴吗？归档回写顺吗？

**出口标准**：
- [ ] 需求①上线预发并归档，specs/ 长出新内容
- [ ] 摩擦点清单 ≥ 5 条，每条注明发生在哪个环节

## P2 定制清单 + 闸门协议（1~2 天）

- [ ] 摩擦点 + retro 提案合并排序，形成定制 backlog（只改被证明有摩擦的，不预先过度设计）
- [ ] 补轻量闸门协议 `openspec/` 外的 status.md：阶段 + 闸门确认记录 + template-version（**只补 OpenSpec 不管的硬门禁，不重造它的产物协议**）
- [ ] 定义 5 个闸门：澄清回答 / AC 确认 / 方案拍板 / 审查清零确认 / 发布批准；每个写清通过条件、驳回去哪
- [ ] 写 evidence.md：编译/单测/Checkstyle 取证标准（"完成"必须附证据）
- [ ] 确定 ship 硬校验规则：status 未到 reviewed 或检查单未勾完，物理拒绝触发 cc-上预发

**出口标准**：
- [ ] 定制 backlog 排好序；闸门协议能对着口述需求②怎么流转

## P3 内网定制（3~4 天）

- [ ] **审查加 Spec 轴**：把 Matt code-review 的双轴结构 + AC 对照提示词缝进 review.sh（执行仍跨模型：Kimi/GLM，审查模型 ≠ 编码模型硬规则）
- [ ] 审查报告引用 AC 编号，落 changes/{变更}/review/，修复复审追加不覆盖
- [ ] **tdd Java 适配**：新增逻辑测试先行、从 AC 生成、禁止参照实现；存量改动回归测试兜底（改掉原版"先于测试的代码删掉"）
- [ ] 定制 skill 的中文触发词（沿用 cc-* 习惯）
- [ ] commit 自动化：`[需求][号]` 从变更目录名取号
- [ ] dev-ship 化：发布检查单模板（DB 脚本/配置/回滚）+ 闸门硬校验 + 挂载 cc-上预发
- [ ] 任务执行增强（按需，来自摩擦点）：worktree 隔离、逐任务 subagent、任务间互审
- [ ] **需求②实跑定制版全链**，对比需求①的摩擦点是否消除

**出口标准**：
- [ ] 需求②走通定制版全链；审查报告出现 AC 编号引用；ship 闸门硬校验生效

## P4 知识层（1~2 天）

- [ ] glossary.md / adr/ 在 openspec/ 下落位（setup 时已指定位置）
- [ ] 活规格冷启动：先试 `openspec-onboard`；不够则 AI 扫代码生成最小 specs/ + glossary 草稿，人工审
- [ ] 固化归档习惯：每次 archive 必回写 specs/，难决策必留 ADR
- [ ] 复盘分流规则：项目经验 → CLAUDE.md/glossary；通用经验 → 引擎定制 backlog

**出口标准**：
- [ ] thaumas 有可查的活规格和词汇表；至少 1 条复盘经验落进 CLAUDE.md 或定制

## P5 飞书闸门通道（2~3 天）

- [ ] 定义 5 种卡片：澄清问题清单（逐条回复）/ AC 审批 / 方案审批 / 审查结论确认 / 发布审批
- [ ] 回执脚本：飞书回复/审批结果 → 写回 status.md 闸门字段（代码校验，不靠模型转述）
- [ ] 通知分级：闸门卡片 / 告警卡片 / 每日进度摘要（一条，不刷屏）
- [ ] 权限不够则降级：lark-im 卡片 + 约定格式回复，协议不变
- [ ] **需求③至少两个闸门只通过飞书完成**（不开终端）

**出口标准**：
- [ ] 需求③的至少两个闸门我没开终端，仅凭飞书完成

## P6 Conductor 服务化（3~5 天）

- [ ] Agent SDK 实现 conductor 常驻进程：只做三件事——读状态、派 worker、闸门挂起/恢复（不写代码不审查）
- [ ] 触发源：ONES 新需求（API 轮询/webhook，按 P0 结论；无 API 则飞书转发链接手动触发）
- [ ] worker headless 化（claude -p）+ 权限最小化：实现 worker 不能 push；审查只读；部署只由 conductor 在 ship 闸门后触发
- [ ] 运维①宿主机：开发机常驻或内网服务器
- [ ] 运维②Cookie 自愈：复用 ~/.ones 续期机制，失效即飞书告警
- [ ] 运维③模型路由：~/.dev-flow/models.json 角色路由 + 白名单（Kimi-K3.1-Pro / GLM-5.2 等已验证可用）
- [ ] 运维④每日心跳 + 失败挂起告警，不带病推进
- [ ] 恢复验证：杀进程重启，需求从 status.md 无损续跑
- [ ] **需求④实跑**：从 ONES 进来全程 agent 推进，我只在飞书出现

**出口标准**：
- [ ] 需求④全程无人值守推进，中途杀进程一次，恢复无损

## P7 终验与推广（2 天 + 持续）

- [ ] **终验①**：一个真实需求全程只通过飞书走完（不打开 IDE）
- [ ] **终验②**：第二个项目五分钟接入（openspec init + setup）并跑通小需求
- [ ] 写一页安装/接入说明（定制版 skill 无个人信息，团队化预留）
- [ ] 每周引擎/定制提案评审
- [ ] 度量记录：每需求记 审查 P0/P1 数 / 返工轮次 / 人工大改比例 / 我的闸门耗时
- [ ] 用度量数据决定下一个优化点（持续）

---

## 贯穿全程的三条纪律

1. **先原版跑通，再按摩擦点定制。** 不预先 fork 大改；每处定制都要能指出它消除了哪条摩擦。
2. **一个产物只有一个主人**：规格/任务归 OpenSpec，质量原语归 Matt，内网执行归 cc-*；重叠功能（to-spec 等）果断弃用。
3. **闸门用代码强制，不用 prompt 恳求**；自动化永远落后于验证（会话内 → headless → 服务化）。

## 风险与对策

| 风险 | 对策 |
|------|------|
| 两家 skill 触发冲突/重叠 | P0 取舍表落地；重叠功能只留一个主人 |
| Matt skill 假设 GitHub 协作 | setup 选 local files；triage/wayfinder 不用 |
| 原版 TDD 对存量 Java 太激进 | P3 适配：新增测试先行、存量回归兜底 |
| ONES 需求侧无 API | 降级：飞书转发链接手动触发 intake |
| 飞书审批权限批不下来 | 降级：lark-im 卡片回复，P0 就确认 |
| 网关模型不稳/审查超时 | 白名单 + 备选自动切换（review.sh 已有）；失败挂起告警 |
| npx 安装与 plugin 混装导致 skill 双份 | 只走 npx 可编辑路线；定制后不跑自动更新覆盖 |
| 无人值守后登录态失效 | P6 运维自愈 + 心跳，失效即飞书告警 |

## 本周就做的三件事

- [ ] P0 安装配置半天走完（openspec init + npx skills add + setup 三问）
- [ ] 选定试点需求①
- [ ] /grill-me + /openspec-propose 把需求①的前半段走起来

## 度量记录（每需求一行，P1 起开始记）

| 需求号 | 审查 P0/P1 数 | 返工轮次 | 人工大改任务比例 | 我的闸门总耗时 | 摩擦点/备注 |
|--------|--------------|----------|------------------|----------------|-------------|
| | | | | | |