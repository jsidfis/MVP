# Portable Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows portable preview package that can be sent to another user, opened by double-clicking the executable, and used with either isolated personal data or isolated demo data.

**Architecture:** Keep the existing React/Tauri/SQLite structure. Add a small workspace-mode layer in the frontend, add one Rust command that creates and returns the portable `data/` directory beside the executable, and load SQLite with an absolute path so the database lives inside the portable folder. Seed demo data through the existing `DailyRepository` interface so storage rules stay centralized.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, Vitest, Testing Library, SQLite via `@tauri-apps/plugin-sql`, PowerShell packaging script.

---

## File Structure

- Create `src/data/workspaceMode.ts`: workspace mode type, storage key, mode persistence helpers, database filename mapping.
- Create `src/data/workspaceMode.test.ts`: unit coverage for mode persistence and filename mapping.
- Modify `src-tauri/src/lib.rs`: add `portable_data_dir` command and a testable helper for deriving `data/` beside the executable.
- Create `src/data/portableDatabase.ts`: build `sqlite:<absolute path>` URLs for `user.sqlite` and `demo.sqlite`.
- Create `src/data/portableDatabase.test.ts`: mock Tauri `invoke` and `join` APIs.
- Modify `src/data/tauriSqlDailyRepository.ts`: accept a workspace mode and load the matching portable database URL.
- Modify `src/data/repositoryFactory.ts`: accept a workspace mode and pass it to the Tauri SQL repository.
- Modify `src/data/repositoryFactory.test.ts`: assert mode forwarding and memory fallback behavior.
- Create `src/data/demoSeed.ts`: seed realistic demo data into a repository if the demo workspace is empty.
- Create `src/data/demoSeed.test.ts`: verify seed coverage and idempotence through `MemoryDailyRepository`.
- Create `src/components/WorkspaceModeGate.tsx`: first-run choice between blank data and demo data.
- Create `src/components/WorkspaceModeGate.test.tsx`: UI tests for both choices.
- Modify `src/App.tsx`: choose workspace mode before creating the repository, seed demo workspace after repository creation, and allow switching modes.
- Modify `src/App.test.tsx`: cover first-run gate, persisted mode, demo seed call, and repository recreation on mode switch.
- Modify `src/views/DailyWorkspace.tsx`: show current workspace mode and expose a mode-switch button.
- Modify `src/views/DailyWorkspace.test.tsx`: cover workspace mode label and switch callback.
- Modify `src/styles.css`: add minimal styles for the first-run gate and workspace mode indicator.
- Create `scripts/portable-release.ps1`: build and stage a portable folder, then zip it.
- Modify `package.json`: add `portable:build:gnu` script.
- Modify `README.md`: document portable preview usage.
- Create `docs/快速开始.txt`: short text copied into the portable package.

## Task 1: Add Workspace Mode Helpers

**Files:**
- Create: `src/data/workspaceMode.ts`
- Create: `src/data/workspaceMode.test.ts`

- [ ] **Step 1: Write failing tests for workspace mode persistence**

Create `src/data/workspaceMode.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  WORKSPACE_MODE_STORAGE_KEY,
  getWorkspaceDatabaseFile,
  readWorkspaceMode,
  writeWorkspaceMode,
  type WorkspaceMode,
} from './workspaceMode';

class StorageStub implements Storage {
  private values = new Map<string, string>();
  length = 0;

  clear(): void {
    this.values.clear();
    this.length = 0;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
    this.length = this.values.size;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
    this.length = this.values.size;
  }
}

describe('workspaceMode', () => {
  it('returns null when no workspace mode has been selected', () => {
    expect(readWorkspaceMode(new StorageStub())).toBeNull();
  });

  it('returns only supported persisted workspace modes', () => {
    const storage = new StorageStub();
    storage.setItem(WORKSPACE_MODE_STORAGE_KEY, 'demo');

    expect(readWorkspaceMode(storage)).toBe('demo');

    storage.setItem(WORKSPACE_MODE_STORAGE_KEY, 'other');

    expect(readWorkspaceMode(storage)).toBeNull();
  });

  it('persists workspace mode choices', () => {
    const storage = new StorageStub();

    writeWorkspaceMode('user', storage);

    expect(storage.getItem(WORKSPACE_MODE_STORAGE_KEY)).toBe('user');
  });

  it.each<[WorkspaceMode, string]>([
    ['user', 'user.sqlite'],
    ['demo', 'demo.sqlite'],
  ])('maps %s mode to %s', (mode, fileName) => {
    expect(getWorkspaceDatabaseFile(mode)).toBe(fileName);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/data/workspaceMode.test.ts
```

Expected: FAIL because `src/data/workspaceMode.ts` does not exist.

- [ ] **Step 3: Implement workspace mode helpers**

Create `src/data/workspaceMode.ts`:

