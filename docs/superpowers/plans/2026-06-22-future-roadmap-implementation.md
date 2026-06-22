# Future Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current portable MVP into a stable personal daily planning and review product, then prepare it for open-source feedback and only later evaluate small-team use.

**Architecture:** Keep the app local-first with SQLite as the source of truth. Add future capabilities in isolated phases: data safety first, then insights, then workflow efficiency, then open-source release operations, then team validation. Each phase must ship independently and update tests plus docs before the next phase starts.

**Tech Stack:** Tauri 2, React, TypeScript, Vitest, Testing Library, SQLite via `@tauri-apps/plugin-sql`, PowerShell release scripts, GitHub Actions when Phase 6 starts.

---

## File Structure

Future implementation should use these document and source ownership rules:

- `docs/PROJECT_FUTURE_ROADMAP.md`: product-level roadmap, capability boundaries, testing boundaries, phase gates.
- `docs/superpowers/plans/2026-06-22-future-roadmap-implementation.md`: this execution plan.
- `docs/PROJECT_PHASE_3_DATA_SAFETY.md`: create when Phase 3 starts.
- `docs/PROJECT_PHASE_4_INSIGHTS.md`: create when Phase 4 starts.
- `docs/PROJECT_PHASE_5_WORKFLOW.md`: create when Phase 5 starts.
- `docs/PROJECT_PHASE_6_OPEN_SOURCE.md`: create when Phase 6 starts.
- `src/data/*`: repository, import/export, backup, migration, seed, and persistence behavior.
- `src/domain/*`: pure business rules for trend calculation, import validation, recurrence rules, and task summaries.
- `src/views/*`: screen-level UI for workspace, monthly overview, export/import, search, and settings.
- `src/components/*`: reusable UI controls and focused panels.
- `src-tauri/src/*`: native commands only when desktop filesystem access is required.
- `scripts/*`: setup, release, package, CI helper scripts.

## Phase 3: Data Safety And Recovery

### Task 1: Write Phase 3 Product Spec

**Files:**
- Create: `docs/PROJECT_PHASE_3_DATA_SAFETY.md`
- Modify: `README.md`

- [ ] **Step 1: Create the spec**

Document these exact sections:

```markdown
# 三阶段方案：数据安全和可恢复性

## 阶段目标

让用户可以长期使用便携版，不害怕数据丢失，并能在发给别人体验前确认不会带出自己的数据。

## 本阶段包含

- JSON 完整导出。
- JSON 完整导入。
- Markdown 或 CSV 人类可读导出。
- 应用内数据位置说明。
- 示例数据一键重置。
- 迁移和备份说明。

## 本阶段不包含

- 云备份。
- 自动后台备份。
- 数据加密。
- 第三方软件格式兼容。

## 验收标准

- 导出的 JSON 能恢复任务、每日文件、复盘和设置。
- 非法导入不会破坏现有数据。
- demo 重置不会影响 user 数据。
- README 明确说明如何备份、恢复、迁移和发包。
```

- [ ] **Step 2: Link it from README**

Add a `项目文档` section to `README.md` if it does not exist, and link the Phase 3 spec.

- [ ] **Step 3: Verify docs**

Run:

```powershell
git diff --check
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add README.md docs/PROJECT_PHASE_3_DATA_SAFETY.md
git commit -m "docs: plan data safety phase"
```

### Task 2: Add Full JSON Export

**Files:**
- Create: `src/data/exportData.ts`
- Create: `src/data/exportData.test.ts`
- Modify: `src/data/dailyRepository.ts` only if repository methods are missing.

- [ ] **Step 1: Define export shape in tests**

The test must build a repository with settings, daily file, tasks, completed task timing, postponed task reason, and review data. Expected export shape:

```ts
type ExportedDailyPlanData = {
  schemaVersion: 1;
  exportedAt: string;
  settings: unknown;
  dailyFiles: unknown[];
  tasks: unknown[];
};
```

