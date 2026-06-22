import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryDailyRepository } from '../data/memoryDailyRepository';
import type { RecurringTaskRule } from '../domain/recurrenceRules';
import type { Task } from '../domain/types';
import { AppStoreProvider, useAppStore } from './appStore';

const today = '2026-06-19';
const generatedTaskId = '00000000-0000-4000-8000-000000000003';

describe('AppStoreProvider recurrence', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates due recurring tasks when the date is opened', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(generatedTaskId);
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-06-19T07:30:00.000Z');
    const repository = new MemoryDailyRepository();
    await repository.saveRecurringTaskRule(rule('rule-1', 'daily', '2026-06-18'));

    renderStore(repository);

    await waitFor(() => expect(screen.getByTestId('tasks').textContent).toBe('generated:Plan day'));
    await expect(repository.listTasks(today)).resolves.toEqual([
      expect.objectContaining({
        id: generatedTaskId,
        title: 'Plan day',
        recurrenceRuleId: 'rule-1',
      }),
    ]);
  });

  it('does not generate a duplicate recurring task for the same date', async () => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(generatedTaskId);
    const repository = new MemoryDailyRepository();
    await repository.saveRecurringTaskRule(rule('rule-1', 'daily', '2026-06-18'));
    await repository.saveTask(task('existing-task', 'rule-1'));

    renderStore(repository);

    await waitFor(() => expect(screen.getByTestId('tasks').textContent).toBe('existing:Plan day'));
    await expect(repository.listTasks(today)).resolves.toHaveLength(1);
  });
});

function renderStore(repository: MemoryDailyRepository) {
  return render(
    <AppStoreProvider repository={repository} today={today}>
      <RecurrenceProbe />
    </AppStoreProvider>,
  );
}

function RecurrenceProbe() {
  const store = useAppStore();

  return (
    <span data-testid="tasks">
      {store.tasks.map((task) => `${task.id === generatedTaskId ? 'generated' : 'existing'}:${task.title}`).join(', ')}
    </span>
  );
}

function rule(
  id: string,
  frequency: RecurringTaskRule['frequency'],
  startDate: string,
): RecurringTaskRule {
  return {
    id,
    title: 'Plan day',
    quadrant: 'important_urgent',
    plannedDurationMinutes: 30,
    frequency,
    startDate,
    enabled: true,
    createdAt: `${startDate}T07:00:00.000Z`,
    updatedAt: `${startDate}T07:00:00.000Z`,
  };
}

function task(id: string, recurrenceRuleId: string): Task {
  return {
    id,
    date: today,
    title: 'Plan day',
    quadrant: 'important_urgent',
    status: 'not_started',
    isCarryover: false,
    recurrenceRuleId,
    createdAt: '2026-06-19T07:00:00.000Z',
    updatedAt: '2026-06-19T07:00:00.000Z',
  };
}
