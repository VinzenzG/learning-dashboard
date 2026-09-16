import type { AppConfig } from '../config';

export interface GeneratedQuestion {
  question_type: 'mc' | 'truefalse' | 'fillin' | 'shortanswer' | 'feynman';
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
  topic_tag: string;
  difficulty: number;
}

export interface FeynmanEvaluation {
  score: number; // 1-5
  feedback: string;
  correct_points: string[];
  missing_points: string[];
}

export interface AIAdapter {
  generateQuestions(text: string, unitTitle: string, count?: number): Promise<GeneratedQuestion[]>;
  generateQuestionsForTopic(text: string, unitTitle: string, topicTag: string, count?: number): Promise<GeneratedQuestion[]>;
  generateSummary(text: string, moduleName: string): Promise<string>;
  evaluateFeynmanAnswer(question: string, userAnswer: string): Promise<FeynmanEvaluation>;
}

export async function createAdapter(config: AppConfig): Promise<AIAdapter> {
  switch (config.aiProvider) {
    case 'claude-cli': {
      const { ClaudeCliAdapter } = await import('./claudeCliAdapter');
      return new ClaudeCliAdapter();
    }
    case 'claude-sdk': {
      const { ClaudeSdkAdapter } = await import('./claudeSdkAdapter');
      return new ClaudeSdkAdapter(config.anthropicApiKey);
    }
    case 'ollama': {
      const { OllamaAdapter } = await import('./ollamaAdapter');
      return new OllamaAdapter(config.ollamaBaseUrl, config.ollamaModel);
    }
    case 'none': {
      const { NoneAdapter } = await import('./noneAdapter');
      return new NoneAdapter();
    }
    default:
      throw new Error(`Unknown AI provider: ${config.aiProvider}`);
  }
}
