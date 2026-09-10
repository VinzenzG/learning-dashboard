import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';

interface Props {
  onExpire?: () => void;
}

export function PomodoroTimer({ onExpire }: Props) {
  const { minutes, seconds, isRunning, isExpired, progress, start, pause, reset } = usePomodoroTimer(25);

  if (isExpired && onExpire) onExpire();

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-8 w-8">
        <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
          <circle
            cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="3"
            strokeDasharray={2 * Math.PI * 13}
            strokeDashoffset={2 * Math.PI * 13 * (1 - progress / 100)}
            className={isExpired ? 'text-destructive' : 'text-primary transition-all'}
            strokeLinecap="round"
          />
        </svg>
        <Timer className="absolute inset-0 m-auto h-3 w-3 text-muted-foreground" />
      </div>
      <span className={`text-sm font-mono font-bold tabular-nums ${isExpired ? 'text-destructive' : ''}`}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={isRunning ? pause : start}>
          {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
