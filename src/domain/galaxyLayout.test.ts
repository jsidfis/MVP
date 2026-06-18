import { describe, expect, it } from 'vitest';
import { buildGalaxyLayout } from './galaxyLayout';
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
});

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
