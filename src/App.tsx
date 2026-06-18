import { MemoryDailyRepository } from './data/memoryDailyRepository';
import { AppStoreProvider } from './store/appStore';
import { DailyWorkspace } from './views/DailyWorkspace';

const repository = new MemoryDailyRepository();

export function App() {
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
