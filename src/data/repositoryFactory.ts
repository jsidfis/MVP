import type { DailyRepository } from './dailyRepository';
import { MemoryDailyRepository } from './memoryDailyRepository';
import { createTauriSqlDailyRepository } from './tauriSqlDailyRepository';
import type { WorkspaceMode } from './workspaceMode';

export async function createDailyRepository(mode: WorkspaceMode = 'user'): Promise<DailyRepository> {
  if ('__TAURI_INTERNALS__' in window) {
    return createTauriSqlDailyRepository(mode);
  }

  return new MemoryDailyRepository();
}
