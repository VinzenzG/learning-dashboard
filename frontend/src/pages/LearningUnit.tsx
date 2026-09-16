import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import type { LearningUnit as LU, Question, WeakSpot } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Play, RefreshCw, Loader2, TrendingUp, ChevronDown, ChevronRight, Settings2 } from 'lucide-react';

const typeLabel: Record<string, string> = {
  mc: 'Multiple Choice',
  truefalse: 'Wahr/Falsch',
  fillin: 'Lückentext',
  shortanswer: 'Kurzantwort',
  feynman: 'Feynman',
};

const cardStatusVariant: Record<string, 'new' | 'learning' | 'review' | 'mastered'> = {
  new: 'new', learning: 'learning', review: 'review', mastered: 'mastered',
};

export function LearningUnitPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [unit, setUnit] = useState<LU | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [weakSpots, setWeakSpots] = useState<WeakSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [deepeningTopic, setDeepeningTopic] = useState<string | null>(null);
  const [deepenedTopics, setDeepenedTopics] = useState<Set<string>>(new Set());
  const [showQuestions, setShowQuestions] = useState(false);
  const [questionsPerChunk, setQuestionsPerChunk] = useState(6);
  const [showReprocessOptions, setShowReprocessOptions] = useState(false);

  useEffect(() => {
    if (!id) return;
    const numId = parseInt(id);
    Promise.all([
      api.learningUnits.get(numId),
      api.analytics.weakSpots(numId),
    ]).then(([unitData, ws]) => {
      setUnit(unitData.unit);
      setQuestions(unitData.questions);
      setWeakSpots(ws);
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleReprocess = async () => {
    if (!id) return;
    setReprocessing(true);
    await api.settings.update({ questionsPerChunk }).catch(console.error);
    await api.learningUnits.reprocess(parseInt(id)).catch(console.error);
    setTimeout(() => { navigate(0); }, 1000);
  };

  const handleDeepen = async (topicTag: string) => {
    if (!id) return;
    setDeepeningTopic(topicTag);
    try {
      await api.learningUnits.deepen(parseInt(id), topicTag);
      setDeepenedTopics(prev => new Set([...prev, topicTag]));
    } catch (e) {
      alert('Fehler beim Generieren zusätzlicher Fragen.');
    } finally {
      setDeepeningTopic(null);
    }
  };

  if (loading) return <div className="p-6 text-muted-foreground">Lade…</div>;
  if (!unit) return <div className="p-6">Einheit nicht gefunden.</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{unit.title}</h1>
          <p className="text-xs text-muted-foreground">{unit.file_name} · {unit.slide_count} Folien</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowReprocessOptions(v => !v)} disabled={reprocessing}>
          <Settings2 className="h-4 w-4" />
          Neu verarbeiten
        </Button>
        {unit.due_cards! > 0 && (
          <Button onClick={() => navigate(`/quiz/${unit.id}`)}>
            <Play className="h-4 w-4 mr-1" />
            {unit.due_cards} Karten üben
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Neu', count: unit.new_cards, variant: 'new' },
          { label: 'Lernen', count: unit.learning_cards, variant: 'learning' },
          { label: 'Wiederholen', count: unit.review_cards, variant: 'review' },
          { label: 'Gemeistert', count: unit.mastered_cards, variant: 'mastered' },
        ].map(({ label, count, variant }) => (
          <div key={label} className="rounded-lg border bg-card p-3 text-center">
            <p className="text-2xl font-bold">{count || 0}</p>
            <Badge variant={cardStatusVariant[variant] ?? 'default'} className="text-xs mt-1">{label}</Badge>
          </div>
        ))}
      </div>

      {/* Reprocess options panel */}
      {showReprocessOptions && (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Neu verarbeiten — Einstellungen
          </p>
          <div className="flex items-center gap-3">
            <label className="text-sm text-muted-foreground whitespace-nowrap">Fragen pro Chunk</label>
            <Input
              type="number"
              min={2}
              max={15}
              value={questionsPerChunk}
              onChange={e => setQuestionsPerChunk(Math.max(2, Math.min(15, parseInt(e.target.value) || 6)))}
              className="w-24"
            />
            <span className="text-xs text-muted-foreground">(2–15, Standard: 6)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Alle bestehenden Fragen dieser Einheit werden gelöscht und mit der neuen Einstellung neu generiert.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleReprocess} disabled={reprocessing} variant="destructive">
              {reprocessing ? <><Loader2 className="h-3 w-3 animate-spin mr-1" />Verarbeite…</> : 'Jetzt neu verarbeiten'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReprocessOptions(false)}>Abbrechen</Button>
          </div>
        </div>
      )}

      {/* Topic breakdown with Vertiefen */}
      {questions.length > 0 && (() => {
        const topicMap = new Map<string, number>();
        for (const q of questions) topicMap.set(q.topic_tag, (topicMap.get(q.topic_tag) ?? 0) + 1);

        return (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold">Themen</h2>
            </div>
            <div className="space-y-2">
              {[...topicMap.entries()].map(([tag, count]) => {
                const ws = weakSpots.find(w => w.topic_tag === tag);
                const accuracy = ws ? Math.round(ws.accuracy * 100) : null;
                const isWeak = accuracy !== null && accuracy < 60;
                const isDeepened = deepenedTopics.has(tag);
                const isDeepening = deepeningTopic === tag;

                return (
                  <div key={tag} className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${isWeak ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30' : 'bg-card'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{tag}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} Fragen
                        {accuracy !== null && <span className={`ml-2 font-medium ${isWeak ? 'text-amber-600' : 'text-green-600'}`}>{accuracy}% richtig</span>}
                      </p>
                    </div>
                    <Button
                      variant={isDeepened ? 'outline' : isWeak ? 'default' : 'outline'}
                      size="sm"
                      disabled={isDeepening || isDeepened}
                      onClick={() => handleDeepen(tag)}
                      className="shrink-0 text-xs"
                    >
                      {isDeepening ? (
                        <><Loader2 className="h-3 w-3 animate-spin mr-1" />Generiere…</>
                      ) : isDeepened ? (
                        '+8 Fragen hinzugefügt'
                      ) : (
                        'Vertiefen'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Question list (collapsible) */}
      <div>
        <button
          onClick={() => setShowQuestions(v => !v)}
          className="flex items-center gap-2 font-semibold mb-3 hover:text-primary transition-colors"
        >
          {showQuestions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {questions.length} Fragen anzeigen
        </button>
        {showQuestions && (
          <div className="space-y-2">
            {questions.map((q, i) => (
              <div key={q.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start gap-2">
                  <span className="text-sm text-muted-foreground min-w-[24px]">{i + 1}.</span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm">{q.question_text}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-xs">{typeLabel[q.question_type] ?? q.question_type}</Badge>
                      <Badge variant="outline" className="text-xs">{q.topic_tag}</Badge>
                      {q.source_hint && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">{q.source_hint}</Badge>
                      )}
                      {q.card_status && (
                        <Badge variant={cardStatusVariant[q.card_status] ?? 'default'} className="text-xs">{q.card_status}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
