import type { DailyFile, ReviewDecision, Task, TaskSession, UserSettings } from '../domain/types';
import type { DailyRepository } from './dailyRepository';

export interface ExportedDailyPlanData {
  schemaVersion: 1;
  exportedAt: string;
  settings: UserSettings;
  dailyFiles: DailyFile[];
  tasks: Task[];
  sessions: TaskSession[];
  reviewDecisions: ReviewDecision[];
}

interface ExportDailyPlanDataOptions {
  exportedAt?: string;
}

export async function exportDailyPlanData(
  repository: DailyRepository,
  options: ExportDailyPlanDataOptions = {},
): Promise<ExportedDailyPlanData> {
  const [settings, dailyFiles, tasks, sessions, reviewDecisions] = await Promise.all([
    repository.getSettings(),
    repository.listDailyFiles(),
    repository.listAllTasks(),
    repository.listAllSessions(),
    repository.listReviewDecisions(),
  ]);

  return {
    schemaVersion: 1,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    settings,
    dailyFiles,
    tasks,
    sessions,
    reviewDecisions,
  };
}
