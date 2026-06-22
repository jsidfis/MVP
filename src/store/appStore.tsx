import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import type { DailyRepository } from '../data/dailyRepository';
import { ensureDemoData } from '../data/demoSeed';
import { exportDailyPlanData } from '../data/exportData';
import { importDailyPlanData } from '../data/importData';
import { createReadableDailyArchive } from '../data/readableExport';
import {
  applyTaskTemplate as buildTasksFromTemplate,
  createTaskTemplate,
  type TaskTemplate,
} from '../data/taskTemplates';
import { calculateMonthlyInsights, type MonthlyInsights } from '../domain/insightRules';
import { buildTask, confirmCarryoverTask } from '../domain/taskRules';
import { completeSession, createSession } from '../domain/timeRules';
import type { DailyFile, Quadrant, Task, TaskSession, UserSettings } from '../domain/types';

export interface AppState {
  today: string;
  dailyFile?: DailyFile;
  settings?: UserSettings;
  tasks: Task[];
  taskTemplates: TaskTemplate[];
  carryoverCandidates: Task[];
  monthlyOverview?: MonthlyOverviewState;
  isLoading: boolean;
}

interface AppActions {
  addTask(input: { title: string; quadrant: Quadrant }): Promise<void>;
  saveTaskTemplate(input: { name: string; taskIds: string[] }): Promise<void>;
  applyTaskTemplate(templateId: string): Promise<void>;
  startTask(taskId: string, oldTaskMode?: OldTaskMode): Promise<void>;
  completeTask(taskId: string): Promise<void>;
  confirmCarryover(taskId: string): Promise<void>;
  hideCarryoverCandidate(taskId: string): void;
  saveSettings(settings: UserSettings): Promise<void>;
  setHomeView(view: UserSettings['homeView']): Promise<void>;
  exportJsonBackup(): Promise<string>;
  exportMarkdownArchive(): Promise<string>;
  importJsonBackup(payload: unknown): Promise<void>;
  resetDemoData(): Promise<void>;
  loadMonthlyOverview(input: { year: number; month: number }): Promise<void>;
}

type AppStoreValue = AppState & AppActions;
type OldTaskMode = 'pause' | 'background';
type StartableTaskStatus = 'not_started' | 'paused' | 'active_background';

export interface MonthlyOverviewState {
  year: number;
  month: number;
  recordedDates: string[];
  tasks: Task[];
  insights: MonthlyInsights;
}