- [ ] **Step 2: Run the failing test**

Run:

```powershell
npm.cmd run test:run -- src/data/exportData.test.ts
```

Expected: FAIL because `exportData.ts` does not exist.

- [ ] **Step 3: Implement through repository APIs**

Implementation rule: export must read through `DailyRepository`. Do not read SQLite tables directly from frontend code.

- [ ] **Step 4: Verify**

Run:

```powershell
npm.cmd run test:run -- src/data/exportData.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/data/exportData.ts src/data/exportData.test.ts src/data/dailyRepository.ts
git commit -m "feat: export complete local data"
```

### Task 3: Add JSON Import With Validation

**Files:**
- Create: `src/data/importData.ts`
- Create: `src/data/importData.test.ts`
- Modify: `src/domain/types.ts` only if a shared import result type is needed.

- [ ] **Step 1: Write validation tests**

Cover:

- valid export imports into an empty repository.
- invalid JSON object is rejected.
- unsupported `schemaVersion` is rejected.
- import failure leaves existing data unchanged.

- [ ] **Step 2: Run failing tests**

Run:

```powershell
npm.cmd run test:run -- src/data/importData.test.ts
```

Expected: FAIL before implementation.

- [ ] **Step 3: Implement staged import**

Implementation rule: validate the entire payload before writing anything. If validation fails, write nothing.

- [ ] **Step 4: Verify**

Run:

```powershell
npm.cmd run test:run -- src/data/importData.test.ts src/data/exportData.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/data/importData.ts src/data/importData.test.ts src/domain/types.ts
git commit -m "feat: import validated local data"
```

### Task 4: Add Human-Readable Export

**Files:**
- Create: `src/data/readableExport.ts`
- Create: `src/data/readableExport.test.ts`

- [ ] **Step 1: Write tests for Markdown or CSV output**

Minimum coverage:

- daily goal appears.
- each task title appears.
- quadrant and status appear.
- review answers appear.
- postponed reason appears.

- [ ] **Step 2: Implement Markdown first**

Prefer Markdown before CSV because it preserves review text and is easier for personal archive reading.

- [ ] **Step 3: Verify**

Run:

```powershell
npm.cmd run test:run -- src/data/readableExport.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/data/readableExport.ts src/data/readableExport.test.ts
git commit -m "feat: export readable daily archive"
```

### Task 5: Add Data Safety UI

**Files:**
- Create: `src/settings/DataSafetyPanel.tsx`
- Create: `src/settings/DataSafetyPanel.test.tsx`
- Modify: `src/settings/SettingsPanel.tsx`
- Modify: `src/styles.css`
- Modify: `src-tauri/src/lib.rs` only if opening the data directory needs a native command.

- [ ] **Step 1: Write component tests**

Cover:

- panel displays `data/user.sqlite` and `data/demo.sqlite`.
- export button calls export handler.
- import button handles invalid payload with an error message.
- reset demo button calls demo reset handler.

- [ ] **Step 2: Implement UI**

Keep it in settings or a compact modal. Do not add a new top-level navigation system for this phase.

- [ ] **Step 3: Verify**

Run:

```powershell
npm.cmd run test:run -- src/settings/DataSafetyPanel.test.tsx src/settings/SettingsPanel.test.tsx
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/settings/DataSafetyPanel.tsx src/settings/DataSafetyPanel.test.tsx src/settings/SettingsPanel.tsx src/styles.css src-tauri/src/lib.rs
git commit -m "feat: add data safety settings"
```

### Task 6: Phase 3 Manual Acceptance

**Files:**
- Modify: `README.md`
- Modify: `docs/PROJECT_PHASE_3_DATA_SAFETY.md`

- [ ] **Step 1: Run full automated verification**

Run:

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run tauri:check:gnu
npm.cmd run portable:build:gnu
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Run manual smoke**