```ts
export type WorkspaceMode = 'user' | 'demo';

export const WORKSPACE_MODE_STORAGE_KEY = 'daily-plan-review.workspace-mode';

const WORKSPACE_DATABASE_FILES: Record<WorkspaceMode, string> = {
  user: 'user.sqlite',
  demo: 'demo.sqlite',
};

export function isWorkspaceMode(value: unknown): value is WorkspaceMode {
  return value === 'user' || value === 'demo';
}

export function readWorkspaceMode(storage: Storage = window.localStorage): WorkspaceMode | null {
  const value = storage.getItem(WORKSPACE_MODE_STORAGE_KEY);

  return isWorkspaceMode(value) ? value : null;
}

export function writeWorkspaceMode(mode: WorkspaceMode, storage: Storage = window.localStorage): void {
  storage.setItem(WORKSPACE_MODE_STORAGE_KEY, mode);
}

export function getWorkspaceDatabaseFile(mode: WorkspaceMode): string {
  return WORKSPACE_DATABASE_FILES[mode];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm run test:run -- src/data/workspaceMode.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/data/workspaceMode.ts src/data/workspaceMode.test.ts
git commit -m "feat: add workspace mode helpers"
```

## Task 2: Add Portable Data Directory Command

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Add failing Rust tests for data directory derivation**

Modify `src-tauri/src/lib.rs` by adding this helper and tests below `run()`:

```rust
use std::path::{Path, PathBuf};

fn portable_data_dir_from_exe(exe_path: &Path) -> Result<PathBuf, String> {
    let app_dir = exe_path
        .parent()
        .ok_or_else(|| "Could not resolve executable directory".to_string())?;

    Ok(app_dir.join("data"))
}

#[cfg(test)]
mod tests {
    use super::portable_data_dir_from_exe;
    use std::path::Path;

    #[test]
    fn derives_data_dir_next_to_executable() {
        let data_dir = portable_data_dir_from_exe(Path::new(r"C:\Apps\Daily\每日计划与复盘.exe"))
            .expect("data dir");

        assert_eq!(data_dir, Path::new(r"C:\Apps\Daily\data"));
    }
}
```

- [ ] **Step 2: Run Rust test**

Run:

```powershell
npm run tauri:check:gnu
```

Expected: PASS. This helper has no command integration yet, but it verifies the path rule compiles.

- [ ] **Step 3: Add the Tauri command and register it**

Replace `src-tauri/src/lib.rs` with:

```rust
use std::path::{Path, PathBuf};

#[tauri::command]
fn portable_data_dir() -> Result<String, String> {
    let exe_path = std::env::current_exe().map_err(|error| error.to_string())?;
    let data_dir = portable_data_dir_from_exe(&exe_path)?;

    std::fs::create_dir_all(&data_dir).map_err(|error| error.to_string())?;

    Ok(data_dir.to_string_lossy().to_string())
}

fn portable_data_dir_from_exe(exe_path: &Path) -> Result<PathBuf, String> {
    let app_dir = exe_path
        .parent()
        .ok_or_else(|| "Could not resolve executable directory".to_string())?;

    Ok(app_dir.join("data"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![portable_data_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::portable_data_dir_from_exe;
    use std::path::Path;

    #[test]
    fn derives_data_dir_next_to_executable() {
        let data_dir = portable_data_dir_from_exe(Path::new(r"C:\Apps\Daily\每日计划与复盘.exe"))
            .expect("data dir");

        assert_eq!(data_dir, Path::new(r"C:\Apps\Daily\data"));
    }
}
```

- [ ] **Step 4: Verify native layer**

Run:

```powershell
npm run tauri:check:gnu
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src-tauri/src/lib.rs
git commit -m "feat: expose portable data directory"
```

## Task 3: Build Portable SQLite URLs

**Files:**
- Create: `src/data/portableDatabase.ts`
- Create: `src/data/portableDatabase.test.ts`

- [ ] **Step 1: Write failing tests for portable database URL creation**

Create `src/data/portableDatabase.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createPortableDatabaseUrl } from './portableDatabase';

const tauriMocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  join: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: tauriMocks.invoke,
}));

vi.mock('@tauri-apps/api/path', () => ({
  join: tauriMocks.join,
}));

describe('createPortableDatabaseUrl', () => {
  it('builds the user database URL inside the portable data directory', async () => {
    tauriMocks.invoke.mockResolvedValue('C:\\Apps\\Daily\\data');
    tauriMocks.join.mockResolvedValue('C:\\Apps\\Daily\\data\\user.sqlite');

    await expect(createPortableDatabaseUrl('user')).resolves.toBe(
      'sqlite:C:\\Apps\\Daily\\data\\user.sqlite',
    );
    expect(tauriMocks.invoke).toHaveBeenCalledWith('portable_data_dir');
    expect(tauriMocks.join).toHaveBeenCalledWith('C:\\Apps\\Daily\\data', 'user.sqlite');
  });

  it('builds the demo database URL inside the portable data directory', async () => {
    tauriMocks.invoke.mockResolvedValue('C:\\Apps\\Daily\\data');
    tauriMocks.join.mockResolvedValue('C:\\Apps\\Daily\\data\\demo.sqlite');

    await expect(createPortableDatabaseUrl('demo')).resolves.toBe(
      'sqlite:C:\\Apps\\Daily\\data\\demo.sqlite',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/data/portableDatabase.test.ts
```

