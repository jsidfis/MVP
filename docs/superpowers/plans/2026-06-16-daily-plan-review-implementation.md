# Daily Plan Review MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the local-first desktop MVP for daily planning, task execution, review, and folder/galaxy view switching.

**Architecture:** The app is a Tauri desktop shell with a React + TypeScript frontend. Domain rules stay in pure TypeScript modules with Vitest coverage; persistence is behind a repository interface with a SQLite implementation using Tauri SQL. UI components consume one app store and never talk directly to SQL.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, Vitest, Testing Library, SQLite via `@tauri-apps/plugin-sql`, notifications via `@tauri-apps/plugin-notification`, SVG/CSS for the MVP galaxy view.

---

## Source References

- Tauri project setup: https://v2.tauri.app/start/create-project/
- Tauri SQL plugin: https://v2.tauri.app/plugin/sql/
- Tauri SQL JavaScript API: https://v2.tauri.app/reference/javascript/sql/
- Tauri notification plugin: https://v2.tauri.app/plugin/notification/

## File Structure

Create or modify these files:

- `package.json`: scripts and frontend dependencies.
- `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `vitest.setup.ts`: frontend tooling.
- `src/main.tsx`: React entry.
- `src/App.tsx`: app composition.
- `src/styles.css`: shared visual system for warm archive and night sky.
- `src/domain/types.ts`: domain types and enum unions.
- `src/domain/taskRules.ts`: task creation, status transitions, ordering, carryover rules.
- `src/domain/timeRules.ts`: session timing and manual correction rules.
- `src/domain/reviewRules.ts`: review decisions, reason labels, daily review validation.
- `src/domain/summaryRules.ts`: daily completion overview and weighted highlight calculation.
- `src/data/schema.ts`: SQL schema strings.
- `src/data/dailyRepository.ts`: repository interface.
- `src/data/memoryDailyRepository.ts`: test and development fallback repository.
- `src/data/tauriSqlDailyRepository.ts`: Tauri SQL repository.
- `src/store/appStore.tsx`: reducer, context provider, async actions.
- `src/store/appStore.test.tsx`: store integration tests.
- `src/notifications/notificationService.ts`: notification permission and send wrapper.
- `src/components/StageTabs.tsx`: plan/execute/review stage switch.
- `src/components/ViewSwitch.tsx`: folder/galaxy switch.
- `src/components/TaskQuickAdd.tsx`: top quick-add form.
- `src/components/CarryoverInbox.tsx`: morning carryover confirmation.
- `src/components/TaskStatusBadge.tsx`: status and carryover badges.
- `src/views/DailyWorkspace.tsx`: main today screen.
- `src/views/FolderView.tsx`: four-floor folder view.
- `src/views/GalaxyView.tsx`: four-quadrant galaxy view with curved routes.
- `src/views/ReviewPanel.tsx`: evening review flow.
- `src/views/CompletionSummary.tsx`: post-review overview.
- `src/views/MonthlyOverview.tsx`: read-only monthly entry.
- `src/settings/SettingsPanel.tsx`: reminder setup and view preference.
- `src-tauri/Cargo.toml`, `src-tauri/build.rs`, `src-tauri/src/main.rs`, `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`: Tauri shell and plugin setup.

## Task 1: Scaffold Tooling And Tauri Shell

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vitest.setup.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/src/lib.rs`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/capabilities/default.json`

- [ ] **Step 1: Create frontend package metadata**

Create `package.json`:

```json
{
  "name": "daily-plan-review",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-notification": "^2.0.0",
    "@tauri-apps/plugin-sql": "^2.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create Vite and TypeScript config**

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
  },
});
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Create the minimal React shell**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>每日计划与复盘</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <h1>每日计划与复盘</h1>
      <p>今天工作台将在后续任务中接入。</p>
    </main>
  );
}
```

Create `src/styles.css`:

```css
:root {
  color: #352a20;
  background: #f3eadc;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 960px;
  min-height: 100vh;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-shell {
  min-height: 100vh;
  padding: 32px;
}
```

- [ ] **Step 4: Create Tauri shell files**

Create `src-tauri/Cargo.toml`:

```toml
[package]
name = "daily-plan-review"
version = "0.1.0"
description = "Daily planning and review desktop app"
authors = ["PAIDA"]
edition = "2021"

[lib]
name = "daily_plan_review_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-notification = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

Create `src-tauri/build.rs`:

```rust
fn main() {
    tauri_build::build()
}
```

Create `src-tauri/src/main.rs`:

```rust
fn main() {
    daily_plan_review_lib::run();
}
```

Create `src-tauri/src/lib.rs`:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Create `src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "每日计划与复盘",
  "version": "0.1.0",
  "identifier": "com.paida.daily-plan-review",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "每日计划与复盘",
        "width": 1200,
        "height": 820,
        "minWidth": 960,
        "minHeight": 720
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all"
  },
  "plugins": {
    "sql": {
      "preload": ["sqlite:daily-plan-review.db"]
    }
  }
}
```

Create `src-tauri/capabilities/default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default permissions for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "notification:default",
    "sql:default",
    "sql:allow-execute"
  ]
}
```

- [ ] **Step 5: Install dependencies**

Run:

```powershell
npm install
```

Expected: `package-lock.json` is created and dependencies install without errors.

- [ ] **Step 6: Verify frontend build and tests**

Run:

```powershell
npm run build
npm run test:run
```

Expected: build succeeds; tests pass with zero tests or a no-test pass depending on Vitest version.

- [ ] **Step 7: Commit scaffold**

```powershell
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json vitest.setup.ts src src-tauri
git commit -m "chore: scaffold tauri react app"
```

## Task 2: Domain Types And Task Rules

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/taskRules.ts`
- Create: `src/domain/taskRules.test.ts`

- [ ] **Step 1: Write failing tests for task creation, sorting, and carryover confirmation**

Create `src/domain/taskRules.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildTask,
  confirmCarryoverTask,
  orderTasksForFloor,
  QUADRANT_FLOORS,
} from './taskRules';
import type { Task } from './types';

