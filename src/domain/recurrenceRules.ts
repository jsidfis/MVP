import type { Quadrant, Task } from './types';

export type RecurrenceFrequency = 'daily' | 'workday' | 'weekly';

export interface RecurringTaskRule {
  id: string;
  title: string;
  quadrant: Quadrant;
  plannedDurationMinutes?: number;
  frequency: RecurrenceFrequency;
  startDate: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function generateRecurringTasks(input: {
  rules: RecurringTaskRule[];
  existingTasks: Task[];
  date: string;
  now: string;
  idFactory: (rule: RecurringTaskRule) => string;
}): Task[] {
  return input.rules
    .filter((rule) => isRuleDueOnDate(rule, input.date))
    .filter(
      (rule) =>
        !input.existingTasks.some(
          (task) => task.date === input.date && task.recurrenceRuleId === rule.id,
        ),
    )
    .map((rule) => ({
      id: input.idFactory(rule),
      date: input.date,
      title: rule.title,
      quadrant: rule.quadrant,
      status: 'not_started',
      isCarryover: false,
      plannedDurationMinutes: rule.plannedDurationMinutes,
      recurrenceRuleId: rule.id,
      createdAt: input.now,
      updatedAt: input.now,
    }));
}

function isRuleDueOnDate(rule: RecurringTaskRule, date: string): boolean {
  if (!rule.enabled || date < rule.startDate) {
    return false;
  }

  if (rule.frequency === 'daily') {
    return true;
  }

  const day = getUtcDay(date);

  if (rule.frequency === 'workday') {
    return day >= 1 && day <= 5;
  }

  return day === getUtcDay(rule.startDate);
}

function getUtcDay(date: string): number {
  return new Date(`${date}T00:00:00.000Z`).getUTCDay();
}