Expected: FAIL because `portableDatabase.ts` does not exist.

- [ ] **Step 3: Implement portable database URL creation**

Create `src/data/portableDatabase.ts`:

```ts
import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';
import { getWorkspaceDatabaseFile, type WorkspaceMode } from './workspaceMode';

export async function createPortableDatabaseUrl(mode: WorkspaceMode): Promise<string> {
  const dataDir = await invoke<string>('portable_data_dir');
  const databasePath = await join(dataDir, getWorkspaceDatabaseFile(mode));

  return `sqlite:${databasePath}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm run test:run -- src/data/portableDatabase.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/data/portableDatabase.ts src/data/portableDatabase.test.ts
git commit -m "feat: create portable database urls"
```

## Task 4: Wire Workspace Mode Into Repository Creation

**Files:**
- Modify: `src/data/tauriSqlDailyRepository.ts`
- Modify: `src/data/repositoryFactory.ts`
- Modify: `src/data/repositoryFactory.test.ts`
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: Update repository factory tests**

Replace `src/data/repositoryFactory.test.ts` with:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryDailyRepository } from './memoryDailyRepository';
import { createDailyRepository } from './repositoryFactory';

const tauriMocks = vi.hoisted(() => ({
  repository: { source: 'tauri' },
  createTauriSqlDailyRepository: vi.fn(),
}));

vi.mock('./tauriSqlDailyRepository', () => ({
  createTauriSqlDailyRepository: tauriMocks.createTauriSqlDailyRepository,
}));

describe('createDailyRepository', () => {
  afterEach(() => {
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    tauriMocks.createTauriSqlDailyRepository.mockReset();
  });

  it('creates a memory repository outside Tauri', async () => {
    const repository = await createDailyRepository('user');

    expect(repository).toBeInstanceOf(MemoryDailyRepository);
    expect(tauriMocks.createTauriSqlDailyRepository).not.toHaveBeenCalled();
  });

  it('creates a Tauri SQL repository for the selected workspace mode inside Tauri', async () => {
    tauriMocks.createTauriSqlDailyRepository.mockResolvedValue(tauriMocks.repository);
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      configurable: true,
      value: {},
    });

    const repository = await createDailyRepository('demo');

    expect(repository).toBe(tauriMocks.repository);
    expect(tauriMocks.createTauriSqlDailyRepository).toHaveBeenCalledWith('demo');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/data/repositoryFactory.test.ts
```

Expected: FAIL because `createDailyRepository` and `createTauriSqlDailyRepository` do not accept a mode.

- [ ] **Step 3: Modify repository creation**

Update `src/data/repositoryFactory.ts`:

```ts
import type { DailyRepository } from './dailyRepository';
import { MemoryDailyRepository } from './memoryDailyRepository';
import { createTauriSqlDailyRepository } from './tauriSqlDailyRepository';
import type { WorkspaceMode } from './workspaceMode';

export async function createDailyRepository(mode: WorkspaceMode): Promise<DailyRepository> {
  if ('__TAURI_INTERNALS__' in window) {
    return createTauriSqlDailyRepository(mode);
  }

  return new MemoryDailyRepository();
}
```

Update the top of `src/data/tauriSqlDailyRepository.ts`:

```ts
import Database from '@tauri-apps/plugin-sql';
import { createPortableDatabaseUrl } from './portableDatabase';
import type { WorkspaceMode } from './workspaceMode';
```

Replace `createTauriSqlDailyRepository` with:

```ts
export async function createTauriSqlDailyRepository(mode: WorkspaceMode): Promise<DailyRepository> {
  const db = await Database.load(await createPortableDatabaseUrl(mode));

  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(statement);
  }

  return createRepository(db);
}
```

Remove the old `Database.load('sqlite:daily-plan-review.db')` call.

- [ ] **Step 4: Remove old SQL preload**

In `src-tauri/tauri.conf.json`, remove:

```json
"plugins": {
  "sql": {
    "preload": ["sqlite:daily-plan-review.db"]
  }
}
```

Keep valid JSON after removal.

- [ ] **Step 5: Verify tests and build**

Run:

