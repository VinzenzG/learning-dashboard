import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, ChevronRight, RotateCcw, Timer, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { ExamQuestion, ExamModule } from '@/types/api';

// ── Setup screen ──────────────────────────────────────────────────────────────

function SetupScreen({ onStart }: { onStart: (moduleName: string | undefined, count: number) => void }) {
  const [modules, setModules] = useState<ExamModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [count, setCount] = useState(30);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    api.exam.modules().then(r => {
      setModules(r.modules);
      const preselect = searchParams.get('module');
      if (preselect) setSelectedModule(preselect);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const moduleName = selectedModule || undefined;

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Prüfungs-Simulation</h1>
          <p className="text-sm text-muted-foreground">Zeitlich unbegrenzt, kein Einfluss auf SRS</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Modul</label>
          {loading ? (
            <p className="text-sm text-muted-foreground">Lade Module…</p>
          ) : (
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
            >
              <option value="">Alle Module</option>
              {modules.map(m => (
                <option key={m.module_name} value={m.module_name}>
                  {m.module_name === '__unmodule__' ? 'Ohne Modul' : m.module_name}
                  {' '}({m.question_count} Fragen)
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Anzahl Fragen</label>
          <div className="flex gap-2">
            {[10, 20, 30, 50].map(n => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`flex-1 rounded-md border py-2 text-sm font-medium transition-colors ${
                  count === n ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button className="w-full gap-2" onClick={() => onStart(moduleName, count)}>
        <Trophy className="h-4 w-4" />
        Prüfung starten
      </Button>
    </div>
  );
}

// ── Exam question ──────────────────────────────────────────────────────────────

interface QuestionResult {
  question: ExamQuestion;
  userAnswer: string;
  correct: boolean;
}

function ExamQuestion({
  question,
  index,
  total,
  onAnswer,
}: {
  question: ExamQuestion;
  index: number;
  total: number;
  onAnswer: (answer: string, correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);

  const options = question.options ? (JSON.parse(question.options) as string[]) : null;

  const checkAnswer = () => {
    const answer = options ? selected : textAnswer.trim();
    if (!answer) return;
    const isCorrect = answer.toLowerCase() === question.correct_answer.toLowerCase();
    setRevealed(true);
    return { answer, isCorrect };
  };

  const handleSubmit = () => {
    if (revealed) {
      const answer = options ? selected : textAnswer.trim();
      const isCorrect = answer.toLowerCase() === question.correct_answer.toLowerCase();
      onAnswer(answer, isCorrect);
      return;
    }
    const result = checkAnswer();
    if (!result) return;
  };

  const typeLabel: Record<string, string> = {
    mc: 'Multiple Choice', truefalse: 'Richtig/Falsch',
    fillin: 'Lückentext', shortanswer: 'Kurzantwort',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{typeLabel[question.question_type] ?? question.question_type}</span>
        <span className="font-medium">{index + 1} / {total}</span>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <p className="text-base font-medium leading-relaxed">{question.question_text}</p>

        {options ? (
          <div className="space-y-2">
            {options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              let cls = 'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors';
              if (revealed) {
                if (opt === question.correct_answer) cls += ' border-green-500 bg-green-500/10';
                else if (opt === selected) cls += ' border-red-500 bg-red-500/10';
                else cls += ' opacity-50';
              } else {
                cls += selected === opt ? ' border-primary bg-primary/10' : ' hover:bg-muted';
              }
              return (
                <div key={i} className={cls} onClick={() => !revealed && setSelected(opt)}>
                  <span className="shrink-0 font-mono text-xs font-bold">{letter}</span>
                  <span className="text-sm">{opt}</span>
                  {revealed && opt === question.correct_answer && (
                    <Check className="ml-auto h-4 w-4 text-green-600" />
                  )}
                  {revealed && opt === selected && opt !== question.correct_answer && (
                    <X className="ml-auto h-4 w-4 text-red-600" />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <input
              type="text"
              placeholder="Deine Antwort…"
              value={textAnswer}
              onChange={e => setTextAnswer(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
              disabled={revealed}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-70"
            />
            {revealed && (
              <p className="mt-2 text-sm">
                <span className={textAnswer.toLowerCase() === question.correct_answer.toLowerCase()
                  ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {textAnswer.toLowerCase() === question.correct_answer.toLowerCase() ? '✓ Richtig' : '✗ Falsch'}
                </span>
                {textAnswer.toLowerCase() !== question.correct_answer.toLowerCase() && (
                  <span className="text-muted-foreground"> — Richtige Antwort: <strong>{question.correct_answer}</strong></span>
                )}
              </p>
            )}
          </div>
        )}

        {revealed && (
          <div className="rounded-md bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            <strong className="text-foreground">Erklärung:</strong> {question.explanation}
          </div>
        )}
      </div>

      <Button
        className="w-full gap-2"
        onClick={handleSubmit}
        disabled={options ? !selected : !textAnswer.trim()}
      >
        {revealed ? (
          <><ChevronRight className="h-4 w-4" /> Weiter</>
        ) : (
          'Antwort prüfen'
        )}
      </Button>
    </div>
  );
}

// ── Results screen ─────────────────────────────────────────────────────────────

function ResultsScreen({ results, onRestart }: { results: QuestionResult[]; onRestart: () => void }) {
  const navigate = useNavigate();
  const correct = results.filter(r => r.correct).length;
  const total = results.length;
  const pct = Math.round((correct / total) * 100);

  const grade = pct >= 90 ? { label: 'Sehr gut', color: 'text-green-600' }
    : pct >= 75 ? { label: 'Gut', color: 'text-blue-600' }
    : pct >= 60 ? { label: 'Befriedigend', color: 'text-yellow-600' }
    : { label: 'Verbesserungsbedarf', color: 'text-red-600' };

  // Group wrong answers by topic
  const wrongByTopic = new Map<string, number>();
  for (const r of results) {
    if (!r.correct) {
      wrongByTopic.set(r.question.topic_tag, (wrongByTopic.get(r.question.topic_tag) ?? 0) + 1);
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Trophy className="h-12 w-12 mx-auto text-primary" />
        <h2 className="text-2xl font-bold">Prüfung abgeschlossen</h2>
      </div>

      <div className="rounded-lg border bg-card p-6 text-center space-y-1">
        <p className="text-5xl font-bold">{pct}%</p>
        <p className={`text-lg font-semibold ${grade.color}`}>{grade.label}</p>
        <p className="text-sm text-muted-foreground">{correct} von {total} Fragen richtig</p>
      </div>

      {wrongByTopic.size > 0 && (
        <div className="rounded-lg border bg-card p-4 space-y-2">
          <p className="text-sm font-semibold">Schwache Themen</p>
          {[...wrongByTopic.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([tag, count]) => (
              <div key={tag} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{tag}</span>
                <span className="font-medium text-red-600">{count} Fehler</span>
              </div>
            ))}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2" onClick={onRestart}>
          <RotateCcw className="h-4 w-4" />
          Neue Prüfung
        </Button>
        <Button className="flex-1" onClick={() => navigate('/')}>
          Zum Dashboard
        </Button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ExamMode() {
  const [phase, setPhase] = useState<'setup' | 'exam' | 'results'>('setup');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [loadingExam, setLoadingExam] = useState(false);

  const handleStart = async (moduleName: string | undefined, count: number) => {
    setLoadingExam(true);
    try {
      const data = await api.exam.start(moduleName, count);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setResults([]);
      setPhase('exam');
    } catch (e) {
      alert('Fehler beim Laden der Fragen.');
    } finally {
      setLoadingExam(false);
    }
  };

  const handleAnswer = useCallback((answer: string, correct: boolean) => {
    const q = questions[currentIndex];
    setResults(prev => [...prev, { question: q, userAnswer: answer, correct }]);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(i => i + 1);
    } else {
      setPhase('results');
    }
  }, [questions, currentIndex]);

  if (phase === 'setup' || loadingExam) {
    return (
      <div className="relative">
        {loadingExam && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
            <p className="text-sm text-muted-foreground">Fragen werden geladen…</p>
          </div>
        )}
        <SetupScreen onStart={handleStart} />
      </div>
    );
  }

  if (phase === 'results') {
    return <ResultsScreen results={results} onRestart={() => setPhase('setup')} />;
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4" />
          <span className="font-medium">Prüfungs-Simulation</span>
        </div>
        <span>{results.filter(r => r.correct).length} / {currentIndex} richtig</span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(currentIndex / questions.length) * 100}%` }}
        />
      </div>

      <ExamQuestion
        key={currentIndex}
        question={questions[currentIndex]}
        index={currentIndex}
        total={questions.length}
        onAnswer={handleAnswer}
      />
    </div>
  );
}
