import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { UserSettings } from '../domain/types';
import { ExecutionWorkspace } from './ExecutionWorkspace';

const settings: UserSettings = {
  homeView: 'folder',
  notificationsEnabled: false,
};

describe('ExecutionWorkspace', () => {
  it('renders the selected view as the main canvas with an on-demand dock', async () => {
    renderWorkspace();

    expect(screen.getByLabelText('执行工作区')).toBeTruthy();
    expect(screen.getByRole('heading', { name: '文件夹视图' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '本地搜索' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: '搜索' }));
    expect(screen.getByRole('heading', { name: '本地搜索' }).closest('[hidden]')).toBeNull();
  });

  it('preserves a quick-add draft while switching drawers', async () => {
    renderWorkspace();

    await userEvent.click(screen.getByRole('button', { name: '新增任务' }));
    await userEvent.type(screen.getByLabelText('任务标题'), '临时新增');
    await userEvent.click(screen.getByRole('button', { name: '设置' }));
    await userEvent.click(screen.getByRole('button', { name: '新增任务' }));

    expect((screen.getByLabelText('任务标题') as HTMLInputElement).value).toBe('临时新增');
  });
});

function renderWorkspace() {
  return render(
    <ExecutionWorkspace
      currentView="folder"
      tasks={[]}
      settings={settings}
      canResetDemo={false}
      onAddTask={vi.fn()}
      onStartTask={vi.fn()}
      onCompleteTask={vi.fn()}
      onSearch={vi.fn().mockResolvedValue([])}
      onSaveSettings={vi.fn()}
      onExportJson={vi.fn().mockResolvedValue('{}')}
      onExportMarkdown={vi.fn().mockResolvedValue('')}
      onImportJson={vi.fn()}
      onResetDemo={vi.fn()}
    />,
  );
}
