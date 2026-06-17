import type { DailyReview, ReasonTag, ReviewDecision } from './types';

export const REASON_TAGS: ReasonTag[] = [
  'time_estimate_error',
  'unexpected_interruption',
  'low_energy',
  'external_dependency',
  'priority_changed',
  'unclear_task',
  'no_longer_needed',
];

export function buildReviewDecision(input: {
  id?: string;
  taskId: string;
  action: ReviewDecision['action'];
  targetDate?: string;
  reasonTag: ReasonTag;
  reasonNote?: string;
  now: string;
}): ReviewDecision {
  const targetDate = input.targetDate?.trim();
  const requiresTargetDate = input.action === 'postpone' || input.action === 'reschedule';

  if (requiresTargetDate && !targetDate) {
    throw new Error('Target date is required for postponed or rescheduled tasks');
  }

  const reasonNote = input.reasonNote?.trim();

  return {
    id: input.id ?? crypto.randomUUID(),
    taskId: input.taskId,
    action: input.action,
    ...(requiresTargetDate ? { targetDate } : {}),
    reasonTag: input.reasonTag,
    ...(reasonNote ? { reasonNote } : {}),
    createdAt: input.now,
  };
}

export function validateDailyReview(review: DailyReview): boolean {
  return (
    review.completedText.trim().length > 0 &&
    review.unfinishedText.trim().length > 0 &&
    review.feelingText.trim().length > 0 &&
    review.tomorrowFocusText.trim().length > 0
  );
}
