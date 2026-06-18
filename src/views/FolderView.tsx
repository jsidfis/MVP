import { TaskStatusBadge } from '../components/TaskStatusBadge';
import type { Task } from '../domain/types';

export function FolderView({ tasks }: { tasks: Task[] }) {
  return (
    <section className="workspace-panel task-view" aria-labelledby="folder-view-title">
      <h2 id="folder-view-title">文件夹视图</h2>
      <TaskList tasks={tasks} />
    </section>
  );
}

function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="empty-state">暂无任务</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className="task-row">
          <span>{task.title}</span>
          <TaskStatusBadge status={task.status} isCarryover={task.isCarryover} />
        </li>
      ))}
    </ul>
  );
}
