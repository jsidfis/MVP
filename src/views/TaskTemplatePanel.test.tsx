import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../domain/types';
import type { TaskTemplate } from '../data/taskTemplates';
import { TaskTemplatePanel } from './TaskTemplatePanel';

describe('TaskTemplatePanel', () => {
  it('saves selected tasks only after explicit user action', async () => {
    const onSaveTemplate = vi.fn();

    render(
      <TaskTemplatePanel
        tasks={[
          task('task-1', 'Write plan', 'important_urgent', 30),
          task('task-2', 'Read notes', 'important_not_urgent'),
        ]}
        templates={[]}
        onSaveTemplate={onSaveTemplate}
        onApplyTemplate={vi.fn()}
      />,
    );

    await userEvent.type(screen.getByLabelText('模板名称'), 'Morning routine');
    await userEvent.click(screen.getByRole('checkbox', { name: /Write plan/ }));

    expect(onSaveTemplate).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: '保存为模板' }));

    expect(onSaveTemplate).toHaveBeenCalledWith({
      name: 'Morning routine',
      taskIds: ['task-1'],
    });
  });

  it('applies a template only after explicit user action', async () => {
    const onApplyTemplate = vi.fn();

    render(
      <TaskTemplatePanel
        tasks={[]}
        templates={[template('template-1', 'Morning routine')]}
        onSaveTemplate={vi.fn()}
        onApplyTemplate={onApplyTemplate}
      />,
    );

    expect(onApplyTemplate).not.toHaveBeenCalled();

    const templateRow = screen.getByRole('listitem');
    await userEvent.click(within(templateRow).getByRole('button', { name: '应用 Morning routine' }));

    expect(onApplyTemplate).toHaveBeenCalledWith('template-1');
  });

  it('shows task quadrant and planned duration when available', () => {
    render(
      <TaskTemplatePanel
        tasks={[task('task-1', 'Write plan', 'important_urgent', 30)]}
        templates={[]}
        onSaveTemplate={vi.fn()}
        onApplyTemplate={vi.fn()}
      />,
    );

    const taskOption = screen.getByRole('checkbox', { name: /Write plan/ }).closest('label');

    expect(taskOption?.textContent).toContain('重要且紧急');
    expect(taskOption?.textContent).toContain('30 分钟');
  });
});

function task(
  id: string,
  title: string,
  quadrant: Task['quadrant'],
  plannedDurationMinutes?: number,
): Task {
  return {
    id,
    date: '2026-06-22',
    title,
    quadrant,
    status: 'not_started',
    isCarryover: false,
    plannedDurationMinutes,
    createdAt: '2026-06-22T07:30:00.000Z',
    updatedAt: '2026-06-22T07:30:00.000Z',
  };
}

function template(id: string, name: string): TaskTemplate {
  return {
    id,
    name,
    createdAt: '2026-06-22T08:00:00.000Z',
    updatedAt: '2026-06-22T08:00:00.000Z',
    items: [
      {
        title: 'Write plan',
        quadrant: 'important_urgent',
      },
    ],
  };
}
