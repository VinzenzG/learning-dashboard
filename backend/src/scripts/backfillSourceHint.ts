/**
 * Backfills source_hint for existing questions that have NULL.
 * Questions were generated sequentially per chunk, so we distribute them proportionally.
 * Run with: npx tsx backend/src/scripts/backfillSourceHint.ts
 */

import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

import { getDb } from '../db/client';
import { chunkText } from '../ingestion/textChunker';

const db = getDb();

interface UnitRow {
  id: number;
  title: string;
  file_name: string;
  extracted_text: string | null;
  slide_count: number;
}

interface QuestionRow {
  id: number;
  created_at: string;
}

const units = db.prepare(`
  SELECT id, title, file_name, extracted_text, slide_count
  FROM learning_units
  WHERE extracted_text IS NOT NULL AND status IN ('ready', 'warning')
`).all() as UnitRow[];

console.log(`Found ${units.length} units to process`);

let totalUpdated = 0;

for (const unit of units) {
  if (!unit.extracted_text || unit.extracted_text.trim().length < 50) continue;

  const ext = path.extname(unit.file_name).toLowerCase();
  const isSlide = ext === '.pptx';
  const label = (n: number) => isSlide ? (n === 1 ? 'Folie' : 'Folien') : (n === 1 ? 'Seite' : 'Seiten');

  const chunks = chunkText(unit.extracted_text);
  if (chunks.length === 0) continue;

  // Get all questions for this unit that have no source_hint, ordered by creation
  const questions = db.prepare(`
    SELECT id, created_at FROM questions
    WHERE unit_id = ? AND source_hint IS NULL
    ORDER BY id ASC
  `).all(unit.id) as QuestionRow[];

  if (questions.length === 0) {
    console.log(`  [${unit.title}] no NULL source_hints, skip`);
    continue;
  }

  // Distribute questions across chunks proportionally
  // Since questions were inserted sequentially per chunk, we split evenly
  const qPerChunk = questions.length / chunks.length;
  const update = db.prepare(`UPDATE questions SET source_hint = ? WHERE id = ?`);
  const updateMany = db.transaction((rows: { id: number; hint: string }[]) => {
    for (const row of rows) update.run(row.hint, row.id);
  });

  const updates: { id: number; hint: string }[] = [];

  chunks.forEach((chunk, chunkIdx) => {
    const start = Math.round(chunkIdx * qPerChunk);
    const end = Math.round((chunkIdx + 1) * qPerChunk);
    const chunkQuestions = questions.slice(start, end);

    const hint = chunk.slideStart === chunk.slideEnd
      ? `${label(1)} ${chunk.slideStart}`
      : `${label(2)} ${chunk.slideStart}–${chunk.slideEnd}`;

    for (const q of chunkQuestions) {
      updates.push({ id: q.id, hint });
    }
  });

  updateMany(updates);
  totalUpdated += updates.length;
  console.log(`  [${unit.title}] ${updates.length} questions updated across ${chunks.length} chunks`);
}

console.log(`\nDone. Total updated: ${totalUpdated}`);
