import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildReviewDecision,
  REASON_TAGS,
  validateDailyReview,
} from './reviewRules';
import type { DailyReview } from './types';

describe('reviewRules', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exports the fixed reason tags', () => {
    expect(REASON_TAGS).toEqual([
      'time_estimate_error',
      'unexpected_interruption',
      'low_energy',
      'external_dependency',
      'priority_changed',
      'unclear_task',
      'no_longer_needed',
    ]);
  });

  it('builds a postpone decision with a generated id and trimmed note', () => {
    const randomUUID = vi.fn(() => 'decision-1');
    vi.stubGlobal('crypto', { randomUUID });

    const decision = buildReviewDecision({
      taskId: 'task-1',
      action: 'postpone',
      targetDate: '2026-06-20',
      reasonTag: 'time_estimate_error',
      reasonNote: '  underestimated the task  ',
      now: '2026-06-17T21:00:00.000Z',
    });

    expect(randomUUID).toHaveBeenCalledOnce();
    expect(decision).toEqual({
      id: 'decision-1',
      taskId: 'task-1',
      action: 'postpone',
      targetDate: '2026-06-20',
      reasonTag: 'time_estimate_error',
      reasonNote: 'underestimated the task',
      createdAt: '2026-06-17T21:00:00.000Z',
    });
  });

  it('requires a target date for postponed or rescheduled tasks', () => {
    for (const action of ['postpone', 'reschedule'] as const) {
      expect(() =>
        buildReviewDecision({
          taskId: 'task-1',
          action,
          reasonTag: 'low_energy',
          now: '2026-06-17T21:00:00.000Z',
        }),
      ).toThrow('Target date is required for postponed or rescheduled tasks');
    }
  });

  it('turns a blank reason note into undefined', () => {
    const decision = buildReviewDecision({
      id: 'decision-1',
      taskId: 'task-1',
      action: 'drop',
      reasonTag: 'no_longer_needed',
      reasonNote: '   ',
      now: '2026-06-17T21:00:00.000Z',
    });

    expect(decision.reasonNote).toBeUndefined();
  });

  it('validates a daily review when all fields have text after trim', () => {
    expect(
      validateDailyReview({
        completedText: ' finished plan ',
        unfinishedText: ' left follow-up ',
        feelingText: ' steady ',
        tomorrowFocusText: ' write tests ',
      }),
    ).toBe(true);
  });

  it('rejects a daily review when any required field is blank', () => {
    const valid: DailyReview = {
      completedText: 'finished plan',
      unfinishedText: 'left follow-up',
      feelingText: 'steady',
      tomorrowFocusText: 'write tests',
    };

    for (const field of Object.keys(valid) as Array<keyof DailyReview>) {
      expect(validateDailyReview({ ...valid, [field]: '   ' })).toBe(false);
    }
  });
});
