import type { AIAdapter, GeneratedQuestion, FeynmanEvaluation } from './adapter';

export class NoneAdapter implements AIAdapter {
  async generateQuestions(): Promise<GeneratedQuestion[]> {
    return [];
  }

  async generateQuestionsForTopic(): Promise<GeneratedQuestion[]> {
    return [];
  }

  async generateSummary(): Promise<string> {
    return '';
  }

  async evaluateFeynmanAnswer(): Promise<FeynmanEvaluation> {
    return {
      score: 0,
      feedback: 'KI-Auswertung ist auf diesem Server nicht verfügbar.',
      correct_points: [],
      missing_points: [],
    };
  }
}
