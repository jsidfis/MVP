import { useState } from 'react';
import { CarryoverInbox } from '../components/CarryoverInbox';
import type { TaskTemplate } from '../data/taskTemplates';
import type { RecurrenceFrequency } from '../domain/recurrenceRules';
import type { Quadrant, Task } from '../domain/types';
import { TaskTemplatePanel } from './TaskTemplatePanel';

type PlanningStep = 'title' | 'quadrant' | 'recurrence' | 'confirm';

const quadrantOptions: Array<{ value: Quadrant; label: string; hint: string }> = [
  { value: 'important_urgent', label: '重要且紧急', hint: '优先处理' },
  { value: 'important_not_urgent', label: '重要不紧急', hint: '安排推进' },
  { value: 'not_important_urgent', label: '不重要但紧急', hint: '快速处理' },
  { value: 'not_important_not_urgent', label: '不重要不紧急', hint: '稍后考虑' },
];

const recurrenceOptions: Array<{ value: '' | RecurrenceFrequency; label: string }> = [
  { value: '', label: '不重复' },
  { value: 'daily', label: '每天' },
  { value: 'workday', label: '工作日' },
  { value: 'weekly', label: '每周' },
];

const stepOrder: PlanningStep[] = ['title', 'quadrant', 'recurrence', 'confirm'];

