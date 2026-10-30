import {
  BellRing, Captions, Hand, Mic, MicOff, Phone, PhoneIncoming, PhoneMissed, PhoneOff, PhoneOutgoing, Radio, Star, Users, Video, VideoOff,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar, Button, Header, Sheet, toast } from '@/components/ui';
import { answerIncoming, callLog, fullName, joinRoom, leaveRoom, ringMe, toggleRoomReminder, userById } from '@/lib/api';
import { cn, fmtDate, fmtTime, timeAgo, useDb, useMe } from '@/lib/store';
import type { CallLog, LiveRoom } from '@/lib/types';

export const mmss = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;
const dur = (secs: number) => (secs >= 3600 ? `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m` : secs >= 60 ? `${Math.floor(secs / 60)} min` : `${secs}s`);

// ---------- Calls hub (Messages → Calls) ----------

export function CallsHub() {
  const nav = useNavigate();
  const calls = useDb((d) => callLog(d));
  const rooms = useDb((d) => d.rooms);
  const [open, setOpen] = useState<CallLog | null>(null);
  const live = rooms.filter((r) => r.live);
  const upcoming = rooms.filter((r) => !r.live);
  const talked = calls.filter((c) => c.status === 'completed').reduce((n, c) => n + c.duration, 0);

  return (
    <div className="space-y-6 py-4">
      <section className="px-4">
        <div className="grid grid-cols-3 gap-2">
          <Stat value={String(calls.filter((c) => c.status === 'completed').length)} label="Sessions" />
          <Stat value={`${Math.round(talked / 60)}m`} label="Mentoring time" />
          <Stat value={avgRating(calls)} label="Avg. rating" />
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between px-4">
          <h2 className="font-display flex items-center gap-2 text-base font-bold">
            <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-60" /><span className="relative inline-flex size-2.5 rounded-full bg-danger" /></span>
            Live office hours
          </h2>
          <span className="text-xs text-faint">Drop in, no booking needed</span>
        </div>
        <ul className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
          {live.map((r) => <RoomCard key={r.id} room={r} />)}
        </ul>
      </section>

      {upcoming.length > 0 && (
        <section className="px-4">
          <h2 className="font-display mb-2.5 text-base font-bold">Coming up</h2>
          <ul className="space-y-2">
            {upcoming.map((r) => <UpcomingRoom key={r.id} room={r} />)}
          </ul>
        </section>
      )}

      <section className="px-4">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Recent calls</h2>
          <button onClick={() => { toast('Incoming call in 2 seconds…'); setTimeout(() => ringMe('u2', 'video'), 2000); }} className="flex items-center gap-1 text-xs font-semibold text-orange-text">
            <BellRing className="size-3.5" /> Demo: receive a call
          </button>
        </div>
        <ul className="shadow-premium divide-y divide-line overflow-hidden rounded-2xl border border-line/70 bg-surface">
          {calls.map((c) => <CallRow key={c.id} call={c} onOpen={() => setOpen(c)} />)}
        </ul>
        {!calls.length && <p className="py-8 text-center text-sm text-faint">No calls yet. Start one from any chat.</p>}
      </section>

      <Sheet open={!!open} onClose={() => setOpen(null)} title="Session recap">
        {open && <Recap call={open} onCall={(video) => { setOpen(null); nav(`/call/${open.withId}${video ? '?video=1' : ''}`); }} />}
      </Sheet>
    </div>
  );
}

function avgRating(calls: CallLog[]) {
  const r = calls.filter((c) => c.rating).map((c) => c.rating!);
  return r.length ? `${(r.reduce((a, b) => a + b, 0) / r.length).toFixed(1)}★` : '—';
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="shadow-premium rounded-2xl border border-line/70 bg-surface px-3 py-3 text-center">
      <p className="font-display text-xl font-extrabold text-navy">{value}</p>
      <p className="text-[11px] font-medium text-faint">{label}</p>
    </div>
  );
}

