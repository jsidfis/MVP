# Daily Workspace UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the daily workspace so planning uses a focused full-width creation flow, execution uses a full-window folder/galaxy canvas with on-demand drawers, and review uses the selected view as a dimmed background.

**Architecture:** Keep repository, store, task state, and persistence contracts unchanged. Split stage-specific presentation into focused React components, reuse the existing panels inside mutually exclusive drawers, and extend the existing CSS galaxy rendering with quadrant color semantics and reduced-motion behavior.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, Testing Library, Tauri 2.

---

### Task 1: Build the focused planning workspace

**Files:**
- Create: `src/views/PlanningWorkspace.tsx`
- Create: `src/views/PlanningWorkspace.test.tsx`
- Modify: `src/views/DailyWorkspace.tsx`
- Modify: `src/views/DailyWorkspace.test.tsx`
- Modify: `src/views/DailyWorkspace.taskTemplates.test.tsx`

- [ ] **Step 1: Write failing planning tests**

Add tests proving that plan mode:

```tsx
expect(screen.queryByRole('heading', { name: '文件夹视图' })).toBeNull();
expect(screen.queryByRole('heading', { name: '今日星图' })).toBeNull();
expect(screen.getByRole('heading', { name: '制定今日计划' })).toBeTruthy();
```

Add a component test that enters a title, advances to the quadrant step, selects the `重要不紧急` card, selects `每周`, submits, and expects:

```tsx
expect(onAdd).toHaveBeenCalledWith({
  title: '整理项目计划',
  quadrant: 'important_not_urgent',
  recurrenceFrequency: 'weekly',
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
npm.cmd run test:run -- src/views/PlanningWorkspace.test.tsx src/views/DailyWorkspace.test.tsx
```

Expected: FAIL because `PlanningWorkspace` and the new stage-specific behavior do not exist.

- [ ] **Step 3: Implement the minimal planning flow**

Create `PlanningWorkspace` with:

- carryover inbox first;
- four steps: title, quadrant cards, recurrence, confirmation;
- one actionable quadrant input;
- a compact today summary with quadrant, recurrence, and carryover labels;
- a button that opens the existing template panel without rendering it permanently.

Update `DailyWorkspace` so plan mode renders `PlanningWorkspace` instead of the selected main view.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
npm.cmd run test:run -- src/views/PlanningWorkspace.test.tsx src/views/DailyWorkspace.test.tsx src/views/DailyWorkspace.taskTemplates.test.tsx
```

Expected: all selected tests pass.

### Task 2: Add the full-window execution shell and drawers

**Files:**
- Create: `src/components/WorkspaceDock.tsx`
- Create: `src/components/WorkspaceDock.test.tsx`
- Create: `src/views/ExecutionWorkspace.tsx`
- Create: `src/views/ExecutionWorkspace.test.tsx`
- Modify: `src/views/DailyWorkspace.tsx`

- [ ] **Step 1: Write failing dock and execution tests**

Test mutual exclusion and draft preservation:

```tsx
await userEvent.click(screen.getByRole('button', { name: '新增任务' }));
await userEvent.type(screen.getByLabelText('任务标题'), '临时新增');
await userEvent.click(screen.getByRole('button', { name: '搜索' }));
await userEvent.click(screen.getByRole('button', { name: '新增任务' }));
expect(screen.getByLabelText('任务标题')).toHaveValue('临时新增');
```

Test that execute mode renders the selected view and dock, without the old permanent side panel.

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
npm.cmd run test:run -- src/components/WorkspaceDock.test.tsx src/views/ExecutionWorkspace.test.tsx
```

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement dock, drawer, and execution workspace**

Implement four dock actions:

- `新增任务`
- `今日任务`
- `搜索`
- `设置`

Keep all drawer children mounted and hide inactive panels with the `hidden` attribute so form state survives switching. Render the selected folder or galaxy view as the full workspace background. Show current task details in the task drawer when a primary task exists.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
npm.cmd run test:run -- src/components/WorkspaceDock.test.tsx src/views/ExecutionWorkspace.test.tsx src/views/DailyWorkspace.test.tsx
```

Expected: all selected tests pass.

### Task 3: Strengthen galaxy quadrant semantics and motion

**Files:**
- Modify: `src/views/GalaxyView.tsx`
- Modify: `src/views/GalaxyView.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing galaxy tests**

