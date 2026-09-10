import { getDb } from '../client';

export interface LearningUnit {
  id: number;
  title: string;
  file_name: string;
  file_path: string;
  file_hash: string;
  module_name: string | null;
  markdown_path: string | null;
  slide_count: number;
  extracted_text: string | null;
  status: 'pending' | 'processing' | 'ready' | 'warning' | 'error';
  error_message: string | null;
  created_at: string;
  updated_at: string;
  // aggregated
  total_cards?: number;
  new_cards?: number;
  learning_cards?: number;
  review_cards?: number;
  mastered_cards?: number;
  due_cards?: number;
}

export function getAllUnits(): LearningUnit[] {
  const db = getDb();
  return db.prepare(`
    SELECT
      u.*,
      COUNT(c.id)                                             AS total_cards,
      SUM(CASE WHEN c.status = 'new'      THEN 1 ELSE 0 END) AS new_cards,
      SUM(CASE WHEN c.status = 'learning' THEN 1 ELSE 0 END) AS learning_cards,
      SUM(CASE WHEN c.status = 'review'   THEN 1 ELSE 0 END) AS review_cards,
      SUM(CASE WHEN c.status = 'mastered' THEN 1 ELSE 0 END) AS mastered_cards,
      SUM(CASE WHEN c.next_review_at <= datetime('now') AND c.status != 'mastered' THEN 1 ELSE 0 END) AS due_cards
    FROM learning_units u
    LEFT JOIN questions q ON q.unit_id = u.id
    LEFT JOIN srs_cards c ON c.question_id = q.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all() as LearningUnit[];
}

export function getUnitById(id: number): LearningUnit | null {
  const db = getDb();
  const unit = db.prepare(`SELECT * FROM learning_units WHERE id = ?`).get(id) as LearningUnit | undefined;
  return unit ?? null;
}

export function getUnitByHash(hash: string): LearningUnit | null {
  const db = getDb();
  const unit = db.prepare(`SELECT * FROM learning_units WHERE file_hash = ?`).get(hash) as LearningUnit | undefined;
  return unit ?? null;
}

export function insertUnit(data: {
  title: string;
  file_name: string;
  file_path: string;
  file_hash: string;
  module_name?: string | null;
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO learning_units (title, file_name, file_path, file_hash, module_name)
    VALUES (@title, @file_name, @file_path, @file_hash, @module_name)
  `).run({ ...data, module_name: data.module_name ?? null });
  return result.lastInsertRowid as number;
}

export function updateMarkdownPath(id: number, markdownPath: string): void {
  const db = getDb();
  db.prepare(`UPDATE learning_units SET markdown_path = ?, updated_at = datetime('now') WHERE id = ?`).run(markdownPath, id);
}

export function getModuleNames(): string[] {
  const db = getDb();
  const rows = db.prepare(`SELECT DISTINCT module_name FROM learning_units WHERE module_name IS NOT NULL ORDER BY module_name`).all() as { module_name: string }[];
  return rows.map(r => r.module_name);
}

export function updateUnitStatus(id: number, status: LearningUnit['status'], extra?: {
  slide_count?: number;
  extracted_text?: string;
  error_message?: string;
}): void {
  const db = getDb();
  db.prepare(`
    UPDATE learning_units
    SET status = ?, slide_count = COALESCE(?, slide_count),
        extracted_text = COALESCE(?, extracted_text),
        error_message = ?,
        updated_at = datetime('now')
    WHERE id = ?
  `).run(status, extra?.slide_count ?? null, extra?.extracted_text ?? null, extra?.error_message ?? null, id);
}

export function deleteUnitQuestions(unitId: number): void {
  const db = getDb();
  db.prepare(`DELETE FROM questions WHERE unit_id = ?`).run(unitId);
}
