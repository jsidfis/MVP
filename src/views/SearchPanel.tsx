import { useState, type FormEvent } from 'react';
import type { TaskSearchFilters } from '../domain/searchRules';
import type { Quadrant, ReasonTag, Task, TaskStatus } from '../domain/types';

const quadrantLabels: Record<Quadrant, string> = {
  important_urgent: '重要且紧急',
  important_not_urgent: '重要不紧急',
  not_important_urgent: '不重要但紧急',
  not_important_not_urgent: '不重要不紧急',
};

const statusLabels: Record<TaskStatus, string> = {
  not_started: '未开始',
  active_primary: '进行中',
  active_background: '后台进行',
  paused: '已暂停',
  completed: '已完成',
  postponed: '已顺延',
  dropped: '已放弃',
};

const reasonLabels: Record<ReasonTag, string> = {
  time_estimate_error: '时间预估偏差',
  unexpected_interruption: '临时打断',
  low_energy: '状态不足',
  external_dependency: '外部依赖',
  priority_changed: '优先级变化',
  unclear_task: '任务不清晰',
  no_longer_needed: '不再需要',
};

const quadrants = Object.keys(quadrantLabels) as Quadrant[];
const statuses = Object.keys(statusLabels) as TaskStatus[];
const reasons = Object.keys(reasonLabels) as ReasonTag[];

export function SearchPanel({
  onSearch,
}: {
  onSearch: (filters: TaskSearchFilters) => Promise<Task[]>;
}) {
  const [keyword, setKeyword] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quadrant, setQuadrant] = useState('');
  const [status, setStatus] = useState('');
  const [reasonTag, setReasonTag] = useState('');
  const [results, setResults] = useState<Task[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSearching(true);
    try {
      const nextResults = await onSearch({
        ...(keyword.trim() ? { keyword: keyword.trim() } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
        ...(quadrant ? { quadrant: quadrant as Quadrant } : {}),
        ...(status ? { status: status as TaskStatus } : {}),
        ...(reasonTag ? { reasonTag: reasonTag as ReasonTag } : {}),
      });
      setResults(nextResults);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <section className="workspace-panel search-panel" aria-labelledby="search-panel-title">
      <h2 id="search-panel-title">本地搜索</h2>
      <form className="search-panel__form" onSubmit={handleSubmit}>
        <label className="field">
          <span>关键词</span>
          <input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </label>
        <label className="field">
          <span>开始日期</span>
          <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </label>
        <label className="field">
          <span>结束日期</span>
          <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </label>
        <label className="field">
          <span>筛选四象限</span>
          <select value={quadrant} onChange={(event) => setQuadrant(event.target.value)}>
            <option value="">全部</option>
            {quadrants.map((item) => (
              <option key={item} value={item}>
                {quadrantLabels[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>状态</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">全部</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {statusLabels[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>顺延原因</span>
          <select value={reasonTag} onChange={(event) => setReasonTag(event.target.value)}>
            <option value="">全部</option>
            {reasons.map((item) => (
              <option key={item} value={item}>
                {reasonLabels[item]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="secondary-button" disabled={isSearching}>
          搜索
        </button>
      </form>

      {hasSearched && results.length === 0 ? (
        <p className="empty-state">没有匹配的本地记录。</p>
      ) : null}
      {results.length > 0 ? (
        <ul className="task-list search-panel__results">
          {results.map((task) => (
            <li key={task.id} className="task-row">
              <span>{task.title}</span>
              <span>{task.date}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
