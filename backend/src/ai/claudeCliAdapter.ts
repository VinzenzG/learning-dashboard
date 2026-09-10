import { spawn } from 'child_process';
import type { AIAdapter, GeneratedQuestion, FeynmanEvaluation } from './adapter';
import { buildQuestionPrompt, buildFeynmanEvalPrompt, buildSummaryPrompt, buildDeepenPrompt } from './prompts';
import { config } from '../config';

async function runClaude(prompt: string): Promise<string> {
  const bin = config.claudeCliBin;
  return new Promise((resolve, reject) => {
    const child = spawn(bin, ['-p', prompt, '--output-format', 'text'], {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`claude CLI exited with code ${code}: ${stderr}`));
      } else {
        resolve(stdout.trim());
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn claude CLI: ${err.message}`));
    });
  });
}

function extractJson(raw: string): string {
  // Strip markdown code fences if present
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Find first [ or { and last ] or }
  const arrStart = raw.indexOf('[');
  const arrEnd = raw.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) return raw.slice(arrStart, arrEnd + 1);

  const objStart = raw.indexOf('{');
  const objEnd = raw.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) return raw.slice(objStart, objEnd + 1);

  return raw;
}

export class ClaudeCliAdapter implements AIAdapter {
  async generateQuestions(text: string, unitTitle: string, count = 6): Promise<GeneratedQuestion[]> {
    const prompt = buildQuestionPrompt(text, unitTitle, count);
    let raw: string;
    try {
      raw = await runClaude(prompt);
    } catch (err) {
      console.error('[ClaudeCLI] Error:', err);
      return [];
    }

    try {
      const parsed = JSON.parse(extractJson(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Retry with simplified prompt
      try {
        const retryPrompt = `Return ONLY a JSON array of ${count} quiz questions about "${unitTitle}". Each object: {question_type,question_text,options,correct_answer,explanation,topic_tag,difficulty}. Types: mc|truefalse|fillin|shortanswer|feynman. Content: ${text.slice(0, 1000)}`;
        const retryRaw = await runClaude(retryPrompt);
        const parsed2 = JSON.parse(extractJson(retryRaw));
        return Array.isArray(parsed2) ? parsed2 : [];
      } catch {
        return [];
      }
    }
  }

  async generateQuestionsForTopic(text: string, unitTitle: string, topicTag: string, count = 8): Promise<GeneratedQuestion[]> {
    const prompt = buildDeepenPrompt(text, unitTitle, topicTag, count);
    let raw: string;
    try {
      raw = await runClaude(prompt);
    } catch (err) {
      console.error('[ClaudeCLI] Deepen error:', err);
      return [];
    }
    try {
      const parsed = JSON.parse(extractJson(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async generateSummary(text: string, moduleName: string): Promise<string> {
    const prompt = buildSummaryPrompt(text, moduleName);
    try {
      return await runClaude(prompt);
    } catch (err) {
      console.error('[ClaudeCLI] Summary error:', err);
      return `# ${moduleName}\n\n*Zusammenfassung konnte nicht generiert werden.*`;
    }
  }

  async evaluateFeynmanAnswer(question: string, userAnswer: string): Promise<FeynmanEvaluation> {
    const prompt = buildFeynmanEvalPrompt(question, userAnswer);
    let raw: string;
    try {
      raw = await runClaude(prompt);
    } catch {
      return { score: 3, feedback: 'Could not evaluate answer.', correct_points: [], missing_points: [] };
    }

    try {
      return JSON.parse(extractJson(raw)) as FeynmanEvaluation;
    } catch {
      return { score: 3, feedback: raw.slice(0, 200), correct_points: [], missing_points: [] };
    }
  }
}
