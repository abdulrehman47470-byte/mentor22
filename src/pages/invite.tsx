import { Check, Copy, Inbox, Mail, Send, Share2, Sparkles, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { Avatar, Badge, Button, Empty, Field, Header, Input, Sheet, TextArea, toast } from '@/components/ui';
import { discoverable, fullName, inviteStatus, isMentorType, matchScore, respondRequest, sendInvite, userById } from '@/lib/api';
import { cn, timeAgo, useDb, useMe } from '@/lib/store';
import type { User } from '@/lib/types';
import { coverFor } from '@/data/media';

type Tab = 'sent' | 'received';

/** Ready-made openers, so sending an invite takes one tap. */
function openers(me: User, them: string) {
  return isMentorType(me.role)
    ? [`Hi ${them}! I'd love to be your mentor this semester.`, `Hi ${them}, your goals line up with my experience. Want to connect?`, `Hi ${them}! Happy to help with classes, careers or anything in between.`]
    : [`Hi ${them}! I'd really value your mentorship.`, `Hi ${them}, I'm interested in your field and would love your advice.`, `Hi ${them}! Could we connect for a coffee chat sometime?`];
}

export function InvitePage() {
  const me = useMe()!;
  const mentor = isMentorType(me.role);
  const seeking = me.role === 'peer_mentor' ? 'members' : mentor ? 'mentees' : 'mentors';
  const people = useDb((d) => discoverable(me, d).map((u) => ({ u, ...matchScore(me, u) })).sort((a, b) => b.score - a.score));
  const sent = useDb((d) => d.invites.filter((i) => i.fromId === me.id).map((i) => ({ i, to: i.toId ? userById(i.toId, d) : undefined, status: inviteStatus(i, d) })));
  const received = useDb((d) => d.invites.filter((i) => i.toId === me.id).map((i) => ({ i, from: userById(i.fromId, d), status: inviteStatus(i, d) })).filter((x) => x.from));
  const accepted = sent.filter((x) => x.status === 'accepted').length;
  const [target, setTarget] = useState<User | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [tab, setTab] = useState<Tab>(received.some((x) => x.status === 'pending') ? 'received' : 'sent');
  const link = `${window.location.origin}/welcome?ref=${me.id}`;

  const share = async () => {
    const text = `Join me on ${BRAND.appName}, the ${BRAND.orgName} mentoring community.`;
    try {
      if (navigator.share) await navigator.share({ title: BRAND.appName, text, url: link });
      else { await navigator.clipboard.writeText(`${text} ${link}`); toast('Invite link copied'); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="pb-10">
      <Header title="Send invites" back />

      {/* Hero */}
      <div className="px-4 pt-4">
        <div className="apex-gradient relative overflow-hidden rounded-3xl p-5 text-white shadow-[0_24px_48px_-20px_rgba(38,70,114,0.7)]">
          <div className="apex-sheen pointer-events-none absolute inset-0" aria-hidden />
          <div className="float-glow pointer-events-none absolute -right-12 -top-12 size-44 rounded-full bg-orange/35 blur-3xl" aria-hidden />
          <div className="relative">
            <div className="flex -space-x-3">
              {people.slice(0, 5).map(({ u }) => <div key={u.id} className="rounded-full ring-2 ring-navy"><Avatar user={u} size={40} /></div>)}
              <span className="glass grid size-10 place-items-center rounded-full text-xs font-bold ring-2 ring-navy">+{Math.max(0, people.length - 5)}</span>
            </div>
            <h2 className="font-display mt-4 text-2xl font-extrabold leading-tight">Grow your <span className="text-gradient">circle</span></h2>
            <p className="mt-1 text-sm text-white/75">Invite {seeking} to connect with you. They get your note and can accept in one tap.</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {([['Sent', sent.length], ['Accepted', accepted], ['For you', people.length]] as const).map(([k, v]) => (
                <div key={k} className="glass rounded-2xl py-2">
                  <p className="font-display text-xl font-extrabold">{v}</p>
                  <p className="text-[10.5px] font-semibold uppercase tracking-wider text-white/60">{k}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setEmailOpen(true)} className="flex items-center justify-center gap-2 rounded-full bg-white py-2.5 text-sm font-semibold text-navy active:scale-[0.98]"><Mail className="size-4" /> Invite by email</button>
              <button onClick={share} className="glass flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold active:scale-[0.98]"><Share2 className="size-4" /> Share link</button>
            </div>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="mt-6 flex items-center justify-between px-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-faint">Best {seeking} for you</h2>
        <span className="flex items-center gap-1 text-xs font-semibold text-orange-text"><Sparkles className="size-3.5" /> Ranked by fit</span>
      </div>
      {people.length ? (
        <div className="no-scrollbar mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {people.slice(0, 12).map(({ u, score, reasons }) => (
            <div key={u.id} className="shadow-premium flex w-[200px] shrink-0 snap-start flex-col items-center overflow-hidden rounded-3xl border border-line bg-surface p-4 pt-0 text-center">
              <div className="-mx-4 mb-[-42px] h-20 w-[calc(100%+32px)]"><img loading="lazy" decoding="async" src={coverFor(u)} alt="" className="size-full object-cover" /></div>
              <div className="relative grid size-[84px] place-items-center rounded-full" style={{ background: `conic-gradient(var(--orange) ${score * 3.6}deg, var(--bg-soft) 0deg)` }}>
                <div className="rounded-full bg-surface p-[3px]"><Avatar user={u} size={72} /></div>
                <span className="brand-gradient absolute -bottom-1 rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white">{score}%</span>
              </div>
              <Link to={`/member/${u.id}`} className="mt-3 w-full truncate font-semibold">{fullName(u)}</Link>
              <p className="w-full truncate text-xs text-faint">{u.profile.classification} · {u.profile.affiliation}</p>
              <div className="mt-2 flex h-[44px] flex-wrap justify-center gap-1 overflow-hidden">
                {reasons.slice(0, 2).map((r) => <span key={r} className="h-fit rounded-full bg-orange-fill px-2 py-0.5 text-[10.5px] font-semibold text-orange-text">{r}</span>)}
              </div>
              <Button size="sm" className="mt-2 w-full" onClick={() => setTarget(u)}><UserPlus className="size-4" /> Invite</Button>
            </div>
          ))}
        </div>
      ) : (
        <Empty icon={<Sparkles className="size-7" />} title="You've reached everyone" body="Invite new people by email or share your link." />
      )}

      {/* Sent / received */}
      <div className="mx-4 mt-6 flex gap-1 rounded-full bg-bg-soft p-1">
        {([['sent', 'Sent', sent.length], ['received', 'Received', received.filter((x) => x.status === 'pending').length]] as const).map(([k, label, n]) => (
          <button key={k} onClick={() => setTab(k)} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition', tab === k ? 'bg-surface text-navy shadow-premium' : 'text-faint')}>
            {label}<span className={cn('rounded-full px-1.5 text-[11px]', tab === k ? 'bg-orange-fill text-orange-text' : 'bg-line')}>{n}</span>
          </button>
        ))}
      </div>
      <ul className="mt-2 divide-y divide-line">
        {tab === 'sent' && sent.map(({ i, to, status }) => (
          <li key={i.id} className="flex items-center gap-3 px-4 py-3">
            {to ? <Avatar user={to} size={44} /> : <span className="grid size-11 place-items-center rounded-full bg-orange-fill text-orange-text"><Mail className="size-5" /></span>}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{to ? fullName(to) : i.name || i.email}</p>
              <p className="truncate text-xs text-faint">{i.channel === 'email' ? i.email : i.message} · {timeAgo(i.createdAt)}</p>
            </div>
            <StatusBadge status={status} />
          </li>
        ))}
        {tab === 'received' && received.map(({ i, from, status }) => (
          <li key={i.id} className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Link to={`/member/${from!.id}`}><Avatar user={from!} size={44} /></Link>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{fullName(from!)}</p>
                <p className="text-xs text-faint">{from!.profile.classification} · {timeAgo(i.createdAt)}</p>
              </div>
              {status === 'pending' ? (
                <div className="flex gap-2">
                  <button aria-label="Decline" onClick={() => { respondRequest(from!.id, false); toast('Invite declined'); }} className="grid size-10 place-items-center rounded-full border border-line-strong text-muted"><X className="size-5" /></button>
                  <button aria-label="Accept" onClick={() => { respondRequest(from!.id, true); toast(`You and ${from!.profile.firstName} are connected`); }} className="grid size-10 place-items-center rounded-full bg-navy text-white"><Check className="size-5" /></button>
                </div>
              ) : <StatusBadge status={status} />}
            </div>
            {i.message && <p className="ml-14 mt-2 rounded-2xl rounded-tl-sm bg-bg-soft px-3 py-2 text-sm">{i.message}</p>}
          </li>
        ))}
      </ul>
      {tab === 'sent' && !sent.length && <Empty icon={<Send className="size-7" />} title="No invites sent yet" body="Pick someone above and send your first invite." />}
      {tab === 'received' && !received.length && <Empty icon={<Inbox className="size-7" />} title="No invites yet" body={`When ${seeking} invite you, they show up here.`} />}

      <InviteSheet user={target} onClose={() => setTarget(null)} />
      <EmailInviteSheet key={String(emailOpen)} open={emailOpen} onClose={() => setEmailOpen(false)} link={link} />
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof inviteStatus> }) {
  const map = { pending: ['Pending', 'orange'], accepted: ['Connected', 'green'], declined: ['Declined', 'gray'], sent: ['Emailed', 'navy'], opened: ['Opened', 'orange'], scheduled: ['Scheduled', 'gray'] } as const;
  const [label, tone] = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

function InviteSheet({ user, onClose }: { user: User | null; onClose: () => void }) {
  const me = useMe()!;
  const [msg, setMsg] = useState('');
  if (!user) return null;
  const options = openers(me, user.profile.firstName);
  const text = msg || options[0];
  return (
    <Sheet open onClose={() => { setMsg(''); onClose(); }} title={`Invite ${user.profile.firstName}`}>
      <div className="flex items-center gap-3">
        <Avatar user={user} size={56} ring />
        <div className="min-w-0"><p className="truncate font-semibold">{fullName(user)}</p><p className="truncate text-sm text-faint">{user.profile.classification} · {user.profile.college || user.profile.affiliation}</p></div>
      </div>
      <p className="mb-2 mt-5 text-sm font-semibold">Pick an opener</p>
      <div className="space-y-2">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => setMsg(o)} className={cn('w-full rounded-2xl border px-3.5 py-2.5 text-left text-sm transition', text === o ? 'border-orange bg-orange-fill' : 'border-line-strong hover:bg-bg-soft')}>{o}</button>
        ))}
      </div>
      <div className="mt-4"><Field label="Your message"><TextArea value={text} onChange={(e) => setMsg(e.target.value)} max={300} rows={3} /></Field></div>
      <Button size="lg" variant="accent" onClick={() => { sendInvite({ toId: user.id, message: text }); toast(`Invite sent to ${user.profile.firstName}`); setMsg(''); onClose(); }}>
        <Send className="size-5" /> Send invite
      </Button>
    </Sheet>
  );
}

