import type { Quadrant, ReasonTag, Task, TaskStatus } from './types';

export interface TaskSearchFilters {
  keyword?: string;
  dateFrom?: string;
  dateTo?: string;
  quadrant?: Quadrant;
  status?: TaskStatus;
  reasonTag?: ReasonTag;
}

export function searchTasks(tasks: Task[], filters: TaskSearchFilters): Task[] {
  const keyword = filters.keyword?.trim().toLocaleLowerCase();

  return tasks
    .filter((task) => !keyword || task.title.toLocaleLowerCase().includes(keyword))
    .filter((task) => !filters.dateFrom || task.date >= filters.dateFrom)
    .filter((task) => !filters.dateTo || task.date <= filters.dateTo)
    .filter((task) => !filters.quadrant || task.quadrant === filters.quadrant)
    .filter((task) => !filters.status || task.status === filters.status)
    .filter((task) => !filters.reasonTag || task.postponeReasonTag === filters.reasonTag)
    .sort(
      (left, right) =>
        right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt),
    );
}
