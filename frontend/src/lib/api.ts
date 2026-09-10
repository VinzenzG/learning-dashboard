import type {
  LearningUnit, Question, SrsCard, UserStats, Badge,
  Session, AwardResult, FeynmanEvaluation,
  AnalyticsAccuracy, WeakSpot, ForgettingPoint,
  ExamQuestion, ExamModule,
} from '@/types/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// Learning Units
export const api = {
  learningUnits: {
    list: () => req<{ units: LearningUnit[]; dueTotal: number }>('/learning-units'),
    get: (id: number) => req<{ unit: LearningUnit; questions: Question[] }>(`/learning-units/${id}`),
    reprocess: (id: number) => req<{ message: string }>(`/learning-units/${id}/reprocess`, { method: 'POST' }),
    deepen: (id: number, topicTag?: string) =>
      req<{ message: string; topicTag: string | null }>(`/learning-units/${id}/deepen`, {
        method: 'POST',
        body: JSON.stringify({ topicTag }),
      }),
  },

  exam: {
    modules: () => req<{ modules: ExamModule[] }>('/exam/modules'),
    start: (moduleName?: string, count = 30) =>
      req<{ questions: ExamQuestion[]; total: number }>('/exam/start', {
        method: 'POST',
        body: JSON.stringify({ moduleName, count }),
      }),
  },

  reviews: {
    due: (limit = 20, interleave = true) =>
      req<{ cards: SrsCard[]; total: number }>(`/reviews/due?limit=${limit}&interleave=${interleave}`),
    submit: (data: { cardId: number; quality: number; confidence?: number; timeMs?: number; sessionId?: number }) =>
      req<{ updatedCard: SrsCard; awards: AwardResult }>('/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  sessions: {
    list: (limit = 20) => req<Session[]>(`/sessions?limit=${limit}`),
    create: (data: { unitId?: number; sessionType?: string }) =>
      req<{ id: number }>('/sessions', { method: 'POST', body: JSON.stringify(data) }),
    end: (id: number, data: { cardsStudied: number; correctCount: number; xpEarned: number }) =>
      req<{ message: string }>(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  gamification: {
    stats: () => req<{ stats: UserStats; badges: Badge[] }>('/gamification/stats'),
  },

  analytics: {
    accuracy: (days = 30) => req<AnalyticsAccuracy[]>(`/analytics/accuracy?days=${days}`),
    weakSpots: (unitId?: number) =>
      req<WeakSpot[]>(`/analytics/weak-spots${unitId ? `?unitId=${unitId}` : ''}`),
    forgettingCurve: () => req<ForgettingPoint[]>('/analytics/forgetting-curve'),
  },

  feynman: {
    evaluate: (question: string, userAnswer: string) =>
      req<FeynmanEvaluation>('/feynman/evaluate', {
        method: 'POST',
        body: JSON.stringify({ question, userAnswer }),
      }),
  },

  settings: {
    get: () => req<{ aiProvider: string; ollamaBaseUrl: string; ollamaModel: string; watchFolder: string; questionsPerChunk: number }>('/settings'),
    update: (data: object) => req<{ message: string }>('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  health: () => req<{ status: string; aiProvider: string; watchFolder: string }>('/health'),
};
