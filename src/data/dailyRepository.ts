import type { DailyFile, ReviewDecision, Task, TaskSession, UserSettings } from '../domain/types';

export interface DailyRepository {
  getDailyFile(date: string): Promise<DailyFile>;
  saveDailyFile(file: DailyFile): Promise<void>;
  listDailyFiles(): Promise<DailyFile[]>;
  listTasks(date: string): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  listAllTasks(): Promise<Task[]>;
  listSessions(taskId: string): Promise<TaskSession[]>;
  saveSession(session: TaskSession): Promise<void>;
  listAllSessions(): Promise<TaskSession[]>;
  saveReviewDecision(decision: ReviewDecision): Promise<void>;
  listReviewDecisions(): Promise<ReviewDecision[]>;
  listCarryoverCandidates(today: string): Promise<Task[]>;
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: UserSettings): Promise<void>;
}
