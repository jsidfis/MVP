import type { Task } from './types';

export interface GalaxyPoint {
  x: number;
  y: number;
}

export interface GalaxyPlanet {
  task: Task;
  position: GalaxyPoint;
}

export interface GalaxyRoute {
  task: Task;
  from: GalaxyPoint;
  to: GalaxyPoint;
  path: string;
  completed: boolean;
}

export interface GalaxyLayout {
  planets: GalaxyPlanet[];
  routes: GalaxyRoute[];
}

const QUADRANT_BOUNDS: Record<Task['quadrant'], { minX: number; maxX: number; minY: number; maxY: number }> = {
  important_urgent: { minX: 56, maxX: 88, minY: 12, maxY: 42 },
  important_not_urgent: { minX: 12, maxX: 44, minY: 12, maxY: 42 },
  not_important_urgent: { minX: 56, maxX: 88, minY: 58, maxY: 88 },
  not_important_not_urgent: { minX: 12, maxX: 44, minY: 58, maxY: 88 },
};

const ROUTE_START: GalaxyPoint = { x: 50, y: 50 };

export function buildGalaxyLayout(tasks: Task[]): GalaxyLayout {
  const quadrantOrdinals: Record<Task['quadrant'], number> = {
    important_urgent: 0,
    important_not_urgent: 0,
    not_important_urgent: 0,
    not_important_not_urgent: 0,
  };

  const planets = tasks.map((task) => {
    const ordinal = quadrantOrdinals[task.quadrant];
    quadrantOrdinals[task.quadrant] += 1;

    return {
      task,
      position: positionForTask(task, ordinal),
    };
  });

  const planetById = new Map(planets.map((planet) => [planet.task.id, planet]));
  let previousPoint = ROUTE_START;

  const routes = tasks
    .filter((task) => task.status === 'completed' || task.status === 'active_primary')
    .map((task, routeIndex) => {
      const planet = planetById.get(task.id);
      if (!planet) {
        throw new Error(`Missing planet for task ${task.id}`);
      }

      const from = previousPoint;
      const to = planet.position;
      previousPoint = to;

      return {
        task,
        from,
        to,
        path: buildRoutePath(from, to, routeIndex),
        completed: task.status === 'completed',
      };
    });

  return { planets, routes };
}

function positionForTask(task: Task, ordinal: number): GalaxyPoint {
  const bounds = QUADRANT_BOUNDS[task.quadrant];
  const cycle = ordinal % 11;
  const lap = Math.floor(ordinal / 11);
  const columnStep = wrapStep(((cycle * 7) % 11) / 10 + lap * 0.07);
  const rowStep = wrapStep(((cycle * 5 + 3) % 11) / 10 + lap * 0.09);

  return {
    x: round(bounds.minX + (bounds.maxX - bounds.minX) * columnStep),
    y: round(bounds.minY + (bounds.maxY - bounds.minY) * rowStep),
  };
}

function buildRoutePath(from: GalaxyPoint, to: GalaxyPoint, routeIndex: number): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const bend = (routeIndex % 2 === 0 ? 1 : -1) * Math.min(12, distance * 0.28);
  const perpendicularX = (-dy / distance) * bend;
  const perpendicularY = (dx / distance) * bend;
  const firstControl = {
    x: from.x + dx * 0.35 + perpendicularX,
    y: from.y + dy * 0.35 + perpendicularY,
  };
  const secondControl = {
    x: from.x + dx * 0.65 + perpendicularX,
    y: from.y + dy * 0.65 + perpendicularY,
  };

  return [
    `M ${round(from.x)} ${round(from.y)}`,
    `C ${round(firstControl.x)} ${round(firstControl.y)}`,
    `${round(secondControl.x)} ${round(secondControl.y)}`,
    `${round(to.x)} ${round(to.y)}`,
  ].join(' ');
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function wrapStep(value: number): number {
  return value % 1;
}
