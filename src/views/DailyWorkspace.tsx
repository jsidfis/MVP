import { useEffect, useState } from 'react';
import { StageTabs } from '../components/StageTabs';
import { ViewSwitch } from '../components/ViewSwitch';
import type { WorkspaceMode } from '../data/workspaceMode';
import type { HomeView, Stage } from '../domain/types';
import { useAppStore } from '../store/appStore';
import { ExecutionWorkspace } from './ExecutionWorkspace';
import { MonthlyOverview } from './MonthlyOverview';
import { PlanningWorkspace } from './PlanningWorkspace';
import { ReviewWorkspace } from './ReviewWorkspace';

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
    taskTemplates,
    carryoverCandidates,
    monthlyOverview,
    isLoading,
    addTask,
    saveTaskTemplate,
    applyTaskTemplate,
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
    loadMonthlyOverview,
    searchTasks,
  } = useAppStore();
  const [stage, setStage] = useState<Stage>('plan');
  const currentView = settings?.homeView ?? 'folder';
  const currentSettings = settings ?? { homeView: currentView, notificationsEnabled: false };
  const [currentYear, currentMonth] = today.split('-').map(Number);

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
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadMonthlyOverview({ year: currentYear, month: currentMonth })}
          >
            月度总览
          </button>
        </div>
      </header>

      <section className="workspace-toolbar" aria-label="工作台控制">
        <StageTabs currentStage={stage} onChange={setStage} />
        {stage !== 'plan' ? (
          <ViewSwitch currentView={currentView} onChange={(view: HomeView) => void setHomeView(view)} />
        ) : null}
      </section>

      {stage === 'plan' ? (
        <PlanningWorkspace
          tasks={tasks}
          carryoverCandidates={carryoverCandidates}
          templates={taskTemplates}
          onAddTask={addTask}
          onConfirmCarryover={confirmCarryover}
          onHideCarryover={hideCarryoverCandidate}
          onSaveTemplate={saveTaskTemplate}
          onApplyTemplate={applyTaskTemplate}
        />
      ) : stage === 'execute' ? (
        <ExecutionWorkspace
          currentView={currentView}
          tasks={tasks}
          settings={currentSettings}
          canResetDemo={workspaceMode === 'demo'}
          onAddTask={addTask}
          onStartTask={(taskId) => void startTask(taskId, 'pause')}
          onCompleteTask={(taskId) => void completeTask(taskId)}
          onSearch={searchTasks}
          onSaveSettings={(nextSettings) => void saveSettings(nextSettings)}
          onExportJson={exportJsonBackup}
          onExportMarkdown={exportMarkdownArchive}
          onImportJson={importJsonBackup}
          onResetDemo={resetDemoData}
        />
      ) : (
        <ReviewWorkspace currentView={currentView} tasks={tasks} onSubmit={() => undefined} />
      )}
      {monthlyOverview ? (
        <MonthlyOverview
          year={monthlyOverview.year}
          month={monthlyOverview.month}
          recordedDates={monthlyOverview.recordedDates}
          insights={monthlyOverview.insights}
          tasks={monthlyOverview.tasks}
        />
      ) : null}
    </main>
  );
}
