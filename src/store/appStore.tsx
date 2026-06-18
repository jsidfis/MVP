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
  hideCarryoverCandidate(taskId: string): void;
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
  | { type: 'hiddenCarryoverCandidate'; taskId: string }
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
      const currentSettings = state.settings ?? (await repository.getSettings());
      const settings = { ...currentSettings, homeView: view };

      await repository.saveSettings(settings);
      dispatch({ type: 'settingsUpdated', settings });
    },
    [repository, state.settings],
  );

  const hideCarryoverCandidate = useCallback((taskId: string) => {
    dispatch({ type: 'hiddenCarryoverCandidate', taskId });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      addTask,
      confirmCarryover,
      hideCarryoverCandidate,
      setHomeView,
    }),
    [addTask, confirmCarryover, hideCarryoverCandidate, setHomeView, state],
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
    case 'loaded': {
      const tasks = mergeLoadedTasks(action.tasks, state.tasks);

      return {
        ...state,
        dailyFile: action.dailyFile,
        settings: state.settings ?? action.settings,
        tasks,
        carryoverCandidates: action.carryoverCandidates.filter(
          (candidate) => !tasks.some((task) => task.id === candidate.id),
        ),
        isLoading: false,
      };
    }
    case 'upsertTask':
      return { ...state, tasks: upsertTask(state.tasks, action.task) };
    case 'confirmedCarryover':
      return {
        ...state,
        tasks: upsertTask(state.tasks, action.task),
        carryoverCandidates: state.carryoverCandidates.filter((task) => task.id !== action.candidateId),
      };
    case 'hiddenCarryoverCandidate':
      return {
        ...state,
        carryoverCandidates: state.carryoverCandidates.filter((task) => task.id !== action.taskId),
      };
    case 'settingsUpdated':
      return { ...state, settings: action.settings };
  }
}

function upsertTask(tasks: Task[], task: Task): Task[] {
  return [...tasks.filter((item) => item.id !== task.id), task];
}

function mergeLoadedTasks(loadedTasks: Task[], currentTasks: Task[]): Task[] {
  const currentTaskIds = new Set(currentTasks.map((task) => task.id));

  return [...loadedTasks.filter((task) => !currentTaskIds.has(task.id)), ...currentTasks];
}
