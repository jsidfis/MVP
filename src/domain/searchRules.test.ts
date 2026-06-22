import { describe, expect, it } from 'vitest';
import type { Task } from './types';
import { searchTasks } from './searchRules';

describe('searchTasks', () => {
  it('matches task titles by case-insensitive keyword', () => {
    expect(searchTasks([task('task-1', 'Write Plan')], { keyword: 'plan' })).toEqual([
      task('task-1', 'Write Plan'),
    ]);
    expect(searchTasks([task('task-1', 'Write Plan')], { keyword: 'archive' })).toEqual([]);
  });

  it('filters by date range', () => {
    const tasks = [
      task('task-1', 'Before', '2026-06-17'),
      task('task-2', 'Inside', '2026-06-18'),
      task('task-3', 'After', '2026-06-20'),
    ];

    expect(searchTasks(tasks, { dateFrom: '2026-06-18', dateTo: '2026-06-19' })).toEqual([
      task('task-2', 'Inside', '2026-06-18'),
    ]);
  });

  it('filters by quadrant, status, and postponed reason', () => {
    const matched = {
      ...task('task-1', 'Matched'),
      quadrant: 'important_not_urgent' as const,
      status: 'postponed' as const,
      postponeReasonTag: 'low_energy' as const,
    };
    const other = task('task-2', 'Other');

    expect(
      searchTasks([matched, other], {
        quadrant: 'important_not_urgent',
        status: 'postponed',
        reasonTag: 'low_energy',
      }),
    ).toEqual([matched]);
  });

  it('orders results by recent date first, then creation time', () => {
    const older = task('task-1', 'Older', '2026-06-18', '2026-06-18T08:00:00.000Z');
    const newerMorning = task('task-2', 'Newer morning', '2026-06-19', '2026-06-19T08:00:00.000Z');
    const newerEvening = task('task-3', 'Newer evening', '2026-06-19', '2026-06-19T18:00:00.000Z');

    expect(searchTasks([older, newerMorning, newerEvening], {})).toEqual([
      newerEvening,
      newerMorning,
      older,
    ]);
  });
});

function task(
  id: string,
  title: string,
  date = '2026-06-18',
  createdAt = `${date}T08:00:00.000Z`,
): Task {
  return {
    id,
    date,
    title,
    quadrant: 'important_urgent',
    status: 'not_started',
    isCarryover: false,
    createdAt,
    updatedAt: createdAt,
  };
}
