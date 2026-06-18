import Database from '@tauri-apps/plugin-sql';
import type {
  DailyFile,
  HomeView,
  Quadrant,
  ReasonTag,
  ReviewDecision,
  Stage,
  Task,
  TaskSession,
  TaskStatus,
  UserSettings,
} from '../domain/types';
import type { DailyRepository } from './dailyRepository';
import { SCHEMA_STATEMENTS } from './schema';

type SqlDatabase = Awaited<ReturnType<typeof Database.load>>;

interface DailyFileRow {
  date: string;
  stage: Stage;
  goal: string;
  status_score: number | null;
  status_note: string | null;
  review_completed_text: string | null;
  review_unfinished_text: string | null;
  review_feeling_text: string | null;
  review_tomorrow_focus_text: string | null;
  reviewed_at: string | null;
}

interface TaskRow {
  id: string;
  date: string;
  title: string;
  quadrant: Quadrant;
  status: TaskStatus;
  is_carryover: number;
  carryover_from_date: string | null;
  postpone_reason_tag: ReasonTag | null;
  postpone_reason_note: string | null;
  created_at: string;
  updated_at: string;
}

interface TaskSessionRow {
  id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
  is_manual: number;
  duration_minutes: number | null;
}

interface UserSettingsRow {
  home_view: HomeView;
  morning_reminder: string | null;
  evening_reminder: string | null;
  notifications_enabled: number;
}

const DEFAULT_SETTINGS: UserSettings = {
  homeView: 'folder',
  notificationsEnabled: false,
};

export async function createTauriSqlDailyRepository(): Promise<DailyRepository> {
  const db = await Database.load('sqlite:daily-plan-review.db');

  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(statement);
  }

  return createRepository(db);
}

