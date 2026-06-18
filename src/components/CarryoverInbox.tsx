import type { ReasonTag, Task } from '../domain/types';

const reasonLabels: Record<ReasonTag, string> = {
  time_estimate_error: '时间预估偏差',
  unexpected_interruption: '临时打断',
  low_energy: '精力不足',
  external_dependency: '外部依赖',
  priority_changed: '优先级变化',
  unclear_task: '任务不清晰',
  no_longer_needed: '不再需要',
};

export function CarryoverInbox({
  candidates,
  onConfirm,
}: {
  candidates: Task[];
  onConfirm: (taskId: string) => Promise<void>;
}) {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <section className="workspace-panel" aria-label="待确认顺延任务">
      <div className="section-heading">
        <h2>待确认顺延任务</h2>
      </div>
      <ul className="carryover-list">
        {candidates.map((task) => (
          <li key={task.id} className="carryover-item">
            <div>
              <strong>{task.title}</strong>
              <p>{carryoverSummary(task)}</p>
            </div>
            <button type="button" className="secondary-button" onClick={() => void onConfirm(task.id)}>
              加入今天
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function carryoverSummary(task: Task): string {
  const parts = [`顺延自 ${task.carryoverFromDate ?? task.date}`];

  if (task.postponeReasonTag) {
    parts.push(reasonLabels[task.postponeReasonTag]);
  }

  if (task.postponeReasonNote) {
    parts.push(task.postponeReasonNote);
  }

  return parts.join(' · ');
}
