import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { LearningUnit } from '@/types/api';

export function useLearningUnits() {
  const [units, setUnits] = useState<LearningUnit[]>([]);
  const [dueTotal, setDueTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.learningUnits.list();
      setUnits(data.units);
      setDueTotal(data.dueTotal);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load units');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll every 5s while any unit is processing
    const interval = setInterval(() => {
      load();
    }, 5000);
    return () => clearInterval(interval);
  }, [load]);

  return { units, dueTotal, loading, error, reload: load };
}
