import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildTask,
  confirmCarryoverTask,
  orderTasksForFloor,
  QUADRANT_FLOORS,
} from './taskRules';
import type { Task } from './types';

describe('taskRules', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('buildTask trims the title, defaults the date, and sets creation timestamps', () => {
    const task = buildTask({
      title: '  Write plan  ',
      quadrant: 'important_urgent',
      now: '2026-06-16T08:30:00.000Z',
    });

    expect(task.title).toBe('Write plan');
    expect(task.date).toBe('2026-06-16');
    expect(task.status).toBe('not_started');
    expect(task.isCarryover).toBe(false);
    expect(task.createdAt).toBe('2026-06-16T08:30:00.000Z');
    expect(task.updatedAt).toBe('2026-06-16T08:30:00.000Z');
  });

  it('buildTask rejects an empty title', () => {
    expect(() =>
      buildTask({
        title: '   ',
        quadrant: 'important_urgent',
        now: '2026-06-16T08:30:00.000Z',
      }),
    ).toThrow('Task title is required');
  });

  it('buildTask uses provided id and date when present', () => {
    const task = buildTask({
      id: 'task-1',
      title: 'Write plan',
      quadrant: 'important_not_urgent',
      date: '2026-06-20',
      now: '2026-06-16T08:30:00.000Z',
    });

    expect(task.id).toBe('task-1');
    expect(task.date).toBe('2026-06-20');
  });

  it('maps quadrants to folder floors', () => {
    expect(QUADRANT_FLOORS).toEqual({
      important_urgent: 4,
      important_not_urgent: 3,
      not_important_urgent: 2,
      not_important_not_urgent: 1,
    });
  });

  it('orders tasks by status group and createdAt without mutating the input', () => {
    const tasks: Task[] = [
      task('dropped', 'dropped', '2026-06-15', '2026-06-16T07:00:00.000Z', '2026-06-16T07:00:00.000Z'),
      task('paused', 'paused', '2026-06-15', '2026-06-16T05:00:00.000Z', '2026-06-16T05:00:00.000Z'),
      task('background', 'active_background', '2026-06-15', '2026-06-16T06:00:00.000Z', '2026-06-16T06:00:00.000Z'),
      task('primary-late', 'active_primary', '2026-06-15', '2026-06-16T09:00:00.000Z', '2026-06-16T09:00:00.000Z'),
      task('completed', 'completed', '2026-06-15', '2026-06-16T07:00:00.000Z', '2026-06-16T07:00:00.000Z'),
      task('postponed', 'postponed', '2026-06-15', '2026-06-16T07:00:00.000Z', '2026-06-16T07:00:00.000Z'),
      task('not-started', 'not_started', '2026-06-15', '2026-06-16T07:00:00.000Z', '2026-06-16T07:00:00.000Z'),
    ];
    const originalOrder = tasks.map((item) => item.id);

    const ordered = orderTasksForFloor(tasks);

    expect(ordered).not.toBe(tasks);
    expect(tasks.map((item) => item.id)).toEqual(originalOrder);
    expect(ordered.map((item) => item.id)).toEqual([
      'paused',
      'background',
      'primary-late',
      'not-started',
      'completed',
      'postponed',
      'dropped',
    ]);
  });

  it('confirms a carryover task into today and keeps the original carryover source', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-16T12:34:56.000Z'));

    const confirmed = confirmCarryoverTask(
      task('carry', 'postponed', '2026-06-15', '2026-06-15T08:00:00.000Z', '2026-06-15T08:00:00.000Z', {
        carryoverFromDate: '2026-06-14',
      }),
      '2026-06-16',
    );

    expect(confirmed.date).toBe('2026-06-16');
    expect(confirmed.status).toBe('not_started');
    expect(confirmed.isCarryover).toBe(true);
    expect(confirmed.carryoverFromDate).toBe('2026-06-14');
    expect(confirmed.updatedAt).toBe('2026-06-16T12:34:56.000Z');
  });

  it('confirms a carryover task into today using the original task date when needed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-16T12:34:56.000Z'));

    const confirmed = confirmCarryoverTask(
      task('carry', 'postponed', '2026-06-13', '2026-06-15T08:00:00.000Z', '2026-06-15T08:00:00.000Z'),
      '2026-06-16',
    );

    expect(confirmed.carryoverFromDate).toBe('2026-06-13');
  });
});

function task(
  id: string,
  status: Task['status'],
  date: string,
  updatedAt: string,
  createdAt = '2026-06-15T07:00:00.000Z',
  overrides: Partial<Pick<Task, 'carryoverFromDate' | 'isCarryover'>> = {},
): Task {
  return {
    id,
    date,
    title: `task-${id}`,
    quadrant: 'important_urgent',
    status,
    isCarryover: overrides.isCarryover ?? status === 'postponed',
    carryoverFromDate: overrides.carryoverFromDate,
    postponeReasonTag: status === 'postponed' ? 'time_estimate_error' : undefined,
    postponeReasonNote: undefined,
    createdAt,
    updatedAt,
  };
}
