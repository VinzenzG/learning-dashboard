import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { SrsCard, AwardResult } from '@/types/api';

export function useDailyReview(limit = 20, moduleName?: string) {
  const [cards, setCards] = useState<SrsCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.reviews.due(limit, true, moduleName);
      setCards(data.cards);
      setTotal(data.total);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load review cards');
    } finally {
      setLoading(false);
    }
  }, [limit, moduleName]);

  const submitReview = useCallback(async (params: {
    cardId: number;
    quality: number;
    confidence?: number;
    timeMs?: number;
    sessionId?: number;
  }): Promise<{ updatedCard: SrsCard; awards: AwardResult } | null> => {
    try {
      return await api.reviews.submit(params);
    } catch {
      return null;
    }
  }, []);

  return { cards, total, loading, error, load, submitReview };
}
