import { useEffect, useState } from 'react';
import { CarryoverInbox } from '../components/CarryoverInbox';
import { StageTabs } from '../components/StageTabs';
import { TaskQuickAdd } from '../components/TaskQuickAdd';
import { ViewSwitch } from '../components/ViewSwitch';
import type { WorkspaceMode } from '../data/workspaceMode';
import type { HomeView, Stage } from '../domain/types';
import { SettingsPanel } from '../settings/SettingsPanel';
import { useAppStore } from '../store/appStore';
import { FolderView } from './FolderView';
import { GalaxyView } from './GalaxyView';
import { ReviewPanel } from './ReviewPanel';

type DailyWorkspaceProps = {
  workspaceMode: WorkspaceMode;
  onChangeWorkspaceMode(mode: WorkspaceMode): void;
};

export function DailyWorkspace({ workspaceMode, onChangeWorkspaceMode }: DailyWorkspaceProps) {
  const {
    today,
    dailyFile,
    settings,
    tasks,
    carryoverCandidates,
    isLoading,
    addTask,
    startTask,
    completeTask,
    confirmCarryover,
    hideCarryoverCandidate,
    saveSettings,
    setHomeView,
    exportJsonBackup,
    exportMarkdownArchive,
    importJsonBackup,
    resetDemoData,
  } = useAppStore();
  const [stage, setStage] = useState<Stage>('plan');
  const currentView = settings?.homeView ?? 'folder';
  const currentSettings = settings ?? { homeView: currentView, notificationsEnabled: false };

  useEffect(() => {
    if (dailyFile?.stage) {
      setStage(dailyFile.stage);
    }
  }, [dailyFile?.stage]);

  if (isLoading) {
    return (
      <main className="app-shell workspace-shell">
        <p className="loading-state">加载中</p>
      </main>
    );
  }

  return (
    <main className="app-shell workspace-shell">
      <header className="workspace-header">
        <div>
          <p className="workspace-date">{today}</p>
          <h1>今天工作台</h1>
        </div>
        <div className="workspace-header-actions">
          <span className="workspace-mode-badge">
            {workspaceMode === 'demo' ? '示例数据' : '我的数据'}
          </span>
          <button
            type="button"
            className="secondary-button"
            onClick={() => onChangeWorkspaceMode(workspaceMode === 'demo' ? 'user' : 'demo')}
          >
            {workspaceMode === 'demo' ? '切换到我的数据' : '切换到示例'}
          </button>
          <button type="button" className="secondary-button">
            月度总览
          </button>
        </div>
      </header>

      <section className="workspace-toolbar" aria-label="工作台控制">
        <StageTabs currentStage={stage} onChange={setStage} />
        <ViewSwitch currentView={currentView} onChange={(view: HomeView) => void setHomeView(view)} />
      </section>

      <div className="workspace-grid">
        <div className="workspace-main">
          {currentView === 'galaxy' ? (
            <GalaxyView
              tasks={tasks}
              onStartTask={(taskId) => void startTask(taskId, 'pause')}
              onCompleteTask={(taskId) => void completeTask(taskId)}
            />
          ) : (
            <FolderView
              tasks={tasks}
              onStartTask={(taskId) => void startTask(taskId, 'pause')}
              onCompleteTask={(taskId) => void completeTask(taskId)}
            />
          )}
          {stage === 'review' ? <ReviewPanel tasks={tasks} onSubmit={() => undefined} /> : null}
        </div>
        <aside className="workspace-side" aria-label="任务创建">
          <CarryoverInbox
            candidates={carryoverCandidates}
            onConfirm={confirmCarryover}
            onHide={hideCarryoverCandidate}
          />
          <section className="workspace-panel" aria-label="快速添加任务">
            <TaskQuickAdd onAdd={addTask} />
          </section>
          <section className="workspace-panel" aria-label="设置">
            <SettingsPanel
              settings={currentSettings}
              onSave={(nextSettings) => void saveSettings(nextSettings)}
              dataSafety={{
                onExportJson: exportJsonBackup,
                onExportMarkdown: exportMarkdownArchive,
                onImportJson: importJsonBackup,
                onResetDemo: resetDemoData,
                canResetDemo: workspaceMode === 'demo',
              }}
            />
          </section>
        </aside>
      </div>
    </main>
  );
}
