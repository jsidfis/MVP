import { describe, expect, it } from 'vitest';
import { MemoryDailyRepository } from './memoryDailyRepository';
import type { DailyFile, ReviewDecision, Task, TaskSession, UserSettings } from '../domain/types';
import type { TaskTemplate } from './taskTemplates';

describe('MemoryDailyRepository', () => {
  it('creates a default daily file on first read', async () => {
    const repository = new MemoryDailyRepository();

    await expect(repository.getDailyFile('2026-06-17')).resolves.toEqual({
      date: '2026-06-17',
      stage: 'plan',
      goal: '',
    });
  });

  it('saves and reloads a daily file by date', async () => {
    const repository = new MemoryDailyRepository();
    const file = {
      date: '2026-06-17',
      stage: 'execute' as const,
      goal: 'Ship repository contract',
      statusScore: 4,
      statusNote: 'Focused',
    };

    await repository.saveDailyFile(file);

    await expect(repository.getDailyFile('2026-06-17')).resolves.toEqual(file);
  });

  it('saves, lists, and upserts tasks by date', async () => {
    const repository = new MemoryDailyRepository();
    const first = task('task-1', '2026-06-17', 'not_started');
    const second = task('task-2', '2026-06-17', 'active_primary');
    const otherDate = task('task-3', '2026-06-18', 'not_started');
    const updatedFirst = {
      ...first,
      title: 'Updated task',
      status: 'completed' as const,
      updatedAt: '2026-06-17T11:00:00.000Z',
    };

    await repository.saveTask(first);
    await repository.saveTask(second);
    await repository.saveTask(otherDate);
    await repository.saveTask(updatedFirst);

    const tasks = await repository.listTasks('2026-06-17');

    expect(tasks).toHaveLength(2);
    expect(tasks).toContainEqual(updatedFirst);
    expect(tasks).toContainEqual(second);
    expect(tasks).not.toContainEqual(first);
  });

  it('saves, lists, and upserts task templates', async () => {
    const repository = new MemoryDailyRepository();
    const template = taskTemplate('template-1', 'Morning routine');
    const updatedTemplate = {
      ...template,
      name: 'Updated routine',
      updatedAt: '2026-06-17T10:00:00.000Z',
    };

    await repository.saveTaskTemplate(template);
    await repository.saveTaskTemplate(taskTemplate('template-2', 'Review routine'));
    await repository.saveTaskTemplate(updatedTemplate);

    await expect(repository.listTaskTemplates()).resolves.toEqual([
      updatedTemplate,
      taskTemplate('template-2', 'Review routine'),
    ]);
  });

  it('saves, lists, and upserts sessions by task id', async () => {
    const repository = new MemoryDailyRepository();
    const first = session('session-1', 'task-1');
    const second = session('session-2', 'task-1');
    const otherTask = session('session-3', 'task-2');
    const updatedFirst = {
      ...first,
      endedAt: '2026-06-17T09:30:00.000Z',
      durationMinutes: 30,
    };

    await repository.saveSession(first);
    await repository.saveSession(second);
    await repository.saveSession(otherTask);
    await repository.saveSession(updatedFirst);

    const sessions = await repository.listSessions('task-1');

    expect(sessions).toHaveLength(2);
    expect(sessions).toContainEqual(updatedFirst);
    expect(sessions).toContainEqual(second);
    expect(sessions).not.toContainEqual(first);
  });

  it('lists only postponed carryover candidates from previous dates', async () => {
    const repository = new MemoryDailyRepository();
    const previousPostponed = task('task-1', '2026-06-16', 'postponed');
    const olderPostponed = task('task-2', '2026-06-15', 'postponed');
    const todayPostponed = task('task-3', '2026-06-17', 'postponed');
    const previousCompleted = task('task-4', '2026-06-16', 'completed');
    const futurePostponed = task('task-5', '2026-06-18', 'postponed');

    await repository.saveTask(previousPostponed);
    await repository.saveTask(olderPostponed);
    await repository.saveTask(todayPostponed);
    await repository.saveTask(previousCompleted);
    await repository.saveTask(futurePostponed);

    const candidates = await repository.listCarryoverCandidates('2026-06-17');

    expect(candidates).toHaveLength(2);
    expect(candidates).toContainEqual(previousPostponed);
    expect(candidates).toContainEqual(olderPostponed);
  });

  it('returns default settings and saves updates', async () => {
    const repository = new MemoryDailyRepository();
    const settings: UserSettings = {
      homeView: 'galaxy',
      notificationsEnabled: true,
      morningReminder: '08:30',
      eveningReminder: '21:30',
    };

    await expect(repository.getSettings()).resolves.toEqual({
      homeView: 'folder',
      notificationsEnabled: false,
    });

    await repository.saveSettings(settings);

    await expect(repository.getSettings()).resolves.toEqual(settings);
  });

  it('clears daily files, tasks, sessions, review decisions, and settings', async () => {
    const repository = new MemoryDailyRepository();

    await repository.saveDailyFile(dailyFile('2026-06-17'));
    await repository.saveTask(task('task-1', '2026-06-17', 'completed'));
    await repository.saveSession(session('session-1', 'task-1'));
    await repository.saveReviewDecision(reviewDecision('decision-1', 'task-1'));
    await repository.saveSettings({
      homeView: 'galaxy',
      notificationsEnabled: true,
      morningReminder: '08:30',
    });

    await repository.clearAllData();

    await expect(repository.listDailyFiles()).resolves.toEqual([]);
    await expect(repository.listAllTasks()).resolves.toEqual([]);
    await expect(repository.listTaskTemplates()).resolves.toEqual([]);
    await expect(repository.listAllSessions()).resolves.toEqual([]);
    await expect(repository.listReviewDecisions()).resolves.toEqual([]);
    await expect(repository.getSettings()).resolves.toEqual({
      homeView: 'folder',
      notificationsEnabled: false,
    });
  });

  it('isolates saved daily file objects from later caller mutations', async () => {
    const repository = new MemoryDailyRepository();
    const file = dailyFile('2026-06-17');

    await repository.saveDailyFile(file);
    file.goal = 'Mutated outside repository';
    file.review!.completedText = 'Mutated review';

    await expect(repository.getDailyFile('2026-06-17')).resolves.toEqual(dailyFile('2026-06-17'));
  });

  it('isolates returned daily file objects from later caller mutations', async () => {
    const repository = new MemoryDailyRepository();
    const file = dailyFile('2026-06-17');

    await repository.saveDailyFile(file);
    const returned = await repository.getDailyFile('2026-06-17');
    returned.goal = 'Mutated outside repository';
    returned.review!.completedText = 'Mutated review';

    await expect(repository.getDailyFile('2026-06-17')).resolves.toEqual(dailyFile('2026-06-17'));
  });

  it('isolates saved task objects from later caller mutations', async () => {
    const repository = new MemoryDailyRepository();
    const saved = task('task-1', '2026-06-17', 'not_started');

    await repository.saveTask(saved);
    saved.title = 'Mutated outside repository';
    saved.status = 'completed';

    await expect(repository.listTasks('2026-06-17')).resolves.toEqual([
      task('task-1', '2026-06-17', 'not_started'),
    ]);
  });

  it('isolates returned task objects from later caller mutations', async () => {
    const repository = new MemoryDailyRepository();
    const saved = task('task-1', '2026-06-17', 'not_started');

    await repository.saveTask(saved);
    const [returned] = await repository.listTasks('2026-06-17');
    returned.title = 'Mutated outside repository';
    returned.status = 'completed';

    await expect(repository.listTasks('2026-06-17')).resolves.toEqual([
      task('task-1', '2026-06-17', 'not_started'),
    ]);
  });

  it('isolates saved and returned task templates from later caller mutations', async () => {
    const repository = new MemoryDailyRepository();
    const saved = taskTemplate('template-1', 'Morning routine');

    await repository.saveTaskTemplate(saved);
    saved.name = 'Mutated outside repository';
    saved.items[0].title = 'Mutated task';

    await expect(repository.listTaskTemplates()).resolves.toEqual([
      taskTemplate('template-1', 'Morning routine'),
    ]);

    const [returned] = await repository.listTaskTemplates();
    returned.name = 'Mutated returned template';
    returned.items[0].title = 'Mutated returned task';

    await expect(repository.listTaskTemplates()).resolves.toEqual([
      taskTemplate('template-1', 'Morning routine'),
    ]);
  });

  it('isolates saved session objects from later caller mutations', async () => {
    const repository = new MemoryDailyRepository();
    const saved = session('session-1', 'task-1');

    await repository.saveSession(saved);
    saved.endedAt = '2026-06-17T09:30:00.000Z';
    saved.durationMinutes = 30;

    await expect(repository.listSessions('task-1')).resolves.toEqual([
      session('session-1', 'task-1'),
    ]);
  });

  it('isolates returned session objects from later caller mutations', async () => {
    const repository = new MemoryDailyRepository();
    const saved = session('session-1', 'task-1');

    await repository.saveSession(saved);
    const [returned] = await repository.listSessions('task-1');
    returned.endedAt = '2026-06-17T09:30:00.000Z';
    returned.durationMinutes = 30;

    await expect(repository.listSessions('task-1')).resolves.toEqual([
      session('session-1', 'task-1'),
    ]);
  });

  it('isolates returned carryover candidates from later caller mutations', async () => {
    const repository = new MemoryDailyRepository();
    const saved = task('task-1', '2026-06-16', 'postponed');

    await repository.saveTask(saved);
    const [returned] = await repository.listCarryoverCandidates('2026-06-17');
    returned.title = 'Mutated outside repository';
    returned.status = 'completed';

    await expect(repository.listCarryoverCandidates('2026-06-17')).resolves.toEqual([
      task('task-1', '2026-06-16', 'postponed'),
    ]);
  });

  it('isolates saved and returned settings objects from later caller mutations', async () => {
    const repository = new MemoryDailyRepository();
    const settings: UserSettings = {
      homeView: 'galaxy',
      notificationsEnabled: true,
      morningReminder: '08:30',
    };

    await repository.saveSettings(settings);
    settings.homeView = 'folder';
    settings.notificationsEnabled = false;

    await expect(repository.getSettings()).resolves.toEqual({
      homeView: 'galaxy',
      notificationsEnabled: true,
      morningReminder: '08:30',
    });

    const returned = await repository.getSettings();
    returned.homeView = 'folder';
    returned.notificationsEnabled = false;

    await expect(repository.getSettings()).resolves.toEqual({
      homeView: 'galaxy',
      notificationsEnabled: true,
      morningReminder: '08:30',
    });
  });
});

