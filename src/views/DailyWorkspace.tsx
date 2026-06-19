import { useEffect, useState } from 'react';
import { CarryoverInbox } from '../components/CarryoverInbox';
import { StageTabs } from '../components/StageTabs';
import { TaskQuickAdd } from '../components/TaskQuickAdd';
import { ViewSwitch } from '../components/ViewSwitch';
import type { HomeView, Stage } from '../domain/types';
import { useAppStore } from '../store/appStore';
import { FolderView } from './FolderView';
import { GalaxyView } from './GalaxyView';
import { ReviewPanel } from './ReviewPanel';

export function DailyWorkspace() {
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
    setHomeView,
  } = useAppStore();
  const [stage, setStage] = useState<Stage>('plan');
  const currentView = settings?.homeView ?? 'folder';

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
        <button type="button" className="secondary-button">
          月度总览
        </button>
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
        </aside>
      </div>
    </main>
  );
}
