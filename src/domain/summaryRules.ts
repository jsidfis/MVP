import type { Task, TaskSession } from './types';

export interface DailySummary {
  completedCount: number;
  totalCount: number;
  highlightCompleted: number;
  highlightTotal: number;
  durationMinutes: number;
  statusText: string;
  postponedCount: number;
  droppedCount: number;
}

export function buildDailySummary(input: {
  tasks: Task[];
  sessions: TaskSession[];
  statusScore?: number;
  statusNote?: string;
}): DailySummary {
  const highlightTasks = input.tasks.filter(
    (task) =>
      task.quadrant === 'important_urgent' || task.quadrant === 'important_not_urgent',
  );

  return {
    completedCount: input.tasks.filter((task) => task.status === 'completed').length,
    totalCount: input.tasks.length,
    highlightCompleted: highlightTasks.filter((task) => task.status === 'completed').length,
    highlightTotal: highlightTasks.length,
    durationMinutes: input.sessions.reduce(
      (total, session) => total + (session.durationMinutes ?? 0),
      0,
    ),
    statusText: buildStatusText(input.statusScore, input.statusNote),
    postponedCount: input.tasks.filter((task) => task.status === 'postponed').length,
    droppedCount: input.tasks.filter((task) => task.status === 'dropped').length,
  };
}

function buildStatusText(statusScore?: number, statusNote?: string): string {
  if (statusScore === undefined) {
    return 'Not recorded';
  }

  const note = statusNote?.trim();

  return note ? `${statusScore} / 5, ${note}` : `${statusScore} / 5`;
}