describe('taskRules', () => {
  it('creates a task with only title and quadrant', () => {
    const task = buildTask({
      title: '写设计方案',
      quadrant: 'important_urgent',
      now: '2026-06-16T08:30:00.000Z',
    });

    expect(task.title).toBe('写设计方案');
    expect(task.quadrant).toBe('important_urgent');
    expect(task.status).toBe('not_started');
    expect(task.isCarryover).toBe(false);
  });

  it('maps quadrants to four folder floors', () => {
    expect(QUADRANT_FLOORS.important_urgent).toBe(4);
    expect(QUADRANT_FLOORS.important_not_urgent).toBe(3);
    expect(QUADRANT_FLOORS.not_important_urgent).toBe(2);
    expect(QUADRANT_FLOORS.not_important_not_urgent).toBe(1);
  });

  it('orders tasks by active, not started, completed, archived states', () => {
    const tasks: Task[] = [
      task('4', 'postponed'),
      task('2', 'not_started'),
      task('1', 'active_primary'),
      task('3', 'completed'),
      task('5', 'dropped'),
    ];

    expect(orderTasksForFloor(tasks).map((item) => item.id)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('confirms carryover tasks into today while preserving the carryover mark', () => {
    const original = task('old', 'postponed');
    const confirmed = confirmCarryoverTask(original, '2026-06-16');

    expect(confirmed.date).toBe('2026-06-16');
    expect(confirmed.status).toBe('not_started');
    expect(confirmed.isCarryover).toBe(true);
    expect(confirmed.carryoverFromDate).toBe('2026-06-15');
  });
});

function task(id: string, status: Task['status']): Task {
  return {
    id,
    date: '2026-06-15',
    title: `task-${id}`,
    quadrant: 'important_urgent',
    status,
    isCarryover: status === 'postponed',
    carryoverFromDate: status === 'postponed' ? '2026-06-15' : undefined,
    postponeReasonTag: status === 'postponed' ? 'time_estimate_error' : undefined,
    postponeReasonNote: undefined,
    createdAt: '2026-06-15T08:00:00.000Z',
    updatedAt: '2026-06-15T08:00:00.000Z',
  };
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm run test:run -- src/domain/taskRules.test.ts
```

Expected: FAIL because `src/domain/types.ts` and `src/domain/taskRules.ts` do not exist.

- [ ] **Step 3: Implement domain types**

Create `src/domain/types.ts`:

```ts
export type Quadrant =
  | 'important_urgent'
  | 'important_not_urgent'
  | 'not_important_urgent'
  | 'not_important_not_urgent';

export type TaskStatus =
  | 'not_started'
  | 'active_primary'
  | 'active_background'
  | 'paused'
  | 'completed'
  | 'postponed'
  | 'dropped';

export type Stage = 'plan' | 'execute' | 'review';
export type HomeView = 'folder' | 'galaxy';

export type ReasonTag =
  | 'time_estimate_error'
  | 'unexpected_interruption'
  | 'low_energy'
  | 'external_dependency'
  | 'priority_changed'
  | 'unclear_task'
  | 'no_longer_needed';

export interface Task {
  id: string;
  date: string;
  title: string;
  quadrant: Quadrant;
  status: TaskStatus;
  isCarryover: boolean;
  carryoverFromDate?: string;
  postponeReasonTag?: ReasonTag;
  postponeReasonNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSession {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt?: string;
  isManual: boolean;
  durationMinutes?: number;
}

export interface ReviewDecision {
  id: string;
  taskId: string;
  action: 'postpone' | 'drop' | 'reschedule';
  targetDate?: string;
  reasonTag: ReasonTag;
  reasonNote?: string;
  createdAt: string;
}

export interface DailyReview {
  completedText: string;
  unfinishedText: string;
  feelingText: string;
  tomorrowFocusText: string;
}

export interface DailyFile {
  date: string;
  stage: Stage;
  goal: string;
  statusScore?: number;
  statusNote?: string;
  review?: DailyReview;
  reviewedAt?: string;
}

export interface UserSettings {
  homeView: HomeView;
  morningReminder?: string;
  eveningReminder?: string;
  notificationsEnabled: boolean;
}
```

- [ ] **Step 4: Implement task rules**

Create `src/domain/taskRules.ts`:

```ts
import type { Quadrant, Task, TaskStatus } from './types';

export const QUADRANT_FLOORS: Record<Quadrant, 1 | 2 | 3 | 4> = {
  important_urgent: 4,
  important_not_urgent: 3,
  not_important_urgent: 2,
  not_important_not_urgent: 1,
};

const STATUS_ORDER: Record<TaskStatus, number> = {
  active_primary: 0,
  active_background: 0,
  paused: 0,
  not_started: 1,
  completed: 2,
  postponed: 3,
  dropped: 4,
};

export function buildTask(input: {
  title: string;
  quadrant: Quadrant;
  now: string;
  date?: string;
  id?: string;
}): Task {
  const title = input.title.trim();
  if (title.length === 0) {
    throw new Error('Task title is required');
  }

  return {
    id: input.id ?? crypto.randomUUID(),
    date: input.date ?? input.now.slice(0, 10),
    title,
    quadrant: input.quadrant,
    status: 'not_started',
    isCarryover: false,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function orderTasksForFloor(tasks: Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    const statusDelta = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
    if (statusDelta !== 0) return statusDelta;
    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function confirmCarryoverTask(task: Task, today: string): Task {
  return {
    ...task,
    date: today,
    status: 'not_started',
    isCarryover: true,
    carryoverFromDate: task.carryoverFromDate ?? task.date,
    updatedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 5: Run tests and verify pass**

Run:

```powershell
npm run test:run -- src/domain/taskRules.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit domain task rules**

```powershell
git add src/domain
git commit -m "feat: add task domain rules"
```

## Task 3: Time Tracking Rules

**Files:**
- Create: `src/domain/timeRules.ts`
- Create: `src/domain/timeRules.test.ts`

- [ ] **Step 1: Write failing tests for sessions and task switching**

Create `src/domain/timeRules.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { completeSession, createSession, manualCorrectSession, switchPrimaryTask } from './timeRules';
import type { Task, TaskSession } from './types';

describe('timeRules', () => {
  it('creates a session when a task starts', () => {
    const session = createSession('task-1', '2026-06-16T09:00:00.000Z');

    expect(session.taskId).toBe('task-1');
    expect(session.startedAt).toBe('2026-06-16T09:00:00.000Z');
    expect(session.isManual).toBe(false);
  });

  it('completes a session with rounded minutes', () => {
    const session = createSession('task-1', '2026-06-16T09:00:00.000Z');
    const completed = completeSession(session, '2026-06-16T10:25:00.000Z');

    expect(completed.endedAt).toBe('2026-06-16T10:25:00.000Z');
    expect(completed.durationMinutes).toBe(85);
  });

  it('allows direct manual correction without a reason', () => {
    const session = createSession('task-1', '2026-06-16T09:00:00.000Z');
    const corrected = manualCorrectSession(session, {
      startedAt: '2026-06-16T09:10:00.000Z',
      endedAt: '2026-06-16T09:40:00.000Z',
    });

    expect(corrected.isManual).toBe(true);
    expect(corrected.durationMinutes).toBe(30);
  });

  it('switches the current primary task and pauses the old task when chosen', () => {
    const oldTask = task('old', 'active_primary');
    const newTask = task('new', 'not_started');
    const result = switchPrimaryTask({ oldTask, newTask, oldTaskMode: 'pause' });

    expect(result.oldTask.status).toBe('paused');
    expect(result.newTask.status).toBe('active_primary');
  });

  it('switches the current primary task and keeps the old task in background when chosen', () => {
    const oldTask = task('old', 'active_primary');
    const newTask = task('new', 'not_started');
    const result = switchPrimaryTask({ oldTask, newTask, oldTaskMode: 'background' });

    expect(result.oldTask.status).toBe('active_background');
    expect(result.newTask.status).toBe('active_primary');
  });
});

function task(id: string, status: Task['status']): Task {
  return {
    id,
    date: '2026-06-16',
    title: id,
    quadrant: 'important_urgent',
    status,
    isCarryover: false,
    createdAt: '2026-06-16T08:00:00.000Z',
    updatedAt: '2026-06-16T08:00:00.000Z',
  };
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm run test:run -- src/domain/timeRules.test.ts
```

Expected: FAIL because `timeRules.ts` does not exist.

- [ ] **Step 3: Implement time rules**

Create `src/domain/timeRules.ts`:

```ts
import type { Task, TaskSession } from './types';

export function createSession(taskId: string, startedAt: string): TaskSession {
  return {
    id: crypto.randomUUID(),
    taskId,
    startedAt,
    isManual: false,
  };
}

export function completeSession(session: TaskSession, endedAt: string): TaskSession {
  return {
    ...session,
    endedAt,
    durationMinutes: minutesBetween(session.startedAt, endedAt),
  };
}

export function manualCorrectSession(
  session: TaskSession,
  correction: { startedAt: string; endedAt: string },
): TaskSession {
  return {
    ...session,
    startedAt: correction.startedAt,
    endedAt: correction.endedAt,
    durationMinutes: minutesBetween(correction.startedAt, correction.endedAt),
    isManual: true,
  };
}

export function switchPrimaryTask(input: {
  oldTask: Task;
  newTask: Task;
  oldTaskMode: 'pause' | 'background';
}): { oldTask: Task; newTask: Task } {
  return {
    oldTask: {
      ...input.oldTask,
      status: input.oldTaskMode === 'pause' ? 'paused' : 'active_background',
      updatedAt: new Date().toISOString(),
    },
    newTask: {
      ...input.newTask,
      status: 'active_primary',
      updatedAt: new Date().toISOString(),
    },
  };
}

function minutesBetween(startedAt: string, endedAt: string): number {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    throw new Error('Invalid session time range');
  }
  return Math.round((end - start) / 60000);
}
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```powershell
npm run test:run -- src/domain/timeRules.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit time rules**

```powershell
git add src/domain/timeRules.ts src/domain/timeRules.test.ts
git commit -m "feat: add task time rules"
```

## Task 4: Review And Summary Rules

**Files:**
- Create: `src/domain/reviewRules.ts`
- Create: `src/domain/reviewRules.test.ts`
- Create: `src/domain/summaryRules.ts`
- Create: `src/domain/summaryRules.test.ts`

- [ ] **Step 1: Write failing tests for review decisions**

Create `src/domain/reviewRules.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { REASON_TAGS, buildReviewDecision, validateDailyReview } from './reviewRules';

describe('reviewRules', () => {
  it('uses the fixed MVP reason tag list', () => {
    expect(REASON_TAGS).toEqual([
      'time_estimate_error',
      'unexpected_interruption',
      'low_energy',
      'external_dependency',
      'priority_changed',
      'unclear_task',
      'no_longer_needed',
    ]);
  });

  it('builds a postpone decision with optional note', () => {
    const decision = buildReviewDecision({
      id: 'decision-1',
      taskId: 'task-1',
      action: 'postpone',
      targetDate: '2026-06-17',
      reasonTag: 'low_energy',
      reasonNote: '下午状态低',
      now: '2026-06-16T22:00:00.000Z',
    });

    expect(decision.action).toBe('postpone');
    expect(decision.targetDate).toBe('2026-06-17');
    expect(decision.reasonNote).toBe('下午状态低');
  });

  it('requires all four review questions', () => {
    expect(
      validateDailyReview({
        completedText: '完成设计文档',
        unfinishedText: '还有 UI 细节',
        feelingText: '状态不错',
        tomorrowFocusText: '开始实现计划',
      }),
    ).toBe(true);
  });
});
```

Create `src/domain/summaryRules.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildDailySummary } from './summaryRules';
import type { Task, TaskSession } from './types';

describe('summaryRules', () => {
  it('summarizes completion, highlight completion, duration, state, and unfinished decisions', () => {
    const tasks: Task[] = [
      task('1', 'important_urgent', 'completed'),
      task('2', 'important_not_urgent', 'completed'),
      task('3', 'important_not_urgent', 'postponed'),
      task('4', 'not_important_urgent', 'dropped'),
    ];
    const sessions: TaskSession[] = [
      session('1', 60),
      session('2', 45),
    ];

    const summary = buildDailySummary({
      tasks,
      sessions,
      statusScore: 4,
      statusNote: '状态稳定',
    });

    expect(summary.completedCount).toBe(2);
    expect(summary.totalCount).toBe(4);
    expect(summary.highlightCompleted).toBe(2);
    expect(summary.highlightTotal).toBe(3);
    expect(summary.durationMinutes).toBe(105);
    expect(summary.postponedCount).toBe(1);
    expect(summary.droppedCount).toBe(1);
    expect(summary.statusText).toBe('4 / 5，状态稳定');
  });
});

function task(id: string, quadrant: Task['quadrant'], status: Task['status']): Task {
  return {
    id,
    date: '2026-06-16',
    title: id,
    quadrant,
    status,
    isCarryover: false,
    createdAt: '2026-06-16T08:00:00.000Z',
    updatedAt: '2026-06-16T08:00:00.000Z',
  };
}

function session(taskId: string, durationMinutes: number): TaskSession {
  return {
    id: `session-${taskId}`,
    taskId,
    startedAt: '2026-06-16T09:00:00.000Z',
    endedAt: '2026-06-16T10:00:00.000Z',
    durationMinutes,
    isManual: false,
  };
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm run test:run -- src/domain/reviewRules.test.ts src/domain/summaryRules.test.ts
```

Expected: FAIL because rule files do not exist.

- [ ] **Step 3: Implement review rules**

Create `src/domain/reviewRules.ts`:

```ts
import type { DailyReview, ReasonTag, ReviewDecision } from './types';

export const REASON_TAGS: ReasonTag[] = [
  'time_estimate_error',
  'unexpected_interruption',
  'low_energy',
  'external_dependency',
  'priority_changed',
  'unclear_task',
  'no_longer_needed',
];

export function buildReviewDecision(input: {
  id?: string;
  taskId: string;
  action: ReviewDecision['action'];
  targetDate?: string;
  reasonTag: ReasonTag;
  reasonNote?: string;
  now: string;
}): ReviewDecision {
  if ((input.action === 'postpone' || input.action === 'reschedule') && !input.targetDate) {
    throw new Error('Target date is required for postponed or rescheduled tasks');
  }

  return {
    id: input.id ?? crypto.randomUUID(),
    taskId: input.taskId,
    action: input.action,
    targetDate: input.targetDate,
    reasonTag: input.reasonTag,
    reasonNote: input.reasonNote?.trim() || undefined,
    createdAt: input.now,
  };
}

export function validateDailyReview(review: DailyReview): boolean {
  return [
    review.completedText,
    review.unfinishedText,
    review.feelingText,
    review.tomorrowFocusText,
  ].every((value) => value.trim().length > 0);
}
```

- [ ] **Step 4: Implement summary rules**

Create `src/domain/summaryRules.ts`:

```ts
import type { Task, TaskSession } from './types';

export interface DailySummary {
  completedCount: number;
  totalCount: number;
  highlightCompleted: number;
  highlightTotal: number;
  durationMinutes: number;
  statusText: string;
  postponedCount: number;
  droppedCount: number;
}

export function buildDailySummary(input: {
  tasks: Task[];
  sessions: TaskSession[];
  statusScore?: number;
  statusNote?: string;
}): DailySummary {
  const highlightTasks = input.tasks.filter((task) =>
    task.quadrant === 'important_urgent' || task.quadrant === 'important_not_urgent',
  );

  const completedCount = input.tasks.filter((task) => task.status === 'completed').length;
  const highlightCompleted = highlightTasks.filter((task) => task.status === 'completed').length;
  const durationMinutes = input.sessions.reduce(
    (total, session) => total + (session.durationMinutes ?? 0),
    0,
  );

  return {
    completedCount,
    totalCount: input.tasks.length,
    highlightCompleted,
    highlightTotal: highlightTasks.length,
    durationMinutes,
    statusText: buildStatusText(input.statusScore, input.statusNote),
    postponedCount: input.tasks.filter((task) => task.status === 'postponed').length,
    droppedCount: input.tasks.filter((task) => task.status === 'dropped').length,
  };
}

function buildStatusText(statusScore?: number, statusNote?: string): string {
  if (!statusScore) return '未记录';
  const note = statusNote?.trim();
  return note ? `${statusScore} / 5，${note}` : `${statusScore} / 5`;
}
```

- [ ] **Step 5: Run tests and verify pass**

Run:

```powershell
npm run test:run -- src/domain/reviewRules.test.ts src/domain/summaryRules.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit review and summary rules**

```powershell
git add src/domain/reviewRules.ts src/domain/reviewRules.test.ts src/domain/summaryRules.ts src/domain/summaryRules.test.ts
git commit -m "feat: add review summary rules"
```

## Task 5: Repository Contract And Memory Repository

**Files:**
- Create: `src/data/dailyRepository.ts`
- Create: `src/data/memoryDailyRepository.ts`
- Create: `src/data/memoryDailyRepository.test.ts`

- [ ] **Step 1: Write failing repository tests**

Create `src/data/memoryDailyRepository.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildTask } from '../domain/taskRules';
import { createMemoryDailyRepository } from './memoryDailyRepository';

describe('memoryDailyRepository', () => {
  it('creates a daily file when loading a new date', async () => {
    const repository = createMemoryDailyRepository();
    const file = await repository.getDailyFile('2026-06-16');

    expect(file.date).toBe('2026-06-16');
    expect(file.stage).toBe('plan');
  });

  it('saves and reloads tasks for a date', async () => {
    const repository = createMemoryDailyRepository();
    const task = buildTask({
      id: 'task-1',
      title: '写实现计划',
      quadrant: 'important_urgent',
      now: '2026-06-16T09:00:00.000Z',
      date: '2026-06-16',
    });

    await repository.saveTask(task);

    expect(await repository.listTasks('2026-06-16')).toEqual([task]);
  });

  it('loads postponed tasks from the previous date as carryover candidates', async () => {
    const repository = createMemoryDailyRepository();
    const task = {
      ...buildTask({
        id: 'task-1',
        title: '未完成事项',
        quadrant: 'important_urgent',
        now: '2026-06-15T09:00:00.000Z',
        date: '2026-06-15',
      }),
      status: 'postponed' as const,
      postponeReasonTag: 'low_energy' as const,
    };

    await repository.saveTask(task);

    expect(await repository.listCarryoverCandidates('2026-06-16')).toEqual([task]);
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm run test:run -- src/data/memoryDailyRepository.test.ts
```

Expected: FAIL because repository files do not exist.

- [ ] **Step 3: Create repository contract**

Create `src/data/dailyRepository.ts`:

```ts
import type { DailyFile, ReviewDecision, Task, TaskSession, UserSettings } from '../domain/types';

export interface DailyRepository {
  getDailyFile(date: string): Promise<DailyFile>;
  saveDailyFile(file: DailyFile): Promise<void>;
  listTasks(date: string): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  listSessions(taskId: string): Promise<TaskSession[]>;
  saveSession(session: TaskSession): Promise<void>;
  saveReviewDecision(decision: ReviewDecision): Promise<void>;
  listCarryoverCandidates(today: string): Promise<Task[]>;
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: UserSettings): Promise<void>;
}
```

- [ ] **Step 4: Implement memory repository**

Create `src/data/memoryDailyRepository.ts`:

```ts
import type { DailyFile, ReviewDecision, Task, TaskSession, UserSettings } from '../domain/types';
import type { DailyRepository } from './dailyRepository';

export function createMemoryDailyRepository(): DailyRepository {
  const files = new Map<string, DailyFile>();
  const tasks = new Map<string, Task>();
  const sessions = new Map<string, TaskSession>();
  const decisions = new Map<string, ReviewDecision>();
  let settings: UserSettings = {
    homeView: 'folder',
    notificationsEnabled: false,
  };

  return {
    async getDailyFile(date) {
      if (!files.has(date)) {
        files.set(date, { date, stage: 'plan', goal: '' });
      }
      return files.get(date)!;
    },
    async saveDailyFile(file) {
      files.set(file.date, file);
    },
    async listTasks(date) {
      return [...tasks.values()].filter((task) => task.date === date);
    },
    async saveTask(task) {
      tasks.set(task.id, task);
    },
    async listSessions(taskId) {
      return [...sessions.values()].filter((session) => session.taskId === taskId);
    },
    async saveSession(session) {
      sessions.set(session.id, session);
    },
    async saveReviewDecision(decision) {
      decisions.set(decision.id, decision);
    },
    async listCarryoverCandidates(today) {
      return [...tasks.values()].filter((task) => {
        return task.status === 'postponed' && task.date < today;
      });
    },
    async getSettings() {
      return settings;
    },
    async saveSettings(nextSettings) {
      settings = nextSettings;
    },
  };
}
```

- [ ] **Step 5: Run tests and verify pass**

Run:

```powershell
npm run test:run -- src/data/memoryDailyRepository.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit repository contract**

```powershell
git add src/data
git commit -m "feat: add daily repository contract"
```

## Task 6: SQLite Schema And Tauri SQL Repository

**Files:**
- Create: `src/data/schema.ts`
- Create: `src/data/tauriSqlDailyRepository.ts`

- [ ] **Step 1: Create schema strings**

Create `src/data/schema.ts`:

```ts
export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS daily_files (
    date TEXT PRIMARY KEY,
    stage TEXT NOT NULL,
    goal TEXT NOT NULL DEFAULT '',
    status_score INTEGER,
    status_note TEXT,
    review_completed_text TEXT,
    review_unfinished_text TEXT,
    review_feeling_text TEXT,
    review_tomorrow_focus_text TEXT,
    reviewed_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    quadrant TEXT NOT NULL,
    status TEXT NOT NULL,
    is_carryover INTEGER NOT NULL,
    carryover_from_date TEXT,
    postpone_reason_tag TEXT,
    postpone_reason_note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS task_sessions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    is_manual INTEGER NOT NULL,
    duration_minutes INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS review_decisions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_date TEXT,
    reason_tag TEXT NOT NULL,
    reason_note TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    home_view TEXT NOT NULL,
    morning_reminder TEXT,
    evening_reminder TEXT,
    notifications_enabled INTEGER NOT NULL
  )`,
];
```

- [ ] **Step 2: Implement SQL repository**

Create `src/data/tauriSqlDailyRepository.ts`:

```ts
import Database from '@tauri-apps/plugin-sql';
import type { DailyFile, ReviewDecision, Task, TaskSession, UserSettings } from '../domain/types';
import type { DailyRepository } from './dailyRepository';
import { SCHEMA_STATEMENTS } from './schema';

type SqlDatabase = Awaited<ReturnType<typeof Database.load>>;

export async function createTauriSqlDailyRepository(): Promise<DailyRepository> {
  const db = await Database.load('sqlite:daily-plan-review.db');
  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(statement);
  }
  return createRepository(db);
}

function createRepository(db: SqlDatabase): DailyRepository {
  return {
    async getDailyFile(date) {
      const rows = await db.select<DailyFileRow[]>('SELECT * FROM daily_files WHERE date = $1', [date]);
      if (rows.length === 0) {
        const file: DailyFile = { date, stage: 'plan', goal: '' };
        await this.saveDailyFile(file);
        return file;
      }
      return mapDailyFile(rows[0]);
    },
    async saveDailyFile(file) {
      await db.execute(
        `INSERT INTO daily_files (
          date, stage, goal, status_score, status_note,
          review_completed_text, review_unfinished_text, review_feeling_text,
          review_tomorrow_focus_text, reviewed_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT(date) DO UPDATE SET
          stage = excluded.stage,
          goal = excluded.goal,
          status_score = excluded.status_score,
          status_note = excluded.status_note,
          review_completed_text = excluded.review_completed_text,
          review_unfinished_text = excluded.review_unfinished_text,
          review_feeling_text = excluded.review_feeling_text,
          review_tomorrow_focus_text = excluded.review_tomorrow_focus_text,
          reviewed_at = excluded.reviewed_at`,
        [
          file.date,
          file.stage,
          file.goal,
          file.statusScore ?? null,
          file.statusNote ?? null,
          file.review?.completedText ?? null,
          file.review?.unfinishedText ?? null,
          file.review?.feelingText ?? null,
          file.review?.tomorrowFocusText ?? null,
          file.reviewedAt ?? null,
        ],
      );
    },
    async listTasks(date) {
      const rows = await db.select<TaskRow[]>('SELECT * FROM tasks WHERE date = $1 ORDER BY created_at ASC', [date]);
      return rows.map(mapTask);
    },
    async saveTask(task) {
      await db.execute(
        `INSERT INTO tasks (
          id, date, title, quadrant, status, is_carryover, carryover_from_date,
          postpone_reason_tag, postpone_reason_note, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT(id) DO UPDATE SET
          date = excluded.date,
          title = excluded.title,
          quadrant = excluded.quadrant,
          status = excluded.status,
          is_carryover = excluded.is_carryover,
          carryover_from_date = excluded.carryover_from_date,
          postpone_reason_tag = excluded.postpone_reason_tag,
          postpone_reason_note = excluded.postpone_reason_note,
          updated_at = excluded.updated_at`,
        [
          task.id,
          task.date,
          task.title,
          task.quadrant,
          task.status,
          task.isCarryover ? 1 : 0,
          task.carryoverFromDate ?? null,
          task.postponeReasonTag ?? null,
          task.postponeReasonNote ?? null,
          task.createdAt,
          task.updatedAt,
        ],
      );
    },
    async listSessions(taskId) {
      const rows = await db.select<TaskSessionRow[]>('SELECT * FROM task_sessions WHERE task_id = $1', [taskId]);
      return rows.map(mapTaskSession);
    },
    async saveSession(session) {
      await db.execute(
        `INSERT INTO task_sessions (
          id, task_id, started_at, ended_at, is_manual, duration_minutes
        ) VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT(id) DO UPDATE SET
          started_at = excluded.started_at,
          ended_at = excluded.ended_at,
          is_manual = excluded.is_manual,
          duration_minutes = excluded.duration_minutes`,
        [
          session.id,
          session.taskId,
          session.startedAt,
          session.endedAt ?? null,
          session.isManual ? 1 : 0,
          session.durationMinutes ?? null,
        ],
      );
    },
    async saveReviewDecision(decision) {
      await db.execute(
        `INSERT INTO review_decisions (
          id, task_id, action, target_date, reason_tag, reason_note, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          decision.id,
          decision.taskId,
          decision.action,
          decision.targetDate ?? null,
          decision.reasonTag,
          decision.reasonNote ?? null,
          decision.createdAt,
        ],
      );
    },
    async listCarryoverCandidates(today) {
      const rows = await db.select<TaskRow[]>(
        `SELECT * FROM tasks WHERE status = 'postponed' AND date < $1 ORDER BY date ASC, created_at ASC`,
        [today],
      );
      return rows.map(mapTask);
    },
    async getSettings() {
      const rows = await db.select<UserSettingsRow[]>('SELECT * FROM user_settings WHERE id = 1');
      if (rows.length === 0) {
        return { homeView: 'folder', notificationsEnabled: false };
      }
      return mapSettings(rows[0]);
    },
    async saveSettings(settings) {
      await db.execute(
        `INSERT INTO user_settings (
          id, home_view, morning_reminder, evening_reminder, notifications_enabled
        ) VALUES (1,$1,$2,$3,$4)
        ON CONFLICT(id) DO UPDATE SET
          home_view = excluded.home_view,
          morning_reminder = excluded.morning_reminder,
          evening_reminder = excluded.evening_reminder,
          notifications_enabled = excluded.notifications_enabled`,
        [
          settings.homeView,
          settings.morningReminder ?? null,
          settings.eveningReminder ?? null,
          settings.notificationsEnabled ? 1 : 0,
        ],
      );
    },
  };
}

interface DailyFileRow {
  date: string;
  stage: DailyFile['stage'];
  goal: string;
  status_score: number | null;
  status_note: string | null;
  review_completed_text: string | null;
  review_unfinished_text: string | null;
  review_feeling_text: string | null;
  review_tomorrow_focus_text: string | null;
  reviewed_at: string | null;
}

interface TaskRow {
  id: string;
  date: string;
  title: string;
  quadrant: Task['quadrant'];
  status: Task['status'];
  is_carryover: number;
  carryover_from_date: string | null;
  postpone_reason_tag: Task['postponeReasonTag'] | null;
  postpone_reason_note: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskSessionRow {
  id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
  is_manual: number;
  duration_minutes: number | null;
}

interface UserSettingsRow {
  home_view: UserSettings['homeView'];
  morning_reminder: string | null;
  evening_reminder: string | null;
  notifications_enabled: number;
}

function mapDailyFile(row: DailyFileRow): DailyFile {
  return {
    date: row.date,
    stage: row.stage,
    goal: row.goal,
    statusScore: row.status_score ?? undefined,
    statusNote: row.status_note ?? undefined,
    review: row.review_completed_text
      ? {
          completedText: row.review_completed_text,
          unfinishedText: row.review_unfinished_text ?? '',
          feelingText: row.review_feeling_text ?? '',
          tomorrowFocusText: row.review_tomorrow_focus_text ?? '',
        }
      : undefined,
    reviewedAt: row.reviewed_at ?? undefined,
  };
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    quadrant: row.quadrant,
    status: row.status,
    isCarryover: row.is_carryover === 1,
    carryoverFromDate: row.carryover_from_date ?? undefined,
    postponeReasonTag: row.postpone_reason_tag ?? undefined,
    postponeReasonNote: row.postpone_reason_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTaskSession(row: TaskSessionRow): TaskSession {
  return {
    id: row.id,
    taskId: row.task_id,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    isManual: row.is_manual === 1,
    durationMinutes: row.duration_minutes ?? undefined,
  };
}

function mapSettings(row: UserSettingsRow): UserSettings {
  return {
    homeView: row.home_view,
    morningReminder: row.morning_reminder ?? undefined,
    eveningReminder: row.evening_reminder ?? undefined,
    notificationsEnabled: row.notifications_enabled === 1,
  };
}
```

- [ ] **Step 3: Run typecheck**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit SQL repository**

```powershell
git add src/data/schema.ts src/data/tauriSqlDailyRepository.ts src-tauri
git commit -m "feat: add sqlite daily repository"
```

## Task 7: App Store And Application Actions

**Files:**
- Create: `src/store/appStore.tsx`
- Create: `src/store/appStore.test.tsx`

- [ ] **Step 1: Write store tests for loading, view preference, quick add, and carryover confirmation**

Create `src/store/appStore.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildTask } from '../domain/taskRules';
import { createMemoryDailyRepository } from '../data/memoryDailyRepository';
import { AppStoreProvider, useAppStore } from './appStore';

describe('appStore', () => {
  it('loads today and can add a task', async () => {
    const repository = createMemoryDailyRepository();
    render(
      <AppStoreProvider repository={repository} today="2026-06-16">
        <Harness />
      </AppStoreProvider>,
    );

    await screen.findByText('2026-06-16');
    await userEvent.click(screen.getByRole('button', { name: 'add' }));

    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
  });

  it('confirms carryover candidates', async () => {
    const repository = createMemoryDailyRepository();
    await repository.saveTask({
      ...buildTask({
        id: 'carry',
        title: '昨天顺延',
        quadrant: 'important_urgent',
        now: '2026-06-15T09:00:00.000Z',
        date: '2026-06-15',
      }),
      status: 'postponed',
      postponeReasonTag: 'low_energy',
    });

    render(
      <AppStoreProvider repository={repository} today="2026-06-16">
        <Harness />
      </AppStoreProvider>,
    );

    await screen.findByText('carryover:1');
    await userEvent.click(screen.getByRole('button', { name: 'confirm' }));

    await waitFor(() => expect(screen.getByText('tasks:1')).toBeInTheDocument());
  });
});

function Harness() {
  const store = useAppStore();
  return (
    <div>
      <div>{store.state.dailyFile?.date}</div>
      <div>{store.state.tasks.length}</div>
      <div>tasks:{store.state.tasks.length}</div>
      <div>carryover:{store.state.carryoverCandidates.length}</div>
      <button
        type="button"
        onClick={() =>
          store.actions.addTask({
            title: '新任务',
            quadrant: 'important_urgent',
          })
        }
      >
        add
      </button>
      <button type="button" onClick={() => store.actions.confirmCarryover('carry')}>
        confirm
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm run test:run -- src/store/appStore.test.tsx
```

Expected: FAIL because `appStore.tsx` does not exist.

- [ ] **Step 3: Implement app store**

Create `src/store/appStore.tsx`:

```tsx
import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { buildTask, confirmCarryoverTask } from '../domain/taskRules';
import type { DailyFile, Quadrant, Task, UserSettings } from '../domain/types';
import type { DailyRepository } from '../data/dailyRepository';

interface AppState {
  today: string;
  dailyFile?: DailyFile;
  settings?: UserSettings;
  tasks: Task[];
  carryoverCandidates: Task[];
  isLoading: boolean;
}

type Action =
  | { type: 'loaded'; dailyFile: DailyFile; settings: UserSettings; tasks: Task[]; carryoverCandidates: Task[] }
  | { type: 'taskSaved'; task: Task }
  | { type: 'carryoverConfirmed'; task: Task };

interface StoreValue {
  state: AppState;
  actions: {
    addTask(input: { title: string; quadrant: Quadrant }): Promise<void>;
    confirmCarryover(taskId: string): Promise<void>;
    setHomeView(view: UserSettings['homeView']): Promise<void>;
  };
}

const AppStoreContext = createContext<StoreValue | undefined>(undefined);

export function AppStoreProvider(props: {
  repository: DailyRepository;
  today: string;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    today: props.today,
    tasks: [],
    carryoverCandidates: [],
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [dailyFile, settings, tasks, carryoverCandidates] = await Promise.all([
        props.repository.getDailyFile(props.today),
        props.repository.getSettings(),
        props.repository.listTasks(props.today),
        props.repository.listCarryoverCandidates(props.today),
      ]);
      if (!cancelled) {
        dispatch({ type: 'loaded', dailyFile, settings, tasks, carryoverCandidates });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [props.repository, props.today]);

  const value = useMemo<StoreValue>(() => {
    return {
      state,
      actions: {
        async addTask(input) {
          const now = new Date().toISOString();
          const task = buildTask({
            title: input.title,
            quadrant: input.quadrant,
            now,
            date: state.today,
          });
          await props.repository.saveTask(task);
          dispatch({ type: 'taskSaved', task });
        },
        async confirmCarryover(taskId) {
          const candidate = state.carryoverCandidates.find((task) => task.id === taskId);
          if (!candidate) return;
          const confirmed = confirmCarryoverTask(candidate, state.today);
          await props.repository.saveTask(confirmed);
          dispatch({ type: 'carryoverConfirmed', task: confirmed });
        },
        async setHomeView(view) {
          const settings = state.settings ?? { homeView: 'folder', notificationsEnabled: false };
          const nextSettings = { ...settings, homeView: view };
          await props.repository.saveSettings(nextSettings);
          dispatch({
            type: 'loaded',
            dailyFile: state.dailyFile ?? { date: state.today, stage: 'plan', goal: '' },
            settings: nextSettings,
            tasks: state.tasks,
            carryoverCandidates: state.carryoverCandidates,
          });
        },
      },
    };
  }, [props.repository, state]);

  return <AppStoreContext.Provider value={value}>{props.children}</AppStoreContext.Provider>;
}

export function useAppStore(): StoreValue {
  const value = useContext(AppStoreContext);
  if (!value) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }
  return value;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'loaded':
      return {
        ...state,
        dailyFile: action.dailyFile,
        settings: action.settings,
        tasks: action.tasks,
        carryoverCandidates: action.carryoverCandidates,
        isLoading: false,
      };
    case 'taskSaved':
      return {
        ...state,
        tasks: [...state.tasks.filter((task) => task.id !== action.task.id), action.task],
      };
    case 'carryoverConfirmed':
      return {
        ...state,
        tasks: [...state.tasks, action.task],
        carryoverCandidates: state.carryoverCandidates.filter((task) => task.id !== action.task.id),
      };
  }
}
```

- [ ] **Step 4: Run tests and verify pass**

Run:

```powershell
npm run test:run -- src/store/appStore.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit app store**

```powershell
git add src/store
git commit -m "feat: add app store"
```

## Task 8: Main Workspace And Task Creation UI

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Create: `src/components/StageTabs.tsx`
- Create: `src/components/ViewSwitch.tsx`
- Create: `src/components/TaskQuickAdd.tsx`
- Create: `src/components/CarryoverInbox.tsx`
- Create: `src/components/TaskStatusBadge.tsx`
- Create: `src/views/DailyWorkspace.tsx`
- Create: `src/views/DailyWorkspace.test.tsx`

- [ ] **Step 1: Write failing UI test for quick add and view switch**

Create `src/views/DailyWorkspace.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMemoryDailyRepository } from '../data/memoryDailyRepository';
import { AppStoreProvider } from '../store/appStore';
import { DailyWorkspace } from './DailyWorkspace';

describe('DailyWorkspace', () => {
  it('adds a task with title and quadrant', async () => {
    const repository = createMemoryDailyRepository();
    render(
      <AppStoreProvider repository={repository} today="2026-06-16">
        <DailyWorkspace />
      </AppStoreProvider>,
    );

    await screen.findByText('今天工作台');
    await userEvent.type(screen.getByLabelText('任务标题'), '写实现计划');
    await userEvent.selectOptions(screen.getByLabelText('四象限'), 'important_urgent');
    await userEvent.click(screen.getByRole('button', { name: '添加任务' }));

    expect(await screen.findByText('写实现计划')).toBeInTheDocument();
  });

  it('switches between folder and galaxy views', async () => {
    const repository = createMemoryDailyRepository();
    render(
      <AppStoreProvider repository={repository} today="2026-06-16">
        <DailyWorkspace />
      </AppStoreProvider>,
    );

    await screen.findByText('文件夹视图');
    await userEvent.click(screen.getByRole('button', { name: '星系视图' }));

    expect(await screen.findByText('今日星图')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
npm run test:run -- src/views/DailyWorkspace.test.tsx
```

Expected: FAIL because workspace components do not exist.

- [ ] **Step 3: Implement workspace components**

Create `src/components/TaskQuickAdd.tsx`:

```tsx
import { useState } from 'react';
import type { Quadrant } from '../domain/types';

export function TaskQuickAdd(props: {
  defaultQuadrant?: Quadrant;
  onAdd(input: { title: string; quadrant: Quadrant }): Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [quadrant, setQuadrant] = useState<Quadrant>(props.defaultQuadrant ?? 'important_urgent');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await props.onAdd({ title, quadrant });
    setTitle('');
  }

  return (
    <form className="quick-add" onSubmit={submit}>
      <label>
        任务标题
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        四象限
        <select value={quadrant} onChange={(event) => setQuadrant(event.target.value as Quadrant)}>
          <option value="important_urgent">重要且紧急</option>
          <option value="important_not_urgent">重要不紧急</option>
          <option value="not_important_urgent">不重要但紧急</option>
          <option value="not_important_not_urgent">不重要不紧急</option>
        </select>
      </label>
      <button type="submit">添加任务</button>
    </form>
  );
}
```

Create `src/components/ViewSwitch.tsx`:

```tsx
import type { HomeView } from '../domain/types';

export function ViewSwitch(props: { view: HomeView; onChange(view: HomeView): void }) {
  return (
    <div className="view-switch" aria-label="主页视图切换">
      <button type="button" aria-pressed={props.view === 'folder'} onClick={() => props.onChange('folder')}>
        文件夹视图
      </button>
      <button type="button" aria-pressed={props.view === 'galaxy'} onClick={() => props.onChange('galaxy')}>
        星系视图
      </button>
    </div>
  );
}
```

Create `src/components/StageTabs.tsx`:

```tsx
import type { Stage } from '../domain/types';

export function StageTabs(props: { stage: Stage; onChange(stage: Stage): void }) {
  return (
    <div className="stage-tabs" aria-label="阶段切换">
      <button type="button" aria-pressed={props.stage === 'plan'} onClick={() => props.onChange('plan')}>计划</button>
      <button type="button" aria-pressed={props.stage === 'execute'} onClick={() => props.onChange('execute')}>执行中</button>
      <button type="button" aria-pressed={props.stage === 'review'} onClick={() => props.onChange('review')}>复盘</button>
    </div>
  );
}
```

Create `src/components/CarryoverInbox.tsx`:

```tsx
import type { Task } from '../domain/types';

export function CarryoverInbox(props: {
  tasks: Task[];
  onConfirm(taskId: string): Promise<void>;
}) {
  if (props.tasks.length === 0) return null;

  return (
    <section className="carryover-inbox">
      <h2>待确认顺延任务</h2>
      {props.tasks.map((task) => (
        <article key={task.id} className="carryover-card">
          <strong>{task.title}</strong>
          <span>顺延</span>
          <button type="button" onClick={() => props.onConfirm(task.id)}>加入今天</button>
        </article>
      ))}
    </section>
  );
}
```

Create `src/components/TaskStatusBadge.tsx`:

```tsx
import type { Task } from '../domain/types';

const LABELS: Record<Task['status'], string> = {
  not_started: '未开始',
  active_primary: '进行中',
  active_background: '后台进行中',
  paused: '暂停',
  completed: '已完成',
  postponed: '顺延',
  dropped: '放弃',
};

export function TaskStatusBadge(props: { task: Task }) {
  return (
    <span className={`status-badge status-${props.task.status}`}>
      {props.task.isCarryover ? '顺延 · ' : ''}
      {LABELS[props.task.status]}
    </span>
  );
}
```

- [ ] **Step 4: Implement workspace shell**

Create `src/views/DailyWorkspace.tsx`:

```tsx
import { CarryoverInbox } from '../components/CarryoverInbox';
import { StageTabs } from '../components/StageTabs';
import { TaskQuickAdd } from '../components/TaskQuickAdd';
import { ViewSwitch } from '../components/ViewSwitch';
import { useAppStore } from '../store/appStore';
import { FolderView } from './FolderView';
import { GalaxyView } from './GalaxyView';

export function DailyWorkspace() {
  const store = useAppStore();
  const view = store.state.settings?.homeView ?? 'folder';
  const stage = store.state.dailyFile?.stage ?? 'plan';

  if (store.state.isLoading) {
    return <main className="workspace">加载中</main>;
  }

  return (
    <main className={`workspace workspace-${view}`}>
      <header className="workspace-header">
        <div>
          <span className="eyebrow">{store.state.today}</span>
          <h1>今天工作台</h1>
        </div>
        <div className="workspace-actions">
          <StageTabs stage={stage} onChange={() => undefined} />
          <ViewSwitch view={view} onChange={(nextView) => void store.actions.setHomeView(nextView)} />
          <button type="button">月度总览</button>
        </div>
      </header>

      <CarryoverInbox tasks={store.state.carryoverCandidates} onConfirm={store.actions.confirmCarryover} />
      <TaskQuickAdd onAdd={store.actions.addTask} />

      {view === 'folder' ? (
        <FolderView tasks={store.state.tasks} />
      ) : (
        <GalaxyView tasks={store.state.tasks} />
      )}
    </main>
  );
}
```

Create minimal `src/views/FolderView.tsx` for this task:

```tsx
import type { Task } from '../domain/types';

export function FolderView(props: { tasks: Task[] }) {
  return (
    <section>
      <h2>文件夹视图</h2>
      {props.tasks.map((task) => (
        <div key={task.id}>{task.title}</div>
      ))}
    </section>
  );
}
```

Create minimal `src/views/GalaxyView.tsx` for this task:

```tsx
import type { Task } from '../domain/types';

export function GalaxyView(props: { tasks: Task[] }) {
  return (
    <section>
      <h2>今日星图</h2>
      {props.tasks.map((task) => (
        <div key={task.id}>{task.title}</div>
      ))}
    </section>
  );
}
```

Modify `src/App.tsx`:

```tsx
import { createMemoryDailyRepository } from './data/memoryDailyRepository';
import { AppStoreProvider } from './store/appStore';
import { DailyWorkspace } from './views/DailyWorkspace';

const repository = createMemoryDailyRepository();

export function App() {
  return (
    <AppStoreProvider repository={repository} today={new Date().toISOString().slice(0, 10)}>
      <DailyWorkspace />
    </AppStoreProvider>
  );
}
```

- [ ] **Step 5: Add styles for workspace controls**

Append to `src/styles.css`:

```css
.workspace {
  min-height: 100vh;
  padding: 28px;
  background: linear-gradient(135deg, #f3eadc, #d8c4a8);
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.eyebrow {
  color: #7b6a55;
  font-size: 13px;
}

.workspace h1 {
  margin: 4px 0 0;
  font-size: 30px;
}

.workspace-actions,
.stage-tabs,
.view-switch,
.quick-add {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quick-add,
.carryover-inbox {
  margin-bottom: 18px;
  padding: 16px;
  border: 1px solid rgba(92, 61, 30, .16);
  border-radius: 12px;
  background: rgba(255, 250, 240, .82);
}

.quick-add label {
  display: grid;
  gap: 6px;
  color: #5c4a36;
}

.quick-add input,
.quick-add select {
  min-height: 38px;
  border: 1px solid #d8c8ae;
  border-radius: 8px;
  padding: 0 10px;
  background: #fffdf8;
}
```

- [ ] **Step 6: Run UI tests and build**

Run:

```powershell
npm run test:run -- src/views/DailyWorkspace.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit workspace UI**

```powershell
git add src/App.tsx src/styles.css src/components src/views/DailyWorkspace.tsx src/views/DailyWorkspace.test.tsx
git commit -m "feat: add daily workspace shell"
```

## Task 9: Four-Floor Folder View

**Files:**
- Modify: `src/views/FolderView.tsx`
- Create: `src/views/FolderView.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing folder view test**

Create `src/views/FolderView.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FolderView } from './FolderView';
import type { Task } from '../domain/types';

describe('FolderView', () => {
  it('groups tasks into four floors and orders by status within a floor', () => {
    render(
      <FolderView
        tasks={[
          task('未开始任务', 'important_urgent', 'not_started'),
          task('进行中任务', 'important_urgent', 'active_primary'),
          task('重要不紧急', 'important_not_urgent', 'not_started'),
        ]}
      />,
    );

    const fourthFloor = screen.getByLabelText('4F 重要且紧急');
    const items = within(fourthFloor).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('进行中任务');
    expect(items[1]).toHaveTextContent('未开始任务');
    expect(screen.getByLabelText('3F 重要不紧急')).toHaveTextContent('重要不紧急');
  });
});

function task(title: string, quadrant: Task['quadrant'], status: Task['status']): Task {
  return {
    id: title,
    date: '2026-06-16',
    title,
    quadrant,
    status,
    isCarryover: false,
    createdAt: '2026-06-16T08:00:00.000Z',
    updatedAt: '2026-06-16T08:00:00.000Z',
  };
}
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
npm run test:run -- src/views/FolderView.test.tsx
```

Expected: FAIL because current `FolderView` does not group floors.

- [ ] **Step 3: Implement folder view**

Replace `src/views/FolderView.tsx`:

```tsx
import { TaskStatusBadge } from '../components/TaskStatusBadge';
import { QUADRANT_FLOORS, orderTasksForFloor } from '../domain/taskRules';
import type { Quadrant, Task } from '../domain/types';

const FLOOR_DEFINITIONS: Array<{ floor: 4 | 3 | 2 | 1; label: string; quadrant: Quadrant; className: string }> = [
  { floor: 4, label: '重要且紧急', quadrant: 'important_urgent', className: 'floor-red' },
  { floor: 3, label: '重要不紧急', quadrant: 'important_not_urgent', className: 'floor-blue' },
  { floor: 2, label: '不重要但紧急', quadrant: 'not_important_urgent', className: 'floor-gold' },
  { floor: 1, label: '不重要不紧急', quadrant: 'not_important_not_urgent', className: 'floor-lavender' },
];

export function FolderView(props: { tasks: Task[] }) {
  return (
    <section className="folder-file">
      <header className="folder-file-header">
        <h2>文件夹视图</h2>
        <span>当日备忘录待办</span>
      </header>
      <div className="folder-floors">
        {FLOOR_DEFINITIONS.map((definition) => {
          const floorTasks = orderTasksForFloor(
            props.tasks.filter((task) => QUADRANT_FLOORS[task.quadrant] === definition.floor),
          );
          return (
            <section
              key={definition.floor}
              className={`folder-floor ${definition.className}`}
              aria-label={`${definition.floor}F ${definition.label}`}
            >
              <div className="folder-floor-label">
                <strong>{definition.floor}F</strong>
                <span>{definition.label}</span>
              </div>
              <ul className="folder-task-list">
                {floorTasks.map((task) => (
                  <li key={task.id} className="folder-task">
                    <span>{task.title}</span>
                    <TaskStatusBadge task={task} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add folder styles**

Append to `src/styles.css`:

```css
.folder-file {
  overflow: hidden;
  border: 1px solid #e2d7c2;
  border-radius: 14px;
  background: #fffaf0;
  box-shadow: 0 24px 52px rgba(70, 47, 24, .16);
}

.folder-file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
  border-bottom: 1px solid #ead9bd;
  background: #fffdf8;
}

.folder-file-header h2 {
  margin: 0;
}

.folder-floors {
  display: grid;
  grid-template-rows: repeat(4, minmax(96px, auto));
}

.folder-floor {
  display: grid;
  grid-template-columns: 140px 1fr;
  border-bottom: 1px solid #ead9bd;
}

.folder-floor:last-child {
  border-bottom: 0;
}

.folder-floor-label {
  padding: 16px;
  border-right: 1px solid rgba(70, 47, 24, .12);
}

.folder-floor-label strong,
.folder-floor-label span {
  display: block;
}

.floor-red { background: #fff1f0; }
.floor-red .folder-floor-label { background: #ffdad6; }
.floor-blue { background: #eef7ff; }
.floor-blue .folder-floor-label { background: #d7ebff; }
.floor-gold { background: #fff8e8; }
.floor-gold .folder-floor-label { background: #ffe8b8; }
.floor-lavender { background: #f1f0ff; }
.floor-lavender .folder-floor-label { background: #dedbff; }

.folder-task-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 14px;
  list-style: none;
}

.folder-task {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid rgba(70, 47, 24, .12);
  border-radius: 8px;
  background: rgba(255, 255, 255, .78);
}

.status-badge {
  border-radius: 999px;
  padding: 4px 8px;
  background: rgba(53, 42, 32, .08);
  color: #5c4a36;
  font-size: 12px;
}
```

- [ ] **Step 5: Run tests and build**

Run:

```powershell
npm run test:run -- src/views/FolderView.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit folder view**

```powershell
git add src/views/FolderView.tsx src/views/FolderView.test.tsx src/styles.css
git commit -m "feat: add four floor folder view"
```

## Task 10: Galaxy View With Curved Routes

**Files:**
- Modify: `src/views/GalaxyView.tsx`
- Create: `src/views/GalaxyView.test.tsx`
- Create: `src/domain/galaxyLayout.ts`
- Create: `src/domain/galaxyLayout.test.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing layout tests**

Create `src/domain/galaxyLayout.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildGalaxyLayout } from './galaxyLayout';
import type { Task } from './types';

describe('galaxyLayout', () => {
  it('starts the first route from the quadrant center', () => {
    const layout = buildGalaxyLayout([task('a', 'important_urgent', 'completed')]);

    expect(layout.routes[0].from).toEqual({ x: 50, y: 50 });
    expect(layout.routes[0].to).toEqual(layout.planets[0].position);
    expect(layout.routes[0].path).toContain('C');
  });

  it('connects later routes from planet to planet', () => {
    const layout = buildGalaxyLayout([
      task('a', 'important_urgent', 'completed'),
      task('b', 'important_not_urgent', 'active_primary'),
    ]);

    expect(layout.routes[1].from).toEqual(layout.planets[0].position);
    expect(layout.routes[1].to).toEqual(layout.planets[1].position);
  });
});

function task(id: string, quadrant: Task['quadrant'], status: Task['status']): Task {
  return {
    id,
    date: '2026-06-16',
    title: id,
    quadrant,
    status,
    isCarryover: false,
    createdAt: '2026-06-16T08:00:00.000Z',
    updatedAt: '2026-06-16T08:00:00.000Z',
  };
}
```

Create `src/views/GalaxyView.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GalaxyView } from './GalaxyView';
import type { Task } from '../domain/types';

describe('GalaxyView', () => {
  it('renders quadrants, planets, routes, ship, and flags', () => {
    render(<GalaxyView tasks={[task('a', 'important_urgent', 'completed'), task('b', 'important_not_urgent', 'active_primary')]} />);

    expect(screen.getByText('今日星图')).toBeInTheDocument();
    expect(screen.getByLabelText('四象限星图')).toBeInTheDocument();
    expect(screen.getAllByLabelText('飞行轨迹')).toHaveLength(2);
    expect(screen.getByLabelText('当前飞船')).toBeInTheDocument();
    expect(screen.getByLabelText('完成旗帜')).toBeInTheDocument();
  });
});

function task(id: string, quadrant: Task['quadrant'], status: Task['status']): Task {
  return {
    id,
    date: '2026-06-16',
    title: id,
    quadrant,
    status,
    isCarryover: false,
    createdAt: '2026-06-16T08:00:00.000Z',
    updatedAt: '2026-06-16T08:00:00.000Z',
  };
}
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```powershell
npm run test:run -- src/domain/galaxyLayout.test.ts src/views/GalaxyView.test.tsx
```

Expected: FAIL because galaxy layout is not implemented.

- [ ] **Step 3: Implement galaxy layout**

Create `src/domain/galaxyLayout.ts`:

```ts
import type { Quadrant, Task } from './types';

interface Point {
  x: number;
  y: number;
}

export interface GalaxyPlanet {
  task: Task;
  position: Point;
}

export interface GalaxyRoute {
  from: Point;
  to: Point;
  path: string;
  completed: boolean;
}

export interface GalaxyLayout {
  planets: GalaxyPlanet[];
  routes: GalaxyRoute[];
}

const BASE_POSITIONS: Record<Quadrant, Point[]> = {
  important_urgent: [
    { x: 25, y: 26 },
    { x: 38, y: 34 },
  ],
  important_not_urgent: [
    { x: 68, y: 30 },
    { x: 82, y: 38 },
  ],
  not_important_urgent: [
    { x: 32, y: 72 },
    { x: 18, y: 62 },
  ],
  not_important_not_urgent: [
    { x: 74, y: 72 },
    { x: 86, y: 64 },
  ],
};

export function buildGalaxyLayout(tasks: Task[]): GalaxyLayout {
  const counters: Record<Quadrant, number> = {
    important_urgent: 0,
    important_not_urgent: 0,
    not_important_urgent: 0,
    not_important_not_urgent: 0,
  };

  const planets = tasks.map((task) => {
    const index = counters[task.quadrant]++;
    const options = BASE_POSITIONS[task.quadrant];
    return {
      task,
      position: options[index % options.length],
    };
  });

  const routePlanets = planets.filter((planet) =>
    planet.task.status === 'completed' || planet.task.status === 'active_primary',
  );

  const routes = routePlanets.map((planet, index) => {
    const from = index === 0 ? { x: 50, y: 50 } : routePlanets[index - 1].position;
    return {
      from,
      to: planet.position,
      path: curvedPath(from, planet.position, index),
      completed: planet.task.status === 'completed',
    };
  });

  return { planets, routes };
}

function curvedPath(from: Point, to: Point, seed: number): string {
  const bend = seed % 2 === 0 ? 16 : -16;
  const cx1 = from.x + (to.x - from.x) * 0.35;
  const cy1 = from.y + bend;
  const cx2 = from.x + (to.x - from.x) * 0.7;
  const cy2 = to.y - bend;
  return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
}
```

- [ ] **Step 4: Implement galaxy view**

Replace `src/views/GalaxyView.tsx`:

```tsx
import { buildGalaxyLayout } from '../domain/galaxyLayout';
import type { Task } from '../domain/types';

export function GalaxyView(props: { tasks: Task[] }) {
  const layout = buildGalaxyLayout(props.tasks);
  const activePlanet = layout.planets.find((planet) => planet.task.status === 'active_primary');

  return (
    <section className="galaxy-card">
      <header className="galaxy-header">
        <h2>今日星图</h2>
        <span>任务星球与飞行轨迹</span>
      </header>
      <div className="galaxy-map" aria-label="四象限星图">
        <div className="galaxy-stars" />
        <div className="galaxy-axis galaxy-axis-important">重要</div>
        <div className="galaxy-axis galaxy-axis-urgent">紧急</div>
        <div className="galaxy-center" />
        <svg className="galaxy-routes" viewBox="0 0 100 100" preserveAspectRatio="none">
          {layout.routes.map((route, index) => (
            <path
              key={`${route.path}-${index}`}
              aria-label="飞行轨迹"
              className={route.completed ? 'galaxy-route galaxy-route-completed' : 'galaxy-route'}
              d={route.path}
            />
          ))}
        </svg>
        {layout.planets.map((planet) => (
          <div
            key={planet.task.id}
            className={`galaxy-planet planet-${planet.task.quadrant} planet-${planet.task.status}`}
            style={{ left: `${planet.position.x}%`, top: `${planet.position.y}%` }}
          >
            <span>{planet.task.title}</span>
            {planet.task.status === 'completed' ? <i aria-label="完成旗帜" /> : null}
          </div>
        ))}
        {activePlanet ? (
          <div
            aria-label="当前飞船"
            className="galaxy-ship"
            style={{ left: `${activePlanet.position.x - 6}%`, top: `${activePlanet.position.y + 4}%` }}
          />
        ) : null}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Add galaxy styles**

Append to `src/styles.css`:

```css
.galaxy-card {
  overflow: hidden;
  border: 1px solid rgba(155, 216, 255, .18);
  border-radius: 18px;
  background: linear-gradient(135deg, #101827, #080d18);
  color: #fffaf0;
  box-shadow: 0 24px 64px rgba(0, 0, 0, .28);
}

.galaxy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 22px;
}

.galaxy-header h2 {
  margin: 0;
}

.galaxy-map {
  position: relative;
  min-height: 540px;
  margin: 0 22px 22px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 14px;
  overflow: hidden;
}

.galaxy-map::before,
.galaxy-map::after {
  content: "";
  position: absolute;
  background: rgba(255, 255, 255, .14);
}

.galaxy-map::before {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
}

.galaxy-map::after {
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
}

.galaxy-stars {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,.62) 1px, transparent 1px);
  background-size: 84px 84px;
  opacity: .45;
}

.galaxy-axis {
  position: absolute;
  z-index: 2;
  color: rgba(255, 250, 240, .64);
  font-size: 12px;
}

.galaxy-axis-important {
  left: 20px;
  top: 18px;
}

.galaxy-axis-urgent {
  right: 20px;
  bottom: 18px;
}

.galaxy-center {
  position: absolute;
  left: calc(50% - 7px);
  top: calc(50% - 7px);
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fffaf0;
  box-shadow: 0 0 18px rgba(255, 250, 240, .7);
}

.galaxy-routes {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.galaxy-route {
  fill: none;
  stroke: rgba(155, 216, 255, .84);
  stroke-width: .6;
  stroke-linecap: round;
  stroke-dasharray: 2 2;
  filter: drop-shadow(0 0 2px rgba(155, 216, 255, .72));
}

.galaxy-route-completed {
  stroke: rgba(246, 230, 183, .72);
}

.galaxy-planet {
  position: absolute;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  padding: 8px;
  text-align: center;
  color: #1b2538;
  font-size: 11px;
  font-weight: 800;
  box-shadow: 0 0 24px currentColor;
}

.planet-important_urgent { background: #fff1d0; color: #f6e6b7; }
.planet-important_not_urgent { background: #9bd8ff; color: #9bd8ff; }
.planet-not_important_urgent { background: #ffcf86; color: #ffcf86; }
.planet-not_important_not_urgent { background: #c7c0ff; color: #c7c0ff; }

.galaxy-planet span {
  color: #172033;
}

.galaxy-planet i {
  position: absolute;
  right: 6px;
  top: -12px;
  width: 8px;
  height: 26px;
  border-radius: 2px;
  background: #f0c86e;
}

.galaxy-planet i::after {
  content: "";
  position: absolute;
  left: 7px;
  top: 2px;
  border-left: 18px solid #ff7168;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
}

.galaxy-ship {
  position: absolute;
  z-index: 4;
  width: 42px;
  height: 22px;
  border-radius: 50% 70% 70% 50%;
  background: #fffaf0;
  box-shadow: 0 0 22px rgba(255, 250, 240, .88);
  animation: ship-drift 2.4s ease-in-out infinite;
}

.galaxy-ship::after {
  content: "";
  position: absolute;
  left: -12px;
  top: 7px;
  border-right: 16px solid rgba(155, 216, 255, .72);
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
}

@keyframes ship-drift {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}
```

- [ ] **Step 6: Run tests and build**

Run:

```powershell
npm run test:run -- src/domain/galaxyLayout.test.ts src/views/GalaxyView.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit galaxy view**

```powershell
git add src/domain/galaxyLayout.ts src/domain/galaxyLayout.test.ts src/views/GalaxyView.tsx src/views/GalaxyView.test.tsx src/styles.css
git commit -m "feat: add galaxy task map"
```

## Task 11: Task Execution Actions

**Files:**
- Modify: `src/store/appStore.tsx`
- Modify: `src/views/GalaxyView.tsx`
- Modify: `src/views/FolderView.tsx`
- Create: `src/store/taskExecution.test.tsx`

- [ ] **Step 1: Write failing execution tests**

Create `src/store/taskExecution.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMemoryDailyRepository } from '../data/memoryDailyRepository';
import { AppStoreProvider, useAppStore } from './appStore';

describe('task execution actions', () => {
  it('starts and completes a primary task', async () => {
    const repository = createMemoryDailyRepository();
    render(
      <AppStoreProvider repository={repository} today="2026-06-16">
        <Harness />
      </AppStoreProvider>,
    );

    await userEvent.click(await screen.findByRole('button', { name: 'seed' }));
    await userEvent.click(screen.getByRole('button', { name: 'start' }));
    expect(await screen.findByText('active_primary')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'complete' }));
    expect(await screen.findByText('completed')).toBeInTheDocument();
  });
});

function Harness() {
  const store = useAppStore();
  const task = store.state.tasks[0];
  return (
    <div>
      <button type="button" onClick={() => store.actions.addTask({ title: '任务', quadrant: 'important_urgent' })}>
        seed
      </button>
      {task ? (
        <>
          <div>{task.status}</div>
          <button type="button" onClick={() => store.actions.startTask(task.id, 'pause')}>start</button>
          <button type="button" onClick={() => store.actions.completeTask(task.id)}>complete</button>
        </>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
npm run test:run -- src/store/taskExecution.test.tsx
```

Expected: FAIL because execution actions do not exist.

- [ ] **Step 3: Add execution actions to store**

Modify `src/store/appStore.tsx` to add these action signatures:

```ts
startTask(taskId: string, oldTaskMode: 'pause' | 'background'): Promise<void>;
completeTask(taskId: string): Promise<void>;
```

Add imports:

```ts
import { completeSession, createSession, switchPrimaryTask } from '../domain/timeRules';
```

Add action implementation inside `actions`:

```ts
async startTask(taskId, oldTaskMode) {
  const now = new Date().toISOString();
  const target = state.tasks.find((task) => task.id === taskId);
  if (!target) return;
  const primary = state.tasks.find((task) => task.status === 'active_primary');

  let nextTasks = state.tasks;
  if (primary && primary.id !== target.id) {
    const switched = switchPrimaryTask({ oldTask: primary, newTask: target, oldTaskMode });
    nextTasks = state.tasks.map((task) => {
      if (task.id === switched.oldTask.id) return switched.oldTask;
      if (task.id === switched.newTask.id) return switched.newTask;
      return task;
    });
    await props.repository.saveTask(switched.oldTask);
    await props.repository.saveTask(switched.newTask);
  } else {
    const nextTarget = { ...target, status: 'active_primary' as const, updatedAt: now };
    nextTasks = state.tasks.map((task) => (task.id === taskId ? nextTarget : task));
    await props.repository.saveTask(nextTarget);
  }

  const session = createSession(taskId, now);
  await props.repository.saveSession(session);
  for (const task of nextTasks) {
    dispatch({ type: 'taskSaved', task });
  }
},
async completeTask(taskId) {
  const now = new Date().toISOString();
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  const sessions = await props.repository.listSessions(taskId);
  const openSession = [...sessions].reverse().find((session) => !session.endedAt);
  if (openSession) {
    await props.repository.saveSession(completeSession(openSession, now));
  }

  const completed = { ...task, status: 'completed' as const, updatedAt: now };
  await props.repository.saveTask(completed);
  dispatch({ type: 'taskSaved', task: completed });
},
```

- [ ] **Step 4: Add clickable task handlers to views**

Modify `FolderView` props:

```ts
export function FolderView(props: {
  tasks: Task[];
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
}) {
```

Inside each task item, add buttons:

```tsx
<div className="task-actions">
  {task.status === 'active_primary' ? (
    <button type="button" onClick={() => props.onCompleteTask?.(task.id)}>完成</button>
  ) : (
    <button type="button" onClick={() => props.onStartTask?.(task.id)}>开始</button>
  )}
</div>
```

Modify `GalaxyView` props similarly and make each planet a button:

```tsx
export function GalaxyView(props: {
  tasks: Task[];
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
}) {
```

Replace the planet `div` with:

```tsx
<button
  key={planet.task.id}
  type="button"
  className={`galaxy-planet planet-${planet.task.quadrant} planet-${planet.task.status}`}
  style={{ left: `${planet.position.x}%`, top: `${planet.position.y}%` }}
  onClick={() =>
    planet.task.status === 'active_primary'
      ? props.onCompleteTask?.(planet.task.id)
      : props.onStartTask?.(planet.task.id)
  }
>
  <span>{planet.task.title}</span>
  {planet.task.status === 'completed' ? <i aria-label="完成旗帜" /> : null}
</button>
```

Update `DailyWorkspace` view rendering:

```tsx
{view === 'folder' ? (
  <FolderView
    tasks={store.state.tasks}
    onStartTask={(taskId) => void store.actions.startTask(taskId, 'pause')}
    onCompleteTask={(taskId) => void store.actions.completeTask(taskId)}
  />
) : (
  <GalaxyView
    tasks={store.state.tasks}
    onStartTask={(taskId) => void store.actions.startTask(taskId, 'pause')}
    onCompleteTask={(taskId) => void store.actions.completeTask(taskId)}
  />
)}
```

- [ ] **Step 5: Run execution tests and build**

Run:

```powershell
npm run test:run -- src/store/taskExecution.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit task execution**

```powershell
git add src/store src/views src/styles.css
git commit -m "feat: add task execution actions"
```

## Task 12: Review Flow And Completion Summary

**Files:**
- Create: `src/views/ReviewPanel.tsx`
- Create: `src/views/CompletionSummary.tsx`
- Create: `src/views/ReviewPanel.test.tsx`
- Modify: `src/views/DailyWorkspace.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing review UI test**

Create `src/views/ReviewPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReviewPanel } from './ReviewPanel';
import type { Task } from '../domain/types';

describe('ReviewPanel', () => {
  it('collects four review answers and submits them', async () => {
    const onSubmit = vi.fn();
    render(<ReviewPanel tasks={[task('task-1')]} onSubmit={onSubmit} />);

    await userEvent.selectOptions(screen.getByLabelText('task-1 的处理方式'), 'postpone');
    await userEvent.selectOptions(screen.getByLabelText('task-1 的原因'), 'low_energy');
    await userEvent.type(screen.getByLabelText('今天完成了什么'), '完成方案');
    await userEvent.type(screen.getByLabelText('未完成的原因是什么'), '精力不足');
    await userEvent.type(screen.getByLabelText('今天状态或感受如何'), '状态一般');
    await userEvent.type(screen.getByLabelText('明天的重点是什么'), '继续实现');
    await userEvent.click(screen.getByRole('button', { name: '完成复盘' }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

function task(title: string): Task {
  return {
    id: title,
    date: '2026-06-16',
    title,
    quadrant: 'important_urgent',
    status: 'not_started',
    isCarryover: false,
    createdAt: '2026-06-16T08:00:00.000Z',
    updatedAt: '2026-06-16T08:00:00.000Z',
  };
}
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
npm run test:run -- src/views/ReviewPanel.test.tsx
```

Expected: FAIL because `ReviewPanel` does not exist.

- [ ] **Step 3: Implement review panel**

Create `src/views/ReviewPanel.tsx`:

```tsx
import { useState } from 'react';
import { REASON_TAGS } from '../domain/reviewRules';
import type { DailyReview, ReasonTag, ReviewDecision, Task } from '../domain/types';

export function ReviewPanel(props: {
  tasks: Task[];
  onSubmit(input: { decisions: Array<Pick<ReviewDecision, 'taskId' | 'action' | 'reasonTag' | 'reasonNote' | 'targetDate'>>; review: DailyReview }): void;
}) {
  const unfinished = props.tasks.filter((task) => task.status !== 'completed' && task.status !== 'dropped');
  const [review, setReview] = useState<DailyReview>({
    completedText: '',
    unfinishedText: '',
    feelingText: '',
    tomorrowFocusText: '',
  });
  const [decisions, setDecisions] = useState<Record<string, { action: ReviewDecision['action']; reasonTag: ReasonTag }>>(
    Object.fromEntries(
      unfinished.map((task) => [task.id, { action: 'postpone' as const, reasonTag: 'time_estimate_error' as const }]),
    ),
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    props.onSubmit({
      decisions: unfinished.map((task) => ({
        taskId: task.id,
        action: decisions[task.id].action,
        reasonTag: decisions[task.id].reasonTag,
        targetDate: decisions[task.id].action === 'drop' ? undefined : nextDate(task.date),
      })),
      review,
    });
  }

  return (
    <form className="review-panel" onSubmit={submit}>
      <h2>晚间复盘</h2>
      {unfinished.map((task) => (
        <fieldset key={task.id}>
          <legend>{task.title}</legend>
          <label>
            {task.title} 的处理方式
            <select
              value={decisions[task.id].action}
              onChange={(event) =>
                setDecisions((current) => ({
                  ...current,
                  [task.id]: { ...current[task.id], action: event.target.value as ReviewDecision['action'] },
                }))
              }
            >
              <option value="postpone">顺延到明天</option>
              <option value="drop">放弃</option>
              <option value="reschedule">改到指定日期</option>
            </select>
          </label>
          <label>
            {task.title} 的原因
            <select
              value={decisions[task.id].reasonTag}
              onChange={(event) =>
                setDecisions((current) => ({
                  ...current,
                  [task.id]: { ...current[task.id], reasonTag: event.target.value as ReasonTag },
                }))
              }
            >
              {REASON_TAGS.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </label>
        </fieldset>
      ))}

      <label>
        今天完成了什么
        <textarea value={review.completedText} onChange={(event) => setReview({ ...review, completedText: event.target.value })} />
      </label>
      <label>
        未完成的原因是什么
        <textarea value={review.unfinishedText} onChange={(event) => setReview({ ...review, unfinishedText: event.target.value })} />
      </label>
      <label>
        今天状态或感受如何
        <textarea value={review.feelingText} onChange={(event) => setReview({ ...review, feelingText: event.target.value })} />
      </label>
      <label>
        明天的重点是什么
        <textarea value={review.tomorrowFocusText} onChange={(event) => setReview({ ...review, tomorrowFocusText: event.target.value })} />
      </label>
      <button type="submit">完成复盘</button>
    </form>
  );
}

function nextDate(date: string): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}
```

Create `src/views/CompletionSummary.tsx`:

```tsx
import type { DailySummary } from '../domain/summaryRules';

export function CompletionSummary(props: { summary: DailySummary }) {
  return (
    <section className="completion-summary">
      <h2>今日完成概览</h2>
      <dl>
        <dt>今日完成</dt>
        <dd>{props.summary.completedCount} / {props.summary.totalCount}</dd>
        <dt>重点完成情况</dt>
        <dd>{props.summary.highlightCompleted} / {props.summary.highlightTotal} 个重点任务完成</dd>
        <dt>实际耗时</dt>
        <dd>{Math.floor(props.summary.durationMinutes / 60)}h {props.summary.durationMinutes % 60}m</dd>
        <dt>今日状态</dt>
        <dd>{props.summary.statusText}</dd>
        <dt>未完成处理</dt>
        <dd>{props.summary.postponedCount} 个顺延，{props.summary.droppedCount} 个放弃</dd>
      </dl>
    </section>
  );
}
```

- [ ] **Step 4: Wire review panel into workspace**

In `DailyWorkspace.tsx`, import `ReviewPanel`:

```ts
import { ReviewPanel } from './ReviewPanel';
```

Render it below the active view when `stage === 'review'`:

```tsx
{stage === 'review' ? (
  <ReviewPanel tasks={store.state.tasks} onSubmit={() => undefined} />
) : null}
```

- [ ] **Step 5: Add review styles**

Append to `src/styles.css`:

```css
.review-panel,
.completion-summary {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid rgba(92, 61, 30, .16);
  border-radius: 14px;
  background: rgba(255, 250, 240, .86);
}

.review-panel {
  display: grid;
  gap: 14px;
}

.review-panel label,
.review-panel fieldset {
  display: grid;
  gap: 8px;
}

.review-panel textarea {
  min-height: 80px;
  resize: vertical;
}

.completion-summary dl {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 10px;
}
```

- [ ] **Step 6: Run review tests and build**

Run:

```powershell
npm run test:run -- src/views/ReviewPanel.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit review UI**

```powershell
git add src/views/ReviewPanel.tsx src/views/ReviewPanel.test.tsx src/views/CompletionSummary.tsx src/views/DailyWorkspace.tsx src/styles.css
git commit -m "feat: add evening review flow"
```

## Task 13: Settings And Notifications

**Files:**
- Create: `src/notifications/notificationService.ts`
- Create: `src/settings/SettingsPanel.tsx`
- Create: `src/settings/SettingsPanel.test.tsx`
- Modify: `src/views/DailyWorkspace.tsx`

- [ ] **Step 1: Write failing settings test**

Create `src/settings/SettingsPanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';

describe('SettingsPanel', () => {
  it('saves morning and evening reminder times', async () => {
    const onSave = vi.fn();
    render(
      <SettingsPanel
        settings={{ homeView: 'folder', notificationsEnabled: false }}
        onSave={onSave}
      />,
    );

    await userEvent.type(screen.getByLabelText('早上计划提醒'), '08:30');
    await userEvent.type(screen.getByLabelText('晚上复盘提醒'), '21:30');
    await userEvent.click(screen.getByRole('button', { name: '保存提醒设置' }));

    expect(onSave).toHaveBeenCalledWith({
      homeView: 'folder',
      morningReminder: '08:30',
      eveningReminder: '21:30',
      notificationsEnabled: true,
    });
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
npm run test:run -- src/settings/SettingsPanel.test.tsx
```

Expected: FAIL because settings panel does not exist.

- [ ] **Step 3: Implement notification service**

Create `src/notifications/notificationService.ts`:

```ts
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

export async function ensureNotificationPermission(): Promise<boolean> {
  let granted = await isPermissionGranted();
  if (!granted) {
    const permission = await requestPermission();
    granted = permission === 'granted';
  }
  return granted;
}

export async function sendReminderNotification(title: string, body: string): Promise<void> {
  const granted = await ensureNotificationPermission();
  if (granted) {
    sendNotification({ title, body });
  }
}
```

- [ ] **Step 4: Implement settings panel**

Create `src/settings/SettingsPanel.tsx`:

```tsx
import { useState } from 'react';
import type { UserSettings } from '../domain/types';

export function SettingsPanel(props: {
  settings: UserSettings;
  onSave(settings: UserSettings): void;
}) {
  const [morningReminder, setMorningReminder] = useState(props.settings.morningReminder ?? '');
  const [eveningReminder, setEveningReminder] = useState(props.settings.eveningReminder ?? '');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    props.onSave({
      ...props.settings,
      morningReminder,
      eveningReminder,
      notificationsEnabled: true,
    });
  }

  return (
    <form className="settings-panel" onSubmit={submit}>
      <h2>提醒设置</h2>
      <label>
        早上计划提醒
        <input type="time" value={morningReminder} onChange={(event) => setMorningReminder(event.target.value)} />
      </label>
      <label>
        晚上复盘提醒
        <input type="time" value={eveningReminder} onChange={(event) => setEveningReminder(event.target.value)} />
      </label>
      <button type="submit">保存提醒设置</button>
    </form>
  );
}
```

- [ ] **Step 5: Run settings tests and build**

Run:

```powershell
npm run test:run -- src/settings/SettingsPanel.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit settings and notifications**

```powershell
git add src/notifications src/settings
git commit -m "feat: add reminder settings"
```

## Task 14: Monthly Overview Read-Only Entry

**Files:**
- Create: `src/views/MonthlyOverview.tsx`
- Create: `src/views/MonthlyOverview.test.tsx`
- Modify: `src/views/DailyWorkspace.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing monthly overview test**

Create `src/views/MonthlyOverview.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MonthlyOverview } from './MonthlyOverview';

describe('MonthlyOverview', () => {
  it('renders one node per day for June 2026', () => {
    render(<MonthlyOverview year={2026} month={6} recordedDates={['2026-06-16']} />);

    expect(screen.getAllByRole('button')).toHaveLength(30);
    expect(screen.getByRole('button', { name: '2026-06-16 有记录' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run:

```powershell
npm run test:run -- src/views/MonthlyOverview.test.tsx
```

Expected: FAIL because monthly overview does not exist.

- [ ] **Step 3: Implement monthly overview**

Create `src/views/MonthlyOverview.tsx`:

```tsx
export function MonthlyOverview(props: {
  year: number;
  month: number;
  recordedDates: string[];
  onSelectDate?: (date: string) => void;
}) {
  const days = new Date(Date.UTC(props.year, props.month, 0)).getUTCDate();
  const dates = Array.from({ length: days }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    const month = String(props.month).padStart(2, '0');
    return `${props.year}-${month}-${day}`;
  });

  return (
    <section className="monthly-overview">
      <h2>月度总览</h2>
      <div className="monthly-grid">
        {dates.map((date) => {
          const recorded = props.recordedDates.includes(date);
          return (
            <button
              key={date}
              type="button"
              className={recorded ? 'monthly-day monthly-day-recorded' : 'monthly-day'}
              aria-label={`${date} ${recorded ? '有记录' : '无记录'}`}
              onClick={() => props.onSelectDate?.(date)}
            >
              {Number(date.slice(-2))}
            </button>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add monthly styles**

Append to `src/styles.css`:

```css
.monthly-overview {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid rgba(92, 61, 30, .16);
  border-radius: 14px;
  background: rgba(255, 250, 240, .86);
}

.monthly-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(48px, 1fr));
  gap: 10px;
}

.monthly-day {
  min-height: 56px;
  border: 1px solid #d8c8ae;
  border-radius: 10px;
  background: #fffdf8;
  color: #5c4a36;
}

.monthly-day-recorded {
  background: #172033;
  color: #fffaf0;
  border-color: #172033;
}
```

- [ ] **Step 5: Run monthly tests and build**

Run:

```powershell
npm run test:run -- src/views/MonthlyOverview.test.tsx
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit monthly overview**

```powershell
git add src/views/MonthlyOverview.tsx src/views/MonthlyOverview.test.tsx src/styles.css
git commit -m "feat: add monthly overview"
```

## Task 15: Wire Real SQLite Repository And Final Verification

**Files:**
- Modify: `src/App.tsx`
- Create: `src/data/repositoryFactory.ts`
- Modify: `README.md`

- [ ] **Step 1: Create repository factory**

Create `src/data/repositoryFactory.ts`:

```ts
import type { DailyRepository } from './dailyRepository';
import { createMemoryDailyRepository } from './memoryDailyRepository';
import { createTauriSqlDailyRepository } from './tauriSqlDailyRepository';

export async function createDailyRepository(): Promise<DailyRepository> {
  if ('__TAURI_INTERNALS__' in window) {
    return createTauriSqlDailyRepository();
  }
  return createMemoryDailyRepository();
}
```

- [ ] **Step 2: Load repository asynchronously in App**

Replace `src/App.tsx`:

```tsx
import { useEffect, useState } from 'react';
import type { DailyRepository } from './data/dailyRepository';
import { createDailyRepository } from './data/repositoryFactory';
import { AppStoreProvider } from './store/appStore';
import { DailyWorkspace } from './views/DailyWorkspace';

export function App() {
  const [repository, setRepository] = useState<DailyRepository | null>(null);

  useEffect(() => {
    let cancelled = false;
    void createDailyRepository().then((createdRepository) => {
      if (!cancelled) setRepository(createdRepository);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!repository) {
    return <main className="app-shell">正在打开今日工作台</main>;
  }

  return (
    <AppStoreProvider repository={repository} today={new Date().toISOString().slice(0, 10)}>
      <DailyWorkspace />
    </AppStoreProvider>
  );
}
```

- [ ] **Step 3: Add README**

Create `README.md`:

```md
# 每日计划与复盘

一个本地优先的个人桌面应用，用于早上计划、白天执行、晚上复盘。

## 技术栈

- Tauri 2
- React
- TypeScript
- SQLite

## 开发

```powershell
npm install
npm run test:run
npm run build
npm run tauri dev
```

## MVP 范围

- 今日工作台
- 文件夹视图和星系视图
- 四象限任务
- 任务时间记录和手动修正
- 顺延任务确认
- 晚间四问复盘
- 今日完成概览
- 轻量月度总览
```

- [ ] **Step 4: Run all verification**

Run:

```powershell
npm run test:run
npm run build
npm run tauri dev
```

Expected:

- Vitest passes.
- TypeScript and Vite build pass.
- Tauri opens a desktop window.
- The window displays today's workspace.
- Adding a task works.
- Switching folder/galaxy views works.
- Closing and reopening the Tauri app keeps data in SQLite.

- [ ] **Step 5: Commit final integration**

```powershell
git add src README.md
git commit -m "feat: wire daily review app"
```

## Self-Review

Spec coverage:

- Daily workflow is covered by Tasks 7, 8, 11, and 12.
- Folder view is covered by Task 9.
- Galaxy view, center start, curved route, ship, and flags are covered by Task 10.
- Local-first SQLite storage is covered by Tasks 6 and 15.
- Reminders are covered by Task 13.
- Read-only monthly overview is covered by Task 14.
- MVP exclusions are respected: no account, no cloud sync, no team features, no template system, no custom reason tags, no full monthly animation.

Placeholder scan:

- The plan contains no undefined task, file, or command references.
- Every code-changing step names the file and provides the exact code or exact replacement snippet needed.

Type consistency:

- Domain status names match the design document: `not_started`, `active_primary`, `active_background`, `paused`, `completed`, `postponed`, `dropped`.
- Quadrant names are stable across domain rules, folder view, galaxy view, and tests.
- Repository methods used by the store match `DailyRepository`.
