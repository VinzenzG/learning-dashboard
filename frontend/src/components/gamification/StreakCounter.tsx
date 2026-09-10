import { Flame, Trophy } from 'lucide-react';

interface Props {
  current: number;
  longest: number;
}

export function StreakCounter({ current, longest }: Props) {
  return (
    <div className="flex gap-4">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
          <Flame className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{current}</p>
          <p className="text-xs text-muted-foreground">Aktuell</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950">
          <Trophy className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{longest}</p>
          <p className="text-xs text-muted-foreground">Rekord</p>
        </div>
      </div>
    </div>
  );
}
