import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from './Sidebar';
import { useGamification } from '@/hooks/useGamification';
import { useLearningUnits } from '@/hooks/useLearningUnits';

export function AppLayout() {
  const { stats } = useGamification();
  const { dueTotal } = useLearningUnits();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar streak={stats?.current_streak_days ?? 0} dueCount={dueTotal} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}
