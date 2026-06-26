import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Task } from '../domain/types';
import { GalaxyView } from './GalaxyView';

describe('GalaxyView', () => {
  it('renders a daily star map with routes, active ship, and completed flags', () => {
    render(
      <GalaxyView
        tasks={[
          task('completed-1', 'completed', 'important_urgent'),
          task('active-1', 'active_primary', 'important_not_urgent'),
        ]}
      />,
    );

    expect(screen.getByRole('heading', { name: '今日星图' })).toBeTruthy();
    expect(screen.getByLabelText('四象限星图')).toBeTruthy();
    expect(screen.getAllByLabelText('飞行轨迹')).toHaveLength(2);
    expect(screen.getByLabelText('当前飞船')).toBeTruthy();
    expect(screen.getByLabelText('完成旗帜')).toBeTruthy();
    expect(screen.getByLabelText('重要且紧急象限')).toBeTruthy();
    expect(screen.getByLabelText('重要不紧急象限')).toBeTruthy();
    expect(screen.getByLabelText('不重要但紧急象限')).toBeTruthy();
    expect(screen.getByLabelText('不重要不紧急象限')).toBeTruthy();
    expect(
      screen.getByText('Task completed-1').closest('[data-quadrant]')?.getAttribute('data-quadrant'),
    ).toBe('important_urgent');
    const activeShip = screen.getByLabelText('当前飞船');
    expect(activeShip.getAttribute('data-route-path')).toBeTruthy();
    expect(
      screen.getAllByLabelText('飞行轨迹')[0].closest('svg')?.getAttribute('preserveAspectRatio'),
    ).toBe('none');
    expect(activeShip.querySelector('[data-testid="ufo-cabin"]')).toBeTruthy();
    expect(activeShip.querySelector('[data-testid="ufo-body"]')).toBeTruthy();
    expect(activeShip.querySelector('[data-testid="ufo-thruster"]')).toBeTruthy();
  });

  it('keeps the star map visible for an empty day', () => {
    render(<GalaxyView tasks={[]} />);

    expect(screen.getByLabelText('四象限星图')).toBeTruthy();
    expect(screen.getByText('暂无任务')).toBeTruthy();
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
