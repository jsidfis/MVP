import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryDailyRepository } from '../data/memoryDailyRepository';
import type { Task } from '../domain/types';
import { AppStoreProvider, useAppStore } from './appStore';

const today = '2026-06-18';
const templateId = '00000000-0000-4000-8000-000000000001';
const generatedTaskId = '00000000-0000-4000-8000-000000000002';

describe('AppStoreProvider task templates', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves selected tasks as a template and applies it to today on explicit action', async () => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce(templateId)
      .mockReturnValueOnce(generatedTaskId);
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-06-18T09:30:00.000Z');
    const repository = new MemoryDailyRepository();
    await repository.saveTask(task('task-1', 'Write plan', 30));

    render(
      <AppStoreProvider repository={repository} today={today}>
        <TemplateProbe />
      </AppStoreProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('loaded'));

    await userEvent.click(screen.getByRole('button', { name: 'save template' }));
    await waitFor(() => expect(screen.getByTestId('templates').textContent).toBe('Morning routine'));
    expect(await repository.listTaskTemplates()).toEqual([
      {
        id: templateId,
        name: 'Morning routine',
        createdAt: '2026-06-18T09:30:00.000Z',
        updatedAt: '2026-06-18T09:30:00.000Z',
        items: [
          {
            title: 'Write plan',
            quadrant: 'important_urgent',
            plannedDurationMinutes: 30,
          },
        ],
      },
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'apply template' }));
    await waitFor(() =>
      expect(screen.getByTestId('tasks').textContent).toBe(
        `task-1:Write plan, ${generatedTaskId}:Write plan`,
      ),
    );
  });
});

function TemplateProbe() {
  const store = useAppStore();
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  async function saveTemplate() {
    await store.saveTaskTemplate({ name: 'Morning routine', taskIds: ['task-1'] });
    setSelectedTemplateId(store.taskTemplates[0]?.id ?? templateId);
  }

  return (
    <div>
      <span data-testid="loading">{store.isLoading ? 'loading' : 'loaded'}</span>
      <span data-testid="tasks">{store.tasks.map((item) => `${item.id}:${item.title}`).join(', ')}</span>
      <span data-testid="templates">{store.taskTemplates.map((item) => item.name).join(', ')}</span>
      <button type="button" onClick={() => void saveTemplate()}>
        save template
      </button>
      <button type="button" onClick={() => void store.applyTaskTemplate(selectedTemplateId || templateId)}>
        apply template
      </button>
    </div>
  );
}

function task(id: string, title: string, plannedDurationMinutes?: number): Task {
  return {
    id,
    date: today,
    title,
    quadrant: 'important_urgent',
    status: 'not_started',
    isCarryover: false,
    plannedDurationMinutes,
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-18T08:00:00.000Z',
  };
}
