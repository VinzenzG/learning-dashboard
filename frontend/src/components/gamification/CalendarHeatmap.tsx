import { useMemo } from 'react';
import { subDays, format, getDay } from 'date-fns';

interface Props {
  activeDates: string[]; // 'YYYY-MM-DD' strings
  days?: number;
}

export function CalendarHeatmap({ activeDates, days = 91 }: Props) {
  const activeSet = useMemo(() => new Set(activeDates), [activeDates]);
  const today = new Date();

  const cells = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const d = subDays(today, days - 1 - i);
      const key = format(d, 'yyyy-MM-dd');
      return { key, active: activeSet.has(key), date: d };
    });
  }, [days, activeSet, today]);

  // Pad start to begin on Sunday
  const firstDow = getDay(cells[0].date);
  const padding = Array.from({ length: firstDow }, (_, i) => ({ key: `pad-${i}`, active: false, date: null }));
  const allCells = [...padding, ...cells];

  return (
    <div>
      <div className="flex gap-1 text-[10px] text-muted-foreground mb-1">
        {['So','Mo','Di','Mi','Do','Fr','Sa'].map(d => (
          <div key={d} className="w-3 text-center">{d}</div>
        ))}
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {allCells.map((cell) => (
          <div
            key={cell.key}
            className={[
              'h-3 w-3 rounded-sm',
              cell.active
                ? 'bg-green-500'
                : cell.date
                ? 'bg-muted'
                : 'bg-transparent',
            ].join(' ')}
            title={cell.date ? format(cell.date, 'dd.MM.yyyy') : ''}
          />
        ))}
      </div>
    </div>
  );
}
