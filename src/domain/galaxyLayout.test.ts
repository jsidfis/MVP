import { describe, expect, it } from 'vitest';
import { buildGalaxyLayout, buildGalaxyRoutePath } from './galaxyLayout';
import type { Task } from './types';

describe('buildGalaxyLayout', () => {
  it('starts the first completed route from the map center using a curved path', () => {
    const layout = buildGalaxyLayout([
      task('completed-1', 'completed', 'important_urgent'),
    ]);

    expect(layout.planets).toHaveLength(1);
    expect(layout.routes).toHaveLength(1);
    expect(layout.routes[0].from).toEqual({ x: 50, y: 50 });
    expect(layout.routes[0].to).toEqual(layout.planets[0].position);
    expect(layout.routes[0].path).toContain('C');
    expect(layout.routes[0].completed).toBe(true);
  });

  it('connects later route planets in completed and active order', () => {
    const layout = buildGalaxyLayout([
      task('completed-1', 'completed', 'important_urgent'),
      task('active-1', 'active_primary', 'important_not_urgent'),
    ]);

    expect(layout.routes).toHaveLength(2);
    expect(layout.routes[1].from).toEqual(layout.planets[0].position);
    expect(layout.routes[1].to).toEqual(layout.planets[1].position);
    expect(layout.routes[1].path).toContain('C');
    expect(layout.routes[1].completed).toBe(false);
  });

  it('keeps a planet stable when a task is inserted in another quadrant', () => {
    const baseLayout = buildGalaxyLayout([
      task('target', 'not_started', 'important_urgent'),
    ]);
    const layoutWithOtherQuadrant = buildGalaxyLayout([
      task('other', 'not_started', 'important_not_urgent'),
      task('target', 'not_started', 'important_urgent'),
    ]);

    expect(positionFor(baseLayout, 'target')).toEqual(positionFor(layoutWithOtherQuadrant, 'target'));
  });

  it('assigns unique positions to several tasks in the same quadrant', () => {
    const layout = buildGalaxyLayout(
      Array.from({ length: 12 }, (_, index) =>
        task(`task-${index}`, 'not_started', 'important_urgent'),
      ),
    );

    const positions = layout.planets.map((planet) => `${planet.position.x},${planet.position.y}`);

    expect(new Set(positions).size).toBe(positions.length);
  });

  it('keeps a task route stable for the same identity and endpoints', () => {
    const from = { x: 18, y: 64 };
    const to = { x: 82, y: 24 };

    expect(buildGalaxyRoutePath(from, to, 'stable-task')).toBe(
      buildGalaxyRoutePath(from, to, 'stable-task'),
    );
  });

  it('varies route controls for different task identities with the same endpoints', () => {
    const from = { x: 18, y: 64 };
    const to = { x: 82, y: 24 };

    expect(buildGalaxyRoutePath(from, to, 'task-alpha')).not.toBe(
      buildGalaxyRoutePath(from, to, 'task-beta'),
    );
  });

  it('keeps the route path endpoints equal to the route coordinates', () => {
    const from = { x: 18.4, y: 64.2 };
    const to = { x: 82.3, y: 24.7 };
    const path = buildGalaxyRoutePath(from, to, 'endpoint-task');

    expect(path).toMatch(/^M 18\.4 64\.2 C /);
    expect(path).toMatch(/ 82\.3 24\.7$/);
  });
});

function positionFor(layout: ReturnType<typeof buildGalaxyLayout>, taskId: string) {
  const planet = layout.planets.find((item) => item.task.id === taskId);

  if (!planet) {
    throw new Error(`Missing planet ${taskId}`);
  }

  return planet.position;
}

function task(id: string, status: Task['status'], quadrant: Task['quadrant']): Task {
  return {
    id,
    date: '2026-06-18',
    title: `Task ${id}`,
    quadrant,
    status,
    isCarryover: false,
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-18T08:00:00.000Z',
  };
}
