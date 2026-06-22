import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { MonthlyInsights } from '../domain/insightRules';
import { MonthlyOverview } from './MonthlyOverview';

describe('MonthlyOverview', () => {
  it('renders one node per day for June 2026', () => {
    render(<MonthlyOverview year={2026} month={6} recordedDates={['2026-06-16']} />);

    expect(screen.getAllByRole('button')).toHaveLength(30);
    expect(screen.getByRole('button', { name: '2026-06-16 有记录' })).toBeTruthy();
  });

  it('shows neutral monthly insight sections', () => {
    render(
      <MonthlyOverview
        year={2026}
        month={6}
        recordedDates={['2026-06-16', '2026-06-17']}
        insights={monthlyInsights}
      />,
    );

    expect(screen.getByText('完成趋势')).toBeTruthy();
    expect(screen.getByText('本月完成率')).toBeTruthy();
    expect(screen.getByText('67%')).toBeTruthy();
    expect(screen.getByText('重要任务')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
    expect(screen.getByText('四象限分布')).toBeTruthy();
    expect(screen.getByText('重要且紧急')).toBeTruthy();
    expect(screen.getByText('顺延原因')).toBeTruthy();
    expect(screen.getByText('时间估计偏差')).toBeTruthy();
  });

  it('shows a neutral empty state when the month has no task data', () => {
    render(
      <MonthlyOverview
        year={2026}
        month={6}
        recordedDates={[]}
        insights={{ ...monthlyInsights, days: [], totalTasks: 0 }}
      />,
    );

    expect(screen.getByText('这个月还没有任务记录')).toBeTruthy();
  });
});

const monthlyInsights: MonthlyInsights = {
  totalTasks: 3,
  completedTasks: 2,
  completionRate: 2 / 3,
  importantTasks: 2,
  completedImportantTasks: 1,
  importantCompletionRate: 0.5,
  postponedTasks: 1,
  actualDurationMinutes: 95,
  days: [
    {
      date: '2026-06-16',
      totalTasks: 1,
      completedTasks: 1,
      completionRate: 1,
      importantTasks: 1,
      completedImportantTasks: 1,
      importantCompletionRate: 1,
      postponedTasks: 0,
      actualDurationMinutes: 35,
    },
    {
      date: '2026-06-17',
      totalTasks: 2,
      completedTasks: 1,
      completionRate: 0.5,
      importantTasks: 1,
      completedImportantTasks: 0,
      importantCompletionRate: 0,
      postponedTasks: 1,
      actualDurationMinutes: 60,
    },
  ],
  quadrants: [
    { quadrant: 'important_urgent', totalTasks: 1, completedTasks: 1, completionRate: 1 },
    { quadrant: 'important_not_urgent', totalTasks: 1, completedTasks: 0, completionRate: 0 },
    { quadrant: 'not_important_urgent', totalTasks: 1, completedTasks: 1, completionRate: 1 },
    { quadrant: 'not_important_not_urgent', totalTasks: 0, completedTasks: 0, completionRate: 0 },
  ],
  postponedReasons: [{ tag: 'time_estimate_error', count: 1, withNote: 1 }],
};
