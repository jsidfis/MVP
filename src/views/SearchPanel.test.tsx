import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../domain/types';
import { SearchPanel } from './SearchPanel';

describe('SearchPanel', () => {
  it('submits local search filters and displays results', async () => {
    const onSearch = vi.fn().mockResolvedValue([task('task-1', 'Write plan')]);
    render(<SearchPanel onSearch={onSearch} />);

    await userEvent.type(screen.getByLabelText('关键词'), 'plan');
    await userEvent.type(screen.getByLabelText('开始日期'), '2026-06-01');
    await userEvent.type(screen.getByLabelText('结束日期'), '2026-06-30');
    await userEvent.selectOptions(screen.getByLabelText('筛选四象限'), 'important_urgent');
    await userEvent.selectOptions(screen.getByLabelText('状态'), 'completed');
    await userEvent.selectOptions(screen.getByLabelText('顺延原因'), 'low_energy');
    await userEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(onSearch).toHaveBeenCalledWith({
      keyword: 'plan',
      dateFrom: '2026-06-01',
      dateTo: '2026-06-30',
      quadrant: 'important_urgent',
      status: 'completed',
      reasonTag: 'low_energy',
    });
    expect(await screen.findByText('Write plan')).toBeTruthy();
    expect(screen.getByText('2026-06-18')).toBeTruthy();
  });

  it('shows a neutral empty state after an empty search', async () => {
    const onSearch = vi.fn().mockResolvedValue([]);
    render(<SearchPanel onSearch={onSearch} />);

    await userEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(await screen.findByText('没有匹配的本地记录。')).toBeTruthy();
  });
});

function task(id: string, title: string): Task {
  return {
    id,
    date: '2026-06-18',
    title,
    quadrant: 'important_urgent',
    status: 'completed',
    isCarryover: false,
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-18T09:00:00.000Z',
  };
}
