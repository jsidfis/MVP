import { describe, expect, it } from 'vitest';
import { buildDailySummary } from './summaryRules';
import type { Task, TaskSession } from './types';

describe('summaryRules', () => {
  it('builds daily counts, highlights, duration, and status text', () => {
    const summary = buildDailySummary({
      tasks: [
        task('task-1', 'completed', 'important_urgent'),
        task('task-2', 'not_started', 'important_not_urgent'),
        task('task-3', 'completed', 'not_important_urgent'),
        task('task-4', 'postponed', 'important_not_urgent'),
        task('task-5', 'dropped', 'not_important_not_urgent'),
      ],
      sessions: [
        session('session-1', 25),
        session('session-2'),
        session('session-3', 5),
      ],
      statusScore: 4,
      statusNote: '  calm finish  ',
    });

    expect(summary).toEqual({
      completedCount: 2,
      totalCount: 5,
      highlightCompleted: 1,
      highlightTotal: 3,
      durationMinutes: 30,
      statusText: '4 / 5, calm finish',
      postponedCount: 1,
      droppedCount: 1,
    });
  });

  it('uses fallback status text when score is missing', () => {
    expect(
      buildDailySummary({
        tasks: [],
        sessions: [],
        statusNote: 'recorded without score',
      }).statusText,
    ).toBe('Not recorded');
  });

  it('omits a blank status note from status text', () => {
    expect(
      buildDailySummary({
        tasks: [],
        sessions: [],
        statusScore: 3,
        statusNote: '   ',
      }).statusText,
    ).toBe('3 / 5');
  });
});

function task(id: string, status: Task['status'], quadrant: Task['quadrant']): Task {
  return {
    id,
    date: '2026-06-17',
    title: `task-${id}`,
    quadrant,
    status,
    isCarryover: false,
    createdAt: '2026-06-17T08:00:00.000Z',
    updatedAt: '2026-06-17T08:00:00.000Z',
  };
}

function session(id: string, durationMinutes?: number): TaskSession {
  return {
    id,
    taskId: 'task-1',
    startedAt: '2026-06-17T08:00:00.000Z',
    isManual: false,
    durationMinutes,
  };
}
