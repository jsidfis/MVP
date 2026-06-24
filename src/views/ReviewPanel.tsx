import { useState } from 'react';
import { REASON_TAGS } from '../domain/reviewRules';
import type { DailyReview, ReasonTag, ReviewDecision, Task } from '../domain/types';

type ReviewPanelProps = {
  tasks: Task[];
  onSubmit(input: ReviewSubmitInput): void;
};

export type ReviewSubmitInput = {
  decisions: Array<
    Pick<ReviewDecision, 'taskId' | 'action' | 'reasonTag' | 'reasonNote' | 'targetDate'>
  >;
  review: DailyReview;
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

const reviewQuestions: Array<{
  key: keyof DailyReview;
  label: string;
  placeholder: string;
}> = [
  { key: 'completedText', label: '今天完成了什么', placeholder: '记录今天已经推进的内容' },
  {
    key: 'unfinishedText',
    label: '未完成的原因是什么',
    placeholder: '补充整体原因，任务原因会单独保存',
  },
  { key: 'feelingText', label: '今天状态或感受如何', placeholder: '用一句话记录今天的状态' },
  { key: 'tomorrowFocusText', label: '明天的重点是什么', placeholder: '写下明天最希望推进的事' },
];

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
  const [isReviewingQuestions, setIsReviewingQuestions] = useState(unfinished.length === 0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const currentQuestion = reviewQuestions[questionIndex];

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
      <div className="review-panel__heading">
        <div>
          <p>{isReviewingQuestions ? `问题 ${questionIndex + 1} / 4` : '未完成任务处理'}</p>
          <h2>晚间复盘</h2>
        </div>
        <div className="review-progress" aria-label="复盘进度">
          {reviewQuestions.map((question, index) => (
            <span
              key={question.key}
              data-active={isReviewingQuestions && index <= questionIndex}
            />
          ))}
        </div>
      </div>

      {!isReviewingQuestions && unfinished.length > 0 ? (
        <>
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
          <button
            type="button"
            className="primary-button"
            onClick={() => setIsReviewingQuestions(true)}
          >
            下一步：复盘问题
          </button>
        </>
      ) : null}

      {isReviewingQuestions ? (
        <>
          <label className="field review-question">
            <span>{currentQuestion.label}</span>
            <textarea
              value={review[currentQuestion.key]}
              placeholder={currentQuestion.placeholder}
              onChange={(event) =>
                setReview({ ...review, [currentQuestion.key]: event.target.value })
              }
              autoFocus
            />
          </label>
          <div className="review-question__actions">
            <button
              type="button"
              className="secondary-button"
              disabled={questionIndex === 0 && unfinished.length === 0}
              onClick={() => {
                if (questionIndex === 0) {
                  setIsReviewingQuestions(false);
                } else {
                  setQuestionIndex((current) => current - 1);
                }
              }}
            >
              {questionIndex === 0 ? '返回任务处理' : '上一个问题'}
            </button>
            {questionIndex < reviewQuestions.length - 1 ? (
              <button
                type="button"
                className="primary-button"
                onClick={() => setQuestionIndex((current) => current + 1)}
              >
                下一个问题
              </button>
            ) : (
              <button type="submit" className="primary-button">
                完成复盘
              </button>
            )}
          </div>
        </>
      ) : null}
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
