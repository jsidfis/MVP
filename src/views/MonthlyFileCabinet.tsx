import { useMemo, useState } from 'react';
import type { DayInsight } from '../domain/insightRules';
import type { Task } from '../domain/types';

type MonthlyFileCabinetProps = {
  year: number;
  month: number;
  recordedDates: string[];
  days: DayInsight[];
  tasks: Task[];
  onSelectDate?: (date: string) => void;
};

const statusLabels: Record<Task['status'], string> = {
  not_started: '未开始',
  active_primary: '进行中',
  active_background: '后台进行',
  paused: '暂停',
  completed: '已完成',
  postponed: '已顺延',
  dropped: '已放弃',
};

export function MonthlyFileCabinet({
  year,
  month,
  recordedDates,
  days,
  tasks,
  onSelectDate,
}: MonthlyFileCabinetProps) {
  const dates = useMemo(() => buildMonthDates(year, month), [year, month]);
  const dayByDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const selectedTasks = tasksByDate.get(selectedDate) ?? [];

  return (
    <section className="monthly-file-cabinet" aria-label="月度文件柜">
      <div className="monthly-file-grid">
        {dates.map((date) => {
          const day = dayByDate.get(date);
          const recorded = recordedDates.includes(date);
          const hasCompleted = (day?.completedTasks ?? 0) > 0;
          const label = day ? `${date} 完成 ${day.completedTasks}/${day.totalTasks}` : fallbackLabel(date, recorded);

          return (
            <button
              key={date}
              type="button"
              className={fileDayClassName({ hasCompleted, recorded })}
              aria-label={label}
              aria-pressed={selectedDate === date}
              onClick={() => {
                setSelectedDate(date);
                onSelectDate?.(date);
              }}
            >
              <span>{Number(date.slice(-2))}</span>
              <small>{day ? `${day.completedTasks}/${day.totalTasks}` : recorded ? '有记录' : '空'}</small>
            </button>
          );
        })}
      </div>

      <div className="monthly-file-detail" aria-live="polite">
        <h3>{selectedDate} 文件</h3>
        {selectedTasks.length > 0 ? (
          <ul>
            {selectedTasks.map((task) => (
              <li key={task.id}>
                <span>{task.title}</span>
                <strong>{statusLabels[task.status]}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p>这一天还没有任务文件。</p>
        )}
      </div>
    </section>
  );
}

function fallbackLabel(date: string, recorded: boolean): string {
  return recorded ? `${date} 有记录` : `${date} 无任务记录`;
}

function fileDayClassName(input: { hasCompleted: boolean; recorded: boolean }): string {
  const classNames = ['monthly-file-day'];

  if (input.recorded) {
    classNames.push('monthly-file-day-recorded');
  }

  if (input.hasCompleted) {
    classNames.push('monthly-file-day-completed');
  }

  return classNames.join(' ');
}

function buildMonthDates(year: number, month: number): string[] {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const paddedMonth = String(month).padStart(2, '0');

  return Array.from({ length: days }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');

    return `${year}-${paddedMonth}-${day}`;
  });
}

function groupTasksByDate(tasks: Task[]): Map<string, Task[]> {
  const grouped = new Map<string, Task[]>();

  for (const task of tasks) {
    grouped.set(task.date, [...(grouped.get(task.date) ?? []), task]);
  }

  return grouped;
}
