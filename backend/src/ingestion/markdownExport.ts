import path from 'path';
import fs from 'fs';
import { Question } from '../db/queries/questions';

const TYPE_LABELS: Record<string, string> = {
  mc: 'Multiple Choice',
  truefalse: 'Richtig/Falsch',
  fillin: 'Lückentext',
  shortanswer: 'Kurzantwort',
  feynman: 'Feynman',
};

export function exportQuestionsToMarkdown(
  questions: Question[],
  title: string,
  outputPath: string,
): void {
  const grouped = new Map<string, Question[]>();
  for (const q of questions) {
    const tag = q.topic_tag || 'Allgemein';
    if (!grouped.has(tag)) grouped.set(tag, []);
    grouped.get(tag)!.push(q);
  }

  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push('');
  lines.push(`*Generiert: ${new Date().toLocaleDateString('de-DE')} | ${questions.length} Fragen*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const [tag, qs] of grouped) {
    lines.push(`## ${tag}`);
    lines.push('');

    qs.forEach((q, i) => {
      const sourceLabel = q.source_hint ? ` *(${q.source_hint})*` : '';
      lines.push(`### Frage ${i + 1} — ${TYPE_LABELS[q.question_type] ?? q.question_type}${sourceLabel}`);
      lines.push('');
      lines.push(`**${q.question_text}**`);
      lines.push('');

      if (q.question_type === 'mc' && q.options) {
        try {
          const opts = JSON.parse(q.options) as string[];
          opts.forEach((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            lines.push(`- ${letter}) ${opt}`);
          });
          lines.push('');
        } catch { /* skip */ }
      }

      lines.push(`> **Antwort:** ${q.correct_answer}`);
      lines.push('');
      lines.push(`> **Erklärung:** ${q.explanation}`);
      lines.push('');
      lines.push('---');
      lines.push('');
    });
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
}

export function exportSummaryToMarkdown(
  summary: string,
  moduleName: string,
  outputPath: string,
): void {
  const lines: string[] = [
    `# KI-Zusammenfassung: ${moduleName}`,
    '',
    `*Generiert: ${new Date().toLocaleDateString('de-DE')}*`,
    '',
    '---',
    '',
    summary,
    '',
  ];

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf-8');
}
