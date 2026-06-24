import { TaskQuickAdd } from '../components/TaskQuickAdd';
import { TaskStatusBadge } from '../components/TaskStatusBadge';
import { WorkspaceDock } from '../components/WorkspaceDock';
import type { RecurrenceFrequency } from '../domain/recurrenceRules';
import type { TaskSearchFilters } from '../domain/searchRules';
import type { HomeView, Quadrant, Task, UserSettings } from '../domain/types';
import { SettingsPanel } from '../settings/SettingsPanel';
import { FolderView } from './FolderView';
import { GalaxyView } from './GalaxyView';
import { SearchPanel } from './SearchPanel';

export function ExecutionWorkspace({
  currentView,
  tasks,
  settings,
  canResetDemo,
  onAddTask,
  onStartTask,
  onCompleteTask,
  onSearch,
  onSaveSettings,
  onExportJson,
  onExportMarkdown,
  onImportJson,
  onResetDemo,
}: {
  currentView: HomeView;
  tasks: Task[];
  settings: UserSettings;
  canResetDemo: boolean;
  onAddTask(input: {
    title: string;
    quadrant: Quadrant;
    recurrenceFrequency?: RecurrenceFrequency;
  }): Promise<void>;
  onStartTask(taskId: string): void;
  onCompleteTask(taskId: string): void;
  onSearch(filters: TaskSearchFilters): Promise<Task[]>;
  onSaveSettings(settings: UserSettings): void;
  onExportJson(): Promise<string>;
  onExportMarkdown(): Promise<string>;
  onImportJson(payload: unknown): Promise<void>;
  onResetDemo(): Promise<void>;
}) {
  const activeTask = tasks.find((task) => task.status === 'active_primary');

  return (
    <section className="stage-workspace execution-workspace" aria-label="执行工作区">
      <div className="stage-workspace__canvas">
        {currentView === 'galaxy' ? (
          <GalaxyView
            tasks={tasks}
            onStartTask={onStartTask}
            onCompleteTask={onCompleteTask}
          />
        ) : (
          <FolderView
            tasks={tasks}
            onStartTask={onStartTask}
            onCompleteTask={onCompleteTask}
          />
        )}
      </div>

      {activeTask ? (
        <section className="active-task-status" aria-label="当前任务">
          <span>正在前往</span>
          <strong>{activeTask.title}</strong>
          <p>再次点击当前任务即可完成并记录实际耗时。</p>
        </section>
      ) : null}

      <WorkspaceDock
        panels={{
          add: (
            <section className="drawer-panel" aria-label="新增任务面板">
              <h2>新增任务</h2>
              <TaskQuickAdd onAdd={onAddTask} />
            </section>
          ),
          tasks: (
            <TodayTaskDrawer
              tasks={tasks}
              onStartTask={onStartTask}
              onCompleteTask={onCompleteTask}
            />
          ),
          search: <SearchPanel onSearch={onSearch} />,
          settings: (
            <section className="drawer-panel" aria-label="设置面板">
              <SettingsPanel
                settings={settings}
                onSave={onSaveSettings}
                dataSafety={{
                  onExportJson,
                  onExportMarkdown,
                  onImportJson,
                  onResetDemo,
                  canResetDemo,
                }}
              />
            </section>
          ),
        }}
      />
    </section>
  );
}

function TodayTaskDrawer({
  tasks,
  onStartTask,
  onCompleteTask,
}: {
  tasks: Task[];
  onStartTask(taskId: string): void;
  onCompleteTask(taskId: string): void;
}) {
  return (
    <section className="drawer-panel" aria-labelledby="today-task-drawer-title">
      <h2 id="today-task-drawer-title">今日任务</h2>
      {tasks.length === 0 ? (
        <p className="empty-state">今天还没有任务。</p>
      ) : (
        <ul className="drawer-task-list">
          {tasks.map((task) => {
            const active = task.status === 'active_primary';
            const startable =
              task.status === 'not_started' ||
              task.status === 'paused' ||
              task.status === 'active_background';

            return (
              <li key={task.id}>
                <div>
                  <strong>{task.title}</strong>
                  <TaskStatusBadge status={task.status} isCarryover={task.isCarryover} />
                </div>
                {active || startable ? (
                  <button
                    type="button"
                    className="task-action-button"
                    onClick={() => (active ? onCompleteTask(task.id) : onStartTask(task.id))}
                  >
                    {active ? '完成' : '开始'}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