type Action =
  | { type: 'loading'; today: string }
  | {
      type: 'loaded';
      dailyFile: DailyFile;
      settings: UserSettings;
      tasks: Task[];
      taskTemplates: TaskTemplate[];
      carryoverCandidates: Task[];
    }
  | {
      type: 'reloaded';
      dailyFile: DailyFile;
      settings: UserSettings;
      tasks: Task[];
      taskTemplates: TaskTemplate[];
      carryoverCandidates: Task[];
    }
  | { type: 'upsertTask'; task: Task }
  | { type: 'upsertTasks'; tasks: Task[] }
  | { type: 'upsertTaskTemplate'; template: TaskTemplate }
  | { type: 'confirmedCarryover'; task: Task; candidateId: string }
  | { type: 'hiddenCarryoverCandidate'; taskId: string }
  | { type: 'settingsUpdated'; settings: UserSettings }
  | { type: 'monthlyOverviewLoaded'; monthlyOverview: MonthlyOverviewState };

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
  const startingTaskIds = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    dispatch({ type: 'loading', today });

    loadRepositoryState(repository, today).then(
      ({ dailyFile, settings, tasks, taskTemplates, carryoverCandidates }) => {
        if (!cancelled) {
          dispatch({ type: 'loaded', dailyFile, settings, tasks, taskTemplates, carryoverCandidates });
        }
      },
    );

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

  const saveTaskTemplate = useCallback(
    async (input: { name: string; taskIds: string[] }) => {
      const now = new Date().toISOString();
      const template = createTaskTemplate({
        id: crypto.randomUUID(),
        name: input.name,
        tasks: state.tasks,
        selectedTaskIds: input.taskIds,
        now,
      });

      await repository.saveTaskTemplate(template);
      dispatch({ type: 'upsertTaskTemplate', template });
    },
    [repository, state.tasks],
  );

  const applyTaskTemplate = useCallback(
    async (templateId: string) => {
      const template = state.taskTemplates.find((item) => item.id === templateId);

      if (!template) {
        return;
      }

      const now = new Date().toISOString();
      const tasks = buildTasksFromTemplate({
        template,
        date: state.today,
        now,
        idFactory: () => crypto.randomUUID(),
      });

      await Promise.all(tasks.map((task) => repository.saveTask(task)));
      dispatch({ type: 'upsertTasks', tasks });
    },
    [repository, state.taskTemplates, state.today],
  );

  const startTask = useCallback(
    async (taskId: string, oldTaskMode: OldTaskMode = 'pause') => {
      const targetTask = state.tasks.find((task) => task.id === taskId);

      if (!targetTask || targetTask.status === 'active_primary' || !isStartableStatus(targetTask.status)) {
        return;
      }

      if (startingTaskIds.current.has(taskId)) {
        return;
      }

      startingTaskIds.current.add(taskId);

      try {
        const activeTask = state.tasks.find((task) => task.status === 'active_primary');
        const now = new Date().toISOString();
        const openSession = latestOpenSession(await repository.listSessions(taskId));

        if (activeTask) {
          const oldTask = {
            ...activeTask,
            status: oldTaskMode === 'pause' ? ('paused' as const) : ('active_background' as const),
            updatedAt: now,
          };
          const newTask = { ...targetTask, status: 'active_primary' as const, updatedAt: now };

          if (oldTaskMode === 'pause') {
            const oldOpenSession = latestOpenSession(await repository.listSessions(activeTask.id));

            if (oldOpenSession) {
              await repository.saveSession(completeSession(oldOpenSession, now));
            }
          }

          await repository.saveTask(oldTask);
          await repository.saveTask(newTask);
          if (!openSession) {
            await repository.saveSession(createSession(taskId, now));
          }
          dispatch({ type: 'upsertTask', task: oldTask });
          dispatch({ type: 'upsertTask', task: newTask });
          return;
        }

        const task = { ...targetTask, status: 'active_primary' as const, updatedAt: now };
        await repository.saveTask(task);
        if (!openSession) {
          await repository.saveSession(createSession(taskId, now));
        }
        dispatch({ type: 'upsertTask', task });
      } finally {
        startingTaskIds.current.delete(taskId);
      }
    },
    [repository, state.tasks],
  );

  const completeTask = useCallback(
    async (taskId: string) => {
      const targetTask = state.tasks.find((task) => task.id === taskId);

      if (!targetTask) {
        return;
      }

      const now = new Date().toISOString();
      const sessions = await repository.listSessions(taskId);
      const openSession = latestOpenSession(sessions);

      if (openSession) {
        await repository.saveSession(completeSession(openSession, now));
      }

      const task = { ...targetTask, status: 'completed' as const, updatedAt: now };
      await repository.saveTask(task);
      dispatch({ type: 'upsertTask', task });
    },
    [repository, state.tasks],
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

  const saveSettings = useCallback(
    async (settings: UserSettings) => {
      await repository.saveSettings(settings);
      dispatch({ type: 'settingsUpdated', settings });
    },
    [repository],
  );

  const setHomeView = useCallback(
    async (view: UserSettings['homeView']) => {
      const currentSettings = state.settings ?? (await repository.getSettings());
      const settings = { ...currentSettings, homeView: view };

      await saveSettings(settings);
    },
    [repository, saveSettings, state.settings],
  );

  const hideCarryoverCandidate = useCallback((taskId: string) => {
    dispatch({ type: 'hiddenCarryoverCandidate', taskId });
  }, []);

  const exportJsonBackup = useCallback(async () => {
    const data = await exportDailyPlanData(repository);
    return JSON.stringify(data, null, 2);
  }, [repository]);

  const exportMarkdownArchive = useCallback(async () => {
    return createReadableDailyArchive(await exportDailyPlanData(repository));
  }, [repository]);

  const importJsonBackup = useCallback(
    async (payload: unknown) => {
      await importDailyPlanData(repository, payload);
      const loaded = await loadRepositoryState(repository, state.today);
      dispatch({ type: 'reloaded', ...loaded });
    },
    [repository, state.today],
  );

  const resetDemoData = useCallback(async () => {
    await repository.clearAllData();
    await ensureDemoData(repository, state.today);
    const loaded = await loadRepositoryState(repository, state.today);
    dispatch({ type: 'reloaded', ...loaded });
  }, [repository, state.today]);

  const loadMonthlyOverview = useCallback(
    async (input: { year: number; month: number }) => {
      const [dailyFiles, allTasks, sessions] = await Promise.all([
        repository.listDailyFiles(),
        repository.listAllTasks(),
        repository.listAllSessions(),
      ]);
      const monthPrefix = `${input.year}-${String(input.month).padStart(2, '0')}-`;
      const tasks = allTasks.filter((task) => task.date.startsWith(monthPrefix));
      const recordedDates = Array.from(
        new Set([
          ...dailyFiles.filter((file) => file.date.startsWith(monthPrefix)).map((file) => file.date),
          ...tasks.map((task) => task.date),
        ]),
      ).sort();

      dispatch({
        type: 'monthlyOverviewLoaded',
        monthlyOverview: {
          ...input,
          recordedDates,
          tasks,
          insights: calculateMonthlyInsights({ ...input, tasks: allTasks, sessions }),
        },
      });
    },
    [repository],
  );

  const value = useMemo(
    () => ({
      ...state,
      addTask,
      saveTaskTemplate,
      applyTaskTemplate,
      startTask,
      completeTask,
      confirmCarryover,
      hideCarryoverCandidate,
      saveSettings,
      setHomeView,
      exportJsonBackup,
      exportMarkdownArchive,
      importJsonBackup,
      resetDemoData,
      loadMonthlyOverview,
    }),
    [
      addTask,
      saveTaskTemplate,
      applyTaskTemplate,
      completeTask,
      confirmCarryover,
      exportJsonBackup,
      exportMarkdownArchive,
      hideCarryoverCandidate,
      importJsonBackup,
      loadMonthlyOverview,
      resetDemoData,
      saveSettings,
      setHomeView,
      startTask,
      state,
    ],
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
    taskTemplates: [],
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
      const taskTemplates = mergeLoadedTaskTemplates(action.taskTemplates, state.taskTemplates);

      return {
        ...state,
        dailyFile: action.dailyFile,
        settings: state.settings ?? action.settings,
        tasks,
        taskTemplates,
        carryoverCandidates: action.carryoverCandidates.filter(
          (candidate) => !tasks.some((task) => task.id === candidate.id),
        ),
        isLoading: false,
      };
    }
    case 'reloaded':
      return {
        ...state,
        dailyFile: action.dailyFile,
        settings: action.settings,
        tasks: action.tasks,
        taskTemplates: action.taskTemplates,
        carryoverCandidates: action.carryoverCandidates,
        isLoading: false,
      };
    case 'upsertTask':
      return { ...state, tasks: upsertTask(state.tasks, action.task) };
    case 'upsertTasks':
      return { ...state, tasks: action.tasks.reduce(upsertTask, state.tasks) };
    case 'upsertTaskTemplate':
      return { ...state, taskTemplates: upsertTaskTemplate(state.taskTemplates, action.template) };
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
    case 'monthlyOverviewLoaded':
      return { ...state, monthlyOverview: action.monthlyOverview };
  }
}

