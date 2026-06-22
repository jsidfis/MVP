# 五阶段方案：日常工作流增强

## 阶段目标

减少每天重复输入，让个人用户能更快制定计划、复用常见任务、查找历史记录，同时保持应用仍然是个人每日计划和复盘工具。

本阶段不改变核心流程：早上计划、白天执行、晚上复盘。新增能力只用于降低重复操作，不把应用扩展成完整项目管理器或日历系统。

## 当前实现状态

已完成：

- 本地任务模板：保存选中任务为模板，并手动应用到今天。
- 简单重复任务：新增任务时可选择每天、工作日或每周重复；打开某一天时生成应出现的任务。
- 本地搜索和筛选：读取本地仓库任务，按关键词、日期范围、四象限、状态和顺延原因筛选。
- JSON 备份已包含任务模板和重复任务规则。

未在本轮实现，保留到后续小步：

- 计划耗时和实际耗时的差异展示。
- 重复任务规则的独立管理和关闭入口。
- 复盘草稿保护。

## 本阶段包含

- 常用任务模板：用户可以把一组任务保存为模板，并在需要时手动应用到今天。
- 轻量重复任务：支持每天、工作日和每周三类简单规则。
- 本地搜索和筛选：按标题、日期范围、四象限、任务状态和顺延原因查找历史任务。
- 为计划耗时和实际耗时对比保留基础数据口径。
- 常用操作的更少点击入口。

## 本阶段不包含

- 不做复杂周期规则，例如每月倒数第二个工作日。
- 不做标准 RRULE 编辑器。
- 不做团队任务分配。
- 不做项目管理看板、甘特图或里程碑。
- 不做完整日历系统。
- 不做跨设备同步。
- 不做模板市场、模板分享或分类体系。
- 不做全文索引服务或外部搜索服务。

## 能力口径

### 任务模板

模板是用户手动保存和手动应用的任务组合。

模板应用规则：

- 必须由用户点击应用。
- 应用后只向目标日期新增任务。
- 不自动修改已有任务。
- 保留任务标题、四象限和后续加入的计划耗时字段。
- 不包含任务执行状态、实际耗时、顺延原因和复盘内容。

### 简单重复任务

重复任务只支持三种规则：

- 每天。
- 工作日。
- 每周同一天。

生成规则：

- 在打开某一天时检查是否有应生成任务。
- 同一个来源任务在同一天只生成一次。
- 不在后台持续运行。
- 不处理节假日和复杂工作日历。

### 本地搜索和筛选

搜索只读取本地仓库数据，不联网，不上传数据。

筛选条件包括：

- 标题关键词。
- 日期范围。
- 四象限。
- 任务状态。
- 顺延原因。

没有结果时显示中性空状态，不暗示用户做得不好。

### 计划耗时和实际耗时

计划耗时是用户给任务的预估分钟数。实际耗时来自任务执行会话和手动修正。

目标口径只展示差异，不给效率分数，不做人格化评价。

当前代码只保留 `plannedDurationMinutes` 字段并在模板、重复任务中传递；差异展示 UI 未在本轮实现。

## UI 原则

- 模板和搜索入口放在今日工作台附近，不新增复杂导航系统。
- 重复任务设置跟随任务创建或任务详情，不独立做复杂规则编辑器。
- 搜索结果以任务列表为主，优先可读性和回到当日记录的能力。
- 文案保持工具化和中性，避免“落后”“失败”“低效”等评价。

## 测试边界

自动测试至少覆盖：

- 保存选中任务为模板。
- 手动应用模板到今天。
- 应用模板不会自动执行，必须用户明确触发。
- 模板保留四象限和计划耗时字段。
- 每天重复生成下一天任务。
- 工作日重复跳过周六和周日。
- 每周重复保持同一星期。
- 同一天重复任务不会重复生成。
- 搜索标题关键词。
- 搜索日期范围。
- 搜索四象限、状态和顺延原因。
- 搜索空结果状态。

手动验收至少覆盖：

1. 保存一组今天的任务为模板。
2. 手动应用模板到今天。
3. 创建一个重复任务并打开下一天。
4. 确认重复任务不会重复出现。
5. 搜索已完成任务标题。
6. 搜索有顺延原因的任务。

## 验收标准

- 模板不会自动污染今天任务，必须由用户明确添加。
- 重复任务生成规则简单、可解释；独立关闭入口留到后续。
- 搜索仅使用本地数据。
- 没有新增账号、云同步、团队协作或外部服务依赖。
- README 和本方案对能力边界的描述一致。

## 自动验证记录

2026-06-22 已通过：

```powershell
npm.cmd run test:run -- src/data/taskTemplates.test.ts src/views/TaskTemplatePanel.test.tsx src/data/memoryDailyRepository.test.ts src/data/exportData.test.ts src/data/importData.test.ts src/data/readableExport.test.ts src/store/appStore.test.tsx src/store/appStore.taskTemplates.test.tsx src/views/DailyWorkspace.taskTemplates.test.tsx
npm.cmd run test:run -- src/domain/recurrenceRules.test.ts src/components/TaskQuickAdd.test.tsx src/data/memoryDailyRepository.test.ts src/data/exportData.test.ts src/data/importData.test.ts src/data/readableExport.test.ts src/store/appStore.test.tsx src/store/appStore.recurrence.test.tsx src/views/DailyWorkspace.test.tsx
npm.cmd run test:run -- src/domain/searchRules.test.ts src/views/SearchPanel.test.tsx src/store/appStore.search.test.tsx src/store/appStore.test.tsx src/views/DailyWorkspace.test.tsx
npm.cmd run test:run
npm.cmd run build
npm.cmd run tauri:check:gnu
npm.cmd run portable:build:gnu
git diff --check
```
