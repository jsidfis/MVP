import { describe, expect, it } from 'vitest';
import {
  WORKSPACE_MODE_STORAGE_KEY,
  getWorkspaceDatabaseFile,
  readWorkspaceMode,
  writeWorkspaceMode,
  type WorkspaceMode,
} from './workspaceMode';

class StorageStub implements Storage {
  private values = new Map<string, string>();
  length = 0;

  clear(): void {
    this.values.clear();
    this.length = 0;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
    this.length = this.values.size;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
    this.length = this.values.size;
  }
}

describe('workspaceMode', () => {
  it('returns null when no workspace mode has been selected', () => {
    expect(readWorkspaceMode(new StorageStub())).toBeNull();
  });

  it('returns only supported persisted workspace modes', () => {
    const storage = new StorageStub();
    storage.setItem(WORKSPACE_MODE_STORAGE_KEY, 'demo');

    expect(readWorkspaceMode(storage)).toBe('demo');

    storage.setItem(WORKSPACE_MODE_STORAGE_KEY, 'other');

    expect(readWorkspaceMode(storage)).toBeNull();
  });

  it('persists workspace mode choices', () => {
    const storage = new StorageStub();

    writeWorkspaceMode('user', storage);

    expect(storage.getItem(WORKSPACE_MODE_STORAGE_KEY)).toBe('user');
  });

  it.each<[WorkspaceMode, string]>([
    ['user', 'user.sqlite'],
    ['demo', 'demo.sqlite'],
  ])('maps %s mode to %s', (mode, fileName) => {
    expect(getWorkspaceDatabaseFile(mode)).toBe(fileName);
  });
});