export function PlanningWorkspace({
  tasks,
  carryoverCandidates,
  templates,
  onAddTask,
  onConfirmCarryover,
  onHideCarryover,
  onSaveTemplate,
  onApplyTemplate,
}: {
  tasks: Task[];
  carryoverCandidates: Task[];
  templates: TaskTemplate[];
  onAddTask(input: {
    title: string;
    quadrant: Quadrant;
    recurrenceFrequency?: RecurrenceFrequency;
  }): Promise<void>;
  onConfirmCarryover(taskId: string): Promise<void>;
  onHideCarryover(taskId: string): void;
  onSaveTemplate(input: { name: string; taskIds: string[] }): Promise<void> | void;
  onApplyTemplate(templateId: string): Promise<void> | void;
}) {
  const [step, setStep] = useState<PlanningStep>('title');
  const [title, setTitle] = useState('');
  const [quadrant, setQuadrant] = useState<Quadrant>('important_urgent');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'' | RecurrenceFrequency>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const selectedQuadrant = quadrantOptions.find((option) => option.value === quadrant)!;
  const selectedRecurrence = recurrenceOptions.find((option) => option.value === recurrenceFrequency)!;

  async function submitTask() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setStep('title');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddTask({
        title: trimmedTitle,
        quadrant,
        recurrenceFrequency: recurrenceFrequency || undefined,
      });
      setTitle('');
      setQuadrant('important_urgent');
      setRecurrenceFrequency('');
      setStep('title');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="planning-workspace">
      <CarryoverInbox
        candidates={carryoverCandidates}
        onConfirm={onConfirmCarryover}
        onHide={onHideCarryover}
      />

      <section className="planning-panel" aria-labelledby="planning-title">
        <div className="planning-heading">
          <div>
            <p className="planning-eyebrow">Morning plan</p>
            <h2 id="planning-title">制定今日计划</h2>
          </div>
          <button
            type="button"
            className="secondary-button"
            aria-expanded={showTemplates}
            onClick={() => setShowTemplates((current) => !current)}
          >
            任务模板
          </button>
        </div>

        <nav className="planning-steps" aria-label="新增任务步骤">
          {stepOrder.map((item, index) => (
            <button
              key={item}
              type="button"
              className="planning-step"
              aria-current={step === item ? 'step' : undefined}
              disabled={index > stepOrder.indexOf(step)}
              onClick={() => setStep(item)}
            >
              {stepLabel(item, title, selectedQuadrant.label, selectedRecurrence.label)}
            </button>
          ))}
        </nav>

        <div className="planning-card">
          {step === 'title' ? (
            <>
              <div className="planning-card__heading">
                <span>1 / 4</span>
                <h3>先写下任务</h3>
              </div>
              <label className="field">
                <span>任务标题</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="写下今天要推进的事"
                  autoFocus
                />
              </label>
              <div className="planning-card__actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={!title.trim()}
                  onClick={() => setStep('quadrant')}
                >
                  下一步：选择四象限
                </button>
              </div>
            </>
          ) : null}

          {step === 'quadrant' ? (
            <>
              <div className="planning-card__heading">
                <span>2 / 4</span>
                <h3>这件事属于哪个象限？</h3>
              </div>
              <div className="quadrant-card-grid" aria-label="四象限">
                {quadrantOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`quadrant-choice quadrant-choice--${option.value}`}
                    aria-pressed={quadrant === option.value}
                    onClick={() => setQuadrant(option.value)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.hint}</span>
                  </button>
                ))}
              </div>
              <div className="planning-card__actions planning-card__actions--split">
                <button type="button" className="secondary-button" onClick={() => setStep('title')}>
                  返回
                </button>
                <button type="button" className="primary-button" onClick={() => setStep('recurrence')}>
                  下一步：重复规则
                </button>
              </div>
            </>
          ) : null}

          {step === 'recurrence' ? (
            <>
              <div className="planning-card__heading">
                <span>3 / 4</span>
                <h3>是否需要重复？</h3>
              </div>
              <div className="recurrence-choice-grid" aria-label="重复规则">
                {recurrenceOptions.map((option) => (
                  <button
                    key={option.value || 'none'}
                    type="button"
                    className="recurrence-choice"
                    aria-pressed={recurrenceFrequency === option.value}
                    onClick={() => setRecurrenceFrequency(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="planning-card__actions planning-card__actions--split">
                <button type="button" className="secondary-button" onClick={() => setStep('quadrant')}>
                  返回
                </button>
                <button type="button" className="primary-button" onClick={() => setStep('confirm')}>
                  下一步：确认
                </button>
              </div>
            </>
          ) : null}

          {step === 'confirm' ? (
            <>
              <div className="planning-card__heading">
                <span>4 / 4</span>
                <h3>确认任务</h3>
              </div>
              <dl className="planning-confirmation">
                <dt>任务</dt>
                <dd>{title.trim()}</dd>
                <dt>四象限</dt>
                <dd>{selectedQuadrant.label}</dd>
                <dt>重复</dt>
                <dd>{selectedRecurrence.label}</dd>
              </dl>
              <div className="planning-card__actions planning-card__actions--split">
                <button type="button" className="secondary-button" onClick={() => setStep('recurrence')}>
                  返回
                </button>
                <button
                  type="button"
                  className="primary-button"
                  disabled={isSubmitting}
                  onClick={() => void submitTask()}
                >
                  确认添加任务
                </button>
              </div>
            </>
          ) : null}
        </div>
      </section>

      {showTemplates ? (
        <TaskTemplatePanel
          tasks={tasks}
          templates={templates}
          onSaveTemplate={onSaveTemplate}
          onApplyTemplate={onApplyTemplate}
        />
      ) : null}

      <TodayPlanSummary tasks={tasks} />
    </div>
  );
}

function TodayPlanSummary({ tasks }: { tasks: Task[] }) {
  return (
    <section className="planning-summary" aria-labelledby="today-plan-summary-title">
      <div className="section-heading">
        <h2 id="today-plan-summary-title">今日已安排</h2>
        <span>{tasks.length} 项</span>
      </div>
      {tasks.length === 0 ? (
        <p className="empty-state">今天还没有安排任务。</p>
      ) : (
        <ul className="planning-summary__list">
          {tasks.map((task) => (
            <li key={task.id} data-quadrant={task.quadrant}>
              <span>{task.title}</span>
              <div>
                <span>{quadrantLabel(task.quadrant)}</span>
                {task.recurrenceRuleId ? <span>重复</span> : null}
                {task.isCarryover ? <span>顺延</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function stepLabel(
  step: PlanningStep,
  title: string,
  quadrant: string,
  recurrence: string,
): string {
  if (step === 'title') {
    return title.trim() ? `任务标题 · ${title.trim()}` : '任务标题';
  }
  if (step === 'quadrant') {
    return `四象限 · ${quadrant}`;
  }
  if (step === 'recurrence') {
    return `重复规则 · ${recurrence}`;
  }
  return '确认添加';
}

function quadrantLabel(quadrant: Quadrant): string {
  return quadrantOptions.find((option) => option.value === quadrant)!.label;
}
