import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { UserStats, Badge } from '@/types/api';

export function useGamification() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.gamification.stats();
      setStats(data.stats);
      setBadges(data.badges);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const xpForLevel = (level: number) => 50 * level * (level + 1);
  const xpProgress = stats
    ? stats.total_xp - xpForLevel(stats.level - 1)
    : 0;
  const xpNeeded = stats
    ? xpForLevel(stats.level) - xpForLevel(stats.level - 1)
    : 100;

  return { stats, badges, loading, reload: load, xpProgress, xpNeeded };
}
