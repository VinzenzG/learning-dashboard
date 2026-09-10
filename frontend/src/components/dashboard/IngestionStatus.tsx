import { useState } from 'react';
import { useSSE, type SSEEvent } from '@/hooks/useSSE';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface IngestionJob {
  unitId: number;
  fileName: string;
  step: number;
  total: number;
  status: 'running' | 'done' | 'warning' | 'error';
  questionCount?: number;
  error?: string;
}

interface Props {
  onComplete?: () => void;
}

export function IngestionStatus({ onComplete }: Props) {
  const [jobs, setJobs] = useState<Map<number, IngestionJob>>(new Map());

  useSSE((event: SSEEvent) => {
    if (!event.unitId) return;

    setJobs(prev => {
      const next = new Map(prev);
      if (event.type === 'ingestion_start') {
        next.set(event.unitId!, {
          unitId: event.unitId!,
          fileName: event.fileName ?? '',
          step: 0,
          total: 1,
          status: 'running',
        });
      } else if (event.type === 'ingestion_progress') {
        const job = next.get(event.unitId!);
        if (job) next.set(event.unitId!, { ...job, step: event.step ?? 0, total: event.total ?? 1 });
      } else if (event.type === 'ingestion_complete') {
        const job = next.get(event.unitId!);
        if (job) {
          next.set(event.unitId!, {
            ...job,
            status: event.warning ? 'warning' : 'done',
            questionCount: event.questionCount,
            step: job.total,
          });
          onComplete?.();
          // Remove after 5s
          setTimeout(() => setJobs(p => { const m = new Map(p); m.delete(event.unitId!); return m; }), 5000);
        }
      } else if (event.type === 'ingestion_error') {
        const job = next.get(event.unitId!);
        if (job) next.set(event.unitId!, { ...job, status: 'error', error: event.error });
        setTimeout(() => setJobs(p => { const m = new Map(p); m.delete(event.unitId!); return m; }), 8000);
      }
      return next;
    });
  });

  if (jobs.size === 0) return null;

  return (
    <div className="space-y-2">
      {Array.from(jobs.values()).map(job => (
        <div key={job.unitId} className="rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 mb-1.5">
            {job.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
            {job.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {(job.status === 'warning' || job.status === 'error') && <AlertTriangle className="h-4 w-4 text-amber-500" />}
            <span className="text-sm font-medium truncate">{job.fileName}</span>
            {job.status === 'done' && (
              <span className="ml-auto text-xs text-muted-foreground">{job.questionCount} Fragen generiert</span>
            )}
          </div>
          {job.status === 'running' && job.total > 0 && (
            <Progress value={(job.step / job.total) * 100} className="h-1.5" />
          )}
          {job.error && <p className="text-xs text-destructive mt-1">{job.error}</p>}
        </div>
      ))}
    </div>
  );
}