function createRepository(db: SqlDatabase): DailyRepository {
  const saveDailyFile: DailyRepository['saveDailyFile'] = async (file) => {
    await db.execute(
      `INSERT INTO daily_files (
        date,
        stage,
        goal,
        status_score,
        status_note,
        review_completed_text,
        review_unfinished_text,
        review_feeling_text,
        review_tomorrow_focus_text,
        reviewed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT(date) DO UPDATE SET
        stage = excluded.stage,
        goal = excluded.goal,
        status_score = excluded.status_score,
        status_note = excluded.status_note,
        review_completed_text = excluded.review_completed_text,
        review_unfinished_text = excluded.review_unfinished_text,
        review_feeling_text = excluded.review_feeling_text,
        review_tomorrow_focus_text = excluded.review_tomorrow_focus_text,
        reviewed_at = excluded.reviewed_at`,
      [
        file.date,
        file.stage,
        file.goal,
        file.statusScore ?? null,
        file.statusNote ?? null,
        file.review?.completedText ?? null,
        file.review?.unfinishedText ?? null,
        file.review?.feelingText ?? null,
        file.review?.tomorrowFocusText ?? null,
        file.reviewedAt ?? null,
      ],
    );
  };

  return {
    async getDailyFile(date) {
      const rows = await db.select<DailyFileRow[]>(
        'SELECT * FROM daily_files WHERE date = $1',
        [date],
      );
      const row = rows[0];

      if (row) {
        return mapDailyFile(row);
      }

      const file: DailyFile = { date, stage: 'plan', goal: '' };
      await saveDailyFile(file);
      return file;
    },

    saveDailyFile,

    async listTasks(date) {
      const rows = await db.select<TaskRow[]>(
        'SELECT * FROM tasks WHERE date = $1 ORDER BY created_at ASC',
        [date],
      );
      return rows.map(mapTask);
    },

    async saveTask(task) {
      await db.execute(
        `INSERT INTO tasks (
          id,
          date,
          title,
          quadrant,
          status,
          is_carryover,
          carryover_from_date,
          postpone_reason_tag,
          postpone_reason_note,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT(id) DO UPDATE SET
          date = excluded.date,
          title = excluded.title,
          quadrant = excluded.quadrant,
          status = excluded.status,
          is_carryover = excluded.is_carryover,
          carryover_from_date = excluded.carryover_from_date,
          postpone_reason_tag = excluded.postpone_reason_tag,
          postpone_reason_note = excluded.postpone_reason_note,
          updated_at = excluded.updated_at`,
        [
          task.id,
          task.date,
          task.title,
          task.quadrant,
          task.status,
          task.isCarryover ? 1 : 0,
          task.carryoverFromDate ?? null,
          task.postponeReasonTag ?? null,
          task.postponeReasonNote ?? null,
          task.createdAt,
          task.updatedAt,
        ],
      );
    },

    async listSessions(taskId) {
      const rows = await db.select<TaskSessionRow[]>(
        'SELECT * FROM task_sessions WHERE task_id = $1',
        [taskId],
      );
      return rows.map(mapSession);
    },

    async saveSession(session) {
      await db.execute(
        `INSERT INTO task_sessions (
          id,
          task_id,
          started_at,
          ended_at,
          is_manual,
          duration_minutes
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT(id) DO UPDATE SET
          task_id = excluded.task_id,
          started_at = excluded.started_at,
          ended_at = excluded.ended_at,
          is_manual = excluded.is_manual,
          duration_minutes = excluded.duration_minutes`,
        [
          session.id,
          session.taskId,
          session.startedAt,
          session.endedAt ?? null,
          session.isManual ? 1 : 0,
          session.durationMinutes ?? null,
        ],
      );
    },

    async saveReviewDecision(decision) {
      await db.execute(
        `INSERT INTO review_decisions (
          id,
          task_id,
          action,
          target_date,
          reason_tag,
          reason_note,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT(id) DO UPDATE SET
          task_id = excluded.task_id,
          action = excluded.action,
          target_date = excluded.target_date,
          reason_tag = excluded.reason_tag,
          reason_note = excluded.reason_note`,
        [
          decision.id,
          decision.taskId,
          decision.action,
          decision.targetDate ?? null,
          decision.reasonTag,
          decision.reasonNote ?? null,
          decision.createdAt,
        ],
      );
    },

    async listCarryoverCandidates(today) {
      const rows = await db.select<TaskRow[]>(
        `SELECT * FROM tasks
        WHERE status = $1 AND date < $2
        ORDER BY date ASC, created_at ASC`,
        ['postponed', today],
      );
      return rows.map(mapTask);
    },

    async getSettings() {
      const rows = await db.select<UserSettingsRow[]>(
        'SELECT home_view, morning_reminder, evening_reminder, notifications_enabled FROM user_settings WHERE id = 1',
      );
      const row = rows[0];
      return row ? mapSettings(row) : { ...DEFAULT_SETTINGS };
    },

    async saveSettings(settings) {
      await db.execute(
        `INSERT INTO user_settings (
          id,
          home_view,
          morning_reminder,
          evening_reminder,
          notifications_enabled
        ) VALUES (1, $1, $2, $3, $4)
        ON CONFLICT(id) DO UPDATE SET
          home_view = excluded.home_view,
          morning_reminder = excluded.morning_reminder,
          evening_reminder = excluded.evening_reminder,
          notifications_enabled = excluded.notifications_enabled`,
        [
          settings.homeView,
          settings.morningReminder ?? null,
          settings.eveningReminder ?? null,
          settings.notificationsEnabled ? 1 : 0,
        ],
      );
    },
  };
}

function mapDailyFile(row: DailyFileRow): DailyFile {
  const file: DailyFile = {
    date: row.date,
    stage: row.stage,
    goal: row.goal,
    statusScore: row.status_score ?? undefined,
    statusNote: row.status_note ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
  };

  if (
    row.review_completed_text !== null ||
    row.review_unfinished_text !== null ||
    row.review_feeling_text !== null ||
    row.review_tomorrow_focus_text !== null
  ) {
    file.review = {
      completedText: row.review_completed_text ?? '',
      unfinishedText: row.review_unfinished_text ?? '',
      feelingText: row.review_feeling_text ?? '',
      tomorrowFocusText: row.review_tomorrow_focus_text ?? '',
    };
  }

  return file;
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    quadrant: row.quadrant,
    status: row.status,
    isCarryover: toBoolean(row.is_carryover),
    carryoverFromDate: row.carryover_from_date ?? undefined,
    postponeReasonTag: row.postpone_reason_tag ?? undefined,
    postponeReasonNote: row.postpone_reason_note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSession(row: TaskSessionRow): TaskSession {
  return {
    id: row.id,
    taskId: row.task_id,
    startedAt: row.started_at,
    endedAt: row.ended_at ?? undefined,
    isManual: toBoolean(row.is_manual),
    durationMinutes: row.duration_minutes ?? undefined,
  };
}

function mapSettings(row: UserSettingsRow): UserSettings {
  return {
    homeView: row.home_view,
    morningReminder: row.morning_reminder ?? undefined,
    eveningReminder: row.evening_reminder ?? undefined,
    notificationsEnabled: toBoolean(row.notifications_enabled),
  };
}

function toBoolean(value: number): boolean {
  return value !== 0;
}
