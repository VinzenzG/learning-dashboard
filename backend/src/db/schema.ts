import type Database from 'better-sqlite3';

export function initSchema(db: Database.Database): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS learning_units (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT    NOT NULL,
      file_name     TEXT    NOT NULL,
      file_path     TEXT    NOT NULL,
      file_hash     TEXT    UNIQUE NOT NULL,
      module_name   TEXT    DEFAULT NULL,
      markdown_path TEXT    DEFAULT NULL,
      slide_count   INTEGER DEFAULT 0,
      extracted_text TEXT,
      status        TEXT    DEFAULT 'pending',
      error_message TEXT,
      created_at    TEXT    DEFAULT (datetime('now')),
      updated_at    TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id         INTEGER NOT NULL REFERENCES learning_units(id) ON DELETE CASCADE,
      question_text   TEXT    NOT NULL,
      question_type   TEXT    NOT NULL,
      options         TEXT,
      correct_answer  TEXT    NOT NULL,
      explanation     TEXT    NOT NULL,
      topic_tag       TEXT    NOT NULL DEFAULT 'General',
      difficulty      INTEGER DEFAULT 3,
      source_hint     TEXT    DEFAULT NULL,
      created_at      TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS srs_cards (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id     INTEGER UNIQUE NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      status          TEXT    DEFAULT 'new',
      interval_days   REAL    DEFAULT 1,
      ease_factor     REAL    DEFAULT 2.5,
      repetitions     INTEGER DEFAULT 0,
      lapses          INTEGER DEFAULT 0,
      next_review_at  TEXT    DEFAULT (datetime('now')),
      last_reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id         INTEGER REFERENCES learning_units(id),
      session_type    TEXT    DEFAULT 'quiz',
      started_at      TEXT    DEFAULT (datetime('now')),
      ended_at        TEXT,
      cards_studied   INTEGER DEFAULT 0,
      correct_count   INTEGER DEFAULT 0,
      xp_earned       INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id         INTEGER NOT NULL REFERENCES srs_cards(id),
      session_id      INTEGER REFERENCES sessions(id),
      quality         INTEGER NOT NULL,
      confidence      INTEGER,
      time_taken_ms   INTEGER,
      was_correct     INTEGER NOT NULL,
      created_at      TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_stats (
      id                   INTEGER PRIMARY KEY DEFAULT 1,
      total_xp             INTEGER DEFAULT 0,
      level                INTEGER DEFAULT 1,
      current_streak_days  INTEGER DEFAULT 0,
      longest_streak_days  INTEGER DEFAULT 0,
      last_activity_date   TEXT,
      updated_at           TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS badges (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      slug         TEXT UNIQUE NOT NULL,
      name         TEXT NOT NULL,
      description  TEXT NOT NULL,
      icon         TEXT NOT NULL,
      unlocked_at  TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_srs_next_review ON srs_cards(next_review_at);
    CREATE INDEX IF NOT EXISTS idx_reviews_card    ON reviews(card_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_questions_unit  ON questions(unit_id, topic_tag);
  `);

  // Migrations for existing databases
  const cols = db.prepare(`PRAGMA table_info(learning_units)`).all() as { name: string }[];
  const colNames = cols.map(c => c.name);
  if (!colNames.includes('module_name')) {
    db.exec(`ALTER TABLE learning_units ADD COLUMN module_name TEXT DEFAULT NULL`);
  }
  if (!colNames.includes('markdown_path')) {
    db.exec(`ALTER TABLE learning_units ADD COLUMN markdown_path TEXT DEFAULT NULL`);
  }

  // Migrate questions table
  const qCols = db.prepare(`PRAGMA table_info(questions)`).all() as { name: string }[];
  if (!qCols.map(c => c.name).includes('source_hint')) {
    db.exec(`ALTER TABLE questions ADD COLUMN source_hint TEXT DEFAULT NULL`);
  }

  // Ensure user_stats row exists
  db.prepare(`INSERT OR IGNORE INTO user_stats (id) VALUES (1)`).run();

  // Seed badges
  const badges = [
    { slug: 'first_review',    name: 'First Steps',        description: 'Complete your first card review',                    icon: '🎯' },
    { slug: 'first_unit',      name: 'Ready to Learn',     description: 'First learning unit processed',                      icon: '📚' },
    { slug: 'day_3_streak',    name: 'Getting Started',    description: 'Maintain a 3-day learning streak',                   icon: '🔥' },
    { slug: 'week_warrior',    name: 'Week Warrior',       description: 'Maintain a 7-day learning streak',                   icon: '⚔️' },
    { slug: 'month_master',    name: 'Month Master',       description: 'Maintain a 30-day learning streak',                  icon: '👑' },
    { slug: 'unit_master',     name: 'Unit Master',        description: 'Master all cards in a learning unit',                icon: '🏆' },
    { slug: 'perfectionist',   name: 'Perfectionist',      description: '100% accuracy in a session with 10+ cards',         icon: '💎' },
    { slug: 'hundred_reviews', name: 'Centurion',          description: 'Complete 100 total reviews',                        icon: '💯' },
    { slug: 'speed_demon',     name: 'Speed Demon',        description: 'Average answer time under 5s in a 10+ card session', icon: '⚡' },
    { slug: 'feynman_fan',     name: 'Feynman Fan',        description: 'Submit 5 Feynman-mode explanations',                icon: '🧠' },
    { slug: 'comeback_kid',    name: 'Comeback Kid',       description: 'Return to learning after a 3+ day gap',             icon: '💪' },
    { slug: 'overachiever',    name: 'Overachiever',       description: 'Reach level 10',                                    icon: '🚀' },
  ];

  const insertBadge = db.prepare(`
    INSERT OR IGNORE INTO badges (slug, name, description, icon)
    VALUES (@slug, @name, @description, @icon)
  `);
  for (const b of badges) insertBadge.run(b);
}
