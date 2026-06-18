import type { DailyFile, ReviewDecision, Task, TaskSession, UserSettings } from '../domain/types';
import type { DailyRepository } from './dailyRepository';

const DEFAULT_SETTINGS: UserSettings = {
  homeView: 'folder',
  notificationsEnabled: false,
};

export class MemoryDailyRepository implements DailyRepository {
  private readonly dailyFiles = new Map<string, DailyFile>();
  private readonly tasks = new Map<string, Task>();
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

  async listTasks(date: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((task) => task.date === date)
      .map(cloneTask);
  }

  async saveTask(task: Task): Promise<void> {
    this.tasks.set(task.id, cloneTask(task));
  }

  async listSessions(taskId: string): Promise<TaskSession[]> {
    return Array.from(this.sessions.values())
      .filter((session) => session.taskId === taskId)
      .map(cloneSession);
  }

  async saveSession(session: TaskSession): Promise<void> {
    this.sessions.set(session.id, cloneSession(session));
  }

  async saveReviewDecision(decision: ReviewDecision): Promise<void> {
    this.reviewDecisions.set(decision.id, cloneReviewDecision(decision));
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

function cloneSession(session: TaskSession): TaskSession {
  return { ...session };
}

function cloneReviewDecision(decision: ReviewDecision): ReviewDecision {
  return { ...decision };
}

function cloneSettings(settings: UserSettings): UserSettings {
  return { ...settings };
}
