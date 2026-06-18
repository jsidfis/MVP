import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { DailyRepository } from '../data/dailyRepository';
import { buildTask, confirmCarryoverTask } from '../domain/taskRules';
import type { DailyFile, Quadrant, Task, UserSettings } from '../domain/types';

const DEFAULT_SETTINGS: UserSettings = {
  homeView: 'folder',
  notificationsEnabled: false,
};

export interface AppState {
  today: string;
  dailyFile?: DailyFile;
  settings?: UserSettings;
  tasks: Task[];
  carryoverCandidates: Task[];
  isLoading: boolean;
}

interface AppActions {
  addTask(input: { title: string; quadrant: Quadrant }): Promise<void>;
  confirmCarryover(taskId: string): Promise<void>;
  setHomeView(view: UserSettings['homeView']): Promise<void>;
}

type AppStoreValue = AppState & AppActions;

type Action =
  | { type: 'loading'; today: string }
  | {
      type: 'loaded';
      dailyFile: DailyFile;
      settings: UserSettings;
      tasks: Task[];
      carryoverCandidates: Task[];
    }
  | { type: 'upsertTask'; task: Task }
  | { type: 'confirmedCarryover'; task: Task; candidateId: string }
  | { type: 'settingsUpdated'; settings: UserSettings };

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({
  repository,
  today,
  children,
}: {
  repository: DailyRepository;
  today: string;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, initialState(today));

  useEffect(() => {
    let cancelled = false;

    dispatch({ type: 'loading', today });

    Promise.all([
      repository.getDailyFile(today),
      repository.getSettings(),
      repository.listTasks(today),
      repository.listCarryoverCandidates(today),
    ]).then(([dailyFile, settings, tasks, carryoverCandidates]) => {
      if (!cancelled) {
        dispatch({ type: 'loaded', dailyFile, settings, tasks, carryoverCandidates });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [repository, today]);

  const addTask = useCallback(
    async (input: { title: string; quadrant: Quadrant }) => {
      const now = new Date().toISOString();
      const task = buildTask({ ...input, now, date: state.today });

      await repository.saveTask(task);
      dispatch({ type: 'upsertTask', task });
    },
    [repository, state.today],
  );

  const confirmCarryover = useCallback(
    async (taskId: string) => {
      const candidate = state.carryoverCandidates.find((task) => task.id === taskId);

      if (!candidate) {
        return;
      }

      const task = confirmCarryoverTask(candidate, state.today);
      await repository.saveTask(task);
      dispatch({ type: 'confirmedCarryover', task, candidateId: taskId });
    },
    [repository, state.carryoverCandidates, state.today],
  );

  const setHomeView = useCallback(
    async (view: UserSettings['homeView']) => {
      const settings = { ...(state.settings ?? DEFAULT_SETTINGS), homeView: view };

      await repository.saveSettings(settings);
      dispatch({ type: 'settingsUpdated', settings });
    },
    [repository, state.settings],
  );

  const value = useMemo(
    () => ({
      ...state,
      addTask,
      confirmCarryover,
      setHomeView,
    }),
    [addTask, confirmCarryover, setHomeView, state],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const store = useContext(AppStoreContext);

  if (!store) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }

  return store;
}

function initialState(today: string): AppState {
  return {
    today,
    tasks: [],
    carryoverCandidates: [],
    isLoading: true,
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'loading':
      return { ...state, today: action.today, isLoading: true };
    case 'loaded':
      return {
        ...state,
        dailyFile: action.dailyFile,
        settings: action.settings,
        tasks: action.tasks,
        carryoverCandidates: action.carryoverCandidates,
        isLoading: false,
      };
    case 'upsertTask':
      return { ...state, tasks: upsertTask(state.tasks, action.task) };
    case 'confirmedCarryover':
      return {
        ...state,
        tasks: upsertTask(state.tasks, action.task),
        carryoverCandidates: state.carryoverCandidates.filter((task) => task.id !== action.candidateId),
      };
    case 'settingsUpdated':
      return { ...state, settings: action.settings };
  }
}

function upsertTask(tasks: Task[], task: Task): Task[] {
  return [...tasks.filter((item) => item.id !== task.id), task];
}
