import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Zap, Target } from 'lucide-react';
import type { Badge } from '@/types/api';

interface Props {
  totalCards: number;
  correctCount: number;
  xpEarned: number;
  newBadges: Badge[];
  onClose: () => void;
}

export function SessionSummary({ totalCards, correctCount, xpEarned, newBadges, onClose }: Props) {
  const pct = totalCards > 0 ? Math.round((correctCount / totalCards) * 100) : 0;

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
          <CardTitle>Session abgeschlossen!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted p-3">
              <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{pct}%</p>
              <p className="text-xs text-muted-foreground">Genauigkeit</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-2xl font-bold">{correctCount}/{totalCards}</p>
              <p className="text-xs text-muted-foreground">Richtig</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold">+{xpEarned}</p>
              <p className="text-xs text-muted-foreground">XP verdient</p>
            </div>
          </div>

          {newBadges.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Neue Badges freigeschaltet!</p>
              <div className="flex gap-2 flex-wrap">
                {newBadges.map(b => (
                  <div key={b.slug} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1">
                    <span>{b.icon}</span>
                    <span className="text-xs font-medium">{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button className="w-full" onClick={onClose}>Fertig</Button>
        </CardContent>
      </Card>
    </div>
  );
}