function dailyFile(date: string): DailyFile {
  return {
    date,
    stage: 'review',
    goal: 'Review repository behavior',
    review: {
      completedText: 'Finished tests',
      unfinishedText: 'No blockers',
      feelingText: 'Focused',
      tomorrowFocusText: 'Continue implementation',
    },
  };
}

function task(id: string, date: string, status: Task['status']): Task {
  return {
    id,
    date,
    title: `Task ${id}`,
    quadrant: 'important_urgent',
    status,
    isCarryover: false,
    postponeReasonTag: status === 'postponed' ? 'time_estimate_error' : undefined,
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T08:00:00.000Z`,
  };
}

function taskTemplate(id: string, name: string): TaskTemplate {
  return {
    id,
    name,
    createdAt: '2026-06-17T09:00:00.000Z',
    updatedAt: '2026-06-17T09:00:00.000Z',
    items: [
      {
        title: 'Plan day',
        quadrant: 'important_urgent',
        plannedDurationMinutes: 30,
      },
    ],
  };
}

function session(id: string, taskId: string): TaskSession {
  return {
    id,
    taskId,
    startedAt: '2026-06-17T09:00:00.000Z',
    isManual: true,
  };
}

function reviewDecision(id: string, taskId: string): ReviewDecision {
  return {
    id,
    taskId,
    action: 'postpone',
    targetDate: '2026-06-18',
    reasonTag: 'time_estimate_error',
    createdAt: '2026-06-17T20:00:00.000Z',
  };
}
