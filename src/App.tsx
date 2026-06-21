import { useEffect, useRef, useState } from 'react';
import { WorkspaceModeGate } from './components/WorkspaceModeGate';
import type { DailyRepository } from './data/dailyRepository';
import { ensureDemoData } from './data/demoSeed';
import { createDailyRepository } from './data/repositoryFactory';
import { readWorkspaceMode, writeWorkspaceMode, type WorkspaceMode } from './data/workspaceMode';
import { AppStoreProvider } from './store/appStore';
import { DailyWorkspace } from './views/DailyWorkspace';

type RepositoryRequest = {
  key: string;
  promise: Promise<DailyRepository>;
};

export function App() {
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode | null>(() => readWorkspaceMode());
  const [repository, setRepository] = useState<DailyRepository | null>(null);
  const [repositoryError, setRepositoryError] = useState(false);
  const repositoryRequest = useRef<RepositoryRequest | null>(null);
  const today = getTodayDate();

  useEffect(() => {
    let cancelled = false;

    if (!workspaceMode) {
      setRepository(null);
      return;
    }

    const requestKey = `${workspaceMode}:${today}`;
    let request = repositoryRequest.current;

    setRepository(null);
    setRepositoryError(false);

    if (!request || request.key !== requestKey) {
      request = {
        key: requestKey,
        promise: createDailyRepository(workspaceMode).then(async (createdRepository) => {
          if (workspaceMode === 'demo') {
            await ensureDemoData(createdRepository, today);
          }

          return createdRepository;
        }),
      };
      repositoryRequest.current = request;
    }

    void request.promise.then(
      (createdRepository) => {
        if (!cancelled && repositoryRequest.current === request) {
          setRepository(createdRepository);
        }
      },
      () => {
        if (!cancelled && repositoryRequest.current === request) {
          setRepositoryError(true);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [today, workspaceMode]);

  function selectWorkspaceMode(mode: WorkspaceMode) {
    writeWorkspaceMode(mode);
    setWorkspaceMode(mode);
  }

  if (!workspaceMode) {
    return <WorkspaceModeGate onSelect={selectWorkspaceMode} />;
  }

  if (repositoryError) {
    return <main className="app-shell">今日工作台打开失败</main>;
  }

  if (!repository) {
    return <main className="app-shell">正在打开今日工作台</main>;
  }

  return (
    <AppStoreProvider key={workspaceMode} repository={repository} today={today}>
      <DailyWorkspace workspaceMode={workspaceMode} onChangeWorkspaceMode={selectWorkspaceMode} />
    </AppStoreProvider>
  );
}

function getTodayDate(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
}
