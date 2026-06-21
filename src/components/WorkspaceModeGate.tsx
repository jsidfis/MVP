import type { WorkspaceMode } from '../data/workspaceMode';

type WorkspaceModeGateProps = {
  onSelect(mode: WorkspaceMode): void;
};

export function WorkspaceModeGate({ onSelect }: WorkspaceModeGateProps) {
  return (
    <main className="app-shell workspace-mode-gate">
      <section className="workspace-mode-panel" aria-label="选择数据空间">
        <p className="workspace-date">便携体验版</p>
        <h1>每日计划与复盘</h1>
        <div className="workspace-mode-actions">
          <button type="button" className="primary-button" onClick={() => onSelect('user')}>
            空白开始
          </button>
          <button type="button" className="secondary-button" onClick={() => onSelect('demo')}>
            查看示例
          </button>
        </div>
      </section>
    </main>
  );
}
