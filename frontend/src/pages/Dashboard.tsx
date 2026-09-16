import { BookOpen, ChevronDown, ChevronRight, RefreshCw, RotateCcw, Trophy } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LearningUnitCard } from '@/components/dashboard/LearningUnitCard';
import { IngestionStatus } from '@/components/dashboard/IngestionStatus';
import { XpBar } from '@/components/gamification/XpBar';
import { useLearningUnits } from '@/hooks/useLearningUnits';
import { useGamification } from '@/hooks/useGamification';
import type { LearningUnit } from '@/types/api';

function ModuleGroup({ name, units }: { name: string | null; units: LearningUnit[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const displayName = name ?? 'Ohne Modul';
  const moduleDue = units.reduce((sum, u) => sum + (u.due_cards || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronDown className="h-4 w-4" />}
          {displayName}
          <span className="font-normal">({units.length})</span>
        </button>
        <div className="ml-auto flex gap-1.5">
          {moduleDue > 0 && (
            <Button
              variant="default"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => navigate(name ? `/review?module=${encodeURIComponent(name)}` : '/review')}
            >
              <RotateCcw className="h-3 w-3" />
              {moduleDue} lernen
            </Button>
          )}
          {name && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => navigate(`/exam?module=${encodeURIComponent(name)}`)}
            >
              <Trophy className="h-3 w-3" />
              Prüfung
            </Button>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {units.map(unit => (
            <LearningUnitCard key={unit.id} unit={unit} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Dashboard() {
  const { units, dueTotal, loading, reload } = useLearningUnits();
  const { stats, xpProgress, xpNeeded, reload: reloadGamification } = useGamification();
  const navigate = useNavigate();

  // Group units by module_name
  const grouped = new Map<string | null, LearningUnit[]>();
  for (const u of units) {
    const key = u.module_name ?? null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(u);
  }
  // Sort: named modules first (alphabetical), then null group
  const sortedKeys = [...grouped.keys()].sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Deine Lerneinheiten im Überblick</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/exam')}>
            <Trophy className="h-4 w-4" />
            Prüfungs-Simulation
          </Button>
          <Button variant="outline" size="icon" onClick={() => { reload(); reloadGamification(); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {stats && (
        <div className="rounded-lg border bg-card p-4">
          <XpBar
            level={stats.level}
            xpProgress={xpProgress}
            xpNeeded={xpNeeded}
            totalXp={stats.total_xp}
          />
        </div>
      )}

      {dueTotal > 0 && (
        <button
          onClick={() => navigate('/review')}
          className="w-full flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-left hover:bg-primary/10 transition-colors"
        >
          <RotateCcw className="h-5 w-5 text-primary" />
          <div>
            <p className="font-semibold text-primary">{dueTotal} Karten zur Wiederholung fällig</p>
            <p className="text-xs text-muted-foreground">Jetzt Daily Review starten</p>
          </div>
        </button>
      )}

      <IngestionStatus onComplete={reload} />

      {loading ? (
        <div className="text-muted-foreground text-sm">Lade Lerneinheiten…</div>
      ) : units.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 text-center">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="font-semibold">Noch keine Lerneinheiten</p>
          <p className="text-sm text-muted-foreground mt-1">
            Lege eine PDF oder PPTX in <code className="bg-muted px-1 rounded">inbox/</code> oder einen Unterordner wie{' '}
            <code className="bg-muted px-1 rounded">inbox/Modul-SS26/</code>
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedKeys.map(key => (
            <ModuleGroup key={key ?? '__none__'} name={key} units={grouped.get(key)!} />
          ))}
        </div>
      )}
    </div>
  );
}
