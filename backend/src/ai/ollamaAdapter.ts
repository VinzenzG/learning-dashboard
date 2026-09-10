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

export class OllamaAdapter implements AIAdapter {
  constructor(private baseUrl: string, private model: string) {}

  private async callOllama(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, prompt, stream: false, format: 'json' }),
    });
    if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
    const data = await response.json() as { response: string };
    return data.response;
  }

  async generateQuestions(text: string, unitTitle: string, count = 6): Promise<GeneratedQuestion[]> {
    try {
      const raw = await this.callOllama(buildQuestionPrompt(text, unitTitle, count));
      const parsed = JSON.parse(extractJson(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async generateQuestionsForTopic(text: string, unitTitle: string, topicTag: string, count = 8): Promise<GeneratedQuestion[]> {
    try {
      const raw = await this.callOllama(buildDeepenPrompt(text, unitTitle, topicTag, count));
      const parsed = JSON.parse(extractJson(raw));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async generateSummary(text: string, moduleName: string): Promise<string> {
    try {
      return await this.callOllama(buildSummaryPrompt(text, moduleName));
    } catch {
      return `# ${moduleName}\n\n*Zusammenfassung konnte nicht generiert werden.*`;
    }
  }

  async evaluateFeynmanAnswer(question: string, userAnswer: string): Promise<FeynmanEvaluation> {
    try {
      const raw = await this.callOllama(buildFeynmanEvalPrompt(question, userAnswer));
      return JSON.parse(extractJson(raw)) as FeynmanEvaluation;
    } catch {
      return { score: 3, feedback: 'Could not evaluate.', correct_points: [], missing_points: [] };
    }
  }
}
