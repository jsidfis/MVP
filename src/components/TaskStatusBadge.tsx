import type { TaskStatus } from '../domain/types';

const statusLabels: Record<TaskStatus, string> = {
  not_started: '未开始',
  active_primary: '进行中',
  active_background: '后台中',
  paused: '已暂停',
  completed: '已完成',
  postponed: '已顺延',
  dropped: '已放弃',
};

export function TaskStatusBadge({ status, isCarryover }: { status: TaskStatus; isCarryover?: boolean }) {
  return (
    <span className="status-badge">
      {statusLabels[status]}
      {isCarryover ? ' · 顺延' : ''}
    </span>
  );
}
