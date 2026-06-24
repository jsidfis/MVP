import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { WorkspaceDock } from './WorkspaceDock';

describe('WorkspaceDock', () => {
  it('keeps one drawer open at a time and preserves mounted panel state', async () => {
    render(
      <WorkspaceDock
        panels={{
          add: <input aria-label="任务草稿" />,
          tasks: <p>今日任务内容</p>,
          search: <p>搜索内容</p>,
          settings: <p>设置内容</p>,
        }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: '新增任务' }));
    await userEvent.type(screen.getByLabelText('任务草稿'), '临时新增');
    await userEvent.click(screen.getByRole('button', { name: '搜索' }));

    expect(screen.getByLabelText('任务草稿').closest('[hidden]')).toBeTruthy();
    expect(screen.getByText('搜索内容').closest('[hidden]')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: '新增任务' }));
    expect((screen.getByLabelText('任务草稿') as HTMLInputElement).value).toBe('临时新增');
  });
});
