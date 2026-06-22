import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryDailyRepository } from '../data/memoryDailyRepository';
import type { WorkspaceMode } from '../data/workspaceMode';
import type { Task } from '../domain/types';
import { AppStoreProvider } from '../store/appStore';
import { DailyWorkspace } from './DailyWorkspace';

const today = '2026-06-18';

describe('DailyWorkspace', () => {
  it('adds a task with title and quadrant through the store', async () => {
    const repository = new MemoryDailyRepository();
    renderWorkspace(repository);

    await waitForLoaded();
    await userEvent.type(screen.getByLabelText('任务标题'), '整理项目计划');
    await userEvent.selectOptions(screen.getByLabelText('四象限'), 'important_not_urgent');
    await userEvent.click(screen.getByRole('button', { name: '添加任务' }));

    expect(await screen.findByText('整理项目计划')).toBeTruthy();
    const [saved] = await repository.listTasks(today);
    expect(saved).toMatchObject({
      date: today,
      title: '整理项目计划',
      quadrant: 'important_not_urgent',
      status: 'not_started',
    });
  });

  it('switches from folder view to galaxy view', async () => {
    const repository = new MemoryDailyRepository();
    renderWorkspace(repository);

    await waitForLoaded();
    expect(screen.getByRole('heading', { name: '文件夹视图' })).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: '星系视图' }));

    expect(await screen.findByRole('heading', { name: '今日星图' })).toBeTruthy();
  });

  it('confirms a carryover candidate into today', async () => {
    const repository = new MemoryDailyRepository();
    await repository.saveTask(task('task-yesterday', '2026-06-17', '昨天的任务'));
    renderWorkspace(repository);

    const inbox = await screen.findByRole('region', { name: '待确认顺延任务' });
    expect(within(inbox).getByText('昨天的任务')).toBeTruthy();

    await userEvent.click(within(inbox).getByRole('button', { name: '加入今天' }));

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: '待确认顺延任务' })).toBeNull();
    });
    expect(screen.getByText('昨天的任务')).toBeTruthy();
    const [saved] = await repository.listTasks(today);
    expect(saved).toMatchObject({
      id: 'task-yesterday',
      date: today,
      title: '昨天的任务',
      status: 'not_started',
      isCarryover: true,
      carryoverFromDate: '2026-06-17',
    });
  });

  it('hides a carryover candidate without adding it to today', async () => {
    const repository = new MemoryDailyRepository();
    await repository.saveTask(task('task-yesterday', '2026-06-17', '昨天的任务'));
    renderWorkspace(repository);

    const inbox = await screen.findByRole('region', { name: '待确认顺延任务' });
    expect(within(inbox).getByText('昨天的任务')).toBeTruthy();

    await userEvent.click(within(inbox).getByRole('button', { name: '忽略' }));

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: '待确认顺延任务' })).toBeNull();
    });
    expect(screen.queryByText('昨天的任务')).toBeNull();
    await expect(repository.listTasks(today)).resolves.toEqual([]);
  });

  it('shows the current workspace mode and can switch to demo data', async () => {
    const repository = new MemoryDailyRepository();
    const onChangeWorkspaceMode = vi.fn();
    renderWorkspace(repository, 'user', onChangeWorkspaceMode);

    await waitForLoaded();

    expect(screen.getByText('我的数据')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: '切换到示例' }));

    expect(onChangeWorkspaceMode).toHaveBeenCalledWith('demo');
  });

  it('shows data safety controls in the workspace side panel', async () => {
    const repository = new MemoryDailyRepository();
    renderWorkspace(repository);

    await waitForLoaded();

    expect(screen.getByText('data/user.sqlite')).toBeTruthy();
    expect(screen.getByText('data/demo.sqlite')).toBeTruthy();
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

async function waitForLoaded() {
  await waitFor(() => expect(screen.queryByText('加载中')).toBeNull());
}

function task(id: string, date: string, title: string): Task {
  return {
    id,
    date,
    title,
    quadrant: 'important_urgent',
    status: 'postponed',
    isCarryover: false,
    postponeReasonTag: 'time_estimate_error',
    postponeReasonNote: '预估偏短',
    createdAt: `${date}T08:00:00.000Z`,
    updatedAt: `${date}T18:00:00.000Z`,
  };
}
