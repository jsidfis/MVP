import type { MonthlyInsights, PostponedReasonInsight, QuadrantInsight } from '../domain/insightRules';
import type { Quadrant, ReasonTag, Task } from '../domain/types';
import { MonthlyFileCabinet } from './MonthlyFileCabinet';
import { MonthlyGalaxyMap } from './MonthlyGalaxyMap';

type MonthlyOverviewProps = {
  year: number;
  month: number;
  recordedDates: string[];
  insights?: MonthlyInsights;
  tasks?: Task[];
  onSelectDate?: (date: string) => void;
};

const quadrantLabels: Record<Quadrant, string> = {
  important_urgent: '重要且紧急',
  important_not_urgent: '重要不紧急',
  not_important_urgent: '紧急不重要',
  not_important_not_urgent: '不紧急不重要',
};

const reasonLabels: Record<ReasonTag, string> = {
  time_estimate_error: '时间估计偏差',
  unexpected_interruption: '临时打断',
  low_energy: '状态不足',
  external_dependency: '外部依赖',
  priority_changed: '优先级变化',
  unclear_task: '任务不清晰',
  no_longer_needed: '不再需要',
};

export function MonthlyOverview({ year, month, recordedDates, insights, tasks = [], onSelectDate }: MonthlyOverviewProps) {
  return (
    <section className="monthly-overview">
      <h2>月度总览</h2>
      {insights ? <MonthlyInsightSummary insights={insights} /> : null}
      {insights && insights.totalTasks > 0 ? (
        <MonthlyGalaxyMap
          year={year}
          month={month}
          days={insights.days}
          tasks={tasks}
          onSelectDate={onSelectDate}
        />
      ) : null}
      <MonthlyFileCabinet
        year={year}
        month={month}
        recordedDates={recordedDates}
        days={insights?.days ?? []}
        tasks={tasks}
        onSelectDate={onSelectDate}
      />
    </section>
  );
}

function MonthlyInsightSummary({ insights }: { insights: MonthlyInsights }) {
  if (insights.totalTasks === 0) {
    return (
      <div className="monthly-empty-state">
        <strong>这个月还没有任务记录</strong>
        <span>开始记录后，这里会显示完成趋势、四象限分布和顺延原因。</span>
      </div>
    );
  }

  return (
    <div className="monthly-insights" aria-label="月度洞察">
      <div className="monthly-stat-strip">
        <StatItem label="本月完成率" value={formatPercent(insights.completionRate)} detail={`${insights.completedTasks}/${insights.totalTasks} 项`} />
        <StatItem label="重要任务" value={formatPercent(insights.importantCompletionRate)} detail={`${insights.completedImportantTasks}/${insights.importantTasks} 项`} />
        <StatItem label="实际耗时" value={`${insights.actualDurationMinutes} 分钟`} detail="已记录任务会话" />
      </div>

      <section className="monthly-insight-section" aria-labelledby="monthly-trend-title">
        <div className="monthly-section-heading">
          <h3 id="monthly-trend-title">完成趋势</h3>
          <span>{insights.days.length} 天有记录</span>
        </div>
        <div className="monthly-trend-bars" aria-label="每日完成趋势">
          {insights.days.map((day) => (
            <div key={day.date} className="monthly-trend-day">
              <span
                className="monthly-trend-bar"
                style={{ height: `${Math.max(8, Math.round(day.completionRate * 100))}%` }}
                aria-label={`${day.date} 完成率 ${formatPercent(day.completionRate)}`}
              />
              <span>{Number(day.date.slice(-2))}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="monthly-insight-section" aria-labelledby="monthly-quadrant-title">
        <div className="monthly-section-heading">
          <h3 id="monthly-quadrant-title">四象限分布</h3>
          <span>按任务落点查看</span>
        </div>
        <div className="monthly-quadrants">
          {insights.quadrants.map((quadrant) => (
            <QuadrantRow key={quadrant.quadrant} quadrant={quadrant} />
          ))}
        </div>
      </section>

      <section className="monthly-insight-section" aria-labelledby="monthly-postpone-title">
        <div className="monthly-section-heading">
          <h3 id="monthly-postpone-title">顺延原因</h3>
          <span>{insights.postponedTasks} 项顺延</span>
        </div>
        {insights.postponedReasons.length > 0 ? (
          <div className="monthly-reasons">
            {insights.postponedReasons.map((reason) => (
              <ReasonRow key={reason.tag} reason={reason} />
            ))}
          </div>
        ) : (
          <p className="monthly-muted">本月还没有顺延原因记录。</p>
        )}
      </section>
    </div>
  );
}

function StatItem({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="monthly-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function QuadrantRow({ quadrant }: { quadrant: QuadrantInsight }) {
  return (
    <div className="monthly-row">
      <span>{quadrantLabels[quadrant.quadrant]}</span>
      <div className="monthly-row-meter" aria-hidden="true">
        <span style={{ width: `${Math.round(quadrant.completionRate * 100)}%` }} />
      </div>
      <strong>
        {quadrant.completedTasks}/{quadrant.totalTasks}
      </strong>
    </div>
  );
}

function ReasonRow({ reason }: { reason: PostponedReasonInsight }) {
  return (
    <div className="monthly-row">
      <span>{reasonLabels[reason.tag]}</span>
      <div className="monthly-row-meter monthly-row-meter-muted" aria-hidden="true">
        <span style={{ width: `${Math.min(100, reason.count * 24)}%` }} />
      </div>
      <strong>
        {reason.count} 次 · {reason.withNote} 条说明
      </strong>
    </div>
  );
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
