import type { Badge } from '@/types/api';
import { cn } from '@/lib/utils';

interface Props {
  badges: Badge[];
}

export function BadgeGrid({ badges }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {badges.map(badge => (
        <div
          key={badge.slug}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-all',
            badge.unlocked_at
              ? 'border-primary/30 bg-primary/5'
              : 'border-muted opacity-40 grayscale'
          )}
          title={badge.description}
        >
          <span className="text-2xl">{badge.icon}</span>
          <span className="text-xs font-medium leading-tight">{badge.name}</span>
          {badge.unlocked_at && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(badge.unlocked_at).toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
