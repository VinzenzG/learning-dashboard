import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { FeedbackPanel } from '@/components/quiz/FeedbackPanel';
import { QualityRater } from '@/components/quiz/QualityRater';
import { PomodoroTimer } from '@/components/quiz/PomodoroTimer';
import { SessionSummary } from '@/components/quiz/SessionSummary';
import { api } from '@/lib/api';
import type { SrsCard, Badge } from '@/types/api';

export function QuizSession() {
  const { unitId } = useParams<{ unitId: string }>();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<SrsCard[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ answer: string; correct: boolean } | null>(null);
  const [done, setDone] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [allNewBadges, setAllNewBadges] = useState<Badge[]>([]);
  const [pomodoroExpired, setPomodoroExpired] = useState(false);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    api.reviews.due(30, true).then(data => {
      const filtered = unitId
        ? data.cards.filter(c => c.unit_id === parseInt(unitId))
        : data.cards;
      setQueue(filtered);
      const sType = unitId ? 'quiz' : 'daily_review';
      api.sessions.create({ unitId: unitId ? parseInt(unitId) : undefined, sessionType: sType })
        .then(d => setSessionId(d.id));
    });
  }, [unitId]);

  const current = queue[currentIndex];
  const progressPct = queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

  const handleAnswer = (answer: string, correct: boolean) => {
    setAnswered(true);
    setLastAnswer({ answer, correct });
    startTimeRef.current = Date.now();
  };

  const handleQuality = async (quality: number) => {
    if (!current) return;
    const timeMs = Date.now() - startTimeRef.current;

    const result = await api.reviews.submit({
      cardId: current.id,
      quality,
      timeMs,
      sessionId: sessionId ?? undefined,
    });

    if (result) {
      if (quality >= 3) setCorrectCount(c => c + 1);
      setTotalXp(xp => xp + (result.awards?.xpDelta ?? 0));
      if (result.awards?.newBadges?.length) {
        setAllNewBadges(prev => [...prev, ...result.awards.newBadges]);
        for (const b of result.awards.newBadges) {
          toast.success(`${b.icon} ${b.name}`, { duration: 4000 });
        }
      }
    }

    const next = currentIndex + 1;
    if (next >= queue.length || pomodoroExpired) {
      setDone(true);
      if (sessionId) {
        api.sessions.end(sessionId, {
          cardsStudied: next,
          correctCount: correctCount + (quality >= 3 ? 1 : 0),
          xpEarned: totalXp + (result?.awards?.xpDelta ?? 0),
        }).catch(console.error);
      }
    } else {
      setCurrentIndex(next);
      setAnswered(false);
      setLastAnswer(null);
    }
  };

  if (queue.length === 0) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-muted-foreground">Keine fälligen Karten für diese Einheit.</p>
        <Button onClick={() => navigate(-1)}>Zurück</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <SessionSummary
          totalCards={currentIndex}
          correctCount={correctCount}
          xpEarned={totalXp}
          newBadges={allNewBadges}
          onClose={() => navigate(-1)}
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
            <span>Frage {currentIndex + 1} von {queue.length}</span>
            <PomodoroTimer onExpire={() => setPomodoroExpired(true)} />
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      </div>

      {current && (
        <div className="space-y-4">
          <QuestionCard
            card={current}
            onAnswer={handleAnswer}
            answered={answered}
          />

          {answered && lastAnswer && (
            <FeedbackPanel
              correct={lastAnswer.correct}
              correctAnswer={current.correct_answer}
              explanation={current.explanation}
            />
          )}

          {answered && (
            <QualityRater onRate={handleQuality} />
          )}
        </div>
      )}
    </div>
  );
}
