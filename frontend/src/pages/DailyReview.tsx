import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FlashCard } from '@/components/flashcard/FlashCard';
import { ConfidenceRater } from '@/components/quiz/ConfidenceRater';
import { QualityRater } from '@/components/quiz/QualityRater';
import { SessionSummary } from '@/components/quiz/SessionSummary';
import { useDailyReview } from '@/hooks/useDailyReview';
import { api } from '@/lib/api';
import type { SrsCard, Badge } from '@/types/api';

export function DailyReview() {
  const navigate = useNavigate();
  const { cards, total, loading, error, load } = useDailyReview(20);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [queue, setQueue] = useState<SrsCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [allNewBadges, setAllNewBadges] = useState<Badge[]>([]);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (cards.length > 0) {
      setQueue(cards);
      api.sessions.create({ sessionType: 'daily_review' })
        .then(d => setSessionId(d.id))
        .catch(console.error);
    }
  }, [cards]);

  const current = queue[currentIndex];
  const progressPct = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

  const handleFlipped = () => {
    setFlipped(true);
    startTimeRef.current = Date.now();
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (done || !current) return;
    if (e.key === ' ' && !flipped) {
      e.preventDefault();
      handleFlipped();
    }
    if (flipped) {
      const qualityMap: Record<string, number> = { '1': 1, '2': 2, '3': 4, '4': 5 };
      if (qualityMap[e.key]) handleQuality(qualityMap[e.key]);
    }
  }, [done, current, flipped]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleQuality = async (quality: number) => {
    if (!current) return;
    const timeMs = Date.now() - startTimeRef.current;

    const result = await api.reviews.submit({
      cardId: current.id,
      quality,
      confidence: confidence ?? undefined,
      timeMs,
      sessionId: sessionId ?? undefined,
    });

    if (result) {
      if (quality >= 3) setCorrectCount(c => c + 1);
      setTotalXp(xp => xp + (result.awards?.xpDelta ?? 0));
      if (result.awards?.newBadges?.length) {
        setAllNewBadges(prev => [...prev, ...result.awards.newBadges]);
        for (const b of result.awards.newBadges) {
          toast.success(`Badge freigeschaltet: ${b.icon} ${b.name}`, { duration: 5000 });
        }
      }
      if (result.awards?.newLevel) {
        toast.success(`Level Up! Du bist jetzt Level ${result.awards.newLevel} 🚀`, { duration: 5000 });
      }
    }

    if (currentIndex + 1 >= queue.length) {
      setDone(true);
      if (sessionId) {
        api.sessions.end(sessionId, {
          cardsStudied: queue.length,
          correctCount: correctCount + (quality >= 3 ? 1 : 0),
          xpEarned: totalXp + (result?.awards?.xpDelta ?? 0),
        }).catch(console.error);
      }
    } else {
      setCurrentIndex(i => i + 1);
      setConfidence(null);
      setFlipped(false);
    }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Lade Karten…</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;

  if (queue.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 max-w-xl mx-auto">
        <BookOpen className="h-16 w-16 text-green-500" />
        <h1 className="text-2xl font-bold text-center">Alle Karten erledigt!</h1>
        <p className="text-muted-foreground text-center">
          Keine fälligen Karten für heute. Komm morgen wieder — dein Gehirn dankt es dir.
        </p>
        <Button onClick={() => navigate('/')}>Zurück zum Dashboard</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <SessionSummary
          totalCards={queue.length}
          correctCount={correctCount}
          xpEarned={totalXp}
          newBadges={allNewBadges}
          onClose={() => navigate('/')}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span>Karte {currentIndex + 1} von {queue.length}</span>
            <span className="text-muted-foreground">{total} fällig insgesamt</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        <kbd className="rounded border px-1">Space</kbd> aufdecken · <kbd className="rounded border px-1">1</kbd> Nochmal · <kbd className="rounded border px-1">2</kbd> Schwer · <kbd className="rounded border px-1">3</kbd> Gut · <kbd className="rounded border px-1">4</kbd> Einfach
      </p>

      {current && (
        <>
          <FlashCard card={current} onFlipped={handleFlipped} />

          <ConfidenceRater value={confidence} onChange={setConfidence} />

          {flipped && (
            <QualityRater onRate={handleQuality} />
          )}
        </>
      )}
    </div>
  );
}
