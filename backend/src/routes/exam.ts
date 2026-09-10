import { Router, type Request, type Response } from 'express';
import { getDb } from '../db/client';

const router = Router();

// GET /api/exam/modules — list modules with question counts
router.get('/modules', (_req: Request, res: Response) => {
  const db = getDb();
  const modules = db.prepare(`
    SELECT
      COALESCE(u.module_name, '__unmodule__') AS module_name,
      COUNT(DISTINCT u.id)                    AS unit_count,
      COUNT(q.id)                             AS question_count
    FROM learning_units u
    JOIN questions q ON q.unit_id = u.id
    WHERE u.status = 'ready'
    GROUP BY u.module_name
    ORDER BY u.module_name
  `).all() as { module_name: string; unit_count: number; question_count: number }[];

  res.json({ modules });
});

// POST /api/exam/start — draw random questions for an exam session
// Body: { moduleName?: string; count?: number }
router.post('/start', (req: Request, res: Response) => {
  const { moduleName, count = 30 } = req.body as { moduleName?: string; count?: number };
  const db = getDb();

  let questions;
  if (moduleName && moduleName !== '__unmodule__') {
    questions = db.prepare(`
      SELECT q.id, q.question_text, q.question_type, q.options,
             q.correct_answer, q.explanation, q.topic_tag, q.difficulty
      FROM questions q
      JOIN learning_units u ON u.id = q.unit_id
      WHERE u.module_name = ? AND u.status = 'ready'
        AND q.question_type != 'feynman'
      ORDER BY RANDOM()
      LIMIT ?
    `).all(moduleName, count);
  } else if (moduleName === '__unmodule__') {
    questions = db.prepare(`
      SELECT q.id, q.question_text, q.question_type, q.options,
             q.correct_answer, q.explanation, q.topic_tag, q.difficulty
      FROM questions q
      JOIN learning_units u ON u.id = q.unit_id
      WHERE u.module_name IS NULL AND u.status = 'ready'
        AND q.question_type != 'feynman'
      ORDER BY RANDOM()
      LIMIT ?
    `).all(count);
  } else {
    questions = db.prepare(`
      SELECT q.id, q.question_text, q.question_type, q.options,
             q.correct_answer, q.explanation, q.topic_tag, q.difficulty
      FROM questions q
      JOIN learning_units u ON u.id = q.unit_id
      WHERE u.status = 'ready'
        AND q.question_type != 'feynman'
      ORDER BY RANDOM()
      LIMIT ?
    `).all(count);
  }

  res.json({ questions, total: (questions as unknown[]).length });
});

export default router;
