import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
}

export function FeedbackPanel({ correct, correctAnswer, explanation }: Props) {
  return (
    <div className={cn(
      'rounded-lg border p-4 space-y-2',
      correct
        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30'
        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
    )}>
      <div className="flex items-center gap-2">
        {correct
          ? <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          : <XCircle className="h-5 w-5 text-red-600 shrink-0" />
        }
        <span className={cn('font-semibold text-sm', correct ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300')}>
          {correct ? 'Richtig!' : 'Falsch'}
        </span>
      </div>
      {!correct && (
        <p className="text-sm">
          <span className="font-medium">Richtige Antwort: </span>
          <span className="text-green-700 dark:text-green-300">{correctAnswer}</span>
        </p>
      )}
      <p className="text-sm text-muted-foreground">{explanation}</p>
    </div>
  );
}
