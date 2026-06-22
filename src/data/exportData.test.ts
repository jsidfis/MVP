import { describe, expect, it } from 'vitest';
import { MemoryDailyRepository } from './memoryDailyRepository';
import { exportDailyPlanData } from './exportData';
import type { DailyFile, ReviewDecision, Task, TaskSession } from '../domain/types';

describe('exportDailyPlanData', () => {
  it('exports settings, daily files, tasks, sessions, and review decisions', async () => {
    const repository = new MemoryDailyRepository();
    const dailyFile: DailyFile = {
      date: '2026-06-22',
      stage: 'review',
      goal: '完成数据安全方案',
      statusNote: '状态稳定',
      review: {
        completedText: '完成了导出方案',
        unfinishedText: '导入还未开始',
        feelingText: '节奏清楚',
        tomorrowFocusText: '实现导入校验',
      },
      reviewedAt: '2026-06-22T21:30:00.000Z',
    };
    const completedTask: Task = {
      id: 'task-1',
      date: '2026-06-22',
      title: '整理导出字段',
      quadrant: 'important_urgent',
      status: 'completed',
      isCarryover: false,
      createdAt: '2026-06-22T08:00:00.000Z',
      updatedAt: '2026-06-22T09:00:00.000Z',
    };
    const postponedTask: Task = {
      id: 'task-2',
      date: '2026-06-22',
      title: '实现导入校验',
      quadrant: 'important_not_urgent',
      status: 'postponed',
      isCarryover: true,
      carryoverFromDate: '2026-06-21',
      postponeReasonTag: 'time_estimate_error',
      postponeReasonNote: '导出字段确认花了更久',
      createdAt: '2026-06-22T10:00:00.000Z',
      updatedAt: '2026-06-22T20:00:00.000Z',
    };
    const session: TaskSession = {
      id: 'session-1',
      taskId: 'task-1',
      startedAt: '2026-06-22T08:10:00.000Z',
      endedAt: '2026-06-22T08:55:00.000Z',
      isManual: false,
      durationMinutes: 45,
    };
    const reviewDecision: ReviewDecision = {
      id: 'decision-1',
      taskId: 'task-2',
      action: 'postpone',
      targetDate: '2026-06-23',
      reasonTag: 'time_estimate_error',
      reasonNote: '导出字段确认花了更久',
      createdAt: '2026-06-22T21:00:00.000Z',
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
    await repository.saveSession(session);
    await repository.saveReviewDecision(reviewDecision);

    await expect(
      exportDailyPlanData(repository, { exportedAt: '2026-06-22T22:00:00.000Z' }),
    ).resolves.toEqual({
      schemaVersion: 1,
      exportedAt: '2026-06-22T22:00:00.000Z',
      settings: {
        homeView: 'galaxy',
        morningReminder: '08:30',
        eveningReminder: '21:30',
        notificationsEnabled: true,
      },
      dailyFiles: [dailyFile],
      tasks: [completedTask, postponedTask],
      sessions: [session],
      reviewDecisions: [reviewDecision],
    });
  });

  it('exports a valid empty archive shape', async () => {
    const repository = new MemoryDailyRepository();

    await expect(
      exportDailyPlanData(repository, { exportedAt: '2026-06-22T22:00:00.000Z' }),
    ).resolves.toEqual({
      schemaVersion: 1,
      exportedAt: '2026-06-22T22:00:00.000Z',
      settings: {
        homeView: 'folder',
        notificationsEnabled: false,
      },
      dailyFiles: [],
      tasks: [],
      sessions: [],
      reviewDecisions: [],
    });
  });
});
