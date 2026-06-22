export type Quadrant =
  | 'important_urgent'
  | 'important_not_urgent'
  | 'not_important_urgent'
  | 'not_important_not_urgent';

export type TaskStatus =
  | 'not_started'
  | 'active_primary'
  | 'active_background'
  | 'paused'
  | 'completed'
  | 'postponed'
  | 'dropped';

export type Stage = 'plan' | 'execute' | 'review';
export type HomeView = 'folder' | 'galaxy';

export type ReasonTag =
  | 'time_estimate_error'
  | 'unexpected_interruption'
  | 'low_energy'
  | 'external_dependency'
  | 'priority_changed'
  | 'unclear_task'
  | 'no_longer_needed';

export interface Task {
  id: string;
  date: string;
  title: string;
  quadrant: Quadrant;
  status: TaskStatus;
  isCarryover: boolean;
  plannedDurationMinutes?: number;
  recurrenceRuleId?: string;
  carryoverFromDate?: string;
  postponeReasonTag?: ReasonTag;
  postponeReasonNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSession {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt?: string;
  isManual: boolean;
  durationMinutes?: number;
}

export interface ReviewDecision {
  id: string;
  taskId: string;
  action: 'postpone' | 'drop' | 'reschedule';
  targetDate?: string;
  reasonTag: ReasonTag;
  reasonNote?: string;
  createdAt: string;
}

export interface DailyReview {
  completedText: string;
  unfinishedText: string;
  feelingText: string;
  tomorrowFocusText: string;
}

export interface DailyFile {
  date: string;
  stage: Stage;
  goal: string;
  statusScore?: number;
  statusNote?: string;
  review?: DailyReview;
  reviewedAt?: string;
}

export interface UserSettings {
  homeView: HomeView;
  morningReminder?: string;
  eveningReminder?: string;
  notificationsEnabled: boolean;
}
