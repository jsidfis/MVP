export type WorkspaceMode = 'user' | 'demo';

export const WORKSPACE_MODE_STORAGE_KEY = 'daily-plan-review.workspace-mode';

const WORKSPACE_DATABASE_FILES: Record<WorkspaceMode, string> = {
  user: 'user.sqlite',
  demo: 'demo.sqlite',
};

export function isWorkspaceMode(value: unknown): value is WorkspaceMode {
  return value === 'user' || value === 'demo';
}

export function readWorkspaceMode(storage: Storage = window.localStorage): WorkspaceMode | null {
  const value = storage.getItem(WORKSPACE_MODE_STORAGE_KEY);

  return isWorkspaceMode(value) ? value : null;
}

export function writeWorkspaceMode(mode: WorkspaceMode, storage: Storage = window.localStorage): void {
  storage.setItem(WORKSPACE_MODE_STORAGE_KEY, mode);
}

export function getWorkspaceDatabaseFile(mode: WorkspaceMode): string {
  return WORKSPACE_DATABASE_FILES[mode];
}
