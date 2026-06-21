import type { DailyFile, Quadrant, Task, TaskStatus } from '../domain/types';
import type { DailyRepository } from './dailyRepository';

const DEMO_TASKS: Array<{
  id: string;
  title: string;
  quadrant: Quadrant;
  status: TaskStatus;
  hour: string;
  postponeReasonNote?: string;
}> = [
  {
    id: 'demo-task-1',
    title: '整理本周项目计划',
    quadrant: 'important_urgent',
    status: 'completed',
    hour: '09:00',
  },
  {
    id: 'demo-task-2',
    title: '阅读 Tauri 打包文档并记录要点',
    quadrant: 'important_not_urgent',
    status: 'completed',
    hour: '10:30',
  },
  {
    id: 'demo-task-3',
    title: '回复一个临时确认消息',
    quadrant: 'not_important_urgent',
    status: 'completed',
    hour: '14:00',
  },
  {
    id: 'demo-task-4',
    title: '整理桌面和下载目录',
    quadrant: 'not_important_not_urgent',
    status: 'not_started',
    hour: '16:00',
  },
  {
    id: 'demo-task-5',
    title: '完成 30 分钟运动',
    quadrant: 'important_not_urgent',
    status: 'postponed',
    hour: '19:00',
    postponeReasonNote: '晚饭后精力不足，顺延到明天早上',
  },
  {
    id: 'demo-task-6',
    title: '写下明天最重要的一件事',
    quadrant: 'important_urgent',
    status: 'active_primary',
    hour: '21:00',
  },
];

export async function ensureDemoData(repository: DailyRepository, today: string): Promise<void> {
  const existingTasks = await repository.listTasks(today);

  if (existingTasks.length > 0) {
    return;
  }

  await repository.saveSettings({
    homeView: 'galaxy',
    notificationsEnabled: false,
    morningReminder: '08:30',
    eveningReminder: '21:30',
  });

  await repository.saveDailyFile(demoDailyFile(today));

  for (const task of DEMO_TASKS) {
    await repository.saveTask(demoTask(today, task));
  }

  await repository.saveDailyFile(demoDailyFile(addDays(today, -1)));
  await repository.saveTask(
    demoTask(addDays(today, -1), {
      id: 'demo-history-1',
      title: '把未完成的打包问题记录下来',
      quadrant: 'important_not_urgent',
      status: 'postponed',
      hour: '20:00',
      postponeReasonNote: '打包工具链需要第二天继续确认',
    }),
  );
}

function demoDailyFile(date: string): DailyFile {
  return {
    date,
    stage: 'review',
    goal: '体验一次从早上计划到晚上复盘的完整闭环',
    statusScore: 4,
    statusNote: '上午专注，下午有临时事项插入',
    review: {
      completedText: '完成了项目计划、文档阅读和临时消息处理。',
      unfinishedText: '运动没有完成，主要是晚间精力不足。',
      feelingText: '节奏比昨天稳定，重要任务推进明显。',
      tomorrowFocusText: '先处理顺延任务，再继续完善便携包。',
    },
    reviewedAt: `${date}T21:40:00.000Z`,
  };
}

function demoTask(
  date: string,
  input: {
    id: string;
    title: string;
    quadrant: Quadrant;
    status: TaskStatus;
    hour: string;
    postponeReasonNote?: string;
  },
): Task {
  return {
    id: input.id,
    date,
    title: input.title,
    quadrant: input.quadrant,
    status: input.status,
    isCarryover: input.status === 'postponed',
    carryoverFromDate: input.status === 'postponed' ? addDays(date, -1) : undefined,
    postponeReasonTag: input.status === 'postponed' ? 'low_energy' : undefined,
    postponeReasonNote: input.postponeReasonNote,
    createdAt: `${date}T${input.hour}:00.000Z`,
    updatedAt: `${date}T${input.hour}:00.000Z`,
  };
}

function addDays(date: string, amount: number): string {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + amount);

  return parsed.toISOString().slice(0, 10);
}
