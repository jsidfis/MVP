import { describe, expect, it } from 'vitest';
import { generateRecurringTasks, type RecurringTaskRule } from './recurrenceRules';

describe('generateRecurringTasks', () => {
  it('creates a next-day task for daily recurrence', () => {
    const tasks = generateRecurringTasks({
      rules: [rule('rule-1', 'daily', '2026-06-18')],
      existingTasks: [],
      date: '2026-06-19',
      now: '2026-06-19T07:30:00.000Z',
      idFactory: () => 'task-1',
    });

    expect(tasks).toEqual([
      {
        id: 'task-1',
        date: '2026-06-19',
        title: 'Plan day',
        quadrant: 'important_urgent',
        status: 'not_started',
        isCarryover: false,
        plannedDurationMinutes: 30,
        recurrenceRuleId: 'rule-1',
        createdAt: '2026-06-19T07:30:00.000Z',
        updatedAt: '2026-06-19T07:30:00.000Z',
      },
    ]);
  });

  it('skips Saturday and Sunday for workday recurrence', () => {
    const recurringRule = rule('rule-1', 'workday', '2026-06-19');

    expect(
      generateRecurringTasks({
        rules: [recurringRule],
        existingTasks: [],
        date: '2026-06-20',
        now: '2026-06-20T07:30:00.000Z',
        idFactory: () => 'task-saturday',
      }),
    ).toEqual([]);
    expect(
      generateRecurringTasks({
        rules: [recurringRule],
        existingTasks: [],
        date: '2026-06-22',
        now: '2026-06-22T07:30:00.000Z',
        idFactory: () => 'task-monday',
      }).map((task) => task.id),
    ).toEqual(['task-monday']);
  });

  it('uses the same weekday for weekly recurrence', () => {
    const recurringRule = rule('rule-1', 'weekly', '2026-06-18');

    expect(
      generateRecurringTasks({
        rules: [recurringRule],
        existingTasks: [],
        date: '2026-06-25',
        now: '2026-06-25T07:30:00.000Z',
        idFactory: () => 'task-thursday',
      }).map((task) => task.id),
    ).toEqual(['task-thursday']);
    expect(
      generateRecurringTasks({
        rules: [recurringRule],
        existingTasks: [],
        date: '2026-06-26',
        now: '2026-06-26T07:30:00.000Z',
        idFactory: () => 'task-friday',
      }),
    ).toEqual([]);
  });

  it('does not generate duplicates for the same rule and date', () => {
    const tasks = generateRecurringTasks({
      rules: [rule('rule-1', 'daily', '2026-06-18')],
      existingTasks: [
        {
          id: 'existing-task',
          date: '2026-06-19',
          title: 'Plan day',
          quadrant: 'important_urgent',
          status: 'not_started',
          isCarryover: false,
          recurrenceRuleId: 'rule-1',
          createdAt: '2026-06-19T07:00:00.000Z',
          updatedAt: '2026-06-19T07:00:00.000Z',
        },
      ],
      date: '2026-06-19',
      now: '2026-06-19T07:30:00.000Z',
      idFactory: () => 'duplicate-task',
    });

    expect(tasks).toEqual([]);
  });
});

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
