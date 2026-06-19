import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DailyRepository } from '../data/dailyRepository';
import { MemoryDailyRepository } from '../data/memoryDailyRepository';
import type { Task } from '../domain/types';
import { FolderView } from '../views/FolderView';
import { GalaxyView } from '../views/GalaxyView';
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

  it('does not create duplicate open sessions when start is called twice before rerender', async () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-06-18T09:00:00.000Z');
    const repository = new MemoryDailyRepository();
    const user = userEvent.setup();

    renderStore(repository);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('loaded'));

    await user.click(screen.getByRole('button', { name: 'add' }));
    await waitFor(() => expect(screen.getByTestId('task-status').textContent).toBe('not_started'));
    const [task] = await repository.listTasks(today);

    await user.click(screen.getByRole('button', { name: 'start twice' }));

    await waitFor(() => expect(screen.getByTestId('task-status').textContent).toBe('active_primary'));
    const sessions = await repository.listSessions(task.id);
    expect(sessions.filter((session) => !session.endedAt)).toHaveLength(1);
  });

  it('pauses the old primary task and closes its session when switching tasks', async () => {
    let now = '2026-06-18T09:00:00.000Z';
    vi.spyOn(Date.prototype, 'toISOString').mockImplementation(() => now);
    const repository = new MemoryDailyRepository();
    const user = userEvent.setup();

    renderStore(repository);
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('loaded'));

    await user.click(screen.getByRole('button', { name: 'add' }));
    await user.click(screen.getByRole('button', { name: 'add second' }));
    await waitFor(() => expect(screen.getByTestId('task-count').textContent).toBe('2'));
    const [firstTask, secondTask] = await repository.listTasks(today);

    await user.click(screen.getByRole('button', { name: 'start first' }));
    await waitFor(async () => {
      await expectTaskStatus(repository, firstTask.id, 'active_primary');
      await expectTaskStatus(repository, secondTask.id, 'not_started');
    });

    now = '2026-06-18T09:20:00.000Z';
    await user.click(screen.getByRole('button', { name: 'start second' }));

    await waitFor(async () => {
      await expectTaskStatus(repository, firstTask.id, 'paused');
      await expectTaskStatus(repository, secondTask.id, 'active_primary');
    });
    expect(await repository.listSessions(firstTask.id)).toEqual([
      expect.objectContaining({
        taskId: firstTask.id,
        startedAt: '2026-06-18T09:00:00.000Z',
        endedAt: '2026-06-18T09:20:00.000Z',
        durationMinutes: 20,
      }),
    ]);
    const secondSessions = await repository.listSessions(secondTask.id);
    expect(secondSessions).toEqual([
      expect.objectContaining({
        taskId: secondTask.id,
        startedAt: '2026-06-18T09:20:00.000Z',
      }),
    ]);
    expect(secondSessions[0]).not.toHaveProperty('endedAt');
  });

  it('does not restart a completed task', async () => {
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
    now = '2026-06-18T09:10:00.000Z';
    await user.click(screen.getByRole('button', { name: 'complete' }));
    await waitFor(() => expect(screen.getByTestId('task-status').textContent).toBe('completed'));

    now = '2026-06-18T09:15:00.000Z';
    await user.click(screen.getByRole('button', { name: 'start' }));

    expect(screen.getByTestId('task-status').textContent).toBe('completed');
    expect(await repository.listSessions(task.id)).toEqual([
      expect.objectContaining({
        endedAt: '2026-06-18T09:10:00.000Z',
        durationMinutes: 10,
      }),
    ]);
  });

  it('does not expose start actions for completed tasks in folder or galaxy views', () => {
    const completedTask = task('completed-task', 'Completed task', 'completed');

    const { rerender } = render(
      <FolderView tasks={[completedTask]} onStartTask={vi.fn()} onCompleteTask={vi.fn()} />,
    );
    expect(screen.getByText('Completed task')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Completed task|开始|寮€濮?/ })).toBeNull();

    rerender(<GalaxyView tasks={[completedTask]} onStartTask={vi.fn()} onCompleteTask={vi.fn()} />);
    expect(screen.getByText('Completed task')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Completed task/ })).toBeNull();
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
      <span data-testid="task-statuses">{store.tasks.map((item) => item.status).join(', ') || 'none'}</span>
      <span data-testid="task-count">{store.tasks.length}</span>
      <button type="button" onClick={() => store.addTask({ title: 'Execute task', quadrant: 'important_urgent' })}>
        add
      </button>
      <button type="button" onClick={() => store.addTask({ title: 'Second task', quadrant: 'important_urgent' })}>
        add second
      </button>
      <button type="button" onClick={() => task && store.startTask(task.id)}>
        start
      </button>
      <button
        type="button"
        onClick={() => {
          if (task) {
            void store.startTask(task.id);
            void store.startTask(task.id);
          }
        }}
      >
        start twice
      </button>
      <button
        type="button"
        onClick={() => {
          const firstTask = store.tasks.find((item) => item.title === 'Execute task');
          if (firstTask) {
            void store.startTask(firstTask.id);
          }
        }}
      >
        start first
      </button>
      <button
        type="button"
        onClick={() => {
          const secondTask = store.tasks.find((item) => item.title === 'Second task');
          if (secondTask) {
            void store.startTask(secondTask.id);
          }
        }}
      >
        start second
      </button>
      <button type="button" onClick={() => task && store.completeTask(task.id)}>
        complete
      </button>
    </div>
  );
}

function task(id: string, title: string, status: Task['status']): Task {
  return {
    id,
    date: today,
    title,
    quadrant: 'important_urgent',
    status,
    isCarryover: false,
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-18T08:00:00.000Z',
  };
}

async function expectTaskStatus(repository: DailyRepository, taskId: string, status: Task['status']) {
  const tasks = await repository.listTasks(today);
  expect(tasks.find((task) => task.id === taskId)?.status).toBe(status);
}