Manual checks:

1. Start with blank user data.
2. Add two tasks and one review.
3. Export JSON.
4. Delete `data/user.sqlite`.
5. Import JSON.
6. Confirm tasks and review return.
7. Switch to demo data.
8. Reset demo data.
9. Confirm user data is unchanged.

- [ ] **Step 3: Update docs**

README must explain backup, export, import, reset, and migration. Phase 3 spec must mark current status.

- [ ] **Step 4: Commit**

```powershell
git add README.md docs/PROJECT_PHASE_3_DATA_SAFETY.md
git commit -m "docs: document data safety workflow"
```

## Phase 4: Review Insights And Monthly Experience

### Task 1: Write Phase 4 Product Spec

**Files:**
- Create: `docs/PROJECT_PHASE_4_INSIGHTS.md`

- [ ] **Step 1: Define neutral insight language**

Spec must state:

- show completion rate, not score.
- show trend, not judgement.
- show important task completion separately.
- show postponed reasons as input for reflection, not failure.

- [ ] **Step 2: Verify docs**

Run:

```powershell
git diff --check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```powershell
git add docs/PROJECT_PHASE_4_INSIGHTS.md
git commit -m "docs: plan insight phase"
```

### Task 2: Add Trend Calculation Rules

**Files:**
- Create: `src/domain/insightRules.ts`
- Create: `src/domain/insightRules.test.ts`

- [ ] **Step 1: Write unit tests**

Cover:

- empty month returns empty trend.
- partially completed day calculates completion rate.
- important task completion is separated from all-task completion.
- postponed reasons are counted by tag and note presence.
- actual duration aggregates by date.

- [ ] **Step 2: Implement pure functions**

Implementation rule: no React and no repository imports in `insightRules.ts`.

- [ ] **Step 3: Verify**

Run:

```powershell
npm.cmd run test:run -- src/domain/insightRules.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/domain/insightRules.ts src/domain/insightRules.test.ts
git commit -m "feat: calculate neutral monthly insights"
```

### Task 3: Upgrade Monthly Overview

**Files:**
- Modify: `src/views/MonthlyOverview.tsx`
- Modify: `src/views/MonthlyOverview.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Add tests for visible insight sections**

Cover:

- completion trend appears.
- quadrant distribution appears.
- postponed reason summary appears.
- empty month has neutral empty state.

- [ ] **Step 2: Implement UI**

Use compact panels and simple charts built with CSS/SVG if no chart library exists. Do not add a chart dependency unless the implementation becomes brittle.

- [ ] **Step 3: Verify**

Run:

```powershell
npm.cmd run test:run -- src/views/MonthlyOverview.test.tsx
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/views/MonthlyOverview.tsx src/views/MonthlyOverview.test.tsx src/styles.css
git commit -m "feat: show monthly insight trends"
```

### Task 4: Add Monthly Galaxy Map

**Files:**
- Create: `src/views/MonthlyGalaxyMap.tsx`
- Create: `src/views/MonthlyGalaxyMap.test.tsx`
- Modify: `src/views/MonthlyOverview.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write tests for day nodes**

Cover:

- 30-day month renders 30 nodes.
- 31-day month renders 31 nodes.
- clicking a node shows that date's tasks.
- days with completed tasks have a distinct visual state.

- [ ] **Step 2: Implement map**

Use deterministic layout for tests. Animation may be decorative only and must not be required for understanding the data.

- [ ] **Step 3: Verify**

Run:

```powershell
npm.cmd run test:run -- src/views/MonthlyGalaxyMap.test.tsx src/views/MonthlyOverview.test.tsx
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/views/MonthlyGalaxyMap.tsx src/views/MonthlyGalaxyMap.test.tsx src/views/MonthlyOverview.tsx src/styles.css
git commit -m "feat: add monthly galaxy map"
```

### Task 5: Add Monthly File Cabinet View

**Files:**
- Create: `src/views/MonthlyFileCabinet.tsx`
- Create: `src/views/MonthlyFileCabinet.test.tsx`
- Modify: `src/views/MonthlyOverview.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write tests**

