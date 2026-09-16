import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import type { SrsCard } from '@/types/api';

interface Props {
  card: SrsCard;
  onFlipped?: () => void;
}

const statusVariant: Record<string, 'new' | 'learning' | 'review' | 'mastered'> = {
  new: 'new',
  learning: 'learning',
  review: 'review',
  mastered: 'mastered',
};

export function FlashCard({ card, onFlipped }: Props) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    if (!flipped) {
      setFlipped(true);
      onFlipped?.();
    }
  };

  const sourceLabel = [card.unit_title, card.source_hint].filter(Boolean).join(' · ');

  return (
    <div className="perspective w-full">
      <div
        className={cn('card-inner min-h-[260px] cursor-pointer', flipped && 'flipped')}
        onClick={handleFlip}
      >
        {/* Front */}
        <div className="card-face flex flex-col rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <Badge variant={statusVariant[card.status] ?? 'default'}>{card.status}</Badge>
            <span className="text-xs text-muted-foreground">{card.topic_tag}</span>
          </div>
          <p className="flex-1 text-lg font-medium leading-relaxed">{card.question_text}</p>

          {sourceLabel && (
            <div className="mt-4 flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-2">
              <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">{sourceLabel}</span>
            </div>
          )}

          {!flipped && (
            <p className="mt-3 text-sm text-muted-foreground text-center">
              Klicken zum Aufdecken
            </p>
          )}
        </div>

        {/* Back */}
        <div className="card-back card-face flex flex-col rounded-xl border bg-green-50 dark:bg-green-950/30 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-green-700 dark:text-green-300">Antwort</span>
            <span className="text-xs text-muted-foreground">{card.topic_tag}</span>
          </div>
          <p className="flex-1 text-lg font-semibold leading-relaxed text-green-800 dark:text-green-200">
            {card.correct_answer}
          </p>
          <div className="mt-3 pt-3 border-t space-y-3">
            {card.explanation && (
              <p className="text-sm text-muted-foreground">{card.explanation}</p>
            )}
            {sourceLabel && (
              <div className="flex items-center gap-2 rounded-md bg-white/60 dark:bg-black/20 border px-3 py-2">
                <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-primary">{card.unit_title}</span>
                  {card.source_hint && (
                    <span className="text-xs text-muted-foreground ml-1.5">{card.source_hint}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
