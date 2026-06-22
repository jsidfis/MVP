import { useMemo, useState } from 'react';
import type { DayInsight } from '../domain/insightRules';
import type { Task } from '../domain/types';

type MonthlyGalaxyMapProps = {
  year: number;
  month: number;
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

export function MonthlyGalaxyMap({ year, month, days, tasks, onSelectDate }: MonthlyGalaxyMapProps) {
  const dates = useMemo(() => buildMonthDates(year, month), [year, month]);
  const dayByDate = useMemo(() => new Map(days.map((day) => [day.date, day])), [days]);
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const selectedTasks = tasksByDate.get(selectedDate) ?? [];

  return (
    <section className="monthly-galaxy-map" aria-label="月度星系地图">
      <div className="monthly-galaxy-orbit" aria-label="每日节点">
        <span className="monthly-galaxy-center" aria-hidden="true" />
        {dates.map((date, index) => {
          const point = mapPoint(index, dates.length);
          const day = dayByDate.get(date);
          const hasCompleted = (day?.completedTasks ?? 0) > 0;
          const label = day ? `${date} 完成 ${day.completedTasks}/${day.totalTasks}` : `${date} 无任务记录`;

          return (
            <button
              key={date}
              type="button"
              className={hasCompleted ? 'monthly-galaxy-node monthly-galaxy-node-completed' : 'monthly-galaxy-node'}
              aria-label={label}
              aria-pressed={selectedDate === date}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => {
                setSelectedDate(date);
                onSelectDate?.(date);
              }}
            >
              {Number(date.slice(-2))}
            </button>
          );
        })}
      </div>

      <div className="monthly-galaxy-detail" aria-live="polite">
        <h3>{selectedDate}</h3>
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
          <p>这一天还没有任务记录。</p>
        )}
      </div>
    </section>
  );
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

function mapPoint(index: number, total: number): { x: number; y: number } {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const wave = index % 2 === 0 ? 4 : -4;
  const radiusX = 41 + wave;
  const radiusY = 35 - wave / 2;

  return {
    x: 50 + Math.cos(angle) * radiusX,
    y: 50 + Math.sin(angle) * radiusY,
  };
}
