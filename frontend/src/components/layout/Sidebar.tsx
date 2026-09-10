import { NavLink } from 'react-router-dom';
import { LayoutDashboard, RotateCcw, BarChart3, Trophy, GraduationCap, Settings, BookOpen, Flame, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/review', icon: RotateCcw, label: 'Daily Review' },
  { to: '/exam', icon: GraduationCap, label: 'Prüfung' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/achievements', icon: Trophy, label: 'Achievements' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  streak: number;
  dueCount: number;
}

export function Sidebar({ streak, dueCount }: SidebarProps) {
  const { dark, toggle } = useDarkMode();
  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-card px-3 py-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <BookOpen className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">LearnDash</span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
            {label === 'Daily Review' && dueCount > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {dueCount > 99 ? '99+' : dueCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={toggle}>
        {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {dark ? 'Light Mode' : 'Dark Mode'}
      </Button>

      {streak > 0 && (
        <div className="mt-auto flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 dark:bg-amber-950">
          <Flame className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
            {streak} day streak
          </span>
        </div>
      )}
    </aside>
  );
}
