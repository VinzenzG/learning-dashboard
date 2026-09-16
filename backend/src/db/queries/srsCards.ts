import { getDb } from '../client';

export interface SrsCard {
  id: number;
  question_id: number;
  status: 'new' | 'learning' | 'review' | 'mastered';
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  lapses: number;
  next_review_at: string;
  last_reviewed_at: string | null;
}

export interface SrsCardWithQuestion extends SrsCard {
  question_text: string;
  question_type: string;
  options: string | null;
  correct_answer: string;
  explanation: string;
  topic_tag: string;
  difficulty: number;
  source_hint: string | null;
  unit_id: number;
  unit_title: string;
}

export function insertCard(questionId: number): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO srs_cards (question_id) VALUES (?)
  `).run(questionId);
  return result.lastInsertRowid as number;
}

export function getCardById(id: number): SrsCard | null {
  const db = getDb();
  return (db.prepare(`SELECT * FROM srs_cards WHERE id = ?`).get(id) as SrsCard | undefined) ?? null;
}

export function getDueCards(limit: number = 20, interleave: boolean = true, moduleName?: string): SrsCardWithQuestion[] {
  const db = getDb();
  const whereModule = moduleName ? `AND u.module_name = '${moduleName.replace(/'/g, "''")}'` : '';
  const cards = db.prepare(`
    SELECT c.*, q.question_text, q.question_type, q.options, q.correct_answer,
           q.explanation, q.topic_tag, q.difficulty, q.source_hint, q.unit_id,
           u.title AS unit_title, u.module_name
    FROM srs_cards c
    JOIN questions q ON q.id = c.question_id
    JOIN learning_units u ON u.id = q.unit_id
    WHERE c.next_review_at <= datetime('now')
      AND c.status != 'mastered'
      AND u.status = 'ready'
      ${whereModule}
    ORDER BY c.next_review_at ASC
    LIMIT ?
  `).all(limit * 3) as SrsCardWithQuestion[];

  if (!interleave || cards.length === 0) return cards.slice(0, limit);

  // Interleave: shuffle by topic_tag to mix topics
  const byTopic = new Map<string, SrsCardWithQuestion[]>();
  for (const c of cards) {
    if (!byTopic.has(c.topic_tag)) byTopic.set(c.topic_tag, []);
    byTopic.get(c.topic_tag)!.push(c);
  }

  const interleaved: SrsCardWithQuestion[] = [];
  const queues = Array.from(byTopic.values());
  let i = 0;
  while (interleaved.length < limit && queues.some(q => q.length > 0)) {
    const q = queues[i % queues.length];
    if (q.length > 0) interleaved.push(q.shift()!);
    i++;
  }
  return interleaved;
}

export function getTotalDueCount(moduleName?: string): number {
  const db = getDb();
  const whereModule = moduleName ? `AND u.module_name = '${moduleName.replace(/'/g, "''")}'` : '';
  const row = db.prepare(`
    SELECT COUNT(*) AS cnt FROM srs_cards c
    JOIN questions q ON q.id = c.question_id
    JOIN learning_units u ON u.id = q.unit_id
    WHERE c.next_review_at <= datetime('now')
      AND c.status != 'mastered'
      AND u.status = 'ready'
      ${whereModule}
  `).get() as { cnt: number };
  return row.cnt;
}

export function updateCard(id: number, data: {
  status: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  lapses: number;
  next_review_at: string;
}): void {
  const db = getDb();
  db.prepare(`
    UPDATE srs_cards
    SET status = @status, interval_days = @interval_days, ease_factor = @ease_factor,
        repetitions = @repetitions, lapses = @lapses,
        next_review_at = @next_review_at, last_reviewed_at = datetime('now')
    WHERE id = @id
  `).run({ ...data, id });
}
