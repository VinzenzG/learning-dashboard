import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { SrsCard } from '@/types/api';

interface Props {
  card: SrsCard;
  onAnswer: (answer: string, correct: boolean) => void;
  answered: boolean;
}

export function QuestionCard({ card, onAnswer, answered }: Props) {
  const [selected, setSelected] = useState<string>('');
  const [textInput, setTextInput] = useState('');

  const options: string[] = card.options
    ? (typeof card.options === 'string' ? JSON.parse(card.options) : card.options)
    : [];

  const checkAnswer = (answer: string) => {
    if (answered) return;
    const correct = answer.trim().toLowerCase() === card.correct_answer.trim().toLowerCase();
    onAnswer(answer, correct);
    setSelected(answer);
  };

  if (card.question_type === 'mc' || card.question_type === 'truefalse') {
    return (
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg font-medium leading-relaxed flex-1">{card.question_text}</p>
          <Badge variant="outline" className="shrink-0 text-xs">{card.topic_tag}</Badge>
        </div>
        <div className="grid gap-2">
          {options.map((opt, i) => {
            const isSelected = selected === opt;
            const isCorrect = opt === card.correct_answer;
            let cls = 'w-full text-left justify-start h-auto py-3 px-4 border rounded-lg transition-colors ';
            if (answered) {
              if (isCorrect) cls += 'border-green-400 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200';
              else if (isSelected) cls += 'border-red-400 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200';
              else cls += 'border-muted text-muted-foreground';
            } else {
              cls += 'border-border hover:border-primary hover:bg-accent cursor-pointer';
            }
            return (
              <button key={i} className={cls} onClick={() => checkAnswer(opt)} disabled={answered}>
                <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (card.question_type === 'fillin') {
    return (
      <div className="space-y-4">
        <p className="text-lg font-medium leading-relaxed">{card.question_text}</p>
        <div className="flex gap-2">
          <Input
            placeholder="Antwort eingeben…"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !answered && checkAnswer(textInput)}
            disabled={answered}
          />
          <Button onClick={() => checkAnswer(textInput)} disabled={answered || !textInput.trim()}>
            Prüfen
          </Button>
        </div>
      </div>
    );
  }

  // shortanswer + feynman
  return (
    <div className="space-y-4">
      <p className="text-lg font-medium leading-relaxed">{card.question_text}</p>
      {card.question_type === 'feynman' && (
        <p className="text-sm text-muted-foreground">Erkläre das Konzept in eigenen Worten (Feynman-Methode)</p>
      )}
      <Textarea
        placeholder="Deine Antwort…"
        value={textInput}
        onChange={e => setTextInput(e.target.value)}
        disabled={answered}
        rows={4}
      />
      <Button onClick={() => checkAnswer(textInput)} disabled={answered || !textInput.trim()} className="w-full">
        Antwort abgeben
      </Button>
    </div>
  );
}
