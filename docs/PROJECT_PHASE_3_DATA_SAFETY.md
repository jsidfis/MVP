# 三阶段方案：数据安全和可恢复性

当前执行状态：验收中。Task 1-5 已完成，Task 6 正在做最终文档和手动验收。对应实施计划见 `docs/superpowers/plans/2026-06-22-future-roadmap-implementation.md` 的 Phase 3。

## 1. 阶段目标

让用户可以长期使用便携版，不害怕数据丢失，并能在发给别人体验前确认不会带出自己的数据。

本阶段优先解决三个问题：

- 数据能不能完整备份。
- 备份能不能可靠恢复。
- 用户能不能理解数据在哪里、如何迁移、如何避免泄露自己的记录。

## 2. 本阶段包含

- JSON 完整导出。
- JSON 完整导入。
- Markdown 或 CSV 人类可读导出。
- 应用内数据位置说明。
- 示例数据一键重置。
- 迁移和备份说明。

## 3. 本阶段不包含

- 云备份。
- 自动后台备份。
- 数据加密。
- 第三方软件格式兼容。
- 多设备同步。
- 团队共享。
- 账号登录。

## 4. 数据范围

完整 JSON 导出必须覆盖：

- 用户设置。
- 每日文件，包括日期、阶段、目标、状态记录和晚间复盘。
- 当日任务，包括标题、四象限、状态、顺延信息和创建更新时间。
- 任务执行记录，包括开始时间、结束时间、手动记录标记和实际耗时。
- 复盘决策，包括顺延、放弃、改期和原因。

当前 JSON 备份已经覆盖以上范围，格式由 `src/data/exportData.ts` 定义，导入校验由 `src/data/importData.ts` 负责。

人类可读导出优先覆盖：

- 日期。
- 今日目标。
- 任务标题、四象限、状态。
- 实际耗时。
- 顺延原因。
- 晚间四问复盘。

## 5. 导出策略

JSON 导出用于恢复数据，目标是完整、稳定、可校验。

导出格式必须包含：

```ts
type ExportedDailyPlanData = {
  schemaVersion: 1;
  exportedAt: string;
  settings: unknown;
  dailyFiles: unknown[];
  tasks: unknown[];
  sessions: unknown[];
  reviewDecisions: unknown[];
};
```

规则：

- `schemaVersion` 从 `1` 开始。
- `exportedAt` 使用 ISO 字符串。
- 导出逻辑通过 `DailyRepository` 读取数据。
- 前端业务代码不直接读 SQLite 表。
- 未来结构变化必须新增迁移或兼容逻辑，不直接破坏旧导出。

当前实现：

- `导出 JSON 备份` 生成可恢复的完整 JSON。
- `导出 Markdown 档案` 生成便于人工阅读的每日档案，不作为恢复格式。

## 6. 导入策略

导入必须先校验，再写入。

规则：

- 非 JSON 对象直接拒绝。
- 不支持的 `schemaVersion` 直接拒绝。
- 必填字段缺失直接拒绝。
- 导入前完成整包校验。
- 校验失败时不写入任何数据。
- 导入成功后才能替换或写入现有数据。

默认策略：

- 第一版先支持导入到空仓库或由用户确认覆盖。
- 不做复杂合并。
- 不做冲突解决。
- 不从第三方格式导入。

当前实现会先完成整包校验，再写入仓库。校验失败时不会写入任何数据。应用内入口采用粘贴 JSON 的方式，文件选择器和复杂合并不在本阶段范围内。

## 7. 示例数据重置

示例数据重置只影响 `data/demo.sqlite`。

规则：

- 不修改 `data/user.sqlite`。
- 重置后重新写入当前版本 demo seed。
- 如果用户已经修改示例数据，需要明确提示会覆盖示例数据。

当前实现通过数据安全面板触发示例数据重置。重置逻辑清空当前 demo 仓库后重新写入内置 demo seed；我的数据模式下按钮禁用。

## 8. 用户提示和文档

README 和应用内说明必须让用户理解：

- 便携版数据在 `data/` 文件夹。
- `data/user.sqlite` 是用户自己的数据。
- `data/demo.sqlite` 是示例数据。
- 发给别人体验时不要发送带有真实 `data/user.sqlite` 的个人文件夹。
- 备份时复制整个便携文件夹，或至少复制 `data/`。
- 迁移到新位置时复制整个便携文件夹最稳妥。

当前 README 已补充：

- JSON 备份和导入的使用方式。
- Markdown 档案的定位。
- 便携 zip 默认只包含空 `data/` 文件夹。
- 发给别人体验时不要发送自己已经使用过的便携文件夹。

## 9. 测试边界

自动测试至少覆盖：

- 导出包含 settings、daily files、tasks、sessions、review decisions。
- 导出空仓库时结构仍合法。
- 导入有效 JSON 后能读取回原数据。
- 导入非法 JSON 不改变现有数据。
- 导入不支持的 schema version 不改变现有数据。
- demo 重置不影响 user 数据。

手动验收至少覆盖：

1. 空白开始，创建两条任务和一条复盘。
2. 导出 JSON。
3. 删除或更换 `data/user.sqlite`。
4. 导入 JSON。
5. 确认任务和复盘恢复。
6. 切换到示例数据。
7. 重置示例数据。
8. 切回我的数据，确认个人数据未变化。

## 10. 验收标准

- 导出的 JSON 能恢复任务、每日文件、复盘和设置。
- 非法导入不会破坏现有数据。
- demo 重置不会影响 user 数据。
- README 明确说明如何备份、恢复、迁移和发包。
- 便携 zip 重新生成后仍能启动。
- `npm.cmd run test:run`、`npm.cmd run build`、`npm.cmd run tauri:check:gnu`、`npm.cmd run portable:build:gnu` 通过。

当前验收记录：

- 自动测试覆盖 JSON 导出、JSON 导入、Markdown 可读导出、demo 重置和数据安全面板。
- 便携 zip 内容 smoke 已检查：未包含 `src`、`src-tauri`、`node_modules`、`.git` 或真实 `data/user.sqlite`。
- GUI 级完整恢复流程仍建议在每次正式发布前手动走一遍。

## 11. 风险

- SQLite 文件未加密，不适合保存高敏感内容。
- 用户可能把包含个人 `data/user.sqlite` 的文件夹发给别人，需要文档和 UI 反复提醒。
- JSON 导入如果做合并会引入冲突复杂度，本阶段先避免。
- 未来数据结构变化需要维护 schema 兼容，否则旧备份可能无法恢复。
