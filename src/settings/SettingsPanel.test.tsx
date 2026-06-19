import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';

describe('SettingsPanel', () => {
  it('saves morning and evening reminder times', async () => {
    const onSave = vi.fn();

    render(
      <SettingsPanel
        settings={{ homeView: 'folder', notificationsEnabled: false }}
        onSave={onSave}
      />,
    );

    await userEvent.type(screen.getByLabelText('早上计划提醒'), '08:30');
    await userEvent.type(screen.getByLabelText('晚上复盘提醒'), '21:30');
    await userEvent.click(screen.getByRole('button', { name: '保存提醒设置' }));

    expect(onSave).toHaveBeenCalledWith({
      homeView: 'folder',
      morningReminder: '08:30',
      eveningReminder: '21:30',
      notificationsEnabled: true,
    });
  });
});
