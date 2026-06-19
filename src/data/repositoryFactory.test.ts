import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryDailyRepository } from './memoryDailyRepository';
import { createDailyRepository } from './repositoryFactory';

const tauriMocks = vi.hoisted(() => ({
  repository: { source: 'tauri' },
  createTauriSqlDailyRepository: vi.fn(),
}));

vi.mock('./tauriSqlDailyRepository', () => ({
  createTauriSqlDailyRepository: tauriMocks.createTauriSqlDailyRepository,
}));

describe('createDailyRepository', () => {
  afterEach(() => {
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    tauriMocks.createTauriSqlDailyRepository.mockReset();
  });

  it('creates a memory repository outside Tauri', async () => {
    const repository = await createDailyRepository();

    expect(repository).toBeInstanceOf(MemoryDailyRepository);
    expect(tauriMocks.createTauriSqlDailyRepository).not.toHaveBeenCalled();
  });

  it('creates a Tauri SQL repository inside Tauri', async () => {
    tauriMocks.createTauriSqlDailyRepository.mockResolvedValue(tauriMocks.repository);
    Object.defineProperty(window, '__TAURI_INTERNALS__', {
      configurable: true,
      value: {},
    });

    const repository = await createDailyRepository();

    expect(repository).toBe(tauriMocks.repository);
    expect(tauriMocks.createTauriSqlDailyRepository).toHaveBeenCalledOnce();
  });
});
