import type { Task, TaskSession } from './types';

type ManualSessionCorrection = {
  startedAt: string;
  endedAt: string;
};
type OldTaskMode = 'pause' | 'background';

export function createSession(taskId: string, startedAt: string): TaskSession {
  return {
    id: crypto.randomUUID(),
    taskId,
    startedAt,
    isManual: false,
  };
}

export function completeSession(session: TaskSession, endedAt: string): TaskSession {
  return {
    ...session,
    endedAt,
    durationMinutes: minutesBetween(session.startedAt, endedAt),
  };
}

export function manualCorrectSession(
  session: TaskSession,
  correction: ManualSessionCorrection,
): TaskSession {
  return {
    ...session,
    startedAt: correction.startedAt,
    endedAt: correction.endedAt,
    isManual: true,
    durationMinutes: minutesBetween(correction.startedAt, correction.endedAt),
  };
}

export function switchPrimaryTask(input: {
  oldTask: Task;
  newTask: Task;
  oldTaskMode: OldTaskMode;
}): { oldTask: Task; newTask: Task } {
  const updatedAt = new Date().toISOString();

  return {
    oldTask: {
      ...input.oldTask,
      status: input.oldTaskMode === 'pause' ? 'paused' : 'active_background',
      updatedAt,
    },
    newTask: {
      ...input.newTask,
      status: 'active_primary',
      updatedAt,
    },
  };
}

function minutesBetween(startedAt: string, endedAt: string): number {
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    throw new Error('Invalid session time range');
  }

  return Math.round((end - start) / 60000);
}
