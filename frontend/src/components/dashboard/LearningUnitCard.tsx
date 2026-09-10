import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, Loader2, CheckCircle2, Play } from 'lucide-react';
import type { LearningUnit } from '@/types/api';
import { cn } from '@/lib/utils';

interface Props {
  unit: LearningUnit;
}

const statusConfig = {
  pending: { icon: Loader2, label: 'Warteschlange', color: 'text-muted-foreground', spin: true },
  processing: { icon: Loader2, label: 'Wird verarbeitet…', color: 'text-blue-500', spin: true },
  ready: { icon: CheckCircle2, label: 'Bereit', color: 'text-green-500', spin: false },
  warning: { icon: AlertTriangle, label: 'Warnung', color: 'text-amber-500', spin: false },
  error: { icon: AlertTriangle, label: 'Fehler', color: 'text-destructive', spin: false },
};

function ProgressRing({ value, size = 48 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth="4" fill="none" className="text-muted" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="currentColor" strokeWidth="4" fill="none"
        strokeDasharray={circ} strokeDashoffset={offset}
        className="text-green-500 transition-all duration-500"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LearningUnitCard({ unit }: Props) {
  const navigate = useNavigate();
  const cfg = statusConfig[unit.status] ?? statusConfig.pending;
  const StatusIcon = cfg.icon;
  const total = unit.total_cards || 0;
  const mastered = unit.mastered_cards || 0;
  const progressPct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => navigate(`/unit/${unit.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <CardTitle className="truncate text-base">{unit.title}</CardTitle>
          </div>
          <div className="shrink-0">
            <ProgressRing value={progressPct} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground truncate">{unit.file_name}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status */}
        <div className={cn('flex items-center gap-1.5 text-xs', cfg.color)}>
          <StatusIcon className={cn('h-3.5 w-3.5', cfg.spin && 'animate-spin')} />
          <span>{cfg.label}</span>
          {unit.status === 'ready' && <span className="text-muted-foreground">· {unit.slide_count} Folien</span>}
        </div>

        {unit.error_message && (
          <p className="text-xs text-destructive line-clamp-2">{unit.error_message}</p>
        )}

        {/* SRS Card Counts */}
        {total > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {unit.new_cards > 0 && (
              <Badge variant="new">{unit.new_cards} neu</Badge>
            )}
            {unit.learning_cards > 0 && (
              <Badge variant="learning">{unit.learning_cards} lernen</Badge>
            )}
            {unit.review_cards > 0 && (
              <Badge variant="review">{unit.review_cards} wiederholen</Badge>
            )}
            {unit.mastered_cards > 0 && (
              <Badge variant="mastered">{unit.mastered_cards} gemeistert</Badge>
            )}
          </div>
        )}

        {/* Progress */}
        {total > 0 && (
          <p className="text-xs text-muted-foreground">{mastered}/{total} gemeistert ({progressPct}%)</p>
        )}

        {/* Actions */}
        {unit.status === 'ready' && unit.due_cards > 0 && (
          <Button
            size="sm" variant="default" className="w-full"
            onClick={(e) => { e.stopPropagation(); navigate(`/quiz/${unit.id}`); }}
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            {unit.due_cards} Karten wiederholen
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
