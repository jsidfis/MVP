import { TaskStatusBadge } from '../components/TaskStatusBadge';
import type { Task } from '../domain/types';

export function GalaxyView({ tasks }: { tasks: Task[] }) {
  return (
    <section className="workspace-panel task-view" aria-labelledby="galaxy-view-title">
      <h2 id="galaxy-view-title">今日星图</h2>
      {tasks.length === 0 ? (
        <p className="empty-state">暂无任务</p>
      ) : (
        <ul className="galaxy-task-list">
          {tasks.map((task) => (
            <li key={task.id} className="galaxy-task">
              <span>{task.title}</span>
              <TaskStatusBadge status={task.status} isCarryover={task.isCarryover} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
