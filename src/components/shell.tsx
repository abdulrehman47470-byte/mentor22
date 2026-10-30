import { Ban, Compass, MessageCircle, ShieldX, UserRound, UsersRound } from 'lucide-react';
import { useEffect } from 'react';
import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { L } from '@/data/labels';
import { ADMIN_ONLY, isAdmin, signOut, stopImpersonating, fullName, threads } from '@/lib/api';
import { cn, useDb, useMe } from '@/lib/store';

export const TABS = [
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/connections', label: 'Connections', icon: UsersRound },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

/** Phone frame on wide screens, full screen on phones. Also applies the Accessibility settings. */
export function Frame({ children }: { children: React.ReactNode }) {
  const scale = useDb((d) => d.device.textScale);
  const reduce = useDb((d) => d.device.reduceMotion);
  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', String(scale));
    document.documentElement.classList.toggle('reduce-motion', reduce);
  }, [scale, reduce]);
  return (
    <div className="device-wrap">
      <div className="device">
        <div className="device-scroll relative bg-bg" id="scroller">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Requires a signed-in member with a finished profile. */
export function RequireMember({ children }: { children: React.ReactNode }) {
  const user = useMe();
  const impersonating = useDb((d) => !!d.realUserId);
  if (!user) return <Navigate to="/welcome" replace />;
  if (!user.profile.firstName || !user.profile.classification) return <Navigate to="/onboarding/profile" replace />;
  if (user.suspended && !impersonating) return <Suspended />;
  return <>{children}</>;
}

/** Blocks anyone who isn't a Super Admin, even when they type /admin directly. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const admin = useDb((d) => isAdmin(d));
  if (admin) return <>{children}</>;
  return (
    <div className="flex min-h-app flex-col items-center justify-center px-8 text-center">
      <div className="mb-5 grid size-20 place-items-center rounded-full bg-danger/10 text-danger ring-8 ring-danger/5"><ShieldX className="size-9" /></div>
      <h1 className="font-display text-xl font-bold">{ADMIN_ONLY}</h1>
      <p className="mt-2 text-sm text-muted">Your account doesn’t have admin access. If you think you need it, contact {BRAND.supportEmail}.</p>
      <Link to="/discover" replace className="mt-6 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white">Back to the app</Link>
    </div>
  );
}

function Suspended() {
  return (
    <div className="flex min-h-app flex-col items-center justify-center px-8 text-center">
      <div className="mb-5 grid size-20 place-items-center rounded-full bg-danger/10 text-danger ring-8 ring-danger/5"><Ban className="size-9" /></div>
      <h1 className="font-display text-xl font-bold">Your account is paused</h1>
      <p className="mt-2 text-sm text-muted">A {BRAND.appName} administrator has suspended this account. Contact {BRAND.supportEmail} if you think this is a mistake.</p>
      <button onClick={signOut} className="mt-6 rounded-full border border-line-strong px-6 py-3 text-sm font-semibold">{L.sign_out}</button>
    </div>
  );
}

export function AppShell() {
  const user = useMe();
  const unread = useDb((d) => threads(d).reduce((n, t) => n + t.unread, 0));
  const requests = useDb((d) => d.connections.filter((c) => c.to === d.sessionUserId && c.status === 'requested').length);
  const meetings = useDb((d) => d.meetings.filter((m) => m.invitee === d.sessionUserId && m.status === 'pending').length);
  const impersonating = useDb((d) => !!d.realUserId);
  const badges: Record<string, number> = { '/messages': unread, '/connections': requests, '/profile': meetings };
  // Admins open the Admin panel from their Profile, not from this menu.
  const tabs = TABS;
  return (
    <RequireMember>
      {impersonating && user && (
        <div className="sticky top-0 z-40 flex items-center gap-2 bg-orange px-gutter py-2 text-sm font-medium text-white">
          <span className="flex-1 truncate">Super Admin: viewing as {fullName(user)}</span>
          <button onClick={stopImpersonating} className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
            Exit
          </button>
        </div>
      )}
      <main className="min-h-app pb-[calc(96px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] px-3 pb-[max(10px,env(safe-area-inset-bottom))]">
        <ul className={cn('grid rounded-[26px] border border-line/80 bg-surface/90 p-1.5 shadow-[0_18px_40px_-14px_rgba(38,70,114,0.35)] backdrop-blur-xl', tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4')}>
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) => cn('relative flex h-[56px] flex-col items-center justify-center gap-1 rounded-[20px] text-[10.5px] transition-all', isActive ? 'bg-orange-fill font-semibold text-navy' : 'text-faint hover:text-muted')}
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <Icon className={cn('size-[21px]', isActive && 'text-orange-text')} strokeWidth={isActive ? 2.2 : 1.7} aria-hidden />
                      {badges[to] > 0 && (
                        <span className={cn('absolute -right-2.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold ring-2 ring-surface', to === '/admin' ? 'bg-danger text-white' : 'bg-orange text-white')}>{badges[to]}</span>
                      )}
                    </span>
                    {label}
                    {isActive && <span className="brand-gradient absolute bottom-1 h-[3px] w-5 rounded-full" aria-hidden />}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </RequireMember>
  );
}
