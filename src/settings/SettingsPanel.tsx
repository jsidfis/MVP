import { useState } from 'react';
import type { UserSettings } from '../domain/types';

type SettingsPanelProps = {
  settings: UserSettings;
  onSave(settings: UserSettings): void;
};

export function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [morningReminder, setMorningReminder] = useState(settings.morningReminder ?? '');
  const [eveningReminder, setEveningReminder] = useState(settings.eveningReminder ?? '');

  function submit(event: React.FormEvent) {
    event.preventDefault();

    onSave({
      ...settings,
      morningReminder,
      eveningReminder,
      notificationsEnabled: true,
    });
  }

  return (
    <form className="settings-panel" onSubmit={submit}>
      <h2>提醒设置</h2>
      <label className="field">
        早上计划提醒
        <input
          type="time"
          value={morningReminder}
          onChange={(event) => setMorningReminder(event.target.value)}
        />
      </label>
      <label className="field">
        晚上复盘提醒
        <input
          type="time"
          value={eveningReminder}
          onChange={(event) => setEveningReminder(event.target.value)}
        />
      </label>
      <button type="submit" className="primary-button">
        保存提醒设置
      </button>
    </form>
  );
}
