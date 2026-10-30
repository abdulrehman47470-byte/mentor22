import { Building2, Check, Inbox, MessageCircle, Send, UserMinus, UserPlus, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { L } from '@/data/labels';
import { Avatar, Badge, Button, Empty, Header, ask, toast } from '@/components/ui';
import { cancelRequest, disconnect, fullName, isBlocked, respondRequest, userById } from '@/lib/api';
import { cn, timeAgo, useDb, useMe } from '@/lib/store';
import type { Connection, User } from '@/lib/types';

type Tab = 'received' | 'sent' | 'connected';

/** Connections: requests received, requests sent and connected members, with profession, college, date and "Referred By". */
export function Connections() {
  const me = useMe()!;
  const nav = useNavigate();
  const rows = useDb((d) =>
    d.connections
      .filter((c) => (c.from === me.id || c.to === me.id) && c.status !== 'declined')
      .map((c) => ({ c, other: userById(c.from === me.id ? c.to : c.from, d)! }))
      .filter((r) => r.other && !isBlocked(me.id, r.other.id, d))
      .sort((a, b) => b.c.createdAt.localeCompare(a.c.createdAt)),
  );
  const received = rows.filter((r) => r.c.status === 'requested' && r.c.to === me.id);
  const sent = rows.filter((r) => r.c.status === 'requested' && r.c.from === me.id);
  const connected = rows.filter((r) => r.c.status === 'connected');
  const [tab, setTab] = useState<Tab>(received.length ? 'received' : 'connected');
  const list = tab === 'received' ? received : tab === 'sent' ? sent : connected;

  const reject = async (other: User) => {
    const r = await ask({ message: L.are_you_sure_to_deny_mentoring_request, reason: 'optional', danger: true, confirm: L.reject_request });
    if (r === null) return;
    respondRequest(other.id, false, r);
    toast('Request declined');
  };
  const drop = async (other: User) => {
    const r = await ask({ message: L.are_you_sure_you_want_to_disconnect, reason: 'optional', danger: true, confirm: L.disconnect });
    if (r === null) return;
    disconnect(other.id, r);
    toast(`${L.disconnect}: ${fullName(other)}`);
  };
  const withdraw = async (other: User) => {
    if ((await ask({ message: L.are_you_sure_want_to_cancel_request })) === null) return;
    cancelRequest(other.id);
    toast('Request withdrawn');
  };

  return (
    <div>
      <Header title="Connections" right={<Link to="/invite" className="brand-gradient flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-white"><UserPlus className="size-4" /> {L.invite}</Link>} />
      <div className="sticky top-14 z-20 flex gap-1 border-b border-line bg-surface px-gutter py-2">
        {([['received', 'Requests', received.length], ['sent', 'Sent', sent.length], ['connected', 'Connected', connected.length]] as const).map(([k, label, n]) => (
          <button key={k} onClick={() => setTab(k)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold', tab === k ? 'bg-navy text-white' : 'text-faint')}>
            {label}
            <span className={cn('rounded-full px-1.5 text-[11px]', tab === k ? 'bg-white/20' : 'bg-bg-soft')}>{n}</span>
          </button>
        ))}
      </div>
      <ul className="divide-y divide-line">
        {list.map(({ c, other }) => (
          <li key={c.id} className="flex items-center gap-3 px-gutter py-3">
            <Link to={`/member/${other.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar user={other} size={52} />
              <Info user={other} c={c} />
            </Link>
            {tab === 'received' && (
              <div className="flex gap-2">
                <button aria-label={L.reject_request} onClick={() => reject(other)} className="grid size-10 place-items-center rounded-full border border-line-strong text-muted"><X className="size-5" /></button>
                <button aria-label={L.accept} onClick={() => { respondRequest(other.id, true); toast(`You and ${other.profile.firstName} are connected`); }} className="grid size-10 place-items-center rounded-full bg-navy text-white"><Check className="size-5" /></button>
              </div>
            )}
            {tab === 'sent' && <Button size="sm" variant="outline" onClick={() => withdraw(other)}>{L.cancel}</Button>}
            {tab === 'connected' && (
              <div className="flex gap-2">
                <button aria-label={L.disconnect} onClick={() => drop(other)} className="grid size-10 place-items-center rounded-full border border-line-strong text-muted"><UserMinus className="size-5" /></button>
                <button aria-label={L.message} onClick={() => nav(`/messages/${other.id}`)} className="grid size-10 place-items-center rounded-full bg-orange-fill text-orange-text"><MessageCircle className="size-5" /></button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {!list.length && (
        <Empty
          icon={tab === 'received' ? <Inbox className="size-7" /> : tab === 'sent' ? <Send className="size-7" /> : <UsersRound className="size-7" />}
          title={tab === 'connected' ? L.no_accepted_request : L.no_pending_request}
          body={tab === 'connected' ? 'Send a request from Discover to start mentoring.' : undefined}
          action={tab !== 'received' ? <Button onClick={() => nav('/discover')}>Discover people</Button> : undefined}
        />
      )}
    </div>
  );
}

function Info({ user, c }: { user: User; c: Connection }) {
  const p = user.profile;
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <p className="truncate font-semibold">{fullName(user)}</p>
        <span className="shrink-0 text-xs text-faint">{timeAgo(c.createdAt)}</span>
      </div>
      <p className="truncate text-sm text-muted">{p.profession || `${p.classification} · ${p.affiliation}`}</p>
      {p.college && <p className="flex items-center gap-1 truncate text-xs text-faint"><Building2 className="size-3.5 shrink-0" />{p.college}</p>}
      {c.referredBy && <p className="mt-1"><Badge tone="orange">{L.referred_by} {c.referredBy}</Badge></p>}
    </div>
  );
}
