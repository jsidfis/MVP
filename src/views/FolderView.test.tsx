import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Task } from '../domain/types';
import { FolderView } from './FolderView';

describe('FolderView', () => {
  it('groups tasks into four floors and orders each floor by task rules', () => {
    render(
      <FolderView
        tasks={[
          task('not-started-important-urgent', '未开始任务', 'important_urgent', 'not_started', '2026-06-18T09:00:00.000Z'),
          task('active-important-urgent', '进行中任务', 'important_urgent', 'active_primary', '2026-06-18T10:00:00.000Z'),
          task('important-not-urgent', '重要不紧急', 'important_not_urgent', 'not_started', '2026-06-18T08:00:00.000Z'),
        ]}
      />,
    );

    const fourthFloor = screen.getByRole('region', { name: '4F 重要且紧急' });
    const fourthFloorItems = within(fourthFloor).getAllByRole('listitem');
    expect(fourthFloorItems).toHaveLength(2);
    expect(fourthFloorItems.map((item) => item.textContent)).toEqual([
      expect.stringContaining('进行中任务'),
      expect.stringContaining('未开始任务'),
    ]);

    const thirdFloor = screen.getByRole('region', { name: '3F 重要不紧急' });
    expect(within(thirdFloor).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('重要不紧急'),
    ]);

    expect(screen.getByRole('region', { name: '2F 不重要但紧急' })).toBeTruthy();
    expect(screen.getByRole('region', { name: '1F 不重要不紧急' })).toBeTruthy();
  });
});

function task(
  id: string,
  title: string,
  quadrant: Task['quadrant'],
  status: Task['status'],
  createdAt: string,
): Task {
  return {
    id,
    date: '2026-06-18',
    title,
    quadrant,
    status,
    isCarryover: false,
    createdAt,
    updatedAt: createdAt,
  };
}
