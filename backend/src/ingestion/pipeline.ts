import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { config } from '../config';
import { createAdapter } from '../ai/adapter';
import { chunkText } from './textChunker';
import { extractPdf } from './extractPdf';
import { extractPptx } from './extractPptx';
import { exportQuestionsToMarkdown, exportSummaryToMarkdown } from './markdownExport';
import {
  insertUnit, updateUnitStatus, getUnitByHash, updateMarkdownPath,
} from '../db/queries/learningUnits';
import { insertQuestion, getQuestionsByUnit } from '../db/queries/questions';
import { insertCard } from '../db/queries/srsCards';
import { sseEmit } from '../routes/events';

function hashFile(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function titleFromFilename(fileName: string): string {
  return path.basename(fileName, path.extname(fileName))
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function outputFolder(): string {
  return path.resolve(path.dirname(config.watchFolder), 'output');
}

export async function processFile(filePath: string, moduleName: string | null = null): Promise<void> {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();

  if (!['.pdf', '.pptx'].includes(ext)) return;

  const hash = hashFile(filePath);
  const existing = getUnitByHash(hash);
  if (existing) {
    console.log(`[Pipeline] Skipping duplicate: ${fileName}`);
    return;
  }

  const title = titleFromFilename(fileName);
  const unitId = insertUnit({ title, file_name: fileName, file_path: filePath, file_hash: hash, module_name: moduleName });

  sseEmit({ type: 'ingestion_start', unitId, fileName, moduleName });
  console.log(`[Pipeline] Processing: ${fileName} (unit ${unitId})${moduleName ? ` [${moduleName}]` : ''}`);

  try {
    updateUnitStatus(unitId, 'processing');

    let extracted: { text: string; pageCount: number; isImageBased: boolean };
    if (ext === '.pdf') {
      extracted = await extractPdf(filePath);
    } else {
      extracted = await extractPptx(filePath);
    }

    if (extracted.isImageBased || extracted.text.trim().length < 100) {
      updateUnitStatus(unitId, 'warning', {
        slide_count: extracted.pageCount,
        extracted_text: extracted.text,
        error_message: 'PDF appears to be image-based — text extraction incomplete.',
      });
      sseEmit({ type: 'ingestion_complete', unitId, questionCount: 0, warning: true });
      return;
    }

    const adapter = await createAdapter(config);
    const chunks = chunkText(extracted.text);
    let totalQuestions = 0;
    const isSlide = ext === '.pptx';

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      sseEmit({ type: 'ingestion_progress', unitId, step: i + 1, total: chunks.length });
      const questions = await adapter.generateQuestions(chunk.text, title, config.questionsPerChunk);

      const sourceHint = chunk.slideStart === chunk.slideEnd
        ? `${isSlide ? 'Folie' : 'Seite'} ${chunk.slideStart}`
        : `${isSlide ? 'Folien' : 'Seiten'} ${chunk.slideStart}–${chunk.slideEnd}`;

      for (const q of questions) {
        // Skip questions missing required fields
        if (!q.question_text?.trim() || !q.correct_answer?.trim()) continue;

        const validTypes = ['mc', 'truefalse', 'fillin', 'shortanswer', 'feynman'];
        if (!validTypes.includes(q.question_type)) q.question_type = 'shortanswer';
        if (q.question_type === 'mc' && !Array.isArray(q.options)) q.options = null;

        const qId = insertQuestion({
          unit_id: unitId,
          question_text: q.question_text.trim(),
          question_type: q.question_type as 'mc' | 'truefalse' | 'fillin' | 'shortanswer' | 'feynman',
          options: q.options ? JSON.stringify(q.options) : null,
          correct_answer: q.correct_answer.trim(),
          explanation: q.explanation?.trim() || '–',
          topic_tag: q.topic_tag?.trim() || 'General',
          difficulty: Math.min(5, Math.max(1, Math.round(q.difficulty || 3))),
          source_hint: sourceHint,
        });
        insertCard(qId);
        totalQuestions++;
      }
    }

    updateUnitStatus(unitId, 'ready', {
      slide_count: extracted.pageCount,
      extracted_text: extracted.text,
    });

    // Markdown export
    const outDir = moduleName
      ? path.join(outputFolder(), moduleName)
      : outputFolder();
    const baseName = path.basename(fileName, ext) + '.md';
    const mdPath = path.join(outDir, baseName);

    const allQuestions = getQuestionsByUnit(unitId);
    exportQuestionsToMarkdown(allQuestions, title, mdPath);
    updateMarkdownPath(unitId, mdPath);
    console.log(`[Pipeline] Markdown exported: ${mdPath}`);

    // KI-Zusammenfassung — generate once per module (or per file if no module)
    if (moduleName) {
      const summaryPath = path.join(outputFolder(), moduleName, '_zusammenfassung.md');
      // Generate if not yet written for this module
      if (!fs.existsSync(summaryPath)) {
        const summary = await adapter.generateSummary(extracted.text, moduleName);
        exportSummaryToMarkdown(summary, moduleName, summaryPath);
        console.log(`[Pipeline] Summary exported: ${summaryPath}`);
      }
    }

    sseEmit({ type: 'ingestion_complete', unitId, questionCount: totalQuestions });
    console.log(`[Pipeline] Done: ${fileName} — ${totalQuestions} questions`);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Pipeline] Error processing ${fileName}:`, msg);
    updateUnitStatus(unitId, 'error', { error_message: msg });
    sseEmit({ type: 'ingestion_error', unitId, error: msg });
  }
}

export async function deepenTopic(
  unitId: number,
  unitTitle: string,
  extractedText: string,
  topicTag: string | null,
): Promise<{ added: number }> {
  const adapter = await createAdapter(config);
  const tag = topicTag ?? 'General';
  const questions = await adapter.generateQuestionsForTopic(extractedText, unitTitle, tag, 8);

  let added = 0;
  for (const q of questions) {
    if (!q.question_text?.trim() || !q.correct_answer?.trim()) continue;

    const validTypes = ['mc', 'truefalse', 'fillin', 'shortanswer', 'feynman'];
    if (!validTypes.includes(q.question_type)) q.question_type = 'shortanswer';
    if (q.question_type === 'mc' && !Array.isArray(q.options)) q.options = null;

    const qId = insertQuestion({
      unit_id: unitId,
      question_text: q.question_text.trim(),
      question_type: q.question_type as 'mc' | 'truefalse' | 'fillin' | 'shortanswer' | 'feynman',
      options: q.options ? JSON.stringify(q.options) : null,
      correct_answer: q.correct_answer.trim(),
      explanation: q.explanation?.trim() || '–',
      topic_tag: q.topic_tag?.trim() || tag,
      difficulty: Math.min(5, Math.max(1, Math.round(q.difficulty || 4))),
    });
    insertCard(qId);
    added++;
  }

  // Re-export markdown with new questions
  const { getUnitById } = await import('../db/queries/learningUnits');
  const unit = getUnitById(unitId);
  if (unit?.markdown_path) {
    const allQuestions = getQuestionsByUnit(unitId);
    exportQuestionsToMarkdown(allQuestions, unitTitle, unit.markdown_path);
  }

  console.log(`[Pipeline] Deepen done: +${added} questions for "${tag}" in unit ${unitId}`);
  return { added };
}
