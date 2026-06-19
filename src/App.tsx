import { useEffect, useState } from 'react';
import type { DailyRepository } from './data/dailyRepository';
import { createDailyRepository } from './data/repositoryFactory';
import { AppStoreProvider } from './store/appStore';
import { DailyWorkspace } from './views/DailyWorkspace';

const repositoryPromise = createDailyRepository();

export function App() {
  const [repository, setRepository] = useState<DailyRepository | null>(null);

  useEffect(() => {
    let cancelled = false;

    void repositoryPromise.then((createdRepository) => {
      if (!cancelled) {
        setRepository(createdRepository);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!repository) {
    return <main className="app-shell">正在打开今日工作台</main>;
  }

  return (
    <AppStoreProvider repository={repository} today={getTodayDate()}>
      <DailyWorkspace />
    </AppStoreProvider>
  );
}

function getTodayDate(): string {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localDate.toISOString().slice(0, 10);
}
