import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceModeGate } from './WorkspaceModeGate';

describe('WorkspaceModeGate', () => {
  it('lets the user start with blank data', async () => {
    const onSelect = vi.fn();

    render(<WorkspaceModeGate onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: '空白开始' }));

    expect(onSelect).toHaveBeenCalledWith('user');
  });

  it('lets the user view demo data', async () => {
    const onSelect = vi.fn();

    render(<WorkspaceModeGate onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: '查看示例' }));

    expect(onSelect).toHaveBeenCalledWith('demo');
  });
});
