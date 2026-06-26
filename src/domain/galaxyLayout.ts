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
    .map((task) => {
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
        path: buildGalaxyRoutePath(from, to, task.id),
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

export function buildGalaxyRoutePath(
  from: GalaxyPoint,
  to: GalaxyPoint,
  routeKey: string,
): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy) || 1;
  const seed = hashString(`${routeKey}:${round(from.x)},${round(from.y)}:${round(to.x)},${round(to.y)}`);
  const direction = seededFraction(seed, 1) < 0.5 ? -1 : 1;
  const bend = Math.min(18, Math.max(4, distance * (0.18 + seededFraction(seed, 2) * 0.18)));
  const firstProgress = 0.2 + seededFraction(seed, 3) * 0.22;
  const secondProgress = 0.58 + seededFraction(seed, 4) * 0.22;
  const firstOffset = direction * bend * (0.7 + seededFraction(seed, 5) * 0.55);
  const secondDirection = seededFraction(seed, 6) < 0.32 ? -direction : direction;
  const secondOffset = secondDirection * bend * (0.45 + seededFraction(seed, 7) * 0.75);
  const firstControl = {
    x: clamp(from.x + dx * firstProgress + (-dy / distance) * firstOffset),
    y: clamp(from.y + dy * firstProgress + (dx / distance) * firstOffset),
  };
  const secondControl = {
    x: clamp(from.x + dx * secondProgress + (-dy / distance) * secondOffset),
    y: clamp(from.y + dy * secondProgress + (dx / distance) * secondOffset),
  };

  return [
    `M ${round(from.x)} ${round(from.y)}`,
    `C ${round(firstControl.x)} ${round(firstControl.y)}`,
    `${round(secondControl.x)} ${round(secondControl.y)}`,
    `${round(to.x)} ${round(to.y)}`,
  ].join(' ');
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededFraction(seed: number, salt: number): number {
  let value = seed ^ Math.imul(salt, 0x9e3779b1);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 4294967295;
}

function clamp(value: number): number {
  return Math.min(98, Math.max(2, value));
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function wrapStep(value: number): number {
  return value % 1;
}
