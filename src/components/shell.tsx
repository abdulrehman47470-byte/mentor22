import { CalendarDays, House, MessageCircle, UserRound, UsersRound } from 'lucide-react';
import { useEffect } from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { L } from '@/data/labels';
import { threads } from '@/lib/api';
import { cn, useDb, useMe } from '@/lib/store';

const TABS = [
  { to: '/home', label: L.home, icon: House },
  { to: '/requests', label: L.requests, icon: UsersRound },
  { to: '/calendar', label: L.calendar, icon: CalendarDays },
  { to: '/chat', label: L.chat, icon: MessageCircle },
  { to: '/profile', label: L.profile, icon: UserRound },
];

/** Phone frame on wide screens, full screen on phones. Also applies the Accessibility settings. */
export function Device({ children }: { children: React.ReactNode }) {
  const scale = useDb((d) => d.device.textScale);
  const reduce = useDb((d) => d.device.reduceMotion);
  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', String(scale));
    document.documentElement.classList.toggle('reduce-motion', reduce);
  }, [scale, reduce]);
  return (
    <div className="device-wrap">
      <div className="device">
        <div className="device-scroll" id="scroller">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Signed-in students only; anyone else goes to the landing page. */
export function RequireStudent({ children }: { children: React.ReactNode }) {
  const user = useMe();
  if (!user) return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

export function AppShell() {
  const unread = useDb((d) => threads(d).reduce((n, t) => n + t.unread, 0));
  const requests = useDb((d) => d.connections.filter((c) => c.studentId === d.sessionUserId && c.status === 'invited').length);
  const meetings = useDb((d) => d.meetings.filter((m) => m.invitee === d.sessionUserId && m.status === 'pending').length);
  const badges: Record<string, number> = { '/requests': requests, '/calendar': meetings, '/chat': unread };
  return (
    <RequireStudent>
      <main className="min-h-app pb-[calc(92px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <ul className="grid grid-cols-5 px-1.5 py-1.5">
          {TABS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} className={({ isActive }) => cn('relative flex h-[58px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] transition', isActive ? 'font-semibold text-brand-dark' : 'text-muted hover:text-brand-dark')}>
                {({ isActive }) => (
                  <>
                    <span className={cn('relative grid h-8 w-14 place-items-center rounded-full transition', isActive && 'bg-brand-light')}>
                      <Icon className={cn('size-[22px]', isActive && 'text-brand')} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden />
                      {badges[to] > 0 && <span className="absolute -top-1 right-2 grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">{badges[to]}</span>}
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </RequireStudent>
  );
}
