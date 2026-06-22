import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryDailyRepository } from '../data/memoryDailyRepository';
import type { DailyRepository } from '../data/dailyRepository';
import type { TaskTemplate } from '../data/taskTemplates';
import type { RecurringTaskRule } from '../domain/recurrenceRules';
import type { DailyFile, ReviewDecision, Task, TaskSession, UserSettings } from '../domain/types';
import { AppStoreProvider, useAppStore } from './appStore';

const today = '2026-06-18';

describe('AppStoreProvider', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('loads today file, settings, tasks, and carryover candidates', async () => {
    const repository = new MemoryDailyRepository();
    const todayTask = task('task-today', today, 'not_started', 'Today task');
    const carryoverTask = task('task-old', '2026-06-17', 'postponed', 'Old task');
    await repository.saveDailyFile({ date: today, stage: 'execute', goal: 'Run focused tests' });
    await repository.saveSettings({ homeView: 'galaxy', notificationsEnabled: true });
    await repository.saveTask(todayTask);
    await repository.saveTask(carryoverTask);

    renderStore(repository);

    expectText('loading', 'loading');
    await waitFor(() => expectText('loading', 'loaded'));
    expectText('today', today);
    expectText('goal', 'Run focused tests');
    expectText('home-view', 'galaxy');
    expectText('tasks', 'Today task');
    expectText('carryover', 'Old task');
  });

  it('saves and adds a task', async () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-06-18T09:30:00.000Z');
    const repository = new MemoryDailyRepository();
    renderStore(repository);
    await waitFor(() => expectText('loading', 'loaded'));

    await userEvent.click(screen.getByRole('button', { name: 'add' }));

    await waitFor(() => expectText('tasks', 'Write store test'));
    const [saved] = await repository.listTasks(today);
    expect(saved).toMatchObject({
      date: today,
      title: 'Write store test',
      quadrant: 'important_urgent',
      status: 'not_started',
      isCarryover: false,
      createdAt: '2026-06-18T09:30:00.000Z',
      updatedAt: '2026-06-18T09:30:00.000Z',
    });
  });

  it('keeps a task added before initial load resolves', async () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-06-18T09:30:00.000Z');
    const repository = new DelayedLoadRepository({
      settings: { homeView: 'folder', notificationsEnabled: false },
    });
    renderStore(repository);

    await userEvent.click(screen.getByRole('button', { name: 'add' }));
    await waitFor(() => expectText('tasks', 'Write store test'));

    repository.resolveInitialLoad();

    await waitFor(() => expectText('loading', 'loaded'));
    expectText('tasks', 'Write store test');
  });

  it('confirms carryover into today and removes it from candidates', async () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-06-18T10:15:00.000Z');
    const repository = new MemoryDailyRepository();
    const carryoverTask = task('task-old', '2026-06-17', 'postponed', 'Carry task');
    await repository.saveTask(carryoverTask);
    renderStore(repository);
    await waitFor(() => expectText('carryover', 'Carry task'));

    await userEvent.click(screen.getByRole('button', { name: 'confirm' }));

    await waitFor(() => expectText('tasks', 'Carry task'));
    expectText('carryover', 'none');
    const [saved] = await repository.listTasks(today);
    expect(saved).toMatchObject({
      id: 'task-old',
      date: today,
      title: 'Carry task',
      status: 'not_started',
      isCarryover: true,
      carryoverFromDate: '2026-06-17',
      updatedAt: '2026-06-18T10:15:00.000Z',
    });
  });

  it('preserves existing settings fields when home view changes before initial load resolves', async () => {
    const repository = new DelayedLoadRepository({
      settings: {
        homeView: 'folder',
        notificationsEnabled: true,
        morningReminder: '08:30',
        eveningReminder: '21:30',
      },
    });
    renderStore(repository);

    await userEvent.click(screen.getByRole('button', { name: 'set galaxy' }));
    await waitFor(() => expectText('home-view', 'galaxy'));

    repository.resolveInitialLoad();

    await waitFor(() => expectText('loading', 'loaded'));
    expectText('home-view', 'galaxy');
    await expect(repository.getSettings()).resolves.toEqual({
      homeView: 'galaxy',
      notificationsEnabled: true,
      morningReminder: '08:30',
      eveningReminder: '21:30',
    });
  });

  it('persists and updates the home view preference', async () => {
    const repository = new MemoryDailyRepository();
    renderStore(repository);
    await waitFor(() => expectText('loading', 'loaded'));

    await userEvent.click(screen.getByRole('button', { name: 'set galaxy' }));

    await waitFor(() => expectText('home-view', 'galaxy'));
    await expect(repository.getSettings()).resolves.toEqual({
      homeView: 'galaxy',
      notificationsEnabled: false,
    });
  });

  it('exports and imports JSON backups through store actions', async () => {
    const repository = new MemoryDailyRepository();
    await repository.saveDailyFile({ date: today, stage: 'plan', goal: 'Original goal' });
    await repository.saveTask(task('task-original', today, 'not_started', 'Original task'));
    renderStore(repository);
    await waitFor(() => expectText('loading', 'loaded'));

    await userEvent.click(screen.getByRole('button', { name: 'export json' }));

    await waitFor(() => expect(screen.getByTestId('exported-json').textContent).toContain('Original task'));

    await userEvent.click(screen.getByRole('button', { name: 'import json' }));

    await waitFor(() => expectText('goal', 'Imported goal'));
    expect(screen.getByTestId('tasks').textContent).toContain('Imported task');
  });

  it('resets the current repository with demo data', async () => {
    const repository = new MemoryDailyRepository();
    await repository.saveTask(task('custom-task', today, 'not_started', 'Custom task'));
    renderStore(repository);
    await waitFor(() => expectText('loading', 'loaded'));

    await userEvent.click(screen.getByRole('button', { name: 'reset demo' }));

    await waitFor(async () => {
      const tasks = await repository.listTasks(today);
      expect(tasks.some((item) => item.id === 'demo-task-1')).toBe(true);
      expect(tasks.some((item) => item.id === 'custom-task')).toBe(false);
    });
  });
});

