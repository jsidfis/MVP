import { useState, type ReactNode } from 'react';

export type WorkspacePanelKey = 'add' | 'tasks' | 'search' | 'settings';

const dockItems: Array<{ key: WorkspacePanelKey; label: string; symbol: string }> = [
  { key: 'add', label: '新增任务', symbol: '+' },
  { key: 'tasks', label: '今日任务', symbol: '☰' },
  { key: 'search', label: '搜索', symbol: '⌕' },
  { key: 'settings', label: '设置', symbol: '⚙' },
];

export function WorkspaceDock({
  panels,
  initialPanel,
}: {
  panels: Record<WorkspacePanelKey, ReactNode>;
  initialPanel?: WorkspacePanelKey;
}) {
  const [activePanel, setActivePanel] = useState<WorkspacePanelKey | null>(initialPanel ?? null);

  return (
    <>
      <aside
        className="workspace-drawer"
        aria-label="工作台抽屉"
        hidden={activePanel === null}
      >
        {dockItems.map((item) => (
          <div key={item.key} hidden={activePanel !== item.key}>
            {panels[item.key]}
          </div>
        ))}
      </aside>
      <nav className="workspace-dock" aria-label="工作台工具">
        {dockItems.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-label={item.label}
            aria-pressed={activePanel === item.key}
            onClick={() =>
              setActivePanel((current) => (current === item.key ? null : item.key))
            }
          >
            <span aria-hidden="true">{item.symbol}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
