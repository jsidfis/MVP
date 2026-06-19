import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DailyRepository } from '../data/dailyRepository';
import { MemoryDailyRepository } from '../data/memoryDailyRepository';
import type { Task } from '../domain/types';
import { AppStoreProvider, useAppStore } from './appStore';

const today = '2026-06-18';

describe('task execution actions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts a task session and completes it with elapsed time', async () => {
    let now = '2026-06-18T09:00:00.000Z';
    vi.spyOn(Date.prototype, 'toISOString').mockImplementation(() => now);
    const repository = new MemoryDailyRepository();
    const user = userEvent.setup();

    renderStore(repository);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('loaded'));

    await user.click(screen.getByRole('button', { name: 'add' }));
    await waitFor(() => expect(screen.getByTestId('task-status').textContent).toBe('not_started'));
    const [task] = await repository.listTasks(today);

    await user.click(screen.getByRole('button', { name: 'start' }));

    await waitFor(() => expect(screen.getByTestId('task-status').textContent).toBe('active_primary'));
    const openSessions = await repository.listSessions(task.id);
    expect(openSessions).toEqual([
      expect.objectContaining({
        taskId: task.id,
        startedAt: '2026-06-18T09:00:00.000Z',
      }),
    ]);
    expect(openSessions[0]).not.toHaveProperty('endedAt');
    expect(openSessions[0]).not.toHaveProperty('durationMinutes');

    now = '2026-06-18T09:25:00.000Z';
    await user.click(screen.getByRole('button', { name: 'complete' }));

    await waitFor(() => expect(screen.getByTestId('task-status').textContent).toBe('completed'));
    expect(await repository.listSessions(task.id)).toEqual([
      expect.objectContaining({
        taskId: task.id,
        startedAt: '2026-06-18T09:00:00.000Z',
        endedAt: '2026-06-18T09:25:00.000Z',
        durationMinutes: 25,
      }),
    ]);
  });
});

function renderStore(repository: DailyRepository) {
  return render(
    <AppStoreProvider repository={repository} today={today}>
      <TaskExecutionProbe />
    </AppStoreProvider>,
  );
}

function TaskExecutionProbe() {
  const store = useAppStore();
  const task = store.tasks[0];

  return (
    <div>
      <span data-testid="loading">{store.isLoading ? 'loading' : 'loaded'}</span>
      <span data-testid="task-status">{task?.status ?? 'none'}</span>
      <button type="button" onClick={() => store.addTask({ title: 'Execute task', quadrant: 'important_urgent' })}>
        add
      </button>
      <button type="button" onClick={() => task && store.startTask(task.id)}>
        start
      </button>
      <button type="button" onClick={() => task && store.completeTask(task.id)}>
        complete
      </button>
    </div>
  );
}