describe('useAppStore', () => {
  it('throws outside AppStoreProvider', () => {
    expect(() => render(<HookConsumer />)).toThrow('useAppStore must be used within AppStoreProvider');
  });
});

function renderStore(repository: DailyRepository) {
  return render(
    <AppStoreProvider repository={repository} today={today}>
      <StoreProbe />
    </AppStoreProvider>,
  );
}

function StoreProbe() {
  const store = useAppStore();
  const [exportedJson, setExportedJson] = useState('');

  return (
    <div>
      <span data-testid="loading">{store.isLoading ? 'loading' : 'loaded'}</span>
      <span data-testid="today">{store.today}</span>
      <span data-testid="goal">{store.dailyFile?.goal ?? 'none'}</span>
      <span data-testid="home-view">{store.settings?.homeView ?? 'none'}</span>
      <span data-testid="tasks">{titles(store.tasks)}</span>
      <span data-testid="carryover">{titles(store.carryoverCandidates)}</span>
      <button type="button" onClick={() => store.addTask({ title: 'Write store test', quadrant: 'important_urgent' })}>
        add
      </button>
      <button type="button" onClick={() => store.confirmCarryover('task-old')}>
        confirm
      </button>
      <button type="button" onClick={() => store.setHomeView('galaxy')}>
        set galaxy
      </button>
      <button type="button" onClick={() => void store.exportJsonBackup().then(setExportedJson)}>
        export json
      </button>
      <button type="button" onClick={() => void store.importJsonBackup(importedBackup)}>
        import json
      </button>
      <button type="button" onClick={() => void store.resetDemoData()}>
        reset demo
      </button>
      <span data-testid="exported-json">{exportedJson}</span>
    </div>
  );
}

const importedBackup = {
  schemaVersion: 1,
  exportedAt: '2026-06-18T20:00:00.000Z',
  settings: { homeView: 'galaxy', notificationsEnabled: false },
  dailyFiles: [{ date: today, stage: 'execute', goal: 'Imported goal' }],
  tasks: [
    {
      id: 'task-imported',
      date: today,
      title: 'Imported task',
      quadrant: 'important_urgent',
      status: 'not_started',
      isCarryover: false,
      createdAt: '2026-06-18T08:00:00.000Z',
      updatedAt: '2026-06-18T08:00:00.000Z',
    },
  ],
  taskTemplates: [],
  recurringTaskRules: [],
  sessions: [],
  reviewDecisions: [],
};

