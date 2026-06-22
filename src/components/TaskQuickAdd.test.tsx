import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskQuickAdd } from './TaskQuickAdd';

describe('TaskQuickAdd', () => {
  it('submits an optional recurrence frequency', async () => {
    const onAdd = vi.fn();
    render(<TaskQuickAdd onAdd={onAdd} />);

    await userEvent.type(screen.getByLabelText('任务标题'), 'Plan day');
    await userEvent.selectOptions(screen.getByLabelText('重复'), 'workday');
    await userEvent.click(screen.getByRole('button', { name: '添加任务' }));

    expect(onAdd).toHaveBeenCalledWith({
      title: 'Plan day',
      quadrant: 'important_urgent',
      recurrenceFrequency: 'workday',
    });
  });
});
