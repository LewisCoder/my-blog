# 教学笔记（NOTES）

## 学习者画像
- 后端 Java 程序员；每周 2–5 小时学习时间。
- 已在用 Claude Code（本会话即为其驱动）；仓库中已配置 OpenSpec（`openspec/changes/add-blog-search/` 有完整 proposal/design/tasks）。
- 英文术语接受度高，但课程正文用中文；术语统一参照 [[reference/glossary.html]]。

## 偏好与约定
- 单课 20–40 分钟，每课一个可验证的小胜利；练习带即时反馈。
- 课程在 `learning/` 子目录，避免污染博客仓库的 git 历史。
- 工作环境政策未确认 → 练习一律在个人 Java 项目上，设计须可迁移到内网模型。

## 教学路线（暂定）
1. 输入层：可执行工单与验收标准（本课）
2. 反馈层：让检查真正跑起来（测试先行、验证命令）
3. 上下文层：CLAUDE.md / rules / 模板资产化
4. 自动化层：`claude -p`、hooks、CI 评审与发布说明
5. 评审层：可信度评估——30 分钟内判断 AI 产出是否可用

## 其他
- 博客仓库根目录已有 `AGENTS.md`（Claude Code 可读取），后续讲上下文层时可作为真实案例。