async function loadRepositoryState(repository: DailyRepository, today: string) {
  const [dailyFile, settings, tasks, taskTemplates, carryoverCandidates] = await Promise.all([
    repository.getDailyFile(today),
    repository.getSettings(),
    repository.listTasks(today),
    repository.listTaskTemplates(),
    repository.listCarryoverCandidates(today),
  ]);

  return { dailyFile, settings, tasks, taskTemplates, carryoverCandidates };
}

function upsertTask(tasks: Task[], task: Task): Task[] {
  return [...tasks.filter((item) => item.id !== task.id), task];
}

function mergeLoadedTasks(loadedTasks: Task[], currentTasks: Task[]): Task[] {
  const currentTaskIds = new Set(currentTasks.map((task) => task.id));

  return [...loadedTasks.filter((task) => !currentTaskIds.has(task.id)), ...currentTasks];
}

function upsertTaskTemplate(templates: TaskTemplate[], template: TaskTemplate): TaskTemplate[] {
  return [...templates.filter((item) => item.id !== template.id), template];
}

function mergeLoadedTaskTemplates(
  loadedTemplates: TaskTemplate[],
  currentTemplates: TaskTemplate[],
): TaskTemplate[] {
  const currentTemplateIds = new Set(currentTemplates.map((template) => template.id));

  return [...loadedTemplates.filter((template) => !currentTemplateIds.has(template.id)), ...currentTemplates];
}

function isStartableStatus(status: Task['status']): status is StartableTaskStatus {
  return status === 'not_started' || status === 'paused' || status === 'active_background';
}

function latestOpenSession(sessions: TaskSession[]): TaskSession | undefined {
  return sessions
    .filter((session) => !session.endedAt)
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];
}
