# AGENTS.md

给后续 AI / 开发者接手本项目时先读这份文件。它不是用户说明书，而是项目接手上下文。

## 项目定位

这是一个本地优先的个人每日计划与复盘桌面应用。

核心使用流程：

1. 早上制定今日计划。
2. 白天执行任务，可中途新增任务。
3. 点击任务星球开始执行，再次点击完成并记录实际耗时。
4. 晚上复盘，未完成任务可顺延到明天并记录原因。
5. 通过完成率、趋势、四象限和月度视图观察状态，不做强刺激分数。

当前版本：`0.2.0`，MVP 便携体验版。

当前进度：Phase 3 数据安全主要能力已接入，Phase 4 复盘洞察和月度体验已完成自动验证与便携包 smoke，Phase 5 日常工作流增强已完成代码实现和自动验证。下一阶段优先推进 Phase 6 开源发布准备。

当前重点：个人长期稳定使用、数据可备份、可发给别人体验，并继续降低每天重复输入成本。不要提前做账号、云同步或团队协作。

## 接手时先读

按顺序阅读：

1. `README.md`：安装、运行、打包、迁移、便携版使用。
2. `docs/PROJECT_PHASE_2_PORTABLE_PREVIEW.md`：当前便携体验版方案。
3. `docs/PROJECT_PHASE_3_DATA_SAFETY.md`：三阶段数据安全和可恢复性方案。
4. `docs/PROJECT_PHASE_4_INSIGHTS.md`：四阶段复盘洞察和月度体验方案与验收记录。
5. `docs/PROJECT_PHASE_5_WORKFLOW.md`：五阶段日常工作流增强方案，当前下一阶段入口。
6. `docs/PROJECT_FUTURE_ROADMAP.md`：后续阶段总方案、能力边界、测试边界。
7. `docs/superpowers/plans/2026-06-22-future-roadmap-implementation.md`：后续详细实施计划。
8. `docs/superpowers/specs/2026-06-16-daily-plan-review-design.md`：初始产品设计。
9. `docs/superpowers/plans/2026-06-21-portable-preview-implementation.md`：二阶段便携版实施历史。

如果这些文档和代码出现冲突，以当前代码和最新用户需求为准，但要同步修正文档。

## 当前能力

已实现：

- 今日工作台。
- 文件夹视图和星系视图。
- 主页视图切换并记住选择。
- 四象限任务管理。
- 任务开始、完成、实际耗时记录和手动修正。
- 未完成任务顺延到明天，并记录顺延原因。
- 晚间四问复盘。
- 今日完成概览。
- 月度总览：完成趋势、重要任务、四象限分布、顺延原因、实际耗时、月度星系地图和月度文件柜。
- 用户数据和示例数据分离。
- 数据安全面板：JSON 完整备份、JSON 导入、Markdown 档案导出、示例数据重置。
- 本地任务模板：手动保存选中任务为模板，并手动应用到今天。
- 简单重复任务：支持每天、工作日、每周同一天，打开某一天时生成，不在后台运行。
- 本地搜索和筛选：按关键词、日期范围、四象限、状态和顺延原因筛选本地历史任务。
- 便携 zip 打包。

暂不实现：

- 账号登录。
- 云同步。
- 多人协作。
- 移动端。
- 浏览器 SaaS。
- AI 自动评价或打分。
- 复杂模板系统、模板市场、模板分享或复杂分类。
- 复杂重复规则，例如节假日、调休、RRULE 或每月第几个工作日。
- 重复任务规则的独立管理和关闭入口。
- 企业级权限。

## 代码结构

