import type { Quadrant, Task, TaskStatus } from './types';

export const QUADRANT_FLOORS: Record<Quadrant, 1 | 2 | 3 | 4> = {
  important_urgent: 4,
  important_not_urgent: 3,
  not_important_urgent: 2,
  not_important_not_urgent: 1,
};

const STATUS_ORDER: Record<TaskStatus, number> = {
  active_primary: 0,
  active_background: 0,
  paused: 0,
  not_started: 1,
  completed: 2,
  postponed: 3,
  dropped: 4,
};

export function buildTask(input: {
  title: string;
  quadrant: Quadrant;
  now: string;
  date?: string;
  id?: string;
}): Task {
  const title = input.title.trim();
  if (title.length === 0) {
    throw new Error('Task title is required');
  }

  return {
    id: input.id ?? crypto.randomUUID(),
    date: input.date ?? input.now.slice(0, 10),
    title,
    quadrant: input.quadrant,
    status: 'not_started',
    isCarryover: false,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function orderTasksForFloor(tasks: Task[]): Task[] {
  return [...tasks].sort((left, right) => {
    const statusDelta = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];
    if (statusDelta !== 0) {
      return statusDelta;
    }

    return left.createdAt.localeCompare(right.createdAt);
  });
}

export function confirmCarryoverTask(task: Task, today: string): Task {
  return {
    ...task,
    date: today,
    status: 'not_started',
    isCarryover: true,
    carryoverFromDate: task.carryoverFromDate ?? task.date,
    updatedAt: new Date().toISOString(),
  };
}
