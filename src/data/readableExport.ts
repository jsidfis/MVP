import type { Quadrant, ReasonTag, Task, TaskStatus } from '../domain/types';
import type { ExportedDailyPlanData } from './exportData';

const QUADRANT_LABELS: Record<Quadrant, string> = {
  important_urgent: '重要且紧急',
  important_not_urgent: '重要不紧急',
  not_important_urgent: '不重要但紧急',
  not_important_not_urgent: '不重要不紧急',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: '未开始',
  active_primary: '进行中',
  active_background: '后台进行',
  paused: '已暂停',
  completed: '已完成',
  postponed: '已顺延',
  dropped: '已放弃',
};

const REASON_LABELS: Record<ReasonTag, string> = {
  time_estimate_error: '时间预估偏差',
  unexpected_interruption: '临时打断',
  low_energy: '状态不足',
  external_dependency: '外部依赖',
  priority_changed: '优先级变化',
  unclear_task: '任务不清晰',
  no_longer_needed: '不再需要',
};

export function createReadableDailyArchive(data: ExportedDailyPlanData): string {
  const tasksByDate = groupTasksByDate(data.tasks);
  const durationByTaskId = sumDurationByTaskId(data.sessions);
  const reviewDecisionByTaskId = new Map(
    data.reviewDecisions.map((decision) => [decision.taskId, decision]),
  );
  const lines = ['# 每日计划与复盘档案', '', `导出时间：${data.exportedAt}`, ''];

  for (const file of [...data.dailyFiles].sort((left, right) => left.date.localeCompare(right.date))) {
    lines.push(`## ${file.date}`, '');
    lines.push(`目标：${file.goal || '未填写'}`);

    if (file.statusNote) {
      lines.push(`状态记录：${file.statusNote}`);
    }

    lines.push('', '### 任务');
    const tasks = tasksByDate.get(file.date) ?? [];

    if (tasks.length === 0) {
      lines.push('暂无任务记录');
    } else {
      for (const task of sortTasks(tasks)) {
        lines.push(`- ${task.title}`);
        lines.push(`  - 四象限：${QUADRANT_LABELS[task.quadrant]}`);
        lines.push(`  - 状态：${STATUS_LABELS[task.status]}`);

        const durationMinutes = durationByTaskId.get(task.id);
        if (durationMinutes && durationMinutes > 0) {
          lines.push(`  - 实际耗时：${durationMinutes} 分钟`);
        }

        const reviewDecision = reviewDecisionByTaskId.get(task.id);
        const reasonTag = task.postponeReasonTag ?? reviewDecision?.reasonTag;
        const reasonNote = task.postponeReasonNote ?? reviewDecision?.reasonNote;

        if (reasonTag) {
          lines.push(`  - 顺延原因：${REASON_LABELS[reasonTag]}`);
        }

        if (reasonNote) {
          lines.push(`  - 说明：${reasonNote}`);
        }
      }
    }

    lines.push('', '### 晚间复盘');

    if (file.review) {
      lines.push(`- 完成：${file.review.completedText}`);
      lines.push(`- 未完成：${file.review.unfinishedText}`);
      lines.push(`- 感受：${file.review.feelingText}`);
      lines.push(`- 明日重点：${file.review.tomorrowFocusText}`);
    } else {
      lines.push('暂无复盘记录');
    }

    lines.push('');
  }

  if (data.dailyFiles.length === 0) {
    lines.push('暂无每日记录', '');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

function groupTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const tasksByDate = new Map<string, Task[]>();

  for (const task of tasks) {
    const group = tasksByDate.get(task.date) ?? [];
    group.push(task);
    tasksByDate.set(task.date, group);
  }

  return tasksByDate;
}

function sumDurationByTaskId(sessions: ExportedDailyPlanData['sessions']): Map<string, number> {
  const durationByTaskId = new Map<string, number>();

  for (const session of sessions) {
    if (!session.durationMinutes) {
      continue;
    }

    durationByTaskId.set(
      session.taskId,
      (durationByTaskId.get(session.taskId) ?? 0) + session.durationMinutes,
    );
  }

  return durationByTaskId;
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}