function RoomCard({ room }: { room: LiveRoom }) {
  const nav = useNavigate();
  const host = useDb((d) => userById(room.hostId, d));
  const people = useDb((d) => room.participants.map((id) => userById(id, d)!).filter(Boolean));
  if (!host) return null;
  return (
    <li className="w-64 shrink-0">
      <button onClick={() => nav(`/room/${room.id}`)} className="shadow-premium block w-full overflow-hidden rounded-3xl border border-line/70 bg-surface text-left">
        <div className="relative h-32">
          <img loading="lazy" decoding="async" src={room.cover} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/20 to-transparent" />
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"><Radio className="size-3" /> Live</span>
          <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">{timeAgo(room.start)}</span>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
            <Avatar user={host} size={30} />
            <span className="text-xs font-semibold">{fullName(host)}</span>
          </div>
        </div>
        <div className="p-3.5">
          <p className="font-display truncate font-bold">{room.title}</p>
          <p className="truncate text-xs text-muted">{room.topic}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center">
              <span className="flex -space-x-2">{people.slice(0, 4).map((u) => <span key={u.id} className="rounded-full ring-2 ring-surface"><Avatar user={u} size={24} /></span>)}</span>
              <span className="ml-2 text-xs text-faint">{people.length + 1} in room</span>
            </span>
            <span className="brand-gradient rounded-full px-3 py-1 text-xs font-bold text-white">Join</span>
          </div>
        </div>
      </button>
    </li>
  );
}

function UpcomingRoom({ room }: { room: LiveRoom }) {
  const host = useDb((d) => userById(room.hostId, d));
  if (!host) return null;
  return (
    <li className="shadow-premium flex items-center gap-3 rounded-2xl border border-line/70 bg-surface p-3">
      <div className="w-12 shrink-0 overflow-hidden rounded-xl text-center ring-1 ring-line">
        <p className="bg-navy py-0.5 text-[9px] font-bold uppercase text-white">{new Date(room.start).toLocaleDateString(undefined, { month: 'short' })}</p>
        <p className="font-display py-0.5 text-lg font-extrabold">{new Date(room.start).getDate()}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{room.title}</p>
        <p className="truncate text-xs text-muted">with {fullName(host)} · {fmtTime(room.start)}</p>
      </div>
      <Button size="sm" variant={room.reminded ? 'outline' : 'primary'} onClick={() => { toggleRoomReminder(room.id); toast(room.reminded ? 'Reminder removed' : 'We’ll ping you when it starts'); }}>
        {room.reminded ? 'Reminded' : <><BellRing className="size-4" /> Remind</>}
      </Button>
    </li>
  );
}

function CallRow({ call, onOpen }: { call: CallLog; onOpen: () => void }) {
  const nav = useNavigate();
  const other = useDb((d) => userById(call.withId, d));
  if (!other) return null;
  const missed = call.status !== 'completed';
  const Icon = call.status === 'missed' ? PhoneMissed : call.direction === 'incoming' ? PhoneIncoming : PhoneOutgoing;
  return (
    <li className="flex items-center gap-3 px-3.5 py-3">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <Avatar user={other} size={46} />
        <div className="min-w-0 flex-1">
          <p className={cn('truncate font-semibold', missed && 'text-danger')}>{fullName(other)}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Icon className={cn('size-3.5', missed ? 'text-danger' : 'text-success')} />
            {call.kind === 'video' ? 'Video' : 'Audio'} · {call.status === 'completed' ? dur(call.duration) : call.status === 'missed' ? 'Missed' : 'Declined'} · {timeAgo(call.createdAt)}
          </p>
          {call.rating && <p className="mt-0.5 text-[11px] text-orange-text">{'★'.repeat(call.rating)}<span className="text-line-strong">{'★'.repeat(5 - call.rating)}</span>{call.notes && <span className="ml-1.5 text-faint">· notes saved</span>}</p>}
        </div>
      </button>
      <button aria-label={`Audio call ${other.profile.firstName}`} onClick={() => nav(`/call/${other.id}`)} className="grid size-10 place-items-center rounded-full bg-bg-soft text-white hover:bg-orange-fill"><Phone className="size-[18px]" /></button>
      <button aria-label={`Video call ${other.profile.firstName}`} onClick={() => nav(`/call/${other.id}?video=1`)} className="grid size-10 place-items-center rounded-full bg-bg-soft text-white hover:bg-orange-fill"><Video className="size-[18px]" /></button>
    </li>
  );
}