Assert the four named quadrant regions and quadrant class/data markers:

```tsx
expect(screen.getByLabelText('重要且紧急象限')).toBeTruthy();
expect(screen.getByLabelText('重要不紧急象限')).toBeTruthy();
expect(screen.getByText('Task completed-1').closest('[data-quadrant]')).toHaveAttribute(
  'data-quadrant',
  'important_urgent',
);
```

Assert the active ship exposes the route path for CSS motion:

```tsx
expect(screen.getByLabelText('当前飞船')).toHaveStyle({
  offsetPath: expect.stringContaining('path('),
});
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
npm.cmd run test:run -- src/views/GalaxyView.test.tsx
```

Expected: FAIL because regions, quadrant markers, and route-driven ship motion are absent.

- [ ] **Step 3: Implement quadrant regions and restrained motion**

Add:

- four semantic region overlays;
- compact quadrant legend;
- `data-quadrant` on each planet;
- quadrant-specific orb colors that remain after completion;
- current ship `offset-path` based on the active route;
- CSS fallback position and `prefers-reduced-motion` rules.

- [ ] **Step 4: Run galaxy tests and verify GREEN**

Run:

```powershell
npm.cmd run test:run -- src/views/GalaxyView.test.tsx src/domain/galaxyLayout.test.ts
```

Expected: all selected tests pass.

### Task 4: Build the review background and drawer layout

**Files:**
- Create: `src/views/ReviewWorkspace.tsx`
- Create: `src/views/ReviewWorkspace.test.tsx`
- Modify: `src/views/DailyWorkspace.tsx`
- Modify: `src/views/ReviewPanel.tsx`
- Modify: `src/views/ReviewPanel.test.tsx`

- [ ] **Step 1: Write failing review workspace tests**

Assert review mode renders:

```tsx
expect(screen.getByLabelText('复盘背景')).toBeTruthy();
expect(screen.getByRole('heading', { name: '晚间复盘' })).toBeTruthy();
expect(screen.getByText('问题 1 / 4')).toBeTruthy();
```

Add a draft test that types an answer, advances, goes back, and confirms the answer remains.

- [ ] **Step 2: Run tests and verify RED**

Run:

```powershell
npm.cmd run test:run -- src/views/ReviewWorkspace.test.tsx src/views/ReviewPanel.test.tsx
```

Expected: FAIL because the review workspace and step controls do not exist.

- [ ] **Step 3: Implement the review workspace**

Wrap the selected view in a dimmed background and render `ReviewPanel` in the right drawer. Change `ReviewPanel` presentation to show the existing unfinished-task decisions followed by one review question at a time while retaining all draft values in component state.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
npm.cmd run test:run -- src/views/ReviewWorkspace.test.tsx src/views/ReviewPanel.test.tsx src/views/DailyWorkspace.test.tsx
```

Expected: all selected tests pass.

### Task 5: Finish responsive styling and documentation

**Files:**
- Modify: `src/styles.css`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Create: `docs/PROJECT_UI_REFRESH.md`

- [ ] **Step 1: Implement final responsive CSS**

Add stable dimensions for:

- full-window stage workspace;
- overlay drawers;
- bottom dock;
- planning step cards;
- narrow-screen bottom sheet;
- long Chinese task titles;
- reduced motion.

- [ ] **Step 2: Update project documentation**

Document this as a formal-release UI refinement workstream. Keep the existing Phase 7 “small-team validation” definition unchanged and record the completed interaction decisions and validation boundaries.

- [ ] **Step 3: Run full verification**

Run:

```powershell
npm.cmd run test:run
npm.cmd run build
npm.cmd run tauri:check:gnu
npm.cmd run portable:build:gnu
git diff --check
```

Expected: all commands exit successfully.

- [ ] **Step 4: Inspect the portable package**

Confirm the generated zip:

- starts successfully after extraction;
- contains no `.git`, `node_modules`, `src`, or `src-tauri`;
- contains no local `data/user.sqlite`.

- [ ] **Step 5: Commit and push**

Stage only the plan, UI implementation, tests, and documentation. Commit with:

```powershell
git commit -m "feat: refresh daily workspace ui"
```

Push the current branch to the repository default branch as already established for this project:

```powershell
git push origin codex/daily-plan-review-mvp:main
```
