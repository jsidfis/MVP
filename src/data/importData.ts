import type {
  DailyFile,
  DailyReview,
  HomeView,
  Quadrant,
  ReasonTag,
  ReviewDecision,
  Stage,
  Task,
  TaskSession,
  TaskStatus,
  UserSettings,
} from '../domain/types';
import type { DailyRepository } from './dailyRepository';
import type { ExportedDailyPlanData } from './exportData';

const HOME_VIEWS: readonly HomeView[] = ['folder', 'galaxy'];
const STAGES: readonly Stage[] = ['plan', 'execute', 'review'];
const QUADRANTS: readonly Quadrant[] = [
  'important_urgent',
  'important_not_urgent',
  'not_important_urgent',
  'not_important_not_urgent',
];
const TASK_STATUSES: readonly TaskStatus[] = [
  'not_started',
  'active_primary',
  'active_background',
  'paused',
  'completed',
  'postponed',
  'dropped',
];
const REASON_TAGS: readonly ReasonTag[] = [
  'time_estimate_error',
  'unexpected_interruption',
  'low_energy',
  'external_dependency',
  'priority_changed',
  'unclear_task',
  'no_longer_needed',
];
const REVIEW_ACTIONS: readonly ReviewDecision['action'][] = ['postpone', 'drop', 'reschedule'];

export async function importDailyPlanData(
  repository: DailyRepository,
  payload: unknown,
): Promise<void> {
  const data = readExportedData(payload);

  await repository.saveSettings(data.settings);

  for (const file of data.dailyFiles) {
    await repository.saveDailyFile(file);
  }

  for (const task of data.tasks) {
    await repository.saveTask(task);
  }

  for (const session of data.sessions) {
    await repository.saveSession(session);
  }

  for (const decision of data.reviewDecisions) {
    await repository.saveReviewDecision(decision);
  }
}

function readExportedData(value: unknown): ExportedDailyPlanData {
  const object = readObject(value, 'import data');

  if (object.schemaVersion !== 1) {
    throw new Error('Unsupported import schema version');
  }

  return {
    schemaVersion: 1,
    exportedAt: readString(object.exportedAt, 'exportedAt'),
    settings: readSettings(object.settings),
    dailyFiles: readArray(object.dailyFiles, 'dailyFiles').map(readDailyFile),
    tasks: readArray(object.tasks, 'tasks').map(readTask),
    sessions: readArray(object.sessions, 'sessions').map(readSession),
    reviewDecisions: readArray(object.reviewDecisions, 'reviewDecisions').map(readReviewDecision),
  };
}

function readSettings(value: unknown): UserSettings {
  const object = readObject(value, 'settings');

  return {
    homeView: readEnum(object.homeView, HOME_VIEWS, 'settings.homeView'),
    morningReminder: readOptionalString(object.morningReminder, 'settings.morningReminder'),
    eveningReminder: readOptionalString(object.eveningReminder, 'settings.eveningReminder'),
    notificationsEnabled: readBoolean(object.notificationsEnabled, 'settings.notificationsEnabled'),
  };
}

function readDailyFile(value: unknown): DailyFile {
  const object = readObject(value, 'dailyFile');

  return {
    date: readString(object.date, 'dailyFile.date'),
    stage: readEnum(object.stage, STAGES, 'dailyFile.stage'),
    goal: readString(object.goal, 'dailyFile.goal'),
    statusScore: readOptionalNumber(object.statusScore, 'dailyFile.statusScore'),
    statusNote: readOptionalString(object.statusNote, 'dailyFile.statusNote'),
    review: object.review === undefined ? undefined : readDailyReview(object.review),
    reviewedAt: readOptionalString(object.reviewedAt, 'dailyFile.reviewedAt'),
  };
}

function readDailyReview(value: unknown): DailyReview {
  const object = readObject(value, 'dailyFile.review');

  return {
    completedText: readString(object.completedText, 'dailyFile.review.completedText'),
    unfinishedText: readString(object.unfinishedText, 'dailyFile.review.unfinishedText'),
    feelingText: readString(object.feelingText, 'dailyFile.review.feelingText'),
    tomorrowFocusText: readString(
      object.tomorrowFocusText,
      'dailyFile.review.tomorrowFocusText',
    ),
  };
}

function readTask(value: unknown): Task {
  const object = readObject(value, 'task');

  return {
    id: readString(object.id, 'task.id'),
    date: readString(object.date, 'task.date'),
    title: readString(object.title, 'task.title'),
    quadrant: readEnum(object.quadrant, QUADRANTS, 'task.quadrant'),
    status: readEnum(object.status, TASK_STATUSES, 'task.status'),
    isCarryover: readBoolean(object.isCarryover, 'task.isCarryover'),
    carryoverFromDate: readOptionalString(object.carryoverFromDate, 'task.carryoverFromDate'),
    postponeReasonTag:
      object.postponeReasonTag === undefined
        ? undefined
        : readEnum(object.postponeReasonTag, REASON_TAGS, 'task.postponeReasonTag'),
    postponeReasonNote: readOptionalString(object.postponeReasonNote, 'task.postponeReasonNote'),
    createdAt: readString(object.createdAt, 'task.createdAt'),
    updatedAt: readString(object.updatedAt, 'task.updatedAt'),
  };
}

function readSession(value: unknown): TaskSession {
  const object = readObject(value, 'session');

  return {
    id: readString(object.id, 'session.id'),
    taskId: readString(object.taskId, 'session.taskId'),
    startedAt: readString(object.startedAt, 'session.startedAt'),
    endedAt: readOptionalString(object.endedAt, 'session.endedAt'),
    isManual: readBoolean(object.isManual, 'session.isManual'),
    durationMinutes: readOptionalNumber(object.durationMinutes, 'session.durationMinutes'),
  };
}

function readReviewDecision(value: unknown): ReviewDecision {
  const object = readObject(value, 'reviewDecision');

  return {
    id: readString(object.id, 'reviewDecision.id'),
    taskId: readString(object.taskId, 'reviewDecision.taskId'),
    action: readEnum(object.action, REVIEW_ACTIONS, 'reviewDecision.action'),
    targetDate: readOptionalString(object.targetDate, 'reviewDecision.targetDate'),
    reasonTag: readEnum(object.reasonTag, REASON_TAGS, 'reviewDecision.reasonTag'),
    reasonNote: readOptionalString(object.reasonNote, 'reviewDecision.reasonNote'),
    createdAt: readString(object.createdAt, 'reviewDecision.createdAt'),
  };
}

function readObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Invalid ${label}`);
  }

  return value as Record<string, unknown>;
}

function readArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function readString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function readOptionalString(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : readString(value, label);
}

function readBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function readOptionalNumber(value: unknown, label: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'number') {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function readEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T;
  }

  throw new Error(`Invalid ${label}`);
}
