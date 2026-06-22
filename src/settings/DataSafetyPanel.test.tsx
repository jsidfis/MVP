import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DataSafetyPanel } from './DataSafetyPanel';

describe('DataSafetyPanel', () => {
  it('shows user and demo database locations', () => {
    renderPanel();

    expect(screen.getByText('data/user.sqlite')).toBeTruthy();
    expect(screen.getByText('data/demo.sqlite')).toBeTruthy();
  });

  it('calls the JSON export handler', async () => {
    const onExportJson = vi.fn().mockResolvedValue('{}');
    renderPanel({ onExportJson });

    await userEvent.click(screen.getByRole('button', { name: '导出 JSON 备份' }));

    expect(onExportJson).toHaveBeenCalledOnce();
    expect(await screen.findByText('JSON 备份已生成')).toBeTruthy();
  });

  it('shows an error for invalid import JSON', async () => {
    const onImportJson = vi.fn();
    renderPanel({ onImportJson });

    await userEvent.type(screen.getByLabelText('粘贴 JSON 备份内容'), 'not-json');
    await userEvent.click(screen.getByRole('button', { name: '导入 JSON 备份' }));

    expect(onImportJson).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe('导入内容不是有效 JSON');
  });

  it('calls the demo reset handler', async () => {
    const onResetDemo = vi.fn();
    renderPanel({ onResetDemo });

    await userEvent.click(screen.getByRole('button', { name: '重置示例数据' }));

    expect(onResetDemo).toHaveBeenCalledOnce();
  });
});

function renderPanel(
  overrides: Partial<ComponentProps<typeof DataSafetyPanel>> = {},
) {
  render(
    <DataSafetyPanel
      onExportJson={vi.fn().mockResolvedValue('{}')}
      onExportMarkdown={vi.fn().mockResolvedValue('# archive')}
      onImportJson={vi.fn().mockResolvedValue(undefined)}
      onResetDemo={vi.fn().mockResolvedValue(undefined)}
      {...overrides}
    />,
  );
}
