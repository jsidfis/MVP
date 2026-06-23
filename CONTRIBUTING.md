# 贡献指南

感谢你愿意反馈或参与这个项目。当前项目优先服务个人本地使用，开源协作会保持轻量。

## 反馈前请先确认

- 不要上传 `data/user.sqlite`、`data/demo.sqlite` 或任何私人任务记录。
- 不要在 issue 中粘贴 token、密钥、财务凭据、私人日记或高敏感信息。
- 截图前请切换到示例数据，或确认截图不包含私人内容。
- 如果问题涉及云同步、账号、团队协作或加密，请先作为需求讨论，不要直接提交实现 PR。

## 提交 issue

优先使用 GitHub issue 模板：

- Bug：提供系统版本、应用版本、运行方式、复现步骤、预期结果、实际结果。
- 功能建议：说明真实使用场景、为什么当前流程不够、希望如何保持本地优先。
- 体验反馈：说明你在哪个阶段遇到阻力，例如早上计划、白天执行、晚上复盘、月度回顾。

## 本地开发

第一次准备环境：

```powershell
npm.cmd install
npm.cmd run setup:windows-gnu
```

日常启动桌面开发版：

```powershell
npm.cmd run tauri:dev:gnu
```

提交前至少运行：

```powershell
npm.cmd run test:run
npm.cmd run build
git diff --check
```

涉及 Tauri、SQLite、便携路径或打包脚本时，额外运行：

```powershell
npm.cmd run tauri:check:gnu
npm.cmd run portable:build:gnu
```

## 代码风格

- 保持本地优先，不引入服务器依赖。
- UI 不直接读写 SQLite，必须通过 `DailyRepository`。
- 可测试的业务规则优先放在 `src/domain/` 或 `src/data/`。
- 新增数据能力时，先覆盖 Memory repository，再补 SQLite repository 行为。
- 文案保持中性，不做绩效化评价或压力提示。
- 不为一次性需求创建复杂抽象。

## Pull Request 预期

当前阶段不承诺立即维护外部 PR。较容易接受的改动包括：

- 文档修正。
- 明确 bug 的最小复现和测试。
- 不改变产品边界的小型体验修复。
- 现有测试覆盖下的简单重构。

较难接受的改动包括：

- 账号、云同步、团队协作。
- 大型依赖或架构重写。
- 复杂模板市场、复杂重复规则或完整项目管理系统。
- 未说明隐私和数据迁移影响的数据结构改动。