function EmailInviteSheet({ open, onClose, link }: { open: boolean; onClose: () => void; link: string }) {
  const me = useMe()!;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState(`Hi! I'm on ${BRAND.appName} and thought you'd be a great fit. Join me here: ${link}`);
  const valid = /^\S+@\S+\.\S+$/.test(email);
  return (
    <Sheet open={open} onClose={onClose} title="Invite by email">
      <p className="mb-4 text-sm text-muted">Invite someone who isn't on {BRAND.appName} yet. We'll email them your note with a sign-up link.</p>
      <Field label="Their name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" /></Field>
      <Field label="Email" required><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@csu.fullerton.edu" /></Field>
      <Field label="Message"><TextArea value={msg} onChange={(e) => setMsg(e.target.value)} max={400} rows={4} /></Field>
      <div className="flex gap-2">
        <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(link); toast('Link copied'); } catch { toast(link); } }}><Copy className="size-4" /> Link</Button>
        <Button className="flex-1" disabled={!valid} onClick={() => { sendInvite({ email, name, message: msg, role: isMentorType(me.role) ? 'mentee' : 'mentor' }); toast(`Invite emailed to ${name || email}`); onClose(); }}>
          <Send className="size-4" /> Send from {me.profile.firstName}
        </Button>
      </div>
    </Sheet>
  );
}
