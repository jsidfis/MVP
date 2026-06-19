import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../domain/types';
import { ReviewPanel } from './ReviewPanel';

describe('ReviewPanel', () => {
  it('collects four review answers and submits them', async () => {
    const onSubmit = vi.fn();
    render(<ReviewPanel tasks={[task('task-1')]} onSubmit={onSubmit} />);

    await userEvent.selectOptions(screen.getByLabelText('task-1 的处理方式'), 'postpone');
    await userEvent.selectOptions(screen.getByLabelText('task-1 的原因'), 'low_energy');
    await userEvent.type(screen.getByLabelText('今天完成了什么'), '完成方案');
    await userEvent.type(screen.getByLabelText('未完成的原因是什么'), '精力不足');
    await userEvent.type(screen.getByLabelText('今天状态或感受如何'), '状态一般');
    await userEvent.type(screen.getByLabelText('明天的重点是什么'), '继续实现');
    await userEvent.click(screen.getByRole('button', { name: '完成复盘' }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith({
      decisions: [
        {
          taskId: 'task-1',
          action: 'postpone',
          reasonTag: 'low_energy',
          targetDate: '2026-06-19',
        },
      ],
      review: {
        completedText: '完成方案',
        unfinishedText: '精力不足',
        feelingText: '状态一般',
        tomorrowFocusText: '继续实现',
      },
    });
  });
});

function task(title: string): Task {
  return {
    id: title,
    date: '2026-06-18',
    title,
    quadrant: 'important_urgent',
    status: 'not_started',
    isCarryover: false,
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-18T08:00:00.000Z',
  };
}