- `src/App.tsx`：应用启动、工作区模式选择、repository 初始化、demo seed。
- `src/domain/`：纯业务规则。优先把可测试逻辑放这里。
- `src/domain/insightRules.ts`：月度洞察和趋势计算，保持为纯领域逻辑。
- `src/domain/recurrenceRules.ts`：简单重复任务生成规则，保持为纯领域逻辑。
- `src/domain/searchRules.ts`：本地任务搜索和筛选规则，保持为纯领域逻辑。
- `src/data/`：数据接口、内存仓库、Tauri SQLite 仓库、便携数据库路径、示例数据、JSON 导入导出、Markdown 可读导出。
- `src/data/taskTemplates.ts`：本地任务模板保存和应用的纯数据规则。
- `src/store/`：应用状态和任务执行动作。
- `src/views/`：主要页面和视图，例如今日工作台、星系视图、文件夹视图、月度总览、月度星系地图、月度文件柜、复盘面板。
- `src/components/`：局部可复用组件。
- `src/settings/`：设置面板和数据安全面板。
- `src/notifications/`：本地通知相关能力。
- `src-tauri/src/lib.rs`：Tauri 原生命令，目前包含便携数据目录命令。
- `scripts/windows-gnu.ps1`：Windows GNU 工具链安装、检查、开发、构建入口。
- `scripts/portable-release.ps1`：生成便携 zip。
- `docs/`：产品方案、任务计划、快速开始说明。

## 数据模型和存储

运行在 Tauri 桌面环境时使用 SQLite。

便携版数据位于应用所在文件夹：

- `data/user.sqlite`：我的数据。
- `data/demo.sqlite`：示例数据。

浏览器测试或非 Tauri 环境会回退到 `MemoryDailyRepository`。

数据访问规则：

- UI 不直接读写 SQLite。
- 优先通过 `DailyRepository` 接口访问数据。
- 新增数据能力时，先补 Memory repository 测试，再补 Tauri SQLite repository 行为。
- demo 数据可以被用户修改，但不能影响 user 数据。
- 任务模板和重复任务规则也属于可恢复数据，必须进入 JSON 备份和导入校验。
- 重复任务通过 `recurrenceRuleId + date` 防止同一规则同一天重复生成。

数据安全规则：

- JSON 备份用于恢复数据，格式由 `src/data/exportData.ts` 定义。
- JSON 导入必须先完成整包校验，校验失败不得写入任何数据，逻辑位于 `src/data/importData.ts`。
- Markdown 档案导出只用于人工阅读，不作为恢复格式，逻辑位于 `src/data/readableExport.ts`。
- 示例数据重置只影响 demo 仓库，不得修改 `data/user.sqlite`。
- SQLite 文件未加密，不要引导用户记录高敏感信息。

## 常用命令

在 PowerShell 中优先使用 `npm.cmd`，避免执行策略导致 `npm` 脚本被拦截。

```powershell
npm.cmd install
npm.cmd run test:run
npm.cmd run build
npm.cmd run tauri:check:gnu
npm.cmd run tauri:dev:gnu
npm.cmd run portable:build:gnu
```

第一次配置 Windows 最小桌面工具链：

```powershell
npm.cmd run setup:windows-gnu
```

日常桌面开发启动：

```powershell
npm.cmd run tauri:dev:gnu
```

生成可发送给体验用户的 zip：

```powershell
npm.cmd run portable:build:gnu
```

输出位置：

```text
dist-portable/每日计划与复盘-v0.2.0-portable.zip
```

## 验证标准

改动代码后至少运行：

```powershell
npm.cmd run test:run
npm.cmd run build
```

涉及 Tauri、SQLite、便携路径、打包脚本时还要运行：

```powershell
npm.cmd run tauri:check:gnu
npm.cmd run portable:build:gnu
```

文档或脚本改动后运行：

```powershell
git diff --check
```

只改文档时至少运行 `git diff --check`，并检查新增文档没有未完成草稿标记。

便携包相关改动需要手动 smoke：

1. 从 `dist-portable` 里的 zip 解压到临时目录。
2. 启动 `每日计划与复盘.exe`。
3. 确认不会立即退出。
4. 检查 zip 内不包含源码、`.git`、`node_modules`、`src`、`src-tauri`。

