import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryDailyRepository } from '../data/memoryDailyRepository';
import type { WorkspaceMode } from '../data/workspaceMode';
import type { Task } from '../domain/types';
import { AppStoreProvider } from '../store/appStore';
import { DailyWorkspace } from './DailyWorkspace';

const today = '2026-06-18';
const generatedTaskId = '00000000-0000-4000-8000-000000000002';

describe('DailyWorkspace task templates', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('saves selected tasks as a template and applies the template from the side panel', async () => {
    vi.spyOn(crypto, 'randomUUID')
      .mockReturnValueOnce('00000000-0000-4000-8000-000000000001')
      .mockReturnValueOnce(generatedTaskId);
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-06-18T09:30:00.000Z');
    const repository = new MemoryDailyRepository();
    await repository.saveTask(task('task-1', 'Write plan', 30));

    renderWorkspace(repository);

    expect(await screen.findByRole('heading', { name: '任务模板' })).toBeTruthy();
    await userEvent.type(screen.getByLabelText('模板名称'), 'Morning routine');
    await userEvent.click(screen.getByRole('checkbox', { name: /Write plan/ }));
    await userEvent.click(screen.getByRole('button', { name: '保存为模板' }));

    expect(await screen.findByRole('button', { name: '应用 Morning routine' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: '应用 Morning routine' }));

    await waitFor(async () => {
      const tasks = await repository.listTasks(today);
      expect(tasks.map((item) => item.id)).toEqual(['task-1', generatedTaskId]);
    });
  });
});

function renderWorkspace(
  repository: MemoryDailyRepository,
  workspaceMode: WorkspaceMode = 'user',
  onChangeWorkspaceMode: (mode: WorkspaceMode) => void = vi.fn(),
) {
  return render(
    <AppStoreProvider repository={repository} today={today}>
      <DailyWorkspace workspaceMode={workspaceMode} onChangeWorkspaceMode={onChangeWorkspaceMode} />
    </AppStoreProvider>,
  );
}

function task(id: string, title: string, plannedDurationMinutes?: number): Task {
  return {
    id,
    date: today,
    title,
    quadrant: 'important_urgent',
    status: 'not_started',
    isCarryover: false,
    plannedDurationMinutes,
    createdAt: '2026-06-18T08:00:00.000Z',
    updatedAt: '2026-06-18T08:00:00.000Z',
  };
}
