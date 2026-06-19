import { buildGalaxyLayout } from '../domain/galaxyLayout';
import type { Task, TaskStatus } from '../domain/types';

type GalaxyViewProps = {
  tasks: Task[];
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
};

type StartableTaskStatus = 'not_started' | 'paused' | 'active_background';

export function GalaxyView({ tasks, onStartTask, onCompleteTask }: GalaxyViewProps) {
  const layout = buildGalaxyLayout(tasks);
  const activePlanet = layout.planets.find((planet) => planet.task.status === 'active_primary');

  return (
    <section className="workspace-panel task-view" aria-labelledby="galaxy-view-title">
      <h2 id="galaxy-view-title">今日星图</h2>
      <div className="galaxy-map" aria-label="四象限星图">
        <div className="galaxy-axis galaxy-axis--vertical" aria-hidden="true" />
        <div className="galaxy-axis galaxy-axis--horizontal" aria-hidden="true" />
        <span className="galaxy-center" aria-hidden="true" />
        <svg className="galaxy-routes" viewBox="0 0 100 100">
          {layout.routes.map((route) => (
            <path
              key={route.task.id}
              aria-label="飞行轨迹"
              className={route.completed ? 'galaxy-route galaxy-route--completed' : 'galaxy-route'}
              d={route.path}
              fill="none"
            />
          ))}
        </svg>
        {layout.planets.map((planet) => (
          <PlanetAction
            key={planet.task.id}
            task={planet.task}
            left={planet.position.x}
            top={planet.position.y}
            onStartTask={onStartTask}
            onCompleteTask={onCompleteTask}
          />
        ))}
        {activePlanet ? (
          <span
            className="galaxy-ship"
            aria-label="当前飞船"
            style={{ left: `${activePlanet.position.x}%`, top: `${activePlanet.position.y}%` }}
          />
        ) : null}
        {tasks.length === 0 ? <p className="empty-state">暂无任务</p> : null}
      </div>
    </section>
  );
}

function PlanetAction({
  task,
  left,
  top,
  onStartTask,
  onCompleteTask,
}: {
  task: Task;
  left: number;
  top: number;
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
}) {
  const isActive = task.status === 'active_primary';
  const canStart = isStartableStatus(task.status);
  const handler = isActive ? onCompleteTask : canStart ? onStartTask : undefined;
  const className = `galaxy-planet galaxy-planet--${task.status}`;
  const style = { left: `${left}%`, top: `${top}%` };
  const content = (
    <>
      {task.status === 'completed' ? <span className="galaxy-flag" aria-label="完成旗帜" /> : null}
      <span className="galaxy-planet__orb" aria-hidden="true" />
      <span className="galaxy-planet__title">{task.title}</span>
    </>
  );

  if (!handler) {
    return (
      <article className={className} style={style}>
        {content}
      </article>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => handler(task.id)}
      aria-label={`${task.title} ${isActive ? '完成' : '开始'}`}
    >
      {content}
    </button>
  );
}

function isStartableStatus(status: TaskStatus): status is StartableTaskStatus {
  return status === 'not_started' || status === 'paused' || status === 'active_background';
}
