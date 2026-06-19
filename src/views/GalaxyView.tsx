import { buildGalaxyLayout } from '../domain/galaxyLayout';
import type { Task } from '../domain/types';

type GalaxyViewProps = {
  tasks: Task[];
  onStartTask?: (taskId: string) => void;
  onCompleteTask?: (taskId: string) => void;
};

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
        {layout.planets.map((planet) => {
          const isActive = planet.task.status === 'active_primary';
          const handler = isActive ? onCompleteTask : onStartTask;

          return (
            <button
              key={planet.task.id}
              type="button"
              className={`galaxy-planet galaxy-planet--${planet.task.status}`}
              style={{ left: `${planet.position.x}%`, top: `${planet.position.y}%` }}
              disabled={!handler}
              onClick={() => handler?.(planet.task.id)}
              aria-label={`${planet.task.title} ${isActive ? '完成' : '开始'}`}
            >
            {planet.task.status === 'completed' ? (
              <span className="galaxy-flag" aria-label="完成旗帜" />
            ) : null}
            <span className="galaxy-planet__orb" aria-hidden="true" />
            <span className="galaxy-planet__title">{planet.task.title}</span>
            </button>
          );
        })}
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
