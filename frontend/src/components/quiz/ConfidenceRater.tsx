import { Button } from '@/components/ui/button';

interface Props {
  value: number | null;
  onChange: (v: number) => void;
}

const labels = ['', 'Keine Ahnung', 'Unsicher', 'Ich glaube', 'Ziemlich sicher', 'Sehr sicher'];
const colors = ['', 'bg-red-100 text-red-700 border-red-300', 'bg-orange-100 text-orange-700 border-orange-300', 'bg-yellow-100 text-yellow-700 border-yellow-300', 'bg-blue-100 text-blue-700 border-blue-300', 'bg-green-100 text-green-700 border-green-300'];
const selectedColors = ['', 'bg-red-500 text-white', 'bg-orange-500 text-white', 'bg-yellow-500 text-white', 'bg-blue-500 text-white', 'bg-green-500 text-white'];

export function ConfidenceRater({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground font-medium">Wie sicher bist du? <span className="text-xs">(vor dem Aufdecken)</span></p>
      <div className="flex gap-1.5 flex-wrap">
        {[1, 2, 3, 4, 5].map(v => (
          <Button
            key={v}
            variant="outline"
            size="sm"
            onClick={() => onChange(v)}
            className={value === v ? selectedColors[v] : colors[v]}
          >
            {v} – {labels[v]}
          </Button>
        ))}
      </div>
    </div>
  );
}
