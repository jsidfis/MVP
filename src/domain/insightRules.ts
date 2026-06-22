import type { Quadrant, ReasonTag, Task, TaskSession } from './types';

export interface DayInsight {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  importantTasks: number;
  completedImportantTasks: number;
  importantCompletionRate: number;
  postponedTasks: number;
  actualDurationMinutes: number;
}

export interface QuadrantInsight {
  quadrant: Quadrant;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface PostponedReasonInsight {
  tag: ReasonTag;
  count: number;
  withNote: number;
}

export interface MonthlyInsights {
  days: DayInsight[];
  quadrants: QuadrantInsight[];
  postponedReasons: PostponedReasonInsight[];
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  importantTasks: number;
  completedImportantTasks: number;
  importantCompletionRate: number;
  postponedTasks: number;
  actualDurationMinutes: number;
}

export interface MonthlyInsightInput {
  year: number;
  month: number;
  tasks: Task[];
  sessions: TaskSession[];
}

const quadrantOrder: Quadrant[] = [
  'important_urgent',
  'important_not_urgent',
  'not_important_urgent',
  'not_important_not_urgent',
];

const importantQuadrants = new Set<Quadrant>(['important_urgent', 'important_not_urgent']);

export function calculateMonthlyInsights(input: MonthlyInsightInput): MonthlyInsights {
  const monthPrefix = `${input.year}-${String(input.month).padStart(2, '0')}-`;
  const monthlyTasks = input.tasks.filter((task) => task.date.startsWith(monthPrefix));
  const monthlyTaskIds = new Set(monthlyTasks.map((task) => task.id));
  const durationByTaskId = aggregateDurationByTaskId(input.sessions, monthlyTaskIds);
  const days = Array.from(new Set(monthlyTasks.map((task) => task.date)))
    .sort()
    .map((date) => buildDayInsight(date, monthlyTasks, durationByTaskId));
  const totalTasks = monthlyTasks.length;
  const completedTasks = monthlyTasks.filter(isCompleted).length;
  const importantTasks = monthlyTasks.filter(isImportant).length;
  const completedImportantTasks = monthlyTasks.filter((task) => isImportant(task) && isCompleted(task)).length;
  const postponedTasks = monthlyTasks.filter((task) => task.status === 'postponed').length;
  const actualDurationMinutes = sum(days.map((day) => day.actualDurationMinutes));

  return {
    days,
    quadrants: quadrantOrder.map((quadrant) => buildQuadrantInsight(quadrant, monthlyTasks)),
    postponedReasons: buildPostponedReasons(monthlyTasks),
    totalTasks,
    completedTasks,
    completionRate: rate(completedTasks, totalTasks),
    importantTasks,
    completedImportantTasks,
    importantCompletionRate: rate(completedImportantTasks, importantTasks),
    postponedTasks,
    actualDurationMinutes,
  };
}

function buildDayInsight(date: string, monthlyTasks: Task[], durationByTaskId: Map<string, number>): DayInsight {
  const tasks = monthlyTasks.filter((task) => task.date === date);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(isCompleted).length;
  const importantTasks = tasks.filter(isImportant).length;
  const completedImportantTasks = tasks.filter((task) => isImportant(task) && isCompleted(task)).length;
  const postponedTasks = tasks.filter((task) => task.status === 'postponed').length;

  return {
    date,
    totalTasks,
    completedTasks,
    completionRate: rate(completedTasks, totalTasks),
    importantTasks,
    completedImportantTasks,
    importantCompletionRate: rate(completedImportantTasks, importantTasks),
    postponedTasks,
    actualDurationMinutes: sum(tasks.map((task) => durationByTaskId.get(task.id) ?? 0)),
  };
}

function buildQuadrantInsight(quadrant: Quadrant, monthlyTasks: Task[]): QuadrantInsight {
  const tasks = monthlyTasks.filter((task) => task.quadrant === quadrant);
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(isCompleted).length;

  return {
    quadrant,
    totalTasks,
    completedTasks,
    completionRate: rate(completedTasks, totalTasks),
  };
}

function buildPostponedReasons(tasks: Task[]): PostponedReasonInsight[] {
  const counts = new Map<ReasonTag, PostponedReasonInsight>();

  for (const task of tasks) {
    if (!task.postponeReasonTag) {
      continue;
    }

    const current = counts.get(task.postponeReasonTag) ?? {
      tag: task.postponeReasonTag,
      count: 0,
      withNote: 0,
    };

    counts.set(task.postponeReasonTag, {
      ...current,
      count: current.count + 1,
      withNote: current.withNote + (task.postponeReasonNote?.trim() ? 1 : 0),
    });
  }

  return Array.from(counts.values()).sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return left.tag.localeCompare(right.tag);
  });
}

function aggregateDurationByTaskId(sessions: TaskSession[], monthlyTaskIds: Set<string>): Map<string, number> {
  const durationByTaskId = new Map<string, number>();

  for (const session of sessions) {
    if (!monthlyTaskIds.has(session.taskId) || session.durationMinutes === undefined) {
      continue;
    }

    durationByTaskId.set(session.taskId, (durationByTaskId.get(session.taskId) ?? 0) + session.durationMinutes);
  }

  return durationByTaskId;
}

function isCompleted(task: Task): boolean {
  return task.status === 'completed';
}

function isImportant(task: Task): boolean {
  return importantQuadrants.has(task.quadrant);
}

function rate(completed: number, total: number): number {
  return total === 0 ? 0 : completed / total;
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
