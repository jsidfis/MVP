import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  completeSession,
  createSession,
  manualCorrectSession,
  switchPrimaryTask,
} from './timeRules';
import type { Task, TaskSession } from './types';

describe('timeRules', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('creates a session for a task with a generated id', () => {
    const randomUUID = vi.fn(() => 'session-1');
    vi.stubGlobal('crypto', { randomUUID });

    const session = createSession('task-1', '2026-06-17T08:00:00.000Z');

    expect(randomUUID).toHaveBeenCalledOnce();
    expect(session).toEqual({
      id: 'session-1',
      taskId: 'task-1',
      startedAt: '2026-06-17T08:00:00.000Z',
      isManual: false,
    });
  });

  it('completes a session with rounded duration minutes', () => {
    const completed = completeSession(
      session('session-1', 'task-1', '2026-06-17T08:00:00.000Z'),
      '2026-06-17T08:10:30.000Z',
    );

    expect(completed.endedAt).toBe('2026-06-17T08:10:30.000Z');
    expect(completed.durationMinutes).toBe(11);
  });

  it('manual correction changes times without a reason and recalculates duration', () => {
    const corrected = manualCorrectSession(
      session('session-1', 'task-1', '2026-06-17T08:00:00.000Z', {
        endedAt: '2026-06-17T08:20:00.000Z',
        durationMinutes: 20,
      }),
      {
        startedAt: '2026-06-17T08:05:00.000Z',
        endedAt: '2026-06-17T08:22:29.000Z',
      },
    );

    expect(corrected.startedAt).toBe('2026-06-17T08:05:00.000Z');
    expect(corrected.endedAt).toBe('2026-06-17T08:22:29.000Z');
    expect(corrected.durationMinutes).toBe(17);
    expect(corrected.isManual).toBe(true);
  });

  it('throws for invalid session time ranges', () => {
    expect(() =>
      completeSession(
        session('session-1', 'task-1', 'not-a-date'),
        '2026-06-17T08:10:00.000Z',
      ),
    ).toThrow('Invalid session time range');

    expect(() =>
      completeSession(
        session('session-1', 'task-1', '2026-06-17T08:10:00.000Z'),
        '2026-06-17T08:09:59.000Z',
      ),
    ).toThrow('Invalid session time range');
  });

  it('switches the primary task and pauses the old task', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T09:00:00.000Z'));

    const result = switchPrimaryTask({
      oldTask: task('old-task', 'active_primary', '2026-06-17T08:00:00.000Z'),
      newTask: task('new-task', 'not_started', '2026-06-17T08:10:00.000Z'),
      oldTaskMode: 'pause',
    });

    expect(result.oldTask.status).toBe('paused');
    expect(result.newTask.status).toBe('active_primary');
    expect(result.oldTask.updatedAt).toBe('2026-06-17T09:00:00.000Z');
    expect(result.newTask.updatedAt).toBe('2026-06-17T09:00:00.000Z');
  });

  it('switches the primary task and keeps the old task in the background', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-17T09:30:00.000Z'));

    const result = switchPrimaryTask({
      oldTask: task('old-task', 'active_primary', '2026-06-17T08:00:00.000Z'),
      newTask: task('new-task', 'paused', '2026-06-17T08:10:00.000Z'),
      oldTaskMode: 'background',
    });

    expect(result.oldTask.status).toBe('active_background');
    expect(result.newTask.status).toBe('active_primary');
    expect(result.oldTask.updatedAt).toBe('2026-06-17T09:30:00.000Z');
    expect(result.newTask.updatedAt).toBe('2026-06-17T09:30:00.000Z');
  });
});

function session(
  id: string,
  taskId: string,
  startedAt: string,
  overrides: Partial<Pick<TaskSession, 'endedAt' | 'durationMinutes' | 'isManual'>> = {},
): TaskSession {
  return {
    id,
    taskId,
    startedAt,
    endedAt: overrides.endedAt,
    isManual: overrides.isManual ?? false,
    durationMinutes: overrides.durationMinutes,
  };
}

function task(id: string, status: Task['status'], updatedAt: string): Task {
  return {
    id,
    date: '2026-06-17',
    title: `task-${id}`,
    quadrant: 'important_urgent',
    status,
    isCarryover: false,
    createdAt: '2026-06-17T07:00:00.000Z',
    updatedAt,
  };
}
