import type { DailyFile, ReviewDecision, Task, TaskSession, UserSettings } from '../domain/types';
import type { RecurringTaskRule } from '../domain/recurrenceRules';
import type { DailyRepository } from './dailyRepository';
import type { TaskTemplate } from './taskTemplates';

const DEFAULT_SETTINGS: UserSettings = {
  homeView: 'folder',
  notificationsEnabled: false,
};

export class MemoryDailyRepository implements DailyRepository {
  private readonly dailyFiles = new Map<string, DailyFile>();
  private readonly tasks = new Map<string, Task>();
  private readonly taskTemplates = new Map<string, TaskTemplate>();
  private readonly recurringTaskRules = new Map<string, RecurringTaskRule>();
  private readonly sessions = new Map<string, TaskSession>();
  private readonly reviewDecisions = new Map<string, ReviewDecision>();
  private settings?: UserSettings;

  async getDailyFile(date: string): Promise<DailyFile> {
    let file = this.dailyFiles.get(date);

    if (!file) {
      file = { date, stage: 'plan', goal: '' };
      this.dailyFiles.set(date, file);
    }

    return cloneDailyFile(file);
  }

  async saveDailyFile(file: DailyFile): Promise<void> {
    this.dailyFiles.set(file.date, cloneDailyFile(file));
  }

  async listDailyFiles(): Promise<DailyFile[]> {
    return Array.from(this.dailyFiles.values())
      .sort((left, right) => left.date.localeCompare(right.date))
      .map(cloneDailyFile);
  }

  async listTasks(date: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((task) => task.date === date)
      .map(cloneTask);
  }

  async saveTask(task: Task): Promise<void> {
    this.tasks.set(task.id, cloneTask(task));
  }

  async listAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .sort(
        (left, right) =>
          left.date.localeCompare(right.date) || left.createdAt.localeCompare(right.createdAt),
      )
      .map(cloneTask);
  }

  async listTaskTemplates(): Promise<TaskTemplate[]> {
    return Array.from(this.taskTemplates.values())
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map(cloneTaskTemplate);
  }

  async saveTaskTemplate(template: TaskTemplate): Promise<void> {
    this.taskTemplates.set(template.id, cloneTaskTemplate(template));
  }

  async listRecurringTaskRules(): Promise<RecurringTaskRule[]> {
    return Array.from(this.recurringTaskRules.values())
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map(cloneRecurringTaskRule);
  }

  async saveRecurringTaskRule(rule: RecurringTaskRule): Promise<void> {
    this.recurringTaskRules.set(rule.id, cloneRecurringTaskRule(rule));
  }

  async listSessions(taskId: string): Promise<TaskSession[]> {
    return Array.from(this.sessions.values())
      .filter((session) => session.taskId === taskId)
      .map(cloneSession);
  }

  async saveSession(session: TaskSession): Promise<void> {
    this.sessions.set(session.id, cloneSession(session));
  }

  async listAllSessions(): Promise<TaskSession[]> {
    return Array.from(this.sessions.values())
      .sort((left, right) => left.startedAt.localeCompare(right.startedAt))
      .map(cloneSession);
  }

  async saveReviewDecision(decision: ReviewDecision): Promise<void> {
    this.reviewDecisions.set(decision.id, cloneReviewDecision(decision));
  }

  async listReviewDecisions(): Promise<ReviewDecision[]> {
    return Array.from(this.reviewDecisions.values())
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map(cloneReviewDecision);
  }

  async listCarryoverCandidates(today: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((task) => task.status === 'postponed' && task.date < today)
      .map(cloneTask);
  }

  async getSettings(): Promise<UserSettings> {
    return cloneSettings(this.settings ?? DEFAULT_SETTINGS);
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    this.settings = cloneSettings(settings);
  }

  async clearAllData(): Promise<void> {
    this.dailyFiles.clear();
    this.tasks.clear();
    this.taskTemplates.clear();
    this.recurringTaskRules.clear();
    this.sessions.clear();
    this.reviewDecisions.clear();
    this.settings = undefined;
  }
}

function cloneDailyFile(file: DailyFile): DailyFile {
  const clone = { ...file };

  if (file.review) {
    clone.review = { ...file.review };
  }

  return clone;
}

function cloneTask(task: Task): Task {
  return { ...task };
}

function cloneTaskTemplate(template: TaskTemplate): TaskTemplate {
  return {
    ...template,
    items: template.items.map((item) => ({ ...item })),
  };
}

function cloneRecurringTaskRule(rule: RecurringTaskRule): RecurringTaskRule {
  return { ...rule };
}

function cloneSession(session: TaskSession): TaskSession {
  return { ...session };
}

function cloneReviewDecision(decision: ReviewDecision): ReviewDecision {
  return { ...decision };
}

function cloneSettings(settings: UserSettings): UserSettings {
  return { ...settings };
}