Cover:

- month grid shows correct day count.
- day cell color reflects summary state.
- click opens day task list.
- missing day data remains readable.

- [ ] **Step 2: Implement view**

The file cabinet is a monthly archive view, not a replacement for the daily home screen.

- [ ] **Step 3: Verify**

Run:

```powershell
npm.cmd run test:run -- src/views/MonthlyFileCabinet.test.tsx src/views/MonthlyOverview.test.tsx
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/views/MonthlyFileCabinet.tsx src/views/MonthlyFileCabinet.test.tsx src/views/MonthlyOverview.tsx src/styles.css
git commit -m "feat: add monthly file cabinet"
```

### Task 6: Phase 4 Acceptance

**Files:**
- Modify: `README.md`
- Modify: `docs/PROJECT_PHASE_4_INSIGHTS.md`

- [ ] **Step 1: Run full verification**

Run:

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run tauri:check:gnu
npm.cmd run portable:build:gnu
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Manual smoke**

Check:

1. A month with no data.
2. A month with partial data.
3. A month with postponed tasks.
4. Galaxy monthly map day click.
5. File cabinet day click.
6. Copy in README still says trend/completion, not score.

- [ ] **Step 3: Commit docs**

```powershell
git add README.md docs/PROJECT_PHASE_4_INSIGHTS.md
git commit -m "docs: document monthly insight workflow"
```

## Phase 5: Daily Workflow Enhancements

### Task 1: Write Phase 5 Product Spec

**Files:**
- Create: `docs/PROJECT_PHASE_5_WORKFLOW.md`

- [ ] **Step 1: Define workflow boundaries**

Spec must state:

- templates are manually applied.
- recurrence supports only simple daily, workday, and weekly rules.
- search is local only.
- no project management or calendar replacement.

- [ ] **Step 2: Commit**

```powershell
git add docs/PROJECT_PHASE_5_WORKFLOW.md
git commit -m "docs: plan workflow phase"
```

### Task 2: Add Task Templates

**Files:**
- Create: `src/data/taskTemplates.ts`
- Create: `src/data/taskTemplates.test.ts`
- Create: `src/views/TaskTemplatePanel.tsx`
- Create: `src/views/TaskTemplatePanel.test.tsx`
- Modify: repository interfaces only if persistence is required.

- [ ] **Step 1: Test template save and apply**

Cover:

- save selected tasks as template.
- apply template to today.
- applying template requires explicit user action.
- template preserves quadrant and expected duration where available.

- [ ] **Step 2: Implement minimal template model**

Avoid categories, sharing, and marketplace concepts.

- [ ] **Step 3: Verify**

Run:

```powershell
npm.cmd run test:run -- src/data/taskTemplates.test.ts src/views/TaskTemplatePanel.test.tsx
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/data/taskTemplates.ts src/data/taskTemplates.test.ts src/views/TaskTemplatePanel.tsx src/views/TaskTemplatePanel.test.tsx
git commit -m "feat: add local task templates"
```

### Task 3: Add Simple Recurrence

**Files:**
- Create: `src/domain/recurrenceRules.ts`
- Create: `src/domain/recurrenceRules.test.ts`
- Modify: task creation flow files after tests define behavior.

- [ ] **Step 1: Test recurrence rules**

Cover:

- daily recurrence creates next-day task.
- workday recurrence skips Saturday and Sunday.
- weekly recurrence uses the same weekday.
- duplicate generation is prevented for the same date.

- [ ] **Step 2: Implement pure recurrence functions**

Do not support advanced RRULE syntax in this phase.

- [ ] **Step 3: Wire into app startup or day rollover**

Generate due recurring tasks when opening a date, not continuously in the background.

