import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '../domain/types';
import { ReviewWorkspace } from './ReviewWorkspace';

describe('ReviewWorkspace', () => {
  it('keeps the selected view as a dimmed background behind the review drawer', () => {
    render(
      <ReviewWorkspace
        currentView="galaxy"
        tasks={[task()]}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('复盘背景')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '今日星图' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '晚间复盘' })).toBeTruthy();
  });
});

function task(): Task {
  return {
    id: 'task-1',
    date: '2026-06-24',
    title: '整理项目计划',
    quadrant: 'important_urgent',
    status: 'not_started',
    isCarryover: false,
    createdAt: '2026-06-24T08:00:00.000Z',
    updatedAt: '2026-06-24T08:00:00.000Z',
  };
}
