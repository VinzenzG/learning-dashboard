import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

interface Props {
  level: number;
  xpProgress: number;
  xpNeeded: number;
  totalXp: number;
}

export function XpBar({ level, xpProgress, xpNeeded, totalXp }: Props) {
  const pct = Math.min(100, Math.round((xpProgress / xpNeeded) * 100));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="font-semibold">Level {level}</span>
        </div>
        <span className="text-muted-foreground text-xs">{xpProgress} / {xpNeeded} XP</span>
      </div>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">{totalXp} XP gesamt</p>
    </div>
  );
}
