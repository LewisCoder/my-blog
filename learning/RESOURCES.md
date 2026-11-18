# AI 开发工作流 · Java 后端 Resources

## Knowledge

- [Best practices for Claude Code (Anthropic 官方文档)](https://code.claude.com/docs/en/best-practices)
  本课程的主要一手来源。核心两节：「Tell Claude what it can't see」（CLAUDE.md、具体提示词、先头脑风暴）和「Give Claude a check to run」（可运行的验证、Stop hook、对照规格评审）。用于：工作流设计、可靠性调优。
- [How Claude remembers your project（CLAUDE.md / AGENTS.md）](https://code.claude.com/docs/en/memory)
  持久化项目规则与约定；说明 CLAUDE.md 与 AGENTS.md 的关系、`.claude/rules/` 与自动记忆。用于：搭建项目级上下文层。
- [Run Claude Code programmatically（headless / Agent SDK）](https://code.claude.com/docs/en/headless)
  `claude -p` 非交互模式、`--output-format json`、`--json-schema`、`--allowedTools`、CI 集成与 `--bare`。用于：把工作流环节变成命令/流水线步骤。
- [OpenSpec (Fission-AI)](https://github.com/Fission-AI/OpenSpec)
  轻量规格驱动开发：propose → apply → archive，mitigation 面向 brownfield，无刚性阶段门。用户仓库已在用。用于：需求 → 规格/计划的结构化。
- [GitHub Spec Kit](https://github.com/github/spec-kit)
  另一套 SDD 工具链：constitution → specify → plan → tasks → implement → converge。用于：对比两种 SDD 流程，选择适合个人项目的轻量方案。
- [Thoughtworks Technology Radar: Spec-driven development](https://www.thoughtworks.com/radar/techniques/spec-driven-development)
  对 SDD 的独立评估（Assess 环）：流程精巧但意见化强、规格容易过长难审，需按任务规模取舍。用于：防止规格膨胀，控制工单粒度。
- [JUnit 5 User Guide](https://junit.org/junit5/docs/current/user-guide/)
  Java 测试的一手参考：标注、断言、参数化测试、生命周期。用于：验收标准落地为测试。
- [Spring Boot Testing 文档](https://docs.spring.io/spring-boot/reference/testing/index.html)
  `@SpringBootTest` / `@WebMvcTest` / MockMvc 等切片的官方说明。用于：为接口写正确的测试切片。
- [Testcontainers](https://testcontainers.com/)
  用真实数据库/中间件容器做集成测试。用于：AI 生成的集成测试要可信时的验证环境。

## Wisdom (Communities)

- [r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/)
  大量真实使用经验与翻车案例。用于：工作流踩坑、成本与上下文管理讨论。
- [CodeRanch](https://coderanch.com/)
  长期高质量的 Java 社区， moderation 严格。用于：Java 设计与测试问题的人工复核。
- [r/java](https://www.reddit.com/r/java/)
  新闻与讨论为主，评论质量较高。用于：Java 生态与测试工具选型的交叉验证。
- [V2EX · 程序员节点](https://www.v2ex.com/go/programmer)
  中文开发者社区。用于：国内环境下 AI 工具可用性、公司政策经验交流。
- [Hacker News](https://news.ycombinator.com/)
  用于：追踪 AI 编码工具与 SDD 实践的一手讨论与反对意见。

## Gaps

- 尚未找到「面向 Java 后端、端到端 AI 工作流」的权威成体系教程；当前以官方文档 + SDD 工具文档 + 独立评估拼装，后续课程中持续补充。
- 内网/私有化模型下的 Claude Code 等价工作流资料较少，待确认公司政策后再定向搜集。