```powershell
npm run test:run -- src/data/repositoryFactory.test.ts src/data/portableDatabase.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/data/repositoryFactory.ts src/data/repositoryFactory.test.ts src/data/tauriSqlDailyRepository.ts src-tauri/tauri.conf.json
git commit -m "feat: load workspace-specific portable database"
```

## Task 5: Add Demo Data Seeding

**Files:**
- Create: `src/data/demoSeed.ts`
- Create: `src/data/demoSeed.test.ts`

- [ ] **Step 1: Write failing tests for demo seed behavior**

Create `src/data/demoSeed.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { MemoryDailyRepository } from './memoryDailyRepository';
import { ensureDemoData } from './demoSeed';

const today = '2026-06-21';

describe('ensureDemoData', () => {
  it('seeds realistic demo tasks, review, and settings into an empty repository', async () => {
    const repository = new MemoryDailyRepository();

    await ensureDemoData(repository, today);

    const tasks = await repository.listTasks(today);
    const dailyFile = await repository.getDailyFile(today);
    const settings = await repository.getSettings();

    expect(tasks.length).toBeGreaterThanOrEqual(6);
    expect(new Set(tasks.map((task) => task.quadrant))).toEqual(
      new Set([
        'important_urgent',
        'important_not_urgent',
        'not_important_urgent',
        'not_important_not_urgent',
      ]),
    );
    expect(tasks.some((task) => task.status === 'completed')).toBe(true);
    expect(tasks.some((task) => task.status === 'postponed')).toBe(true);
    expect(dailyFile.goal).toContain('体验');
    expect(dailyFile.review?.completedText).toContain('完成');
    expect(settings.homeView).toBe('galaxy');
  });

  it('does not seed twice when demo tasks already exist', async () => {
    const repository = new MemoryDailyRepository();

    await ensureDemoData(repository, today);
    const firstSeed = await repository.listTasks(today);
    await ensureDemoData(repository, today);

    await expect(repository.listTasks(today)).resolves.toEqual(firstSeed);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/data/demoSeed.test.ts
```

Expected: FAIL because `demoSeed.ts` does not exist.

- [ ] **Step 3: Implement demo data seeding**

Create `src/data/demoSeed.ts`:

```ts
import type { DailyRepository } from './dailyRepository';
import type { DailyFile, Quadrant, Task, TaskStatus } from '../domain/types';

const DEMO_TASKS: Array<{
  id: string;
  title: string;
  quadrant: Quadrant;
  status: TaskStatus;
  hour: string;
  postponeReasonNote?: string;
}> = [
  {
    id: 'demo-task-1',
    title: '整理本周项目计划',
    quadrant: 'important_urgent',
    status: 'completed',
    hour: '09:00',
  },
  {
    id: 'demo-task-2',
    title: '阅读 Tauri 打包文档并记录要点',
    quadrant: 'important_not_urgent',
    status: 'completed',
    hour: '10:30',
  },
  {
    id: 'demo-task-3',
    title: '回复一个临时确认消息',
    quadrant: 'not_important_urgent',
    status: 'completed',
    hour: '14:00',
  },
  {
    id: 'demo-task-4',
    title: '整理桌面和下载目录',
    quadrant: 'not_important_not_urgent',
    status: 'not_started',
    hour: '16:00',
  },
  {
    id: 'demo-task-5',
    title: '完成 30 分钟运动',
    quadrant: 'important_not_urgent',
    status: 'postponed',
    hour: '19:00',
    postponeReasonNote: '晚饭后精力不足，顺延到明天早上',
  },
  {
    id: 'demo-task-6',
    title: '写下明天最重要的一件事',
    quadrant: 'important_urgent',
    status: 'active_primary',
    hour: '21:00',
  },
];

export async function ensureDemoData(repository: DailyRepository, today: string): Promise<void> {
  const existingTasks = await repository.listTasks(today);

  if (existingTasks.length > 0) {
    return;
  }

  await repository.saveSettings({
    homeView: 'galaxy',
    notificationsEnabled: false,
    morningReminder: '08:30',
    eveningReminder: '21:30',
  });

  await repository.saveDailyFile(demoDailyFile(today));

  for (const task of DEMO_TASKS) {
    await repository.saveTask(demoTask(today, task));
  }

  await repository.saveDailyFile(demoDailyFile(addDays(today, -1)));
  await repository.saveTask(
    demoTask(addDays(today, -1), {
      id: 'demo-history-1',
      title: '把未完成的打包问题记录下来',
      quadrant: 'important_not_urgent',
      status: 'postponed',
      hour: '20:00',
      postponeReasonNote: '打包工具链需要第二天继续确认',
    }),
  );
}

function demoDailyFile(date: string): DailyFile {
  return {
    date,
    stage: 'review',
    goal: '体验一次从早上计划到晚上复盘的完整闭环',
    statusScore: 4,
    statusNote: '上午专注，下午有临时事项插入',
    review: {
      completedText: '完成了项目计划、文档阅读和临时消息处理。',
      unfinishedText: '运动没有完成，主要是晚间精力不足。',
      feelingText: '节奏比昨天稳定，重要任务推进明显。',
      tomorrowFocusText: '先处理顺延任务，再继续完善便携包。',
    },
    reviewedAt: `${date}T21:40:00.000Z`,
  };
}

function demoTask(
  date: string,
  input: {
    id: string;
    title: string;
    quadrant: Quadrant;
    status: TaskStatus;
    hour: string;
    postponeReasonNote?: string;
  },
): Task {
  return {
    id: input.id,
    date,
    title: input.title,
    quadrant: input.quadrant,
    status: input.status,
    isCarryover: input.status === 'postponed',
    carryoverFromDate: input.status === 'postponed' ? addDays(date, -1) : undefined,
    postponeReasonTag: input.status === 'postponed' ? 'energy_low' : undefined,
    postponeReasonNote: input.postponeReasonNote,
    createdAt: `${date}T${input.hour}:00.000Z`,
    updatedAt: `${date}T${input.hour}:00.000Z`,
  };
}

function addDays(date: string, amount: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + amount);

  return parsed.toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm run test:run -- src/data/demoSeed.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/data/demoSeed.ts src/data/demoSeed.test.ts
git commit -m "feat: seed demo workspace data"
```

