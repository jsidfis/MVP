export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS daily_files (
    date TEXT PRIMARY KEY,
    stage TEXT NOT NULL,
    goal TEXT NOT NULL DEFAULT '',
    status_score INTEGER,
    status_note TEXT,
    review_completed_text TEXT,
    review_unfinished_text TEXT,
    review_feeling_text TEXT,
    review_tomorrow_focus_text TEXT,
    reviewed_at TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    quadrant TEXT NOT NULL,
    status TEXT NOT NULL,
    is_carryover INTEGER NOT NULL,
    planned_duration_minutes INTEGER,
    carryover_from_date TEXT,
    postpone_reason_tag TEXT,
    postpone_reason_note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS task_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    items_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS task_sessions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    is_manual INTEGER NOT NULL,
    duration_minutes INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS review_decisions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    action TEXT NOT NULL,
    target_date TEXT,
    reason_tag TEXT NOT NULL,
    reason_note TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    home_view TEXT NOT NULL,
    morning_reminder TEXT,
    evening_reminder TEXT,
    notifications_enabled INTEGER NOT NULL
  )`,
];
