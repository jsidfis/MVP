import { describe, expect, it } from 'vitest';
import type { Task } from '../domain/types';
import { applyTaskTemplate, createTaskTemplate } from './taskTemplates';

describe('taskTemplates', () => {
  it('saves selected tasks as a reusable template', () => {
    const template = createTaskTemplate({
      id: 'template-1',
      name: ' Morning routine ',
      now: '2026-06-22T08:00:00.000Z',
      selectedTaskIds: ['task-2', 'task-1'],
      tasks: [
        task('task-1', 'Write plan', 'important_urgent', 25),
        task('task-2', 'Read notes', 'important_not_urgent'),
        task('task-3', 'Archive inbox', 'not_important_not_urgent', 10),
      ],
    });

    expect(template).toEqual({
      id: 'template-1',
      name: 'Morning routine',
      createdAt: '2026-06-22T08:00:00.000Z',
      updatedAt: '2026-06-22T08:00:00.000Z',
      items: [
        {
          title: 'Read notes',
          quadrant: 'important_not_urgent',
        },
        {
          title: 'Write plan',
          quadrant: 'important_urgent',
          plannedDurationMinutes: 25,
        },
      ],
    });
  });

  it('applies a template to a target date only when called explicitly', () => {
    const template = createTaskTemplate({
      id: 'template-1',
      name: 'Focus block',
      now: '2026-06-22T08:00:00.000Z',
      selectedTaskIds: ['task-1'],
      tasks: [task('task-1', 'Draft proposal', 'important_urgent', 45)],
    });

    const tasks = applyTaskTemplate({
      template,
      date: '2026-06-23',
      now: '2026-06-23T07:30:00.000Z',
      idFactory: (_item, index) => `new-task-${index + 1}`,
    });

    expect(tasks).toEqual([
      {
        id: 'new-task-1',
        date: '2026-06-23',
        title: 'Draft proposal',
        quadrant: 'important_urgent',
        status: 'not_started',
        isCarryover: false,
        plannedDurationMinutes: 45,
        createdAt: '2026-06-23T07:30:00.000Z',
        updatedAt: '2026-06-23T07:30:00.000Z',
      },
    ]);
  });

  it('rejects empty template names and empty selections', () => {
    expect(() =>
      createTaskTemplate({
        id: 'template-1',
        name: ' ',
        now: '2026-06-22T08:00:00.000Z',
        selectedTaskIds: ['task-1'],
        tasks: [task('task-1', 'Write plan', 'important_urgent')],
      }),
    ).toThrow('Template name is required');

    expect(() =>
      createTaskTemplate({
        id: 'template-1',
        name: 'Morning routine',
        now: '2026-06-22T08:00:00.000Z',
        selectedTaskIds: [],
        tasks: [task('task-1', 'Write plan', 'important_urgent')],
      }),
    ).toThrow('Template must include at least one task');
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
