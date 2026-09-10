import { getDb } from '../client';

export interface Question {
  id: number;
  unit_id: number;
  question_text: string;
  question_type: 'mc' | 'truefalse' | 'fillin' | 'shortanswer' | 'feynman';
  options: string | null;
  correct_answer: string;
  explanation: string;
  topic_tag: string;
  difficulty: number;
  source_hint: string | null;
  created_at: string;
}

export interface QuestionWithCard extends Question {
  card_id: number;
  card_status: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  next_review_at: string;
}

export function insertQuestion(data: {
  unit_id: number;
  question_text: string;
  question_type: Question['question_type'];
  options: string | null;
  correct_answer: string;
  explanation: string;
  topic_tag: string;
  difficulty: number;
  source_hint?: string | null;
}): number {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO questions (unit_id, question_text, question_type, options, correct_answer, explanation, topic_tag, difficulty, source_hint)
    VALUES (@unit_id, @question_text, @question_type, @options, @correct_answer, @explanation, @topic_tag, @difficulty, @source_hint)
  `).run({ ...data, source_hint: data.source_hint ?? null });
  return result.lastInsertRowid as number;
}

export function getQuestionsByUnit(unitId: number): QuestionWithCard[] {
  const db = getDb();
  return db.prepare(`
    SELECT q.*, c.id AS card_id, c.status AS card_status, c.interval_days,
           c.ease_factor, c.repetitions, c.next_review_at
    FROM questions q
    LEFT JOIN srs_cards c ON c.question_id = q.id
    WHERE q.unit_id = ?
    ORDER BY q.id
  `).all(unitId) as QuestionWithCard[];
}
