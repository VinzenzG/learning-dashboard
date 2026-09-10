import type { AIAdapter, GeneratedQuestion, FeynmanEvaluation } from './adapter';
import { buildQuestionPrompt, buildFeynmanEvalPrompt, buildSummaryPrompt, buildDeepenPrompt } from './prompts';

function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const arrStart = raw.indexOf('[');
  const arrEnd = raw.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) return raw.slice(arrStart, arrEnd + 1);
  const objStart = raw.indexOf('{');
  const objEnd = raw.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) return raw.slice(objStart, objEnd + 1);
  return raw;
}

export class ClaudeSdkAdapter implements AIAdapter {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async callApi(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json() as { content: { type: string; text: string }[] };
    return data.content[0]?.text ?? '';
  }

  async generateQuestions(text: string, unitTitle: string, count = 6): Promise<GeneratedQuestion[]> {
    try {
      const raw = await this.callApi(buildQuestionPrompt(text, unitTitle, count));
      const parsed = JSON.parse(extractJson(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async generateQuestionsForTopic(text: string, unitTitle: string, topicTag: string, count = 8): Promise<GeneratedQuestion[]> {
    try {
      const raw = await this.callApi(buildDeepenPrompt(text, unitTitle, topicTag, count));
      const parsed = JSON.parse(extractJson(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async generateSummary(text: string, moduleName: string): Promise<string> {
    try {
      return await this.callApi(buildSummaryPrompt(text, moduleName));
    } catch {
      return `# ${moduleName}\n\n*Zusammenfassung konnte nicht generiert werden.*`;
    }
  }

  async evaluateFeynmanAnswer(question: string, userAnswer: string): Promise<FeynmanEvaluation> {
    try {
      const raw = await this.callApi(buildFeynmanEvalPrompt(question, userAnswer));
      return JSON.parse(extractJson(raw)) as FeynmanEvaluation;
    } catch {
      return { score: 3, feedback: 'Could not evaluate.', correct_points: [], missing_points: [] };
    }
  }
}
