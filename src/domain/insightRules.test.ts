import { describe, expect, it } from 'vitest';
import { calculateMonthlyInsights } from './insightRules';
import type { Quadrant, Task, TaskSession } from './types';

describe('calculateMonthlyInsights', () => {
  it('returns an empty trend for a month without tasks', () => {
    const insights = calculateMonthlyInsights({
      year: 2026,
      month: 6,
      tasks: [task('may-task', '2026-05-31', 'completed')],
      sessions: [],
    });

    expect(insights.days).toEqual([]);
    expect(insights.totalTasks).toBe(0);
    expect(insights.completedTasks).toBe(0);
    expect(insights.completionRate).toBe(0);
    expect(insights.actualDurationMinutes).toBe(0);
  });

  it('calculates completion rate for a partially completed day', () => {
    const insights = calculateMonthlyInsights({
      year: 2026,
      month: 6,
      tasks: [
        task('completed', '2026-06-16', 'completed'),
        task('open', '2026-06-16', 'not_started'),
      ],
      sessions: [],
    });

    expect(insights.days).toEqual([
      expect.objectContaining({
        date: '2026-06-16',
        totalTasks: 2,
        completedTasks: 1,
        completionRate: 0.5,
      }),
    ]);
    expect(insights.completionRate).toBe(0.5);
  });

  it('separates important task completion from all-task completion', () => {
    const insights = calculateMonthlyInsights({
      year: 2026,
      month: 6,
      tasks: [
        task('important-done', '2026-06-17', 'completed', 'important_not_urgent'),
        task('important-open', '2026-06-17', 'not_started', 'important_urgent'),
        task('regular-done', '2026-06-17', 'completed', 'not_important_urgent'),
      ],
      sessions: [],
    });

    expect(insights.completedTasks).toBe(2);
    expect(insights.totalTasks).toBe(3);
    expect(insights.completionRate).toBeCloseTo(2 / 3);
    expect(insights.completedImportantTasks).toBe(1);
    expect(insights.importantTasks).toBe(2);
    expect(insights.importantCompletionRate).toBe(0.5);
    expect(insights.days[0]).toMatchObject({
      importantTasks: 2,
      completedImportantTasks: 1,
      importantCompletionRate: 0.5,
    });
  });

  it('counts postponed reasons by tag and note presence', () => {
    const insights = calculateMonthlyInsights({
      year: 2026,
      month: 6,
      tasks: [
        task('estimate-note', '2026-06-18', 'postponed', 'important_urgent', {
          postponeReasonTag: 'time_estimate_error',
          postponeReasonNote: '会议延长',
        }),
        task('estimate-empty-note', '2026-06-18', 'postponed', 'important_urgent', {
          postponeReasonTag: 'time_estimate_error',
          postponeReasonNote: '   ',
        }),
        task('energy-note', '2026-06-19', 'postponed', 'important_not_urgent', {
          postponeReasonTag: 'low_energy',
          postponeReasonNote: '下午状态不好',
        }),
      ],
      sessions: [],
    });

    expect(insights.postponedTasks).toBe(3);
    expect(insights.postponedReasons).toEqual([
      { tag: 'time_estimate_error', count: 2, withNote: 1 },
      { tag: 'low_energy', count: 1, withNote: 1 },
    ]);
  });

  it('counts task distribution by quadrant', () => {
    const insights = calculateMonthlyInsights({
      year: 2026,
      month: 6,
      tasks: [
        task('urgent-important', '2026-06-20', 'completed', 'important_urgent'),
        task('planned-important', '2026-06-20', 'not_started', 'important_not_urgent'),
        task('urgent-regular', '2026-06-20', 'completed', 'not_important_urgent'),
        task('optional', '2026-06-20', 'not_started', 'not_important_not_urgent'),
      ],
      sessions: [],
    });

    expect(insights.quadrants).toEqual([
      { quadrant: 'important_urgent', totalTasks: 1, completedTasks: 1, completionRate: 1 },
      { quadrant: 'important_not_urgent', totalTasks: 1, completedTasks: 0, completionRate: 0 },
      { quadrant: 'not_important_urgent', totalTasks: 1, completedTasks: 1, completionRate: 1 },
      { quadrant: 'not_important_not_urgent', totalTasks: 1, completedTasks: 0, completionRate: 0 },
    ]);
  });

  it('aggregates actual duration by task date', () => {
    const insights = calculateMonthlyInsights({
      year: 2026,
      month: 6,
      tasks: [
        task('task-1', '2026-06-20', 'completed'),
        task('task-2', '2026-06-20', 'completed'),
        task('task-3', '2026-06-21', 'completed'),
        task('outside', '2026-07-01', 'completed'),
      ],
      sessions: [
        session('session-1', 'task-1', 25),
        session('session-2', 'task-2', 15),
        session('session-3', 'task-3', 40),
        session('session-open', 'task-3'),
        session('session-outside', 'outside', 99),
      ],
    });

    expect(insights.actualDurationMinutes).toBe(80);
    expect(insights.days).toEqual([
      expect.objectContaining({ date: '2026-06-20', actualDurationMinutes: 40 }),
      expect.objectContaining({ date: '2026-06-21', actualDurationMinutes: 40 }),
    ]);
  });
});

function task(
  id: string,
  date: string,
  status: Task['status'],
  quadrant: Quadrant = 'important_urgent',
  overrides: Partial<Pick<Task, 'postponeReasonTag' | 'postponeReasonNote'>> = {},
): Task {
  return {
    id,
    date,
    title: `task-${id}`,
    quadrant,
    status,
    isCarryover: false,
    postponeReasonTag: overrides.postponeReasonTag,
    postponeReasonNote: overrides.postponeReasonNote,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  };
}

function session(id: string, taskId: string, durationMinutes?: number): TaskSession {
  return {
    id,
    taskId,
    startedAt: '2026-06-20T08:00:00.000Z',
    endedAt: durationMinutes === undefined ? undefined : '2026-06-20T08:30:00.000Z',
    isManual: false,
    durationMinutes,
  };
}