function Recap({ call, onCall }: { call: CallLog; onCall: (video: boolean) => void }) {
  const other = useDb((d) => userById(call.withId, d));
  if (!other) return null;
  return (
    <div>
      <div className="flex items-center gap-3">
        <Avatar user={other} size={52} />
        <div>
          <p className="font-display text-lg font-bold">{fullName(other)}</p>
          <p className="text-xs text-muted">{fmtDate(call.createdAt)} · {fmtTime(call.createdAt)} · {call.kind} call{call.status === 'completed' && ` · ${dur(call.duration)}`}</p>
        </div>
      </div>
      {call.rating ? (
        <div className="mt-4 rounded-2xl bg-bg-soft p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-faint">Your rating</p>
          <p className="mt-1 text-xl text-orange">{'★'.repeat(call.rating)}<span className="text-line-strong">{'★'.repeat(5 - call.rating)}</span></p>
          {call.notes && <><p className="mt-3 text-xs font-bold uppercase tracking-wider text-faint">Private notes</p><p className="mt-1 text-[15px]">{call.notes}</p></>}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl bg-bg-soft p-4 text-sm text-muted">{call.status === 'completed' ? 'No recap saved for this session.' : `This call was ${call.status}. Call ${other.profile.firstName} back?`}</p>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => onCall(false)}><Phone className="size-4" /> Audio</Button>
        <Button onClick={() => onCall(true)}><Video className="size-4" /> Video</Button>
      </div>
    </div>
  );
}

// ---------- Post-call recap (shown when a 1:1 call ends) ----------

export function RecapForm({ name, onSave, onBook }: { name: string; onSave: (rating: number, notes: string) => void; onBook: () => void }) {
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  return (
    <div>
      <p className="text-center text-sm text-muted">How was your session with {name}?</p>
      <div className="mt-3 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="transition hover:scale-110">
            <Star className={cn('size-9', n <= rating ? 'fill-orange text-orange' : 'text-line-strong')} />
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {['Clear next steps', 'Great advice', 'Felt supported', 'Learned a lot'].map((t) => (
          <button key={t} onClick={() => setNotes((n) => (n.includes(t) ? n : `${n}${n ? ' · ' : ''}${t}`))} className="rounded-full border border-line-strong px-3 py-1.5 text-xs font-medium hover:border-orange">{t}</button>
        ))}
      </div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Private notes: what you discussed, action items…" className="mt-4 w-full resize-none rounded-xl border border-line-strong px-3.5 py-3 text-[15px] outline-none focus:border-orange focus:ring-2 focus:ring-orange/25" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={onBook}>Book follow-up</Button>
        <Button onClick={() => onSave(rating, notes.trim())}>Save recap</Button>
      </div>
    </div>
  );
}

// ---------- Incoming call (global overlay) ----------

export function IncomingCall() {
  const nav = useNavigate();
  const inc = useDb((d) => d.incoming);
  const from = useDb((d) => (d.incoming ? userById(d.incoming.fromId, d) : undefined));
  useEffect(() => {
    if (!inc) return;
    navigator.vibrate?.([300, 200, 300]);
  }, [inc]);
  if (!inc || !from) return null;
  return (
    <div className="navy-gradient fade-up fixed inset-0 z-[90] mx-auto flex max-w-[430px] flex-col items-center overflow-hidden px-6 pb-[max(40px,env(safe-area-inset-bottom))] pt-24 text-white" role="dialog" aria-label={`Incoming call from ${fullName(from)}`}>
      {from.photo && <img loading="lazy" decoding="async" src={from.photo} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-25 blur-2xl" />}
      <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-orange-2">Incoming {inc.kind} call</p>
      <div className="relative mt-10 grid place-items-center">
        <span className="ring-wave absolute size-36 rounded-full border-2 border-orange-2/60" />
        <span className="ring-wave absolute size-36 rounded-full border-2 border-white/30 [animation-delay:.7s]" />
        <Avatar user={from} size={144} />
      </div>
      <h1 className="font-display relative mt-8 text-center text-[29px] font-extrabold leading-tight">{fullName(from)}</h1>
      <p className="relative mt-1 text-white/70">{from.profile.classification} · {from.profile.affiliation}</p>
      <div className="relative mt-auto flex w-full justify-around">
        <button onClick={() => { answerIncoming(false); toast('Call declined'); }} className="flex flex-col items-center gap-2 text-[15px] font-medium">
          <span className="grid size-16 place-items-center rounded-full bg-danger shadow-lg"><PhoneOff className="size-7" /></span>Decline
        </button>
        <button onClick={() => { answerIncoming(true); nav(`/call/${from.id}?incoming=1${inc.kind === 'video' ? '&video=1' : ''}`); }} className="flex flex-col items-center gap-2 text-[15px] font-medium">
          <span className="grid size-16 animate-bounce place-items-center rounded-full bg-success shadow-lg">{inc.kind === 'video' ? <Video className="size-7" /> : <Phone className="size-7" />}</span>Accept
        </button>
      </div>
    </div>
  );
}

// ---------- Live room (group video) ----------

const CAPTIONS: Record<string, string[]> = {
  lr1: ['Welcome everyone! Drop your questions in the chat.', 'For your first internship, projects matter more than GPA.', 'Pick one language and go deep. Python is a great start.', 'Apply early: most summer roles open in September.'],
  lr2: ['Let’s warm up: tell me about a time you led a team.', 'Great start. Now add the result: what changed?', 'Remember STAR: Situation, Task, Action, Result.', 'Who wants to go next? Raise your hand.'],
};
const FLOATERS = ['👏', '❤️', '🔥', '💡', '🙌'];

export function LiveRoomPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const me = useMe()!;
  const room = useDb((d) => d.rooms.find((r) => r.id === id));
  const host = useDb((d) => (room ? userById(room.hostId, d) : undefined));
  const people = useDb((d) => (room ? room.participants.filter((p) => p !== me.id).map((p) => userById(p, d)!).filter(Boolean) : []));
  const [muted, setMuted] = useState(true);
  const [cam, setCam] = useState(false);
  const [hand, setHand] = useState(false);
  const [cc, setCc] = useState(true);
  const [line, setLine] = useState(0);
  const [secs, setSecs] = useState(0);
  const [floats, setFloats] = useState<{ id: number; e: string; x: number }[]>([]);
  const vid = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!room) return;
    joinRoom(room.id);
    return () => leaveRoom(room.id);
  }, [room?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    const c = setInterval(() => setLine((l) => l + 1), 4500);
    // Others react now and then.
    const f = setInterval(() => float(FLOATERS[Math.floor(Math.random() * FLOATERS.length)]), 3200);
    return () => { clearInterval(t); clearInterval(c); clearInterval(f); };
  }, []);
  useEffect(() => {
    if (!cam) return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: true }).then((s) => { stream = s; if (vid.current) vid.current.srcObject = s; }).catch(() => toast('Camera not available'));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [cam]);

  function float(e: string) {
    const f = { id: Date.now() + Math.random(), e, x: 10 + Math.random() * 70 };
    setFloats((xs) => [...xs, f]);
    setTimeout(() => setFloats((xs) => xs.filter((x) => x.id !== f.id)), 2600);
  }

  if (!room || !host) return null;
  if (!room.live) {
    return (
      <div className="min-h-app">
        <Header back title={room.title} />
        <p className="p-8 text-center text-muted">This session hasn’t started yet. It begins {fmtDate(room.start)} at {fmtTime(room.start)}.</p>
      </div>
    );
  }
  const captions = CAPTIONS[room.id] ?? ['Welcome to office hours!'];
  const tiles = people.slice(0, 5);
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col bg-[#0a1428] text-white">
      <header className="flex items-center gap-3 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))]">
        <span className="flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"><Radio className="size-3" /> Live</span>
        <div className="min-w-0 flex-1">
          <p className="font-display truncate font-bold">{room.title}</p>
          <p className="text-xs text-white/60">{mmss(secs)} · <Users className="inline size-3" /> {people.length + 2} here</p>
        </div>
      </header>
      <div className="relative flex-1 overflow-hidden px-3">
        <div className="relative h-[46%] overflow-hidden rounded-3xl">
          <img loading="lazy" decoding="async" src={host.photo ?? ''} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="flex h-4 items-end gap-0.5">{[0, 1, 2].map((i) => <span key={i} className="eq-bar w-1 rounded-full bg-orange-2" style={{ height: '100%', animationDelay: `${i * 0.15}s` }} />)}</span>
            <span className="text-sm font-semibold">{fullName(host)} · Host</span>
          </div>
        </div>
        <div className="mt-2 grid h-[calc(54%-8px-64px)] grid-cols-3 gap-2">
          <div className="relative overflow-hidden rounded-2xl bg-white/5">
            {cam ? <video ref={vid} autoPlay playsInline muted className="size-full -scale-x-100 object-cover" /> : <div className="grid size-full place-items-center"><Avatar user={me} size={52} /></div>}
            <span className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[11px] font-semibold">{muted && <MicOff className="size-3 text-danger" />}You {hand && '✋'}</span>
          </div>
          {tiles.map((u, i) => (
            <div key={u.id} className="relative overflow-hidden rounded-2xl bg-white/5">
              {i % 2 === 0 && u.photo ? <img loading="lazy" decoding="async" src={u.photo} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center"><Avatar user={u} size={52} /></div>}
              <span className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[11px] font-semibold drop-shadow"><MicOff className="size-3 text-white/70" />{u.profile.firstName}</span>
            </div>
          ))}
        </div>
        {cc && (
          <p key={line} className="fade-up absolute inset-x-6 bottom-20 rounded-xl bg-black/70 px-3 py-2 text-center text-sm backdrop-blur">
            <b className="text-orange-2">{host.profile.firstName}:</b> {captions[line % captions.length]}
          </p>
        )}
        <div className="pointer-events-none absolute inset-0">
          {floats.map((f) => <span key={f.id} className="absolute bottom-16 animate-[float-up_2.6s_ease-out_forwards] text-3xl" style={{ left: `${f.x}%` }}>{f.e}</span>)}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 px-4 pt-2">
        {FLOATERS.map((e) => <button key={e} onClick={() => float(e)} className="grid size-10 place-items-center rounded-full bg-white/10 text-xl hover:bg-white/20">{e}</button>)}
      </div>
      <div className="grid grid-cols-5 gap-2 px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
        <RoomBtn label={muted ? 'Unmute' : 'Mute'} on={!muted} onClick={() => setMuted(!muted)}>{muted ? <MicOff /> : <Mic />}</RoomBtn>
        <RoomBtn label="Camera" on={cam} onClick={() => setCam(!cam)}>{cam ? <Video /> : <VideoOff />}</RoomBtn>
        <RoomBtn label="Hand" on={hand} onClick={() => { setHand(!hand); if (!hand) toast(`${host.profile.firstName} will call on you next`); }}><Hand /></RoomBtn>
        <RoomBtn label="Captions" on={cc} onClick={() => setCc(!cc)}><Captions /></RoomBtn>
        <button onClick={() => { toast(`Left ${room.title} · ${mmss(secs)}`); nav(-1); }} className="flex flex-col items-center gap-1 text-[11px]">
          <span className="grid size-12 place-items-center rounded-full bg-danger"><PhoneOff className="size-5" /></span>Leave
        </button>
      </div>
    </div>
  );
}

function RoomBtn({ label, on, onClick, children }: { label: string; on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button aria-label={label} onClick={onClick} className="flex flex-col items-center gap-1 text-[11px]">
      <span className={cn('grid size-12 place-items-center rounded-full transition [&_svg]:size-5', on ? 'bg-white text-navy' : 'bg-white/12 bg-white/10')}>{children}</span>
      {label}
    </button>
  );
}
