import { useState, type FormEvent } from 'react';
import type { RecurrenceFrequency } from '../domain/recurrenceRules';
import type { Quadrant } from '../domain/types';

const quadrantLabels: Record<Quadrant, string> = {
  important_urgent: '重要且紧急',
  important_not_urgent: '重要不紧急',
  not_important_urgent: '不重要但紧急',
  not_important_not_urgent: '不重要不紧急',
};

const quadrants: Quadrant[] = [
  'important_urgent',
  'important_not_urgent',
  'not_important_urgent',
  'not_important_not_urgent',
];

const recurrenceOptions: Array<{ value: ''; label: string } | { value: RecurrenceFrequency; label: string }> = [
  { value: '', label: '不重复' },
  { value: 'daily', label: '每天' },
  { value: 'workday', label: '工作日' },
  { value: 'weekly', label: '每周' },
];

export function TaskQuickAdd({
  onAdd,
}: {
  onAdd: (input: {
    title: string;
    quadrant: Quadrant;
    recurrenceFrequency?: RecurrenceFrequency;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [quadrant, setQuadrant] = useState<Quadrant>('important_urgent');
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'' | RecurrenceFrequency>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        title: trimmedTitle,
        quadrant,
        recurrenceFrequency: recurrenceFrequency || undefined,
      });
      setTitle('');
      setRecurrenceFrequency('');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="quick-add" onSubmit={handleSubmit}>
      <label className="field">
        <span>任务标题</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="写下今天要推进的事"
        />
      </label>
      <label className="field">
        <span>四象限</span>
        <select value={quadrant} onChange={(event) => setQuadrant(event.target.value as Quadrant)}>
          {quadrants.map((item) => (
            <option key={item} value={item}>
              {quadrantLabels[item]}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>重复</span>
        <select
          value={recurrenceFrequency}
          onChange={(event) => setRecurrenceFrequency(event.target.value as '' | RecurrenceFrequency)}
        >
          {recurrenceOptions.map((item) => (
            <option key={item.value || 'none'} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="primary-button" disabled={isSubmitting}>
        添加任务
      </button>
    </form>
  );
}