- [ ] **Step 4: Verify**

Run:

```powershell
npm.cmd run test:run -- src/domain/recurrenceRules.test.ts src/App.test.tsx src/store/appStore.test.tsx
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/domain/recurrenceRules.ts src/domain/recurrenceRules.test.ts src/App.tsx src/App.test.tsx src/store/appStore.tsx src/store/appStore.test.tsx
git commit -m "feat: add simple recurring tasks"
```

### Task 4: Add Search And Filters

**Files:**
- Create: `src/domain/searchRules.ts`
- Create: `src/domain/searchRules.test.ts`
- Create: `src/views/SearchPanel.tsx`
- Create: `src/views/SearchPanel.test.tsx`

- [ ] **Step 1: Test local search**

Cover:

- title keyword.
- date range.
- quadrant.
- task status.
- postponed reason.
- empty result state.

- [ ] **Step 2: Implement search**

Search local repository data only. Do not add indexing service or external database.

- [ ] **Step 3: Verify**

Run:

```powershell
npm.cmd run test:run -- src/domain/searchRules.test.ts src/views/SearchPanel.test.tsx
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/domain/searchRules.ts src/domain/searchRules.test.ts src/views/SearchPanel.tsx src/views/SearchPanel.test.tsx
git commit -m "feat: search local daily records"
```

### Task 5: Phase 5 Acceptance

**Files:**
- Modify: `README.md`
- Modify: `docs/PROJECT_PHASE_5_WORKFLOW.md`

- [ ] **Step 1: Run full verification**

Run:

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run tauri:check:gnu
npm.cmd run portable:build:gnu
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Manual smoke**

Check:

1. Create and apply template.
2. Generate recurring task for tomorrow.
3. Search completed task by title.
4. Search postponed task by reason.
5. Confirm no duplicate recurring task appears after reopening.

- [ ] **Step 3: Commit docs**

```powershell
git add README.md docs/PROJECT_PHASE_5_WORKFLOW.md
git commit -m "docs: document workflow enhancements"
```

## Phase 6: Open Source Release Preparation

### Task 1: Write Open Source Spec

**Files:**
- Create: `docs/PROJECT_PHASE_6_OPEN_SOURCE.md`

- [ ] **Step 1: Define release expectations**

Spec must state:

- what users can expect from the portable zip.
- WebView2 Runtime requirement.
- how issues should avoid private data.
- what maintainers will and will not support.

- [ ] **Step 2: Commit**

```powershell
git add docs/PROJECT_PHASE_6_OPEN_SOURCE.md
git commit -m "docs: plan open source release"
```

### Task 2: Add Open Source Repository Files

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `CHANGELOG.md`
- Create: `LICENSE`
- Create: `.github/ISSUE_TEMPLATE/bug_report.md`
- Create: `.github/ISSUE_TEMPLATE/feature_request.md`

- [ ] **Step 1: Add contribution instructions**

Include:

- `npm.cmd install`
- `npm.cmd run test:run`
- `npm.cmd run build`
- `npm.cmd run tauri:check:gnu`
- no private data in issues.

- [ ] **Step 2: Add changelog**

Start with versions:

- `0.2.0`: portable preview.
- `0.1.0`: initial MVP.

- [ ] **Step 3: Verify docs**

Run:

```powershell
git diff --check
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add CONTRIBUTING.md CHANGELOG.md LICENSE .github/ISSUE_TEMPLATE/bug_report.md .github/ISSUE_TEMPLATE/feature_request.md
git commit -m "docs: add open source project files"
```

### Task 3: Add CI Checks

**Files:**
- Create: `.github/workflows/check.yml`

- [ ] **Step 1: Add workflow**

Minimum jobs:

- install Node dependencies.
- run `npm.cmd run test:run` on Windows.
- run `npm.cmd run build` on Windows.
- run `npm.cmd run tauri:check:gnu` only if the hosted runner can install required GNU setup reliably.

