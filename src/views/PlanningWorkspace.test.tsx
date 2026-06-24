import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../domain/types';
import { PlanningWorkspace } from './PlanningWorkspace';

describe('PlanningWorkspace', () => {
  it('creates a task through title, quadrant, and recurrence steps', async () => {
    const onAddTask = vi.fn().mockResolvedValue(undefined);

    render(
      <PlanningWorkspace
        tasks={[]}
        carryoverCandidates={[]}
        templates={[]}
        onAddTask={onAddTask}
        onConfirmCarryover={vi.fn()}
        onHideCarryover={vi.fn()}
        onSaveTemplate={vi.fn()}
        onApplyTemplate={vi.fn()}
      />,
    );

    await userEvent.type(screen.getByLabelText('任务标题'), '整理项目计划');
    await userEvent.click(screen.getByRole('button', { name: '下一步：选择四象限' }));
    await userEvent.click(screen.getByRole('button', { name: '重要不紧急 安排推进' }));
    await userEvent.click(screen.getByRole('button', { name: '下一步：重复规则' }));
    await userEvent.click(screen.getByRole('button', { name: '每周' }));
    await userEvent.click(screen.getByRole('button', { name: '下一步：确认' }));
    await userEvent.click(screen.getByRole('button', { name: '确认添加任务' }));

    expect(onAddTask).toHaveBeenCalledWith({
      title: '整理项目计划',
      quadrant: 'important_not_urgent',
      recurrenceFrequency: 'weekly',
    });
    expect(screen.getByText('今天还没有安排任务。')).toBeTruthy();
  });

  it('shows one actionable quadrant choice and synchronizes the selected result', async () => {
    render(
      <PlanningWorkspace
        tasks={[task()]}
        carryoverCandidates={[]}
        templates={[]}
        onAddTask={vi.fn()}
        onConfirmCarryover={vi.fn()}
        onHideCarryover={vi.fn()}
        onSaveTemplate={vi.fn()}
        onApplyTemplate={vi.fn()}
      />,
    );

    await userEvent.type(screen.getByLabelText('任务标题'), '整理项目计划');
    await userEvent.click(screen.getByRole('button', { name: '下一步：选择四象限' }));
    await userEvent.click(screen.getByRole('button', { name: /重要且紧急 优先处理/ }));

    expect(screen.getByText('四象限 · 重要且紧急')).toBeTruthy();
    expect(screen.queryByRole('combobox', { name: '四象限' })).toBeNull();
    expect(screen.getByText('顺延')).toBeTruthy();
  });
});

function task(): Task {
  return {
    id: 'task-1',
    date: '2026-06-24',
    title: '昨天顺延的任务',
    quadrant: 'important_urgent',
    status: 'not_started',
    isCarryover: true,
    carryoverFromDate: '2026-06-23',
    createdAt: '2026-06-24T08:00:00.000Z',
    updatedAt: '2026-06-24T08:00:00.000Z',
  };
}
