import type { DailyRepository } from './dailyRepository';
import { MemoryDailyRepository } from './memoryDailyRepository';
import { createTauriSqlDailyRepository } from './tauriSqlDailyRepository';

export async function createDailyRepository(): Promise<DailyRepository> {
  if ('__TAURI_INTERNALS__' in window) {
    return createTauriSqlDailyRepository();
  }

  return new MemoryDailyRepository();
}
