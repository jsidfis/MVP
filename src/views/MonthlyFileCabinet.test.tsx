import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { DayInsight } from '../domain/insightRules';
import type { Task } from '../domain/types';
import { MonthlyFileCabinet } from './MonthlyFileCabinet';

describe('MonthlyFileCabinet', () => {
  it('renders the correct day count for a month', () => {
    render(<MonthlyFileCabinet year={2026} month={6} recordedDates={[]} days={[]} tasks={[]} />);

    expect(screen.getAllByRole('button')).toHaveLength(30);
    expect(screen.getByRole('button', { name: '2026-06-30 无任务记录' })).toBeTruthy();
  });

  it('uses a completed visual state for days with completed tasks', () => {
    render(
      <MonthlyFileCabinet
        year={2026}
        month={6}
        recordedDates={['2026-06-16']}
        days={[day('2026-06-16', 2, 1)]}
        tasks={[]}
      />,
    );

    expect(screen.getByRole('button', { name: '2026-06-16 完成 1/2' }).className).toContain(
      'monthly-file-day-completed',
    );
  });

  it('opens the day task list after clicking a day drawer', async () => {
    render(
      <MonthlyFileCabinet
        year={2026}
        month={6}
        recordedDates={['2026-06-16']}
        days={[day('2026-06-16', 2, 1)]}
        tasks={[
          task('task-1', '2026-06-16', 'completed', '完成复盘'),
          task('task-2', '2026-06-16', 'not_started', '整理计划'),
        ]}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '2026-06-16 完成 1/2' }));

    expect(screen.getByText('2026-06-16 文件')).toBeTruthy();
    expect(screen.getByText('完成复盘')).toBeTruthy();
    expect(screen.getByText('整理计划')).toBeTruthy();
  });

  it('keeps missing day data readable', async () => {
    render(<MonthlyFileCabinet year={2026} month={6} recordedDates={[]} days={[]} tasks={[]} />);

    await userEvent.click(screen.getByRole('button', { name: '2026-06-01 无任务记录' }));

    expect(screen.getByText('这一天还没有任务文件。')).toBeTruthy();
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