- [ ] **Step 2: Verify locally**

Run:

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run tauri:check:gnu
```

Expected: PASS.

- [ ] **Step 3: Commit**

```powershell
git add .github/workflows/check.yml
git commit -m "ci: add project checks"
```

### Task 4: Prepare Release Notes

**Files:**
- Create: `docs/releases/v0.2.0.md`
- Modify: `README.md`

- [ ] **Step 1: Write release notes**

Include:

- what is included.
- how to run portable zip.
- WebView2 Runtime requirement.
- where data is stored.
- known limitations.

- [ ] **Step 2: Verify docs**

Run:

```powershell
git diff --check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```powershell
git add README.md docs/releases/v0.2.0.md
git commit -m "docs: prepare portable release notes"
```

### Task 5: Phase 6 Acceptance

**Files:**
- Modify only files needed for documentation corrections.

- [ ] **Step 1: Run local verification**

Run:

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run tauri:check:gnu
npm.cmd run portable:build:gnu
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Verify GitHub after push**

After pushing:

- GitHub repository renders README correctly.
- issue templates appear.
- CI starts on push.
- release notes are readable.

## Phase 7: Small-Team Feasibility Only

### Task 1: Write Team Feasibility Spec

**Files:**
- Create: `docs/PROJECT_PHASE_7_TEAM_FEASIBILITY.md`

- [ ] **Step 1: Document questions before building**

Required questions:

- What data would be shared?
- Who owns shared data?
- Can personal review remain private?
- Is file export enough?
- Does this require accounts?
- What happens when two users edit the same task?

- [ ] **Step 2: Define explicit non-goals**

Non-goals:

- no real-time collaboration.
- no permissions.
- no cloud backend.
- no billing.
- no organization admin.

- [ ] **Step 3: Commit**

```powershell
git add docs/PROJECT_PHASE_7_TEAM_FEASIBILITY.md
git commit -m "docs: plan team feasibility review"
```

### Task 2: Add Read-Only Share Export Prototype

**Files:**
- Create: `src/data/shareExport.ts`
- Create: `src/data/shareExport.test.ts`

- [ ] **Step 1: Write tests**

Cover:

- export excludes private review notes by default.
- export includes task title, status, quadrant, date.
- export can include review only when explicitly requested.

- [ ] **Step 2: Implement export**

Do not add network transport. This is file-based only.

- [ ] **Step 3: Verify**

Run:

```powershell
npm.cmd run test:run -- src/data/shareExport.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add src/data/shareExport.ts src/data/shareExport.test.ts
git commit -m "feat: export read-only share snapshot"
```

### Task 3: Team Feasibility Decision

**Files:**
- Modify: `docs/PROJECT_PHASE_7_TEAM_FEASIBILITY.md`

- [ ] **Step 1: Write decision record**

The decision must be one of:

- stop team work and keep personal product.
- continue with file-based sharing.
- write a new cloud/team architecture spec.

- [ ] **Step 2: Verify docs**

Run:

```powershell
git diff --check
```

Expected: PASS.

- [ ] **Step 3: Commit**

```powershell
git add docs/PROJECT_PHASE_7_TEAM_FEASIBILITY.md
git commit -m "docs: record team feasibility decision"
```

## Cross-Phase Testing Rules

Every phase must run these before final completion:

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run tauri:check:gnu
npm.cmd run portable:build:gnu
git diff --check
```

For UI-heavy changes, add manual checks:

- blank data.
- demo data.
- reopened app persistence.
- portable zip from a clean temp folder.
- WebView2 Runtime note visible in docs.

## Cross-Phase Capability Rules

Do not add these without a new dedicated spec:

- cloud sync.
- login.
- team permissions.
- encryption.
- mobile app.
- automatic updater.
- paid plans.
- AI judgement or scoring.

If a task seems to require one of these, stop the phase and write a separate design first.
