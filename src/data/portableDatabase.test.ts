import { describe, expect, it, vi } from 'vitest';
import { createPortableDatabaseUrl } from './portableDatabase';

const tauriMocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  join: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: tauriMocks.invoke,
}));

vi.mock('@tauri-apps/api/path', () => ({
  join: tauriMocks.join,
}));

describe('createPortableDatabaseUrl', () => {
  it('builds the user database URL inside the portable data directory', async () => {
    tauriMocks.invoke.mockResolvedValue('C:\\Apps\\Daily\\data');
    tauriMocks.join.mockResolvedValue('C:\\Apps\\Daily\\data\\user.sqlite');

    await expect(createPortableDatabaseUrl('user')).resolves.toBe(
      'sqlite:C:\\Apps\\Daily\\data\\user.sqlite',
    );
    expect(tauriMocks.invoke).toHaveBeenCalledWith('portable_data_dir');
    expect(tauriMocks.join).toHaveBeenCalledWith('C:\\Apps\\Daily\\data', 'user.sqlite');
  });

  it('builds the demo database URL inside the portable data directory', async () => {
    tauriMocks.invoke.mockResolvedValue('C:\\Apps\\Daily\\data');
    tauriMocks.join.mockResolvedValue('C:\\Apps\\Daily\\data\\demo.sqlite');

    await expect(createPortableDatabaseUrl('demo')).resolves.toBe(
      'sqlite:C:\\Apps\\Daily\\data\\demo.sqlite',
    );
  });
});
