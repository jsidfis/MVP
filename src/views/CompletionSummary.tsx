import type { DailySummary } from '../domain/summaryRules';

type CompletionSummaryProps = {
  summary: DailySummary;
};

export function CompletionSummary({ summary }: CompletionSummaryProps) {
  return (
    <section className="completion-summary">
      <h2>今日完成概览</h2>
      <dl>
        <dt>今日完成</dt>
        <dd>
          {summary.completedCount} / {summary.totalCount}
        </dd>
        <dt>重点完成情况</dt>
        <dd>
          {summary.highlightCompleted} / {summary.highlightTotal} 个重点任务完成
        </dd>
        <dt>实际耗时</dt>
        <dd>{formatDuration(summary.durationMinutes)}</dd>
        <dt>今日状态</dt>
        <dd>{summary.statusText}</dd>
        <dt>未完成处理</dt>
        <dd>
          {summary.postponedCount} 个顺延，{summary.droppedCount} 个放弃
        </dd>
      </dl>
    </section>
  );
}

function formatDuration(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
