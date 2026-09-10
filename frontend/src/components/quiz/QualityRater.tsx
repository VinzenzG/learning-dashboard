import { Button } from '@/components/ui/button';
import { RotateCcw, Frown, Smile, Star } from 'lucide-react';

interface Props {
  onRate: (quality: number) => void;
  disabled?: boolean;
}

const buttons = [
  { quality: 1, label: 'Nochmal', icon: RotateCcw, className: 'border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950' },
  { quality: 2, label: 'Schwer', icon: Frown, className: 'border-orange-300 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950' },
  { quality: 4, label: 'Gut', icon: Smile, className: 'border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950' },
  { quality: 5, label: 'Einfach', icon: Star, className: 'border-green-300 text-green-600 hover:bg-green-50 dark:hover:bg-green-950' },
];

export function QualityRater({ onRate, disabled }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground font-medium">Wie gut wusstest du es?</p>
      <div className="grid grid-cols-4 gap-2">
        {buttons.map(({ quality, label, icon: Icon, className }) => (
          <Button
            key={quality}
            variant="outline"
            disabled={disabled}
            onClick={() => onRate(quality)}
            className={`flex flex-col h-auto py-3 gap-1 ${className}`}
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
