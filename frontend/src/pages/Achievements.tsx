import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XpBar } from '@/components/gamification/XpBar';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { CalendarHeatmap } from '@/components/gamification/CalendarHeatmap';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import { useGamification } from '@/hooks/useGamification';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function Achievements() {
  const { stats, badges, xpProgress, xpNeeded } = useGamification();
  const [activeDates, setActiveDates] = useState<string[]>([]);

  useEffect(() => {
    api.analytics.accuracy(91).then(data => {
      setActiveDates(data.filter(d => d.total_reviews > 0).map(d => d.date));
    }).catch(console.error);
  }, []);

  if (!stats) return <div className="p-6 text-muted-foreground">Lade…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Achievements</h1>

      <Card>
        <CardHeader><CardTitle>Level & XP</CardTitle></CardHeader>
        <CardContent>
          <XpBar level={stats.level} xpProgress={xpProgress} xpNeeded={xpNeeded} totalXp={stats.total_xp} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Streak</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <StreakCounter current={stats.current_streak_days} longest={stats.longest_streak_days} />
          <CalendarHeatmap activeDates={activeDates} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            {badges.filter(b => b.unlocked_at).length} von {badges.length} freigeschaltet
          </p>
          <BadgeGrid badges={badges} />
        </CardContent>
      </Card>
    </div>
  );
}