## 设计边界

保持简单：

- 不为一次性需求创建大抽象。
- 不提前铺设云同步、权限、团队模型。
- 不引入大型依赖，除非现有实现明显不可维护。
- 动画只服务趣味和理解，不承担核心数据语义。
- 趋势展示保持中性，不做绩效化分数。

前端设计：

- 当前应用是工具型产品，不做营销式首页。
- 主页保留文件夹视图 / 星系视图切换。
- 月度总览从按钮进入，不替代每日工作台。
- UI 文案不要制造压力，避免“失败”“低效”等评价式词语。

Phase 5 设计边界：

- 模板必须由用户手动保存、手动应用，不自动污染今日任务。
- 重复任务只支持每天、工作日、每周同一天三类简单规则。
- 搜索只读取本地数据，不联网、不上传。
- 计划耗时和实际耗时只展示差异，不生成效率分数。
- 当前只保留计划耗时字段并在模板/重复任务中传递；计划和实际耗时差异展示尚未完成。
- 重复任务的独立管理和关闭入口尚未完成，不要扩展成复杂日历系统。

## 外部知识库和文档同步

Obsidian vault 路径：

```text
D:\学习笔记仓库\学习仓库
```

项目外置知识库位置：

```text
D:\学习笔记仓库\学习仓库\项目知识库\每日复盘小程序
```

Obsidian 的 `CLAUDE.md` 已补充：

- 第八章：项目型 Obsidian 外置知识库整理规范。
- 第九章：通用 Obsidian 文档整理规范。

同步规则：

- Repo 内 `README.md`、`AGENTS.md`、`docs/` 仍是项目执行真相。
- Obsidian 只记录长期记忆、阶段状态、关键决策、踩坑和 AI 接手上下文。
- 阶段性工作完成后，优先同步 `02-当前状态.md`、`04-决策记录.md`、`05-路线图.md`、`08-开发日志.md`。
- 不要向 Obsidian 写入源码全文、SQLite 数据、token、密钥或私人记录。

## Git 和工作区注意事项

当前主开发分支通常是：

```text
codex/daily-plan-review-mvp
```

远端仓库：

```text
https://github.com/jsidfis/MVP.git
```

注意：

- 不要提交 `node_modules/`、`dist/`、`dist-portable/`、`src-tauri/target/`。
- 不要删除用户未要求删除的改动。
- 如果工作区已有未提交改动，先判断是否来自用户或前一轮任务，不要直接覆盖。
- 生成的便携 zip 不进 Git；需要发给用户时直接使用本地 `dist-portable` 输出。

## 后续推荐顺序

按 `docs/PROJECT_FUTURE_ROADMAP.md` 推进：

1. Phase 6：开源发布和协作准备。
2. Phase 7：小团队可能性验证。

Phase 3、Phase 4 和 Phase 5 已有主要实现与阶段文档。正式发布前仍建议按对应阶段文档再走一遍手动 smoke，尤其是 JSON 恢复流程、月度总览空数据/部分数据场景、模板/重复/搜索流程和便携包启动检查。

不要跳过 Phase 6 的开源发布准备直接做团队或云同步。这个项目的核心信任基础仍是本地数据安全、可恢复和个人日常使用稳定性。

## 接手检查清单

开始新任务前：

1. 读本文件。
2. 读 README 和相关阶段文档。
3. 运行 `git status --short --branch`。
4. 确认当前任务属于哪个阶段。
5. 明确能力边界和测试边界。
6. 小步修改，小步验证。
7. 如果阶段状态、运行方式或边界变化，更新 `AGENTS.md` 和对应 `docs/`。

完成任务前：

1. 运行对应测试和构建命令。
2. 更新相关文档。
3. 检查 `git diff --check`。
4. 汇报实际验证结果，不要只说“应该可以”。
