import type { DailyFile, ReviewDecision, Task, TaskSession, UserSettings } from '../domain/types';

export interface DailyRepository {
  getDailyFile(date: string): Promise<DailyFile>;
  saveDailyFile(file: DailyFile): Promise<void>;
  listTasks(date: string): Promise<Task[]>;
  saveTask(task: Task): Promise<void>;
  listSessions(taskId: string): Promise<TaskSession[]>;
  saveSession(session: TaskSession): Promise<void>;
  saveReviewDecision(decision: ReviewDecision): Promise<void>;
  listCarryoverCandidates(today: string): Promise<Task[]>;
  getSettings(): Promise<UserSettings>;
  saveSettings(settings: UserSettings): Promise<void>;
}
