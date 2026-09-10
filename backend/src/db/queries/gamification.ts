import { getDb } from '../client';

export interface UserStats {
  id: number;
  total_xp: number;
  level: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_activity_date: string | null;
  updated_at: string;
}

export interface Badge {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string | null;
}

export function getUserStats(): UserStats {
  const db = getDb();
  return db.prepare(`SELECT * FROM user_stats WHERE id = 1`).get() as UserStats;
}

export function updateUserStats(data: Partial<Omit<UserStats, 'id' | 'updated_at'>>): void {
  const db = getDb();
  const sets = Object.entries(data)
    .map(([k]) => `${k} = @${k}`)
    .join(', ');
  db.prepare(`UPDATE user_stats SET ${sets}, updated_at = datetime('now') WHERE id = 1`).run(data);
}

export function getAllBadges(): Badge[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM badges ORDER BY id`).all() as Badge[];
}

export function unlockBadge(slug: string): Badge | null {
  const db = getDb();
  const badge = db.prepare(`SELECT * FROM badges WHERE slug = ?`).get(slug) as Badge | undefined;
  if (!badge || badge.unlocked_at) return null;
  db.prepare(`UPDATE badges SET unlocked_at = datetime('now') WHERE slug = ?`).run(slug);
  return db.prepare(`SELECT * FROM badges WHERE slug = ?`).get(slug) as Badge;
}

export function insertReview(data: {
  card_id: number;
  session_id: number | null;
  quality: number;
  confidence: number | null;
  time_taken_ms: number | null;
  was_correct: number;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO reviews (card_id, session_id, quality, confidence, time_taken_ms, was_correct)
    VALUES (@card_id, @session_id, @quality, @confidence, @time_taken_ms, @was_correct)
  `).run(data);
}

export function getTotalReviewCount(): number {
  const db = getDb();
  return (db.prepare(`SELECT COUNT(*) AS cnt FROM reviews`).get() as { cnt: number }).cnt;
}

export function getFeynmanCount(): number {
  const db = getDb();
  return (db.prepare(`
    SELECT COUNT(*) AS cnt FROM reviews r
    JOIN srs_cards c ON c.id = r.card_id
    JOIN questions q ON q.id = c.question_id
    WHERE q.question_type = 'feynman'
  `).get() as { cnt: number }).cnt;
}

export function insertSession(data: { unit_id: number | null; session_type: string }): number {
  const db = getDb();
  const r = db.prepare(`INSERT INTO sessions (unit_id, session_type) VALUES (@unit_id, @session_type)`).run(data);
  return r.lastInsertRowid as number;
}

export function endSession(id: number, data: { cards_studied: number; correct_count: number; xp_earned: number }): void {
  const db = getDb();
  db.prepare(`
    UPDATE sessions SET ended_at = datetime('now'), cards_studied = @cards_studied,
    correct_count = @correct_count, xp_earned = @xp_earned WHERE id = @id
  `).run({ ...data, id });
}

export function getSessionHistory(limit: number = 20): unknown[] {
  const db = getDb();
  return db.prepare(`
    SELECT s.*, u.title AS unit_title
    FROM sessions s
    LEFT JOIN learning_units u ON u.id = s.unit_id
    ORDER BY s.started_at DESC
    LIMIT ?
  `).all(limit);
}

export function getAccuracyByDay(days: number = 30): { date: string; accuracy: number; total_reviews: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      date(created_at) AS date,
      ROUND(AVG(was_correct) * 100, 1) AS accuracy,
      COUNT(*) AS total_reviews
    FROM reviews
    WHERE created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY date(created_at)
    ORDER BY date
  `).all(days) as { date: string; accuracy: number; total_reviews: number }[];
}

export function getWeakSpots(unitId?: number): { topic_tag: string; accuracy: number; total_reviews: number }[] {
  const db = getDb();
  const query = unitId
    ? `SELECT q.topic_tag, ROUND(AVG(r.was_correct)*100,1) AS accuracy, COUNT(*) AS total_reviews
       FROM reviews r JOIN srs_cards c ON c.id = r.card_id JOIN questions q ON q.id = c.question_id
       WHERE q.unit_id = ? GROUP BY q.topic_tag ORDER BY accuracy ASC`
    : `SELECT q.topic_tag, ROUND(AVG(r.was_correct)*100,1) AS accuracy, COUNT(*) AS total_reviews
       FROM reviews r JOIN srs_cards c ON c.id = r.card_id JOIN questions q ON q.id = c.question_id
       GROUP BY q.topic_tag ORDER BY accuracy ASC`;
  return (unitId ? db.prepare(query).all(unitId) : db.prepare(query).all()) as { topic_tag: string; accuracy: number; total_reviews: number }[];
}