## Task 6: Add First-Run Workspace Mode Gate

**Files:**
- Create: `src/components/WorkspaceModeGate.tsx`
- Create: `src/components/WorkspaceModeGate.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing UI tests**

Create `src/components/WorkspaceModeGate.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceModeGate } from './WorkspaceModeGate';

describe('WorkspaceModeGate', () => {
  it('lets the user start with blank data', async () => {
    const onSelect = vi.fn();

    render(<WorkspaceModeGate onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: '空白开始' }));

    expect(onSelect).toHaveBeenCalledWith('user');
  });

  it('lets the user view demo data', async () => {
    const onSelect = vi.fn();

    render(<WorkspaceModeGate onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: '查看示例' }));

    expect(onSelect).toHaveBeenCalledWith('demo');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/components/WorkspaceModeGate.test.tsx
```

Expected: FAIL because `WorkspaceModeGate.tsx` does not exist.

- [ ] **Step 3: Implement gate component**

Create `src/components/WorkspaceModeGate.tsx`:

```tsx
import type { WorkspaceMode } from '../data/workspaceMode';

type WorkspaceModeGateProps = {
  onSelect(mode: WorkspaceMode): void;
};

export function WorkspaceModeGate({ onSelect }: WorkspaceModeGateProps) {
  return (
    <main className="app-shell workspace-mode-gate">
      <section className="workspace-mode-panel" aria-label="选择数据空间">
        <p className="workspace-date">便携体验版</p>
        <h1>每日计划与复盘</h1>
        <div className="workspace-mode-actions">
          <button type="button" className="primary-button" onClick={() => onSelect('user')}>
            空白开始
          </button>
          <button type="button" className="secondary-button" onClick={() => onSelect('demo')}>
            查看示例
          </button>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Add minimal styles**

Append to `src/styles.css`:

```css
.workspace-mode-gate {
  align-items: center;
  display: flex;
  justify-content: center;
  min-height: 100vh;
}

.workspace-mode-panel {
  max-width: 520px;
  text-align: center;
}

.workspace-mode-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```powershell
npm run test:run -- src/components/WorkspaceModeGate.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/components/WorkspaceModeGate.tsx src/components/WorkspaceModeGate.test.tsx src/styles.css
git commit -m "feat: add workspace selection gate"
```

## Task 7: Wire Workspace Mode Into App Startup

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Replace App tests**

Replace `src/App.test.tsx` with:

```tsx
import { StrictMode, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryMocks = vi.hoisted(() => ({
  repository: {},
  createDailyRepository: vi.fn(),
  ensureDemoData: vi.fn(),
}));

vi.mock('./data/repositoryFactory', () => ({
  createDailyRepository: repositoryMocks.createDailyRepository,
}));

vi.mock('./data/demoSeed', () => ({
  ensureDemoData: repositoryMocks.ensureDemoData,
}));

vi.mock('./store/appStore', () => ({
  AppStoreProvider: ({ children }: { children: ReactNode }) => (
    <section data-testid="app-store">{children}</section>
  ),
}));

vi.mock('./views/DailyWorkspace', () => ({
  DailyWorkspace: ({ workspaceMode, onChangeWorkspaceMode }: { workspaceMode: string; onChangeWorkspaceMode(mode: string): void }) => (
    <div>
      <p>今日工作台</p>
      <p>当前数据：{workspaceMode}</p>
      <button type="button" onClick={() => onChangeWorkspaceMode('demo')}>
        切换示例
      </button>
    </div>
  ),
}));

describe('App', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    repositoryMocks.createDailyRepository.mockReset();
    repositoryMocks.createDailyRepository.mockResolvedValue(repositoryMocks.repository);
    repositoryMocks.ensureDemoData.mockReset();
  });

  it('shows the workspace mode gate before the first choice', async () => {
    const { App } = await import('./App');

    render(<App />);

    expect(screen.getByRole('button', { name: '空白开始' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '查看示例' })).toBeTruthy();
    expect(repositoryMocks.createDailyRepository).not.toHaveBeenCalled();
  });

  it('creates the user repository after blank start is selected', async () => {
    const { App } = await import('./App');

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: '空白开始' }));

    expect(await screen.findByText('今日工作台')).toBeTruthy();
    expect(repositoryMocks.createDailyRepository).toHaveBeenCalledWith('user');
    expect(repositoryMocks.ensureDemoData).not.toHaveBeenCalled();
  });

  it('creates and seeds the demo repository after demo start is selected', async () => {
    const { App } = await import('./App');

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: '查看示例' }));

    expect(await screen.findByText('今日工作台')).toBeTruthy();
    expect(repositoryMocks.createDailyRepository).toHaveBeenCalledWith('demo');
    expect(repositoryMocks.ensureDemoData).toHaveBeenCalledWith(repositoryMocks.repository, expect.any(String));
  });

  it('loads the persisted workspace mode once under StrictMode', async () => {
    localStorage.setItem('daily-plan-review.workspace-mode', 'user');
    const { App } = await import('./App');

    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );

    expect(await screen.findByText('今日工作台')).toBeTruthy();
    expect(repositoryMocks.createDailyRepository).toHaveBeenCalledOnce();
  });

  it('recreates the repository when the workspace mode changes', async () => {
    localStorage.setItem('daily-plan-review.workspace-mode', 'user');
    const { App } = await import('./App');

    render(<App />);
    expect(await screen.findByText('当前数据：user')).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: '切换示例' }));

    await waitFor(() => {
      expect(repositoryMocks.createDailyRepository).toHaveBeenLastCalledWith('demo');
    });
  });

  it('shows a repository loading error', async () => {
    localStorage.setItem('daily-plan-review.workspace-mode', 'user');
    repositoryMocks.createDailyRepository.mockRejectedValue(new Error('Database failed'));
    const { App } = await import('./App');

    render(<App />);

    expect(await screen.findByText('今日工作台打开失败')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/App.test.tsx
```

Expected: FAIL because `App` does not yet handle workspace modes.

- [ ] **Step 3: Implement App startup flow**

Replace `src/App.tsx` with:

```tsx
import { useEffect, useState } from 'react';
import type { DailyRepository } from './data/dailyRepository';
import { ensureDemoData } from './data/demoSeed';
import { createDailyRepository } from './data/repositoryFactory';
import { readWorkspaceMode, writeWorkspaceMode, type WorkspaceMode } from './data/workspaceMode';
import { WorkspaceModeGate } from './components/WorkspaceModeGate';
import { AppStoreProvider } from './store/appStore';
import { DailyWorkspace } from './views/DailyWorkspace';

export function App() {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode | null>(() => readWorkspaceMode());
  const [repository, setRepository] = useState<DailyRepository | null>(null);
  const [repositoryError, setRepositoryError] = useState(false);
  const today = getTodayDate();

  useEffect(() => {
    let cancelled = false;

    if (!workspaceMode) {
      setRepository(null);
      return;
    }

    setRepository(null);
    setRepositoryError(false);

    void createDailyRepository(workspaceMode).then(
      async (createdRepository) => {
        if (workspaceMode === 'demo') {
          await ensureDemoData(createdRepository, today);
        }

        if (!cancelled) {
          setRepository(createdRepository);
        }
      },
      () => {
        if (!cancelled) {
          setRepositoryError(true);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [today, workspaceMode]);

  function selectWorkspaceMode(mode: WorkspaceMode) {
    writeWorkspaceMode(mode);
    setWorkspaceMode(mode);
  }

  if (!workspaceMode) {
    return <WorkspaceModeGate onSelect={selectWorkspaceMode} />;
  }

  if (repositoryError) {
    return <main className="app-shell">今日工作台打开失败</main>;
  }

  if (!repository) {
    return <main className="app-shell">正在打开今日工作台</main>;
  }

  return (
    <AppStoreProvider key={workspaceMode} repository={repository} today={today}>
      <DailyWorkspace workspaceMode={workspaceMode} onChangeWorkspaceMode={selectWorkspaceMode} />
    </AppStoreProvider>
  );
}

function getTodayDate(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
npm run test:run -- src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/App.tsx src/App.test.tsx
git commit -m "feat: choose workspace mode on startup"
```

## Task 8: Show and Switch Current Data Space in Workspace

**Files:**
- Modify: `src/views/DailyWorkspace.tsx`
- Modify: `src/views/DailyWorkspace.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Update DailyWorkspace tests**

Add this test to `src/views/DailyWorkspace.test.tsx`:

```tsx
it('shows the current workspace mode and can switch to demo data', async () => {
  const repository = new MemoryDailyRepository();
  const onChangeWorkspaceMode = vi.fn();
  renderWorkspace(repository, 'user', onChangeWorkspaceMode);

  await waitForLoaded();

  expect(screen.getByText('我的数据')).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: '切换到示例' }));

  expect(onChangeWorkspaceMode).toHaveBeenCalledWith('demo');
});
```

Update imports:

```ts
import { describe, expect, it, vi } from 'vitest';
import type { WorkspaceMode } from '../data/workspaceMode';
```

Update `renderWorkspace`:

```tsx
function renderWorkspace(
  repository: MemoryDailyRepository,
  workspaceMode: WorkspaceMode = 'user',
  onChangeWorkspaceMode: (mode: WorkspaceMode) => void = vi.fn(),
) {
  return render(
    <AppStoreProvider repository={repository} today={today}>
      <DailyWorkspace workspaceMode={workspaceMode} onChangeWorkspaceMode={onChangeWorkspaceMode} />
    </AppStoreProvider>,
  );
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
npm run test:run -- src/views/DailyWorkspace.test.tsx
```

Expected: FAIL because `DailyWorkspace` does not accept workspace mode props.

- [ ] **Step 3: Update DailyWorkspace**

Modify the imports in `src/views/DailyWorkspace.tsx`:

```ts
import type { WorkspaceMode } from '../data/workspaceMode';
```

Change the component signature:

```tsx
type DailyWorkspaceProps = {
  workspaceMode: WorkspaceMode;
  onChangeWorkspaceMode(mode: WorkspaceMode): void;
};

export function DailyWorkspace({ workspaceMode, onChangeWorkspaceMode }: DailyWorkspaceProps) {
```

Inside the header actions, replace the single monthly button with:

```tsx
<div className="workspace-header-actions">
  <span className="workspace-mode-badge">
    {workspaceMode === 'demo' ? '示例数据' : '我的数据'}
  </span>
  <button
    type="button"
    className="secondary-button"
    onClick={() => onChangeWorkspaceMode(workspaceMode === 'demo' ? 'user' : 'demo')}
  >
    {workspaceMode === 'demo' ? '切换到我的数据' : '切换到示例'}
  </button>
  <button type="button" className="secondary-button">
    月度总览
  </button>
</div>
```

- [ ] **Step 4: Add header styles**

Append to `src/styles.css`:

```css
.workspace-header-actions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.workspace-mode-badge {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  color: var(--muted-text);
  font-size: 13px;
  padding: 6px 10px;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```powershell
npm run test:run -- src/views/DailyWorkspace.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/views/DailyWorkspace.tsx src/views/DailyWorkspace.test.tsx src/styles.css
git commit -m "feat: show active workspace mode"
```

## Task 9: Add Portable Package Script

**Files:**
- Create: `scripts/portable-release.ps1`
- Modify: `package.json`
- Create: `docs/快速开始.txt`

- [ ] **Step 1: Create quick start text**

Create `docs/快速开始.txt`:

```text
每日计划与复盘 - 便携体验版

启动方式：
1. 解压整个文件夹。
2. 双击“每日计划与复盘.exe”。

数据位置：
- 我的数据：data/user.sqlite
- 示例数据：data/demo.sqlite

备份方式：
- 复制整个文件夹，或至少复制 data 文件夹。

重置方式：
- 删除 data/user.sqlite 可以重置我的数据。
- 删除 data/demo.sqlite 可以重置示例数据。

发送给别人体验：
- 压缩整个文件夹后发送。
- 不要只发送 exe 文件。

注意：
- 不建议放在 C:\Program Files 等需要管理员权限的目录。
- 建议放在桌面、D 盘或普通用户目录。
```

- [ ] **Step 2: Create portable release script**

Create `scripts/portable-release.ps1`:

```powershell
param(
  [string]$Version = '0.2.0'
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$CargoTargetDir = Join-Path $env:LOCALAPPDATA 'daily-plan-review\cargo-target-gnu'
$Target = 'x86_64-pc-windows-gnu'
$ReleaseDir = Join-Path $CargoTargetDir "$Target\release"
$ExePath = Join-Path $ReleaseDir 'daily-plan-review.exe'
$PortableRoot = Join-Path $RepoRoot 'dist-portable'
$StagingDir = Join-Path $PortableRoot "每日计划与复盘-v$Version-portable"
$ZipPath = Join-Path $PortableRoot "每日计划与复盘-v$Version-portable.zip"

npm.cmd run tauri:build:gnu
if ($LASTEXITCODE -ne 0) {
  throw "tauri:build:gnu failed"
}

if (-not (Test-Path -LiteralPath $ExePath)) {
  throw "Release executable not found: $ExePath"
}

if (Test-Path -LiteralPath $StagingDir) {
  Remove-Item -LiteralPath $StagingDir -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $StagingDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $StagingDir 'data') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $StagingDir 'docs') | Out-Null
Copy-Item -LiteralPath $ExePath -Destination (Join-Path $StagingDir '每日计划与复盘.exe') -Force
Copy-Item -LiteralPath (Join-Path $RepoRoot 'docs\快速开始.txt') -Destination (Join-Path $StagingDir 'docs\快速开始.txt') -Force

if (Test-Path -LiteralPath $ZipPath) {
  Remove-Item -LiteralPath $ZipPath -Force
}

Compress-Archive -LiteralPath $StagingDir -DestinationPath $ZipPath -Force
Write-Host "Portable package created: $ZipPath"
```

- [ ] **Step 3: Add package script**

Modify `package.json` scripts:

```json
"portable:build:gnu": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/portable-release.ps1"
```

Keep the existing scripts unchanged.

- [ ] **Step 4: Verify portable script reaches expected failure or success**

Run:

```powershell
npm run portable:build:gnu
```

Expected: PASS and `dist-portable/每日计划与复盘-v0.2.0-portable.zip` exists. If the generated executable path differs, update `$ExePath` in `scripts/portable-release.ps1` to the real release executable path and rerun.

- [ ] **Step 5: Commit**

```powershell
git add package.json scripts/portable-release.ps1 docs/快速开始.txt
git commit -m "feat: build portable preview package"
```

## Task 10: Update Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/PROJECT_PHASE_2_PORTABLE_PREVIEW.md`

- [ ] **Step 1: Update README portable usage**

Add a section to `README.md` after “日常启动”:

````markdown
## 便携体验版

二阶段目标是生成一个可以直接发给其他用户体验的便携包：

```powershell
npm run portable:build:gnu
```

生成后查看：

```text
dist-portable/每日计划与复盘-v0.2.0-portable.zip
```

体验者解压后双击 `每日计划与复盘.exe`。便携版数据保存在解压文件夹内：

- `data/user.sqlite`：我的数据
- `data/demo.sqlite`：示例数据

发送给别人体验时，请发送整个 zip，不要只发送 exe。
````

- [ ] **Step 2: Update phase 2 status**

Add this to the top of `docs/PROJECT_PHASE_2_PORTABLE_PREVIEW.md` below the title:

```markdown
当前执行状态：实现中。对应实现计划见 `docs/superpowers/plans/2026-06-21-portable-preview-implementation.md`。
```

- [ ] **Step 3: Verify docs**

Run:

```powershell
git diff --check
```

Expected: PASS.

- [ ] **Step 4: Commit**

```powershell
git add README.md docs/PROJECT_PHASE_2_PORTABLE_PREVIEW.md
git commit -m "docs: describe portable preview usage"
```

## Task 11: Full Verification

**Files:**
- No source file changes unless verification exposes a defect.

- [ ] **Step 1: Run unit tests**

Run:

```powershell
npm run test:run
```

Expected: all tests pass.

- [ ] **Step 2: Run frontend build**

Run:

```powershell
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Run native check**

Run:

```powershell
npm run tauri:check:gnu
```

Expected: native check passes.

- [ ] **Step 4: Build portable package**

Run:

```powershell
npm run portable:build:gnu
```

Expected: `dist-portable/每日计划与复盘-v0.2.0-portable.zip` exists.

- [ ] **Step 5: Manual smoke test**

Unzip the package to a fresh temporary folder and verify:

```text
1. Double-click 每日计划与复盘.exe.
2. Select 空白开始.
3. Add one task.
4. Close and reopen.
5. Confirm the task remains.
6. Switch to 示例数据.
7. Confirm demo tasks appear.
8. Modify a demo task.
9. Switch back to 我的数据.
10. Confirm the personal task remains and demo changes are isolated.
```

- [ ] **Step 6: Commit verification fixes only if needed**

If verification required code fixes:

```powershell
git add <changed-files>
git commit -m "fix: stabilize portable preview"
```

If no fixes were needed, do not create an empty commit.

## Spec Coverage Review

- Portable zip package: Task 9 and Task 11.
- Double-click executable: Task 9 and Task 11.
- Data inside portable folder: Task 2, Task 3, Task 4, and Task 11.
- First-run blank/demo choice: Task 6 and Task 7.
- Separate user and demo databases: Task 1, Task 3, Task 4, Task 7, and Task 11.
- Demo data that covers main features: Task 5.
- Quick-start documentation: Task 9 and Task 10.
- Validation: Task 11.
