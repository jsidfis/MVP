import { describe, expect, it } from 'vitest';
import { MemoryDailyRepository } from './memoryDailyRepository';
import { exportDailyPlanData, type ExportedDailyPlanData } from './exportData';
import { importDailyPlanData } from './importData';
import type { RecurringTaskRule } from '../domain/recurrenceRules';
import type { DailyFile, ReviewDecision, Task, TaskSession } from '../domain/types';
import type { TaskTemplate } from './taskTemplates';

describe('importDailyPlanData', () => {
  it('imports a valid export into an empty repository', async () => {
    const source = new MemoryDailyRepository();
    await seedRepository(source);
    const exported = await exportDailyPlanData(source, {
      exportedAt: '2026-06-22T22:00:00.000Z',
    });
    const target = new MemoryDailyRepository();

    await importDailyPlanData(target, exported);

    await expectExport(target, exported);
  });

  it('rejects invalid JSON objects', async () => {
    const repository = new MemoryDailyRepository();

    await expect(importDailyPlanData(repository, null)).rejects.toThrow('Invalid import data');

    await expectExport(repository, {
      schemaVersion: 1,
      exportedAt: '2026-06-22T22:00:00.000Z',
      settings: { homeView: 'folder', notificationsEnabled: false },
      dailyFiles: [],
      tasks: [],
      taskTemplates: [],
      recurringTaskRules: [],
      sessions: [],
      reviewDecisions: [],
    });
  });

  it('rejects unsupported schema versions', async () => {
    const repository = new MemoryDailyRepository();

    await expect(
      importDailyPlanData(repository, {
        schemaVersion: 2,
        exportedAt: '2026-06-22T22:00:00.000Z',
        settings: { homeView: 'folder', notificationsEnabled: false },
        dailyFiles: [],
        tasks: [],
        taskTemplates: [],
        recurringTaskRules: [],
        sessions: [],
        reviewDecisions: [],
      }),
    ).rejects.toThrow('Unsupported import schema version');
  });

  it('does not write anything when import validation fails', async () => {
    const repository = new MemoryDailyRepository();
    await seedRepository(repository);
    const before = await exportDailyPlanData(repository, {
      exportedAt: '2026-06-22T22:00:00.000Z',
    });

    await expect(
      importDailyPlanData(repository, {
        schemaVersion: 1,
        exportedAt: '2026-06-22T22:30:00.000Z',
        settings: { homeView: 'folder', notificationsEnabled: false },
        dailyFiles: [{ date: '2026-06-23', stage: 'plan', goal: 'This must not be written' }],
        tasks: [{ id: 'bad-task' }],
        taskTemplates: [],
        recurringTaskRules: [],
        sessions: [],
        reviewDecisions: [],
      }),
    ).rejects.toThrow('Invalid task');

    await expectExport(repository, before);
  });
});

async function seedRepository(repository: MemoryDailyRepository) {
  const dailyFile: DailyFile = {
    date: '2026-06-22',
    stage: 'review',
    goal: 'Finish data safety export and import',
    statusScore: 4,
    statusNote: 'Steady focus',
    review: {
      completedText: 'Export base is done',
      unfinishedText: 'Import UI is next',
      feelingText: 'Clear',
      tomorrowFocusText: 'Restore workflow',
    },
    reviewedAt: '2026-06-22T21:40:00.000Z',
  };
  const completedTask: Task = {
    id: 'task-export',
    date: '2026-06-22',
    title: 'Export local data',
    quadrant: 'important_urgent',
    status: 'completed',
    isCarryover: false,
    createdAt: '2026-06-22T08:00:00.000Z',
    updatedAt: '2026-06-22T09:15:00.000Z',
  };
  const postponedTask: Task = {
    id: 'task-import',
    date: '2026-06-22',
    title: 'Import local data',
    quadrant: 'important_not_urgent',
    status: 'postponed',
    isCarryover: false,
    postponeReasonTag: 'external_dependency',
    postponeReasonNote: 'Need validation rules first',
    createdAt: '2026-06-22T08:10:00.000Z',
    updatedAt: '2026-06-22T20:00:00.000Z',
  };
  const session: TaskSession = {
    id: 'session-export',
    taskId: completedTask.id,
    startedAt: '2026-06-22T08:05:00.000Z',
    endedAt: '2026-06-22T09:05:00.000Z',
    isManual: false,
    durationMinutes: 60,
  };
  const reviewDecision: ReviewDecision = {
    id: 'decision-import',
    taskId: postponedTask.id,
    action: 'postpone',
    targetDate: '2026-06-23',
    reasonTag: 'external_dependency',
    reasonNote: 'Need validation rules first',
    createdAt: '2026-06-22T20:05:00.000Z',
  };
  const taskTemplate: TaskTemplate = {
    id: 'template-morning',
    name: 'Morning routine',
    createdAt: '2026-06-22T08:00:00.000Z',
    updatedAt: '2026-06-22T08:00:00.000Z',
    items: [
      {
        title: 'Export local data',
        quadrant: 'important_urgent',
        plannedDurationMinutes: 30,
      },
    ],
  };
  const recurringTaskRule: RecurringTaskRule = {
    id: 'rule-review',
    title: 'Weekly review',
    quadrant: 'important_not_urgent',
    plannedDurationMinutes: 30,
    frequency: 'weekly',
    startDate: '2026-06-22',
    enabled: true,
    createdAt: '2026-06-22T08:00:00.000Z',
    updatedAt: '2026-06-22T08:00:00.000Z',
  };

  await repository.saveSettings({
    homeView: 'galaxy',
    morningReminder: '08:30',
    eveningReminder: '21:30',
    notificationsEnabled: true,
  });
  await repository.saveDailyFile(dailyFile);
  await repository.saveTask(completedTask);
  await repository.saveTask(postponedTask);
  await repository.saveTaskTemplate(taskTemplate);
  await repository.saveRecurringTaskRule(recurringTaskRule);
  await repository.saveSession(session);
  await repository.saveReviewDecision(reviewDecision);
}

async function expectExport(repository: MemoryDailyRepository, expected: ExportedDailyPlanData) {
  await expect(
    exportDailyPlanData(repository, {
      exportedAt: expected.exportedAt,
    }),
  ).resolves.toEqual(expected);
}
