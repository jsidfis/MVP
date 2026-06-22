import { describe, expect, it } from 'vitest';
import { createReadableDailyArchive } from './readableExport';
import type { ExportedDailyPlanData } from './exportData';

describe('createReadableDailyArchive', () => {
  it('formats daily goals, tasks, timing, postponed reasons, and review answers as Markdown', () => {
    const markdown = createReadableDailyArchive(data);

    expect(markdown).toContain('# 每日计划与复盘档案');
    expect(markdown).toContain('## 2026-06-22');
    expect(markdown).toContain('目标：Finish data safety export and import');
    expect(markdown).toContain('Export local data');
    expect(markdown).toContain('四象限：重要且紧急');
    expect(markdown).toContain('状态：已完成');
    expect(markdown).toContain('实际耗时：60 分钟');
    expect(markdown).toContain('Import local data');
    expect(markdown).toContain('四象限：重要不紧急');
    expect(markdown).toContain('状态：已顺延');
    expect(markdown).toContain('顺延原因：外部依赖');
    expect(markdown).toContain('说明：Need validation rules first');
    expect(markdown).toContain('完成：Export base is done');
    expect(markdown).toContain('未完成：Import UI is next');
    expect(markdown).toContain('感受：Clear');
    expect(markdown).toContain('明日重点：Restore workflow');
  });

  it('keeps empty days readable', () => {
    const markdown = createReadableDailyArchive({
      schemaVersion: 1,
      exportedAt: '2026-06-22T22:00:00.000Z',
      settings: { homeView: 'folder', notificationsEnabled: false },
      dailyFiles: [{ date: '2026-06-22', stage: 'plan', goal: '' }],
      tasks: [],
      taskTemplates: [],
      recurringTaskRules: [],
      sessions: [],
      reviewDecisions: [],
    });

    expect(markdown).toContain('目标：未填写');
    expect(markdown).toContain('暂无任务记录');
    expect(markdown).toContain('暂无复盘记录');
  });
});

const data: ExportedDailyPlanData = {
  schemaVersion: 1,
  exportedAt: '2026-06-22T22:00:00.000Z',
  settings: {
    homeView: 'galaxy',
    morningReminder: '08:30',
    eveningReminder: '21:30',
    notificationsEnabled: true,
  },
  dailyFiles: [
    {
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
    },
  ],
  tasks: [
    {
      id: 'task-export',
      date: '2026-06-22',
      title: 'Export local data',
      quadrant: 'important_urgent',
      status: 'completed',
      isCarryover: false,
      createdAt: '2026-06-22T08:00:00.000Z',
      updatedAt: '2026-06-22T09:15:00.000Z',
    },
    {
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
    },
  ],
  taskTemplates: [],
  recurringTaskRules: [],
  sessions: [
    {
      id: 'session-export',
      taskId: 'task-export',
      startedAt: '2026-06-22T08:05:00.000Z',
      endedAt: '2026-06-22T09:05:00.000Z',
      isManual: false,
      durationMinutes: 60,
    },
  ],
  reviewDecisions: [
    {
      id: 'decision-import',
      taskId: 'task-import',
      action: 'postpone',
      targetDate: '2026-06-23',
      reasonTag: 'external_dependency',
      reasonNote: 'Need validation rules first',
      createdAt: '2026-06-22T20:05:00.000Z',
    },
  ],
};
