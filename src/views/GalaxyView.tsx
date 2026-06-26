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
  const activeRoute = layout.routes.find((route) => route.task.status === 'active_primary');

  return (
    <section className="workspace-panel task-view" aria-labelledby="galaxy-view-title">
      <h2 id="galaxy-view-title">今日星图</h2>
      <div className="galaxy-map" aria-label="四象限星图">
        <div
          className="galaxy-quadrant galaxy-quadrant--important-not-urgent"
          aria-label="重要不紧急象限"
        />
        <div
          className="galaxy-quadrant galaxy-quadrant--important-urgent"
          aria-label="重要且紧急象限"
        />
        <div
          className="galaxy-quadrant galaxy-quadrant--not-important-not-urgent"
          aria-label="不重要不紧急象限"
        />
        <div
          className="galaxy-quadrant galaxy-quadrant--not-important-urgent"
          aria-label="不重要但紧急象限"
        />
        <div className="galaxy-axis galaxy-axis--vertical" aria-hidden="true" />
        <div className="galaxy-axis galaxy-axis--horizontal" aria-hidden="true" />
        <span className="galaxy-center" aria-hidden="true" />
        <svg className="galaxy-routes" viewBox="0 0 100 100" preserveAspectRatio="none">
          {layout.routes.map((route) => (
            <path
              key={route.task.id}
              aria-label="飞行轨迹"
              className={route.completed ? 'galaxy-route galaxy-route--completed' : 'galaxy-route'}
              d={route.path}
              fill="none"
            />
          ))}
          {activeRoute ? (
            <g
              className="galaxy-ship-motion"
              aria-label="当前飞船"
              data-route-path={activeRoute.path}
            >
              <UfoGlyph />
              <animateMotion
                dur="5s"
                repeatCount="indefinite"
                path={activeRoute.path}
                rotate="auto"
              />
            </g>
          ) : null}
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
          <svg
            className={activeRoute ? 'galaxy-ship galaxy-ship--static-fallback' : 'galaxy-ship'}
            aria-label={activeRoute ? undefined : '当前飞船'}
            aria-hidden={activeRoute ? true : undefined}
            style={{ left: `${activePlanet.position.x}%`, top: `${activePlanet.position.y}%` }}
            viewBox="-6 -5 12 10"
          >
            <UfoGlyph />
          </svg>
        ) : null}
        <div className="galaxy-legend" aria-label="四象限图例">
          <span data-quadrant="important_urgent">重要且紧急</span>
          <span data-quadrant="important_not_urgent">重要不紧急</span>
          <span data-quadrant="not_important_urgent">不重要但紧急</span>
          <span data-quadrant="not_important_not_urgent">不重要不紧急</span>
        </div>
        {tasks.length === 0 ? <p className="empty-state">暂无任务</p> : null}
      </div>
    </section>
  );
}

function UfoGlyph() {
  return (
    <g className="galaxy-ufo" aria-hidden="true">
      <path
        className="galaxy-ufo__thruster"
        data-testid="ufo-thruster"
        d="M -1.8 2.1 L 0 4.8 L 1.8 2.1 Z"
      />
      <path className="galaxy-ufo__wing" d="M -5.2 0.4 L -2.6 -1 L -2.2 1.5 Z" />
      <path className="galaxy-ufo__wing" d="M 5.2 0.4 L 2.6 -1 L 2.2 1.5 Z" />
      <ellipse
        className="galaxy-ufo__body"
        data-testid="ufo-body"
        cx="0"
        cy="0.7"
        rx="3.4"
        ry="1.8"
      />
      <path
        className="galaxy-ufo__cabin"
        data-testid="ufo-cabin"
        d="M -1.8 -0.3 Q -1.25 -3.1 0 -3.35 Q 1.25 -3.1 1.8 -0.3 Z"
      />
      <circle className="galaxy-ufo__light" cx="-1.6" cy="1.05" r="0.34" />
      <circle className="galaxy-ufo__light" cx="0" cy="1.35" r="0.34" />
      <circle className="galaxy-ufo__light" cx="1.6" cy="1.05" r="0.34" />
    </g>
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
  const className = `galaxy-planet galaxy-planet--${task.status} galaxy-planet--${task.quadrant}`;
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
      <article className={className} style={style} data-quadrant={task.quadrant}>
        {content}
      </article>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      data-quadrant={task.quadrant}
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
