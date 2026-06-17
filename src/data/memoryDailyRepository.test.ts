import { describe, expect, it } from 'vitest';
import { MemoryDailyRepository } from './memoryDailyRepository';
import type { Task, TaskSession, UserSettings } from '../domain/types';

describe('MemoryDailyRepository', () => {
  it('creates a default daily file on first read', async () => {
    const repository = new MemoryDailyRepository();

    await expect(repository.getDailyFile('2026-06-17')).resolves.toEqual({
      date: '2026-06-17',
      stage: 'plan',
      goal: '',
    });
  });

  it('saves and reloads a daily file by date', async () => {
    const repository = new MemoryDailyRepository();
    const file = {
      date: '2026-06-17',
      stage: 'execute' as const,
      goal: 'Ship repository contract',
      statusScore: 4,
      statusNote: 'Focused',
    };

    await repository.saveDailyFile(file);

    await expect(repository.getDailyFile('2026-06-17')).resolves.toEqual(file);
  });

  it('saves, lists, and upserts tasks by date', async () => {
    const repository = new MemoryDailyRepository();
    const first = task('task-1', '2026-06-17', 'not_started');
    const second = task('task-2', '2026-06-17', 'active_primary');
    const otherDate = task('task-3', '2026-06-18', 'not_started');
    const updatedFirst = {
      ...first,
      title: 'Updated task',
      status: 'completed' as const,
      updatedAt: '2026-06-17T11:00:00.000Z',
    };

    await repository.saveTask(first);
    await repository.saveTask(second);
    await repository.saveTask(otherDate);
    await repository.saveTask(updatedFirst);

    const tasks = await repository.listTasks('2026-06-17');

    expect(tasks).toHaveLength(2);
    expect(tasks).toContainEqual(updatedFirst);
    expect(tasks).toContainEqual(second);
    expect(tasks).not.toContainEqual(first);
  });

  it('saves, lists, and upserts sessions by task id', async () => {
    const repository = new MemoryDailyRepository();
    const first = session('session-1', 'task-1');
    const second = session('session-2', 'task-1');
    const otherTask = session('session-3', 'task-2');
    const updatedFirst = {
      ...first,
      endedAt: '2026-06-17T09:30:00.000Z',
      durationMinutes: 30,
    };

    await repository.saveSession(first);
    await repository.saveSession(second);
    await repository.saveSession(otherTask);
    await repository.saveSession(updatedFirst);

    const sessions = await repository.listSessions('task-1');

    expect(sessions).toHaveLength(2);
    expect(sessions).toContainEqual(updatedFirst);
    expect(sessions).toContainEqual(second);
    expect(sessions).not.toContainEqual(first);
  });

  it('lists only postponed carryover candidates from previous dates', async () => {
    const repository = new MemoryDailyRepository();
    const previousPostponed = task('task-1', '2026-06-16', 'postponed');
    const olderPostponed = task('task-2', '2026-06-15', 'postponed');
    const todayPostponed = task('task-3', '2026-06-17', 'postponed');
    const previousCompleted = task('task-4', '2026-06-16', 'completed');
    const futurePostponed = task('task-5', '2026-06-18', 'postponed');

    await repository.saveTask(previousPostponed);
    await repository.saveTask(olderPostponed);
    await repository.saveTask(todayPostponed);
    await repository.saveTask(previousCompleted);
    await repository.saveTask(futurePostponed);

    const candidates = await repository.listCarryoverCandidates('2026-06-17');

    expect(candidates).toHaveLength(2);
    expect(candidates).toContainEqual(previousPostponed);
    expect(candidates).toContainEqual(olderPostponed);
  });

  it('returns default settings and saves updates', async () => {
    const repository = new MemoryDailyRepository();
    const settings: UserSettings = {
      homeView: 'galaxy',
      notificationsEnabled: true,
      morningReminder: '08:30',
      eveningReminder: '21:30',
    };

    await expect(repository.getSettings()).resolves.toEqual({
      homeView: 'folder',
      notificationsEnabled: false,
    });

    await repository.saveSettings(settings);

    await expect(repository.getSettings()).resolves.toEqual(settings);
  });
});

function task(id: string, date: string, status: Task['status']): Task {
  return {
    id,
    date,
    title: `Task ${id}`,
    quadrant: 'important_urgent',
    status,
    isCarryover: false,
    postponeReasonTag: status === 'postponed' ? 'time_estimate_error' : undefined,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  };
}

function session(id: string, taskId: string): TaskSession {
  return {
    id,
    taskId,
    startedAt: '2026-06-17T09:00:00.000Z',
    isManual: true,
  };
}
