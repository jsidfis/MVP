import type { Quadrant, Task } from '../domain/types';

export interface TaskTemplateItem {
  title: string;
  quadrant: Quadrant;
  plannedDurationMinutes?: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  items: TaskTemplateItem[];
  createdAt: string;
  updatedAt: string;
}

export function createTaskTemplate(input: {
  id: string;
  name: string;
  tasks: Task[];
  selectedTaskIds: string[];
  now: string;
}): TaskTemplate {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Template name is required');
  }

  const taskById = new Map(input.tasks.map((task) => [task.id, task]));
  const items = input.selectedTaskIds
    .map((taskId) => taskById.get(taskId))
    .filter((task): task is Task => Boolean(task))
    .map(toTemplateItem);

  if (items.length === 0) {
    throw new Error('Template must include at least one task');
  }

  return {
    id: input.id,
    name,
    items,
    createdAt: input.now,
    updatedAt: input.now,
  };
}

export function applyTaskTemplate(input: {
  template: TaskTemplate;
  date: string;
  now: string;
  idFactory: (item: TaskTemplateItem, index: number) => string;
}): Task[] {
  return input.template.items.map((item, index) => ({
    id: input.idFactory(item, index),
    date: input.date,
    title: item.title,
    quadrant: item.quadrant,
    status: 'not_started',
    isCarryover: false,
    plannedDurationMinutes: item.plannedDurationMinutes,
    createdAt: input.now,
    updatedAt: input.now,
  }));
}

function toTemplateItem(task: Task): TaskTemplateItem {
  return {
    title: task.title,
    quadrant: task.quadrant,
    plannedDurationMinutes: task.plannedDurationMinutes,
  };
}