function HookConsumer() {
  useAppStore();
  return null;
}

function titles(tasks: Task[]): string {
  return tasks.map((item) => item.title).join(', ') || 'none';
}

function expectText(testId: string, text: string) {
  expect(screen.getByTestId(testId).textContent).toBe(text);
}

function task(id: string, date: string, status: Task['status'], title: string): Task {
  return {
    id,
    date,
    title,
    quadrant: 'important_urgent',
    status,
    isCarryover: false,
    postponeReasonTag: status === 'postponed' ? 'time_estimate_error' : undefined,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  };
}

class DelayedLoadRepository implements DailyRepository {
  private readonly initialLoad = deferred<void>();
  private readonly dailyFile: DailyFile;
  private readonly tasks = new Map<string, Task>();
  private readonly settingsAtLoadStart: UserSettings;
  private settings: UserSettings;
  private settingsReads = 0;

  constructor(input: { settings: UserSettings; tasks?: Task[] }) {
    this.dailyFile = { date: today, stage: 'plan', goal: '' };
    this.settings = { ...input.settings };
    this.settingsAtLoadStart = { ...input.settings };

    for (const item of input.tasks ?? []) {
      this.tasks.set(item.id, { ...item });
    }
  }

  resolveInitialLoad() {
    this.initialLoad.resolve();
  }

  async getDailyFile(date: string): Promise<DailyFile> {
    await this.initialLoad.promise;
    return { ...this.dailyFile, date };
  }

  async saveDailyFile(file: DailyFile): Promise<void> {
    Object.assign(this.dailyFile, file);
  }

  async listDailyFiles(): Promise<DailyFile[]> {
    await this.initialLoad.promise;
    return [{ ...this.dailyFile }];
  }

  async listTasks(date: string): Promise<Task[]> {
    const snapshot = Array.from(this.tasks.values())
      .filter((item) => item.date === date)
      .map((item) => ({ ...item }));

    await this.initialLoad.promise;
    return snapshot;
  }

  async saveTask(item: Task): Promise<void> {
    this.tasks.set(item.id, { ...item });
  }

  async listAllTasks(): Promise<Task[]> {
    const snapshot = Array.from(this.tasks.values()).map((item) => ({ ...item }));

    await this.initialLoad.promise;
    return snapshot;
  }

  async listTaskTemplates(): Promise<TaskTemplate[]> {
    await this.initialLoad.promise;
    return [];
  }

  async saveTaskTemplate(): Promise<void> {}

  async listRecurringTaskRules(): Promise<RecurringTaskRule[]> {
    await this.initialLoad.promise;
    return [];
  }

  async saveRecurringTaskRule(): Promise<void> {}

  async listSessions(): Promise<TaskSession[]> {
    return [];
  }

  async saveSession(): Promise<void> {}

  async listAllSessions(): Promise<TaskSession[]> {
    return [];
  }

  async saveReviewDecision(): Promise<void> {}

  async listReviewDecisions(): Promise<ReviewDecision[]> {
    return [];
  }

  async listCarryoverCandidates(date: string): Promise<Task[]> {
    const snapshot = Array.from(this.tasks.values())
      .filter((item) => item.status === 'postponed' && item.date < date)
      .map((item) => ({ ...item }));

    await this.initialLoad.promise;
    return snapshot;
  }

  async getSettings(): Promise<UserSettings> {
    this.settingsReads += 1;

    if (this.settingsReads === 1) {
      await this.initialLoad.promise;
      return { ...this.settingsAtLoadStart };
    }

    return { ...this.settings };
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    this.settings = { ...settings };
  }

  async clearAllData(): Promise<void> {
    this.tasks.clear();
    this.settings = { homeView: 'folder', notificationsEnabled: false };
  }
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((next) => {
    resolve = next;
  });

  return { promise, resolve };
}
