import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryDailyRepository } from '../data/memoryDailyRepository';
import type { DailyRepository } from '../data/dailyRepository';
import type { Task } from '../domain/types';
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
    </div>
  );
}

function HookConsumer() {
  useAppStore();
  return null;
}

function titles(tasks: Task[]): string {
  return tasks.map((item) => item.title).join(', ') || 'none';
}

function expectText(testId: string, text: string) {
  expect(screen.getByTestId(testId).textContent).toContain(text);
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
