import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';
import { getWorkspaceDatabaseFile, type WorkspaceMode } from './workspaceMode';

export async function createPortableDatabaseUrl(mode: WorkspaceMode): Promise<string> {
  const dataDir = await invoke<string>('portable_data_dir');
  const databasePath = await join(dataDir, getWorkspaceDatabaseFile(mode));

  return `sqlite:${databasePath}`;
}
