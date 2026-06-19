import { TaskStatusBadge } from '../components/TaskStatusBadge';
import { orderTasksForFloor, QUADRANT_FLOORS } from '../domain/taskRules';
import type { Quadrant, Task, TaskStatus } from '../domain/types';

const floorLabels: Record<Quadrant, string> = {
  important_urgent: '重要且紧急',
  important_not_urgent: '重要不紧急',
  not_important_urgent: '不重要但紧急',
  not_important_not_urgent: '不重要不紧急',
};

const floors = (Object.entries(QUADRANT_FLOORS) as Array<[Quadrant, 1 | 2 | 3 | 4]>).sort(
  (left, right) => right[1] - left[1],
);

type StartableTaskStatus = 'not_started' | 'paused' | 'active_background';

type FolderViewProps = {
  tasks: Task[];
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
};

export function FolderView({ tasks, onStartTask, onCompleteTask }: FolderViewProps) {
  return (
    <section className="workspace-panel task-view" aria-labelledby="folder-view-title">
      <h2 id="folder-view-title">文件夹视图</h2>
      <div className="folder-cabinet">
        {floors.map(([quadrant, floor]) => {
          const floorTasks = orderTasksForFloor(tasks.filter((task) => task.quadrant === quadrant));
          const label = `${floor}F ${floorLabels[quadrant]}`;

          return (
            <section key={quadrant} className={`folder-floor folder-floor--${floor}`} aria-label={label}>
              <div className="folder-floor__header">
                <span className="folder-floor__number">{floor}F</span>
                <h3>{floorLabels[quadrant]}</h3>
              </div>
              <TaskList tasks={floorTasks} onStartTask={onStartTask} onCompleteTask={onCompleteTask} />
            </section>
          );
        })}
      </div>
    </section>
  );
}

function TaskList({
  tasks,
  onStartTask,
  onCompleteTask,
}: {
  tasks: Task[];
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
}) {
  return (
    <ul className="task-list folder-floor__tasks">
      {tasks.map((task) => {
        const isActive = task.status === 'active_primary';
        const canStart = isStartableStatus(task.status);
        const handler = isActive ? onCompleteTask : canStart ? onStartTask : undefined;

        return (
          <li key={task.id} className="task-row">
            <span>{task.title}</span>
            <div className="task-row__actions">
              <TaskStatusBadge status={task.status} isCarryover={task.isCarryover} />
              {handler ? (
                <button type="button" className="task-action-button" onClick={() => handler(task.id)}>
                  {isActive ? '完成' : '开始'}
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function isStartableStatus(status: TaskStatus): status is StartableTaskStatus {
  return status === 'not_started' || status === 'paused' || status === 'active_background';
}
