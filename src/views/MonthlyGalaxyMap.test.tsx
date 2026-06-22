import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { DayInsight } from '../domain/insightRules';
import type { Task } from '../domain/types';
import { MonthlyGalaxyMap } from './MonthlyGalaxyMap';

describe('MonthlyGalaxyMap', () => {
  it('renders 30 nodes for a 30-day month', () => {
    render(<MonthlyGalaxyMap year={2026} month={6} days={[]} tasks={[]} />);

    expect(screen.getAllByRole('button')).toHaveLength(30);
    expect(screen.getByRole('button', { name: '2026-06-30 无任务记录' })).toBeTruthy();
  });

  it('renders 31 nodes for a 31-day month', () => {
    render(<MonthlyGalaxyMap year={2026} month={7} days={[]} tasks={[]} />);

    expect(screen.getAllByRole('button')).toHaveLength(31);
    expect(screen.getByRole('button', { name: '2026-07-31 无任务记录' })).toBeTruthy();
  });

  it('shows that date tasks after clicking a node', async () => {
    render(
      <MonthlyGalaxyMap
        year={2026}
        month={6}
        days={[day('2026-06-16', 2, 1)]}
        tasks={[
          task('task-1', '2026-06-16', 'completed', '完成复盘'),
          task('task-2', '2026-06-16', 'not_started', '整理计划'),
        ]}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '2026-06-16 完成 1/2' }));

    expect(screen.getByText('2026-06-16')).toBeTruthy();
    expect(screen.getByText('完成复盘')).toBeTruthy();
    expect(screen.getByText('整理计划')).toBeTruthy();
  });

  it('marks days with completed tasks as active map nodes', () => {
    render(<MonthlyGalaxyMap year={2026} month={6} days={[day('2026-06-16', 2, 1)]} tasks={[]} />);

    expect(screen.getByRole('button', { name: '2026-06-16 完成 1/2' }).className).toContain(
      'monthly-galaxy-node-completed',
    );
  });
});

function day(date: string, totalTasks: number, completedTasks: number): DayInsight {
  return {
    date,
    totalTasks,
    completedTasks,
    completionRate: completedTasks / totalTasks,
    importantTasks: 0,
    completedImportantTasks: 0,
    importantCompletionRate: 0,
    postponedTasks: 0,
    actualDurationMinutes: 0,
  };
}

function task(id: string, date: string, status: Task['status'], title: string): Task {
  return {
    id,
    date,
    title,
    quadrant: 'important_urgent',
    status,
    isCarryover: false,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  };
}
