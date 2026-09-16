/**
 * Exports the Learning Dashboard database to static JSON files
 * for deployment as a static SPA (no backend needed).
 *
 * Usage: npm run export-static
 * Output: frontend/public/data/*.json
 */

import Database from 'better-sqlite3';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DB_PATH = process.env.DB_PATH ?? join(ROOT, 'data', 'learning.db');
const OUT_DIR = join(ROOT, 'frontend', 'public', 'data');

mkdirSync(OUT_DIR, { recursive: true });

const db = new Database(DB_PATH, { readonly: true });

function write(name, data) {
  const path = join(OUT_DIR, `${name}.json`);
  writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ✓ ${name}.json (${JSON.stringify(data).length} bytes)`);
}

console.log(`\nExporting from: ${DB_PATH}`);

// Learning units with card counts
const units = db.prepare(`
  SELECT
    u.*,
    COUNT(c.id) AS total_cards,
    SUM(CASE WHEN c.status = 'new' THEN 1 ELSE 0 END) AS new_cards,
    SUM(CASE WHEN c.status = 'learning' THEN 1 ELSE 0 END) AS learning_cards,
    SUM(CASE WHEN c.status = 'review' THEN 1 ELSE 0 END) AS review_cards,
    SUM(CASE WHEN c.status = 'mastered' THEN 1 ELSE 0 END) AS mastered_cards,
    0 AS due_cards
  FROM learning_units u
  LEFT JOIN questions q ON q.unit_id = u.id
  LEFT JOIN srs_cards c ON c.question_id = q.id
  WHERE u.status = 'ready'
  GROUP BY u.id
  ORDER BY u.module_name, u.title
`).all();

// Questions per unit
const questions = db.prepare(`
  SELECT q.*, c.id AS card_id, c.status AS card_status,
         c.interval_days, c.ease_factor, c.repetitions, c.next_review_at
  FROM questions q
  LEFT JOIN srs_cards c ON c.question_id = q.id
  ORDER BY q.unit_id, q.topic_tag
`).all();

// Gamification stats
const stats = db.prepare(`SELECT * FROM user_stats WHERE id = 1`).get();
const badges = db.prepare(`SELECT * FROM badges ORDER BY id`).all();

// Analytics (last 90 days)
const accuracy = db.prepare(`
  SELECT DATE(r.created_at) AS date,
         ROUND(AVG(CASE WHEN r.was_correct = 1 THEN 100.0 ELSE 0 END), 1) AS accuracy,
         COUNT(*) AS total_reviews
  FROM reviews r
  WHERE r.created_at >= DATE('now', '-90 days')
  GROUP BY DATE(r.created_at)
  ORDER BY date DESC
`).all();

// Modules summary
const modules = [...new Set(units.map(u => u.module_name).filter(Boolean))].map(name => ({
  module_name: name,
  unit_count: units.filter(u => u.module_name === name).length,
  question_count: questions.filter(q => {
    const unit = units.find(u => u.id === q.unit_id);
    return unit?.module_name === name && q.question_type !== 'feynman';
  }).length,
}));

write('units', { units, dueTotal: 0 });
write('questions', questions);
write('gamification', { stats, badges });
write('analytics-accuracy', accuracy);
write('modules', { modules });

db.close();
console.log(`\n✅ Static export complete → frontend/public/data/\n`);
console.log('Next steps:');
console.log('  1. npm run build -w frontend');
console.log('  2. Push to GitHub → GitHub Actions deploys to Netcup');
