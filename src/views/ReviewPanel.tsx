import { useState } from 'react';
import { REASON_TAGS } from '../domain/reviewRules';
import type { DailyReview, ReasonTag, ReviewDecision, Task } from '../domain/types';

type ReviewPanelProps = {
  tasks: Task[];
  onSubmit(input: {
    decisions: Array<
      Pick<ReviewDecision, 'taskId' | 'action' | 'reasonTag' | 'reasonNote' | 'targetDate'>
    >;
    review: DailyReview;
  }): void;
};

type ReviewAction = ReviewDecision['action'];

type DecisionDraft = {
  action: ReviewAction;
  reasonTag: ReasonTag;
};

const defaultDecision: DecisionDraft = {
  action: 'postpone',
  reasonTag: 'time_estimate_error',
};

export function ReviewPanel({ tasks, onSubmit }: ReviewPanelProps) {
  const unfinished = tasks.filter((task) => task.status !== 'completed' && task.status !== 'dropped');
  const [review, setReview] = useState<DailyReview>({
    completedText: '',
    unfinishedText: '',
    feelingText: '',
    tomorrowFocusText: '',
  });
  const [decisions, setDecisions] = useState<Record<string, DecisionDraft>>(
    Object.fromEntries(unfinished.map((task) => [task.id, defaultDecision])),
  );

  function updateDecision(taskId: string, patch: Partial<DecisionDraft>) {
    setDecisions((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] ?? defaultDecision),
        ...patch,
      },
    }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();

    onSubmit({
      decisions: unfinished.map((task) => {
        const decision = decisions[task.id] ?? defaultDecision;

        return {
          taskId: task.id,
          action: decision.action,
          reasonTag: decision.reasonTag,
          ...(decision.action === 'drop' ? {} : { targetDate: nextDate(task.date) }),
        };
      }),
      review,
    });
  }

  return (
    <form className="review-panel" onSubmit={submit}>
      <h2>晚间复盘</h2>
      {unfinished.length > 0 ? (
        <div className="review-panel__tasks">
          {unfinished.map((task) => {
            const decision = decisions[task.id] ?? defaultDecision;

            return (
              <fieldset key={task.id} className="review-decision">
                <legend>{task.title}</legend>
                <label className="field">
                  {task.title} 的处理方式
                  <select
                    value={decision.action}
                    onChange={(event) =>
                      updateDecision(task.id, { action: event.target.value as ReviewAction })
                    }
                  >
                    <option value="postpone">顺延到明天</option>
                    <option value="drop">放弃</option>
                    <option value="reschedule">重新安排</option>
                  </select>
                </label>
                <label className="field">
                  {task.title} 的原因
                  <select
                    value={decision.reasonTag}
                    onChange={(event) =>
                      updateDecision(task.id, { reasonTag: event.target.value as ReasonTag })
                    }
                  >
                    {REASON_TAGS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reasonLabel(reason)}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">今天没有未完成任务。</p>
      )}

      <label className="field">
        今天完成了什么
        <textarea
          value={review.completedText}
          onChange={(event) => setReview({ ...review, completedText: event.target.value })}
        />
      </label>
      <label className="field">
        未完成的原因是什么
        <textarea
          value={review.unfinishedText}
          onChange={(event) => setReview({ ...review, unfinishedText: event.target.value })}
        />
      </label>
      <label className="field">
        今天状态或感受如何
        <textarea
          value={review.feelingText}
          onChange={(event) => setReview({ ...review, feelingText: event.target.value })}
        />
      </label>
      <label className="field">
        明天的重点是什么
        <textarea
          value={review.tomorrowFocusText}
          onChange={(event) => setReview({ ...review, tomorrowFocusText: event.target.value })}
        />
      </label>
      <button type="submit" className="primary-button">
        完成复盘
      </button>
    </form>
  );
}

function nextDate(date: string): string {
  const next = new Date(`${date}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);

  return next.toISOString().slice(0, 10);
}

function reasonLabel(reason: ReasonTag): string {
  const labels: Record<ReasonTag, string> = {
    time_estimate_error: '时间预估偏差',
    unexpected_interruption: '临时打断',
    low_energy: '精力不足',
    external_dependency: '外部依赖',
    priority_changed: '优先级变化',
    unclear_task: '任务不清晰',
    no_longer_needed: '不再需要',
  };

  return labels[reason];
}
