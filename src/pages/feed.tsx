import {
  Bell, Bookmark, BookOpen, CalendarCheck, CalendarDays, ChevronRight, ExternalLink, HelpCircle, ImagePlus, LifeBuoy, MapPin, Megaphone,
  MessageCircle, MoreHorizontal, Pencil, Plus, Search, Send, Share2, Sparkles, ThumbsUp, Trash2, Trophy, Type, UserPlus, X, Briefcase, Flag, Ban, UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { Avatar, Button, ChipSingle, Field, Input, Sheet, TextArea, toast } from '@/components/ui';
import {
  POST_MAX, activeStories, addComment, addStory, block, createPost, deleteComment, deletePost, discoverable, editPost, feed, fullName, markStorySeen,
  matchScore, react, sendRequest, toggleRsvp, toggleSave, userById,
} from '@/lib/api';
import { cn, fmtDate, fmtTime, timeAgo, useDb, useMe } from '@/lib/store';
import type { Post, PostKind, ReactionType, Story, User } from '@/lib/types';
import { ReportSheet } from './profile';

// ---------- constants ----------

export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'applause', emoji: '👏', label: 'Applause' },
  { type: 'insightful', emoji: '💡', label: 'Insightful' },
  { type: 'celebrate', emoji: '🎉', label: 'Celebrate' },
  { type: 'support', emoji: '🤝', label: 'Support' },
];
const R = Object.fromEntries(REACTIONS.map((r) => [r.type, r])) as Record<ReactionType, (typeof REACTIONS)[number]>;

const KINDS: { id: PostKind; label: string; icon: typeof Trophy; cls: string; prompt: string }[] = [
  { id: 'update', label: 'Update', icon: Megaphone, cls: 'border-navy/20 bg-navy/5 text-navy', prompt: 'What’s new with you?' },
  { id: 'question', label: 'Question', icon: HelpCircle, cls: 'border-[#2f5f95]/30 bg-[#2f5f95]/10 text-[#2f5f95]', prompt: 'Ask the APEX community anything…' },
  { id: 'win', label: 'Win', icon: Trophy, cls: 'border-orange/40 bg-orange-fill text-orange-text', prompt: 'Share a win, big or small 🎉' },
  { id: 'opportunity', label: 'Opportunity', icon: Briefcase, cls: 'border-success/30 bg-success/10 text-success', prompt: 'Share an internship, job or scholarship…' },
  { id: 'event', label: 'Event', icon: CalendarDays, cls: 'border-[#7a3a9a]/30 bg-[#7a3a9a]/10 text-[#7a3a9a]', prompt: 'Tell people about your event…' },
];
const KIND = Object.fromEntries(KINDS.map((k) => [k.id, k])) as Record<PostKind, (typeof KINDS)[number]>;

const FILTERS: { id: 'all' | PostKind | 'saved'; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'win', label: '🏆 Wins' }, { id: 'question', label: '❓ Questions' },
  { id: 'opportunity', label: '💼 Opportunities' }, { id: 'event', label: '📅 Events' }, { id: 'saved', label: '🔖 Saved' },
];

export const STORY_THEMES = [
  'linear-gradient(150deg,#264672 0%,#2F5A84 55%,#3C6A97 140%)',
  'linear-gradient(150deg,#3C6A97 0%,#5A86B1 50%,#E0457B 120%)',
  'linear-gradient(150deg,#0F4C5C 0%,#2F5A84 70%)',
  'linear-gradient(150deg,#5A2D82 0%,#264672 100%)',
];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

// ---------- page ----------

export function Feed() {
  const me = useMe()!;
  const nav = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const posts = useDb((d) => feed(d, filter));
  const unread = useDb((d) => d.notifications.filter((n) => n.userId === d.sessionUserId && !n.read).length);
  const requests = useDb((d) => d.connections.filter((c) => c.to === d.sessionUserId && c.status === 'requested').length);

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="flex h-16 items-center gap-2 px-4">
          <img loading="lazy" decoding="async" src={BRAND.icon} alt="" className="size-10 rounded-full object-contain" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="font-display truncate text-lg font-extrabold">APEX Community</p>
            <p className="truncate text-[11px] font-medium text-orange-text">Mentoring. Moments. Matter.</p>
          </div>
          <HeaderBtn label="Search" onClick={() => nav('/search')}><Search className="size-5" /></HeaderBtn>
          <HeaderBtn label="Requests" onClick={() => nav('/connections')} badge={requests}><UserPlus className="size-5" /></HeaderBtn>
          <HeaderBtn label="Notifications" onClick={() => nav('/notifications')} badge={unread}><Bell className="size-5" /></HeaderBtn>
        </div>
      </header>

      <div className="space-y-4 px-4 py-4">
        <MomentsBar />
        <WelcomeCard user={me} />
        <LiveNow />
        <Composer />
        <div role="radiogroup" aria-label="Filter posts" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((f) => (
            <button key={f.id} role="radio" aria-checked={filter === f.id} onClick={() => setFilter(f.id)}
              className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition', filter === f.id ? 'border-navy bg-navy text-white' : 'border-line-strong bg-surface text-muted hover:text-text')}>
              {f.label}
            </button>
          ))}
        </div>
        {posts.length ? (
          <ul className="space-y-4">
            {posts.map((p, i) => (
              <li key={p.id}>
                <PostCard post={p} />
                {i === 1 && filter === 'all' && <div className="mt-4"><MentorSpotlight /></div>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-line-strong px-6 py-12 text-center">
            <Sparkles className="mx-auto size-8 text-orange-text" />
            <p className="mt-3 font-semibold">{filter === 'saved' ? 'Nothing saved yet' : 'Quiet in here'}</p>
            <p className="mt-1 text-sm text-muted">{filter === 'saved' ? 'Tap the bookmark on any post to keep it here.' : 'Be the first to share something.'}</p>
          </div>
        )}
        {posts.length > 0 && (
          <div className="flex items-center gap-3 py-2 text-xs font-medium text-faint">
            <span className="h-px flex-1 bg-line" />
            <img loading="lazy" decoding="async" src={BRAND.icon} alt="" className="size-6 object-contain opacity-80" />
            You’re all caught up
            <span className="h-px flex-1 bg-line" />
          </div>
        )}
        <a href={`tel:${BRAND.crisisLine.phone}`} className="flex items-center gap-3 rounded-2xl border border-line bg-bg-soft p-3.5">
          <LifeBuoy className="size-5 shrink-0 text-orange-text" />
          <span className="text-xs text-muted">Going through something? <b className="text-text">{BRAND.crisisLine.label}</b>: call or text {BRAND.crisisLine.phone}, any time.</span>
        </a>
      </div>
    </div>
  );
}

function HeaderBtn({ label, onClick, badge = 0, children }: { label: string; onClick: () => void; badge?: number; children: React.ReactNode }) {
  return (
    <button aria-label={label} onClick={onClick} className="relative grid size-10 place-items-center rounded-full border border-line bg-bg-soft text-navy hover:border-line-strong">
      {children}
      {badge > 0 && <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-orange px-1 text-[10px] font-bold text-white ring-2 ring-surface">{badge}</span>}
    </button>
  );
}

// ---------- welcome card ----------

function WelcomeCard({ user }: { user: User }) {
  const nav = useNavigate();
  const next = useDb((d) =>
    d.meetings
      .filter((m) => (m.organizer === user.id || m.invitee === user.id) && m.status === 'accepted' && m.end > new Date().toISOString())
      .sort((a, b) => a.start.localeCompare(b.start))[0],
  );
  const other = useDb((d) => (next ? userById(next.organizer === user.id ? next.invitee : next.organizer, d) : undefined));
  const connections = useDb((d) => d.connections.filter((c) => c.status === 'connected' && (c.from === user.id || c.to === user.id)).length);
  return (
    <section className="navy-gradient relative overflow-hidden rounded-3xl p-5 text-white">
      <div className="brand-gradient absolute -right-10 -top-10 size-40 rounded-full opacity-30 blur-2xl" aria-hidden />
      <div className="relative">
        <p className="text-sm text-white/70">{greeting()},</p>
        <p className="font-display text-2xl font-extrabold">{user.profile.firstName} 👋</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button onClick={() => nav(next ? '/meetings' : '/discover')} className="col-span-2 flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-left backdrop-blur hover:bg-white/15">
            <span className="grid size-10 place-items-center rounded-xl bg-orange text-white"><CalendarCheck className="size-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-orange-2">Next up</span>
              <span className="block truncate text-sm font-semibold">
                {next && other ? `${next.title} with ${other.profile.firstName}` : 'No meetings yet: find a mentor'}
              </span>
              {next && <span className="block text-xs text-white/70">{fmtDate(next.start)} · {fmtTime(next.start)}</span>}
            </span>
            <ChevronRight className="size-4 text-white/60" />
          </button>
          <QuickAction icon={<UserPlus />} label="Find a mentor" onClick={() => nav('/discover')} />
          <QuickAction icon={<CalendarDays />} label="Book a meeting" onClick={() => nav('/meetings')} />
          <QuickAction icon={<BookOpen />} label="Resources" onClick={() => nav('/resources')} />
          <QuickAction icon={<MessageCircle />} label={`${connections} connection${connections === 1 ? '' : 's'}`} onClick={() => nav('/messages')} />
        </div>
      </div>
    </section>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-left text-[13px] font-semibold hover:bg-white/15 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-orange-2">
      {icon}<span className="truncate">{label}</span>
    </button>
  );
}

// ---------- live office hours ----------

function LiveNow() {
  const nav = useNavigate();
  const rooms = useDb((d) => d.rooms.filter((r) => r.live));
  const hosts = useDb((d) => rooms.map((r) => userById(r.hostId, d)!).filter(Boolean));
  if (!rooms.length) return null;
  return (
    <button onClick={() => nav('/messages?tab=calls')} className="shadow-premium flex w-full items-center gap-3 rounded-3xl border border-line/70 bg-surface p-3.5 text-left">
      <span className="flex -space-x-3">
        {hosts.slice(0, 3).map((u) => <span key={u.id} className="rounded-full ring-[3px] ring-surface"><Avatar user={u} size={40} /></span>)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-danger">
          <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-danger" /></span>
          {rooms.length} live now
        </span>
        <span className="block truncate text-sm font-semibold">{rooms[0].title}{rooms.length > 1 && ` + ${rooms.length - 1} more`}</span>
        <span className="block truncate text-xs text-faint">Mentor office hours · drop in on video</span>
      </span>
      <span className="brand-gradient rounded-full px-3.5 py-1.5 text-xs font-bold text-white">Join</span>
    </button>
  );
}

// ---------- mentor spotlight ----------

function MentorSpotlight() {
  const me = useMe()!;
  const nav = useNavigate();
  const people = useDb((d) => discoverable(me, d))
    .map((u) => ({ u, ...matchScore(me, u) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  const [sent, setSent] = useState<string[]>([]);
  if (!people.length) return null;
  return (
    <section className="-mx-4 bg-bg-soft py-4">
      <div className="mb-3 flex items-center justify-between px-4">
        <div>
          <p className="flex items-center gap-1.5 font-bold"><Sparkles className="size-4 text-orange-text" /> Picked for you</p>
          <p className="text-xs text-faint">Based on your interests, college and languages</p>
        </div>
        <Link to="/discover" className="text-sm font-semibold text-orange-text">See all</Link>
      </div>
      <ul className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
        {people.map(({ u, score, reasons }) => (
          <li key={u.id} className="w-44 shrink-0 overflow-hidden rounded-2xl border border-line bg-surface">
            <button onClick={() => nav(`/member/${u.id}`)} className="block w-full text-left">
              <div className="navy-gradient relative flex h-20 justify-center">
                <span className="absolute right-2 top-2 rounded-full bg-orange px-2 py-0.5 text-[11px] font-extrabold text-white">{score}% match</span>
                <div className="absolute -bottom-8 rounded-full ring-4 ring-surface"><Avatar user={u} size={64} /></div>
              </div>
              <div className="px-3 pb-2 pt-10 text-center">
                <p className="truncate font-bold">{fullName(u)}</p>
                <p className="truncate text-xs text-muted">{u.profile.classification} · {u.profile.affiliation}</p>
                <p className="mt-1.5 line-clamp-1 text-[11px] text-faint">{reasons.slice(0, 2).join(' · ') || u.profile.college}</p>
              </div>
            </button>
            <div className="px-3 pb-3">
              <Button size="sm" variant={sent.includes(u.id) ? 'outline' : 'primary'} className="w-full" disabled={sent.includes(u.id)}
                onClick={() => { sendRequest(u.id); setSent([...sent, u.id]); toast(`Request sent to ${u.profile.firstName}`); }}>
                {sent.includes(u.id) ? 'Requested' : <><Plus className="size-4" /> Connect</>}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------- moments (stories) ----------

function MomentsBar() {
  const me = useMe()!;
  const stories = useDb((d) => activeStories(d));
  const users = useDb((d) => d.users);
  const [viewing, setViewing] = useState<{ list: Story[]; index: number } | null>(null);
  const [adding, setAdding] = useState(false);
  // One bubble per author, unseen first.
  const byAuthor = new Map<string, Story[]>();
  for (const s of stories) (byAuthor.get(s.authorId) ?? byAuthor.set(s.authorId, []).get(s.authorId)!).push(s);
  const mine = byAuthor.get(me.id);
  const others = [...byAuthor.entries()].filter(([id]) => id !== me.id)
    .map(([id, list]) => ({ user: users.find((u) => u.id === id)!, list: [...list].reverse(), seen: list.every((s) => s.seenBy.includes(me.id)) }))
    .filter((x) => x.user)
    .sort((a, b) => Number(a.seen) - Number(b.seen));

  return (
    <section aria-label="Moments" className="-mx-4">
      <ul className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
        <li className="relative w-[70px] shrink-0">
          <button onClick={() => (mine ? setViewing({ list: [...mine].reverse(), index: 0 }) : setAdding(true))} className="flex w-full flex-col items-center gap-1.5">
            <Ring seen={!mine} dashed={!mine}><Avatar user={me} size={58} /></Ring>
            <span className="w-full truncate text-center text-[11px] font-medium">Your moment</span>
          </button>
          <button onClick={() => setAdding(true)} aria-label="Add a moment" className="brand-gradient absolute right-0.5 top-11 grid size-6 place-items-center rounded-full border-2 border-surface text-white">
            <Plus className="size-3.5" strokeWidth={3} />
          </button>
        </li>
        {others.map(({ user, list, seen }) => (
          <li key={user.id} className="w-[70px] shrink-0">
            <button onClick={() => setViewing({ list, index: 0 })} className="flex w-full flex-col items-center gap-1.5">
              <Ring seen={seen}><Avatar user={user} size={58} /></Ring>
              <span className={cn('w-full truncate text-center text-[11px]', seen ? 'text-faint' : 'font-semibold')}>{user.profile.firstName}</span>
            </button>
          </li>
        ))}
      </ul>
      {viewing && <StoryViewer list={viewing.list} start={viewing.index} onClose={() => setViewing(null)} />}
      <AddMomentSheet open={adding} onClose={() => setAdding(false)} />
    </section>
  );
}

function Ring({ seen, dashed, children }: { seen: boolean; dashed?: boolean; children: React.ReactNode }) {
  return (
    <span className={cn('grid place-items-center rounded-full p-[3px]', dashed ? 'border-2 border-dashed border-line-strong' : seen ? 'bg-line-strong' : 'brand-gradient')}>
      <span className="rounded-full bg-surface p-[2px]">{children}</span>
    </span>
  );
}

function StoryViewer({ list, start, onClose }: { list: Story[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const story = list[i];
  const author = useDb((d) => userById(story?.authorId ?? '', d));
  const nav = useNavigate();

  useEffect(() => {
    if (story) markStorySeen(story.id);
    setProgress(0);
  }, [story]);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setProgress((p) => p + 2), 100); // 5s per moment
    return () => clearInterval(t);
  }, [paused, i]);
  useEffect(() => {
    if (progress < 100) return;
    if (i < list.length - 1) setI(i + 1);
    else onClose();
  }, [progress, i, list.length, onClose]);

  if (!story || !author) return null;
  return (
    <div className="fixed inset-0 z-[70] mx-auto flex max-w-[430px] flex-col bg-black" role="dialog" aria-label={`${author.profile.firstName}'s moment`}>
      <div className="absolute inset-x-0 top-0 z-10 space-y-3 bg-gradient-to-b from-black/50 to-transparent px-3 pb-6 pt-3">
        <div className="flex gap-1">
          {list.map((s, k) => (
            <span key={s.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
              <span className="block h-full bg-white" style={{ width: `${k < i ? 100 : k === i ? Math.min(progress, 100) : 0}%` }} />
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2.5 text-white">
          <button onClick={() => { onClose(); nav(author.id === story.authorId && author.id !== 'me' ? `/member/${author.id}` : '/profile'); }} className="flex flex-1 items-center gap-2.5 text-left">
            <Avatar user={author} size={36} />
            <span><span className="block text-sm font-semibold">{fullName(author)}</span><span className="block text-xs text-white/70">{timeAgo(story.createdAt)}</span></span>
          </button>
          <button aria-label="Close" onClick={onClose} className="grid size-10 place-items-center rounded-full hover:bg-white/10"><X className="size-6" /></button>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-center overflow-hidden"
        style={story.image ? undefined : { background: STORY_THEMES[story.theme ?? 0] }}
        onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)}>
        {story.image ? (
          <img loading="lazy" decoding="async" src={story.image} alt="" className="max-h-full w-full object-contain" />
        ) : (
          <>
            <img loading="lazy" decoding="async" src={BRAND.icon} alt="" className="absolute bottom-24 size-14 rounded-full bg-white/90 object-contain p-1 opacity-90" />
            <p className="px-8 text-center text-[26px] font-extrabold leading-snug text-white drop-shadow">{story.text}</p>
          </>
        )}
        {story.image && story.text && <p className="absolute bottom-24 mx-6 rounded-2xl bg-black/50 px-4 py-2 text-center text-white">{story.text}</p>}
        <button aria-label="Previous" className="absolute inset-y-0 left-0 w-1/3" onClick={() => (i > 0 ? setI(i - 1) : setProgress(0))} />
        <button aria-label="Next" className="absolute inset-y-0 right-0 w-1/3" onClick={() => setProgress(100)} />
      </div>
      <p className="py-4 text-center text-[11px] text-white/50">{BRAND.appName} Moments · disappear after 24 hours</p>
    </div>
  );
}

function AddMomentSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState('');
  const [theme, setTheme] = useState(0);
  const [image, setImage] = useState<string>();
  const input = useRef<HTMLInputElement>(null);
  const reset = () => { setText(''); setImage(undefined); setTheme(0); };
  return (
    <Sheet open={open} onClose={onClose} title="Share a moment">
      <div className="relative mx-auto mb-4 grid aspect-[9/14] w-48 place-items-center overflow-hidden rounded-2xl" style={image ? { background: '#000' } : { background: STORY_THEMES[theme] }}>
        {image ? <img loading="lazy" decoding="async" src={image} alt="" className="size-full object-cover" /> : (
          <p className="px-4 text-center text-lg font-extrabold leading-snug text-white">{text || 'Type something inspiring…'}</p>
        )}
        {image && text && <p className="absolute bottom-3 mx-2 rounded-lg bg-black/50 px-2 py-1 text-center text-xs text-white">{text}</p>}
      </div>
      <Input value={text} onChange={(e) => setText(e.target.value.slice(0, 120))} placeholder={image ? 'Add a caption (optional)' : 'What’s your moment?'} />
      <div className="mt-3 flex items-center gap-2">
        {!image && STORY_THEMES.map((t, k) => (
          <button key={k} aria-label={`Theme ${k + 1}`} onClick={() => setTheme(k)} className={cn('size-9 rounded-full', theme === k && 'ring-2 ring-orange ring-offset-2')} style={{ background: t }} />
        ))}
        <button onClick={() => (image ? setImage(undefined) : input.current?.click())} className="ml-auto flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-2 text-sm font-semibold">
          {image ? <><Type className="size-4" /> Text instead</> : <><ImagePlus className="size-4" /> Photo</>}
        </button>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) compress(f, 1080).then(setImage); }} />
      </div>
      <Button size="lg" className="mt-4" disabled={!image && !text.trim()} onClick={() => {
        addStory({ image, text: text.trim() || undefined, theme });
        toast('Moment shared. It disappears after 24 hours.');
        reset();
        onClose();
      }}>Share moment</Button>
    </Sheet>
  );
}

/** Resize an image file to a JPEG data URL (keeps local storage small). */
function compress(f: File, max: number): Promise<string> {
  return new Promise((res, rej) => {
    if (!f.type.startsWith('image/')) return rej(toast('Please choose an image'));
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = img.width * s;
      c.height = img.height * s;
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.8));
    };
    img.src = URL.createObjectURL(f);
  });
}

// ---------- composer ----------

function Composer() {
  const me = useMe()!;
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PostKind>('update');
  const start = (k: PostKind) => { setKind(k); setOpen(true); };
  return (
    <section className="shadow-premium rounded-3xl border border-line/70 bg-surface p-3.5">
      <div className="flex items-center gap-3">
        <Avatar user={me} size={42} />
        <button onClick={() => start('update')} className="h-11 flex-1 rounded-full border border-line-strong bg-bg-soft px-4 text-left text-[15px] text-faint hover:border-navy/40">
          Share a win, ask a question…
        </button>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {(['win', 'question', 'opportunity', 'event'] as const).map((k) => {
          const K = KIND[k];
          return (
            <button key={k} onClick={() => start(k)} className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold text-muted hover:bg-bg-soft">
              <span className={cn('grid size-8 place-items-center rounded-full border', K.cls)}><K.icon className="size-4" /></span>
              {K.label}
            </button>
          );
        })}
      </div>
      <ComposerSheet key={String(open) + kind} open={open} onClose={() => setOpen(false)} initialKind={kind} />
    </section>
  );
}

function ComposerSheet({ open, onClose, initialKind }: { open: boolean; onClose: () => void; initialKind: PostKind }) {
  const me = useMe()!;
  const [kind, setKind] = useState<PostKind>(initialKind);
  const [body, setBody] = useState('');
  const [image, setImage] = useState<string>();
  const [extra, setExtra] = useState({ title: '', date: '', time: '', place: '', link: '', deadline: '' });
  const input = useRef<HTMLInputElement>(null);
  const needTitle = kind === 'event' || kind === 'opportunity';
  const ok = body.trim() && (!needTitle || extra.title.trim()) && (kind !== 'event' || extra.date);
  const submit = () => {
    createPost({
      kind, body: body.trim(), image,
      ...(needTitle ? { title: extra.title.trim() } : {}),
      ...(kind === 'event' ? { when: new Date(`${extra.date}T${extra.time || '12:00'}`).toISOString(), place: extra.place.trim() } : {}),
      ...(kind === 'opportunity' ? { link: extra.link.trim(), deadline: extra.deadline ? new Date(`${extra.deadline}T23:59`).toISOString() : undefined } : {}),
    });
    toast(kind === 'win' ? 'Win shared! 🎉' : 'Posted');
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="Create post">
      <div className="mb-3 flex items-center gap-3">
        <Avatar user={me} size={40} />
        <div><p className="font-semibold">{fullName(me)}</p><p className="text-xs text-faint">Posting to {BRAND.appName} community</p></div>
      </div>
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        {KINDS.map((k) => (
          <button key={k.id} onClick={() => setKind(k.id)} className={cn('flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold', kind === k.id ? k.cls + ' ring-2 ring-current/20' : 'border-line-strong text-muted')}>
            <k.icon className="size-4" /> {k.label}
          </button>
        ))}
      </div>
      {needTitle && (
        <Field label={kind === 'event' ? 'Event name' : 'Role or scholarship'} required>
          <Input value={extra.title} onChange={(e) => setExtra({ ...extra, title: e.target.value })} placeholder={kind === 'event' ? 'e.g. APEX Study Night' : 'e.g. Marketing Intern, Spring'} />
        </Field>
      )}
      {kind === 'event' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Date" required><Input type="date" value={extra.date} onChange={(e) => setExtra({ ...extra, date: e.target.value })} /></Field>
          <Field label="Time"><Input type="time" value={extra.time} onChange={(e) => setExtra({ ...extra, time: e.target.value })} /></Field>
          <div className="col-span-2"><Field label="Where"><Input value={extra.place} onChange={(e) => setExtra({ ...extra, place: e.target.value })} placeholder="Room, building or Zoom" /></Field></div>
        </div>
      )}
      {kind === 'opportunity' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Apply by"><Input type="date" value={extra.deadline} onChange={(e) => setExtra({ ...extra, deadline: e.target.value })} /></Field>
          <Field label="Link"><Input value={extra.link} onChange={(e) => setExtra({ ...extra, link: e.target.value })} placeholder="https://" /></Field>
        </div>
      )}
      <TextArea value={body} onChange={(e) => setBody(e.target.value)} max={POST_MAX} rows={5} placeholder={KIND[kind].prompt} autoFocus />
      {image && (
        <div className="relative mt-2 overflow-hidden rounded-2xl">
          <img loading="lazy" decoding="async" src={image} alt="" className="max-h-64 w-full object-cover" />
          <button aria-label="Remove photo" onClick={() => setImage(undefined)} className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/60 text-white"><X className="size-4" /></button>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => input.current?.click()} className="flex items-center gap-1.5 rounded-full border border-line-strong px-3 py-2 text-sm font-semibold"><ImagePlus className="size-4 text-orange-text" /> Photo</button>
        <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) compress(f, 1280).then(setImage); }} />
        <Button className="ml-auto" disabled={!ok} onClick={submit}><Send className="size-4" /> Post</Button>
      </div>
    </Sheet>
  );
}

// ---------- post card ----------

export function PostCard({ post }: { post: Post }) {
  const me = useMe()!;
  const nav = useNavigate();
  const author = useDb((d) => userById(post.authorId, d));
  const comments = useDb((d) => d.comments.filter((c) => c.postId === post.id));
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [picker, setPicker] = useState(false);
  const [draft, setDraft] = useState('');
  if (!author) return null;
  const mine = author.id === me.id;
  const K = KIND[post.kind];
  const mineReaction = post.reactions[me.id];
  const counts = Object.values(post.reactions).reduce<Record<string, number>>((a, r) => ((a[r] = (a[r] ?? 0) + 1), a), {});
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([r]) => R[r as ReactionType].emoji);
  const total = Object.keys(post.reactions).length;
  const long = post.body.length > 240;
  const saved = post.saves.includes(me.id);
  const going = post.rsvps.includes(me.id);
  const profileLink = mine ? '/profile' : `/member/${author.id}`;

  const share = async () => {
    const url = `${window.location.origin}/home`;
    try {
      if (navigator.share) await navigator.share({ title: `${fullName(author)} on ${BRAND.appName}`, text: post.title ?? post.body.slice(0, 80), url });
      else { await navigator.clipboard.writeText(url); toast('Link copied'); }
    } catch { /* cancelled */ }
  };

  return (
    <article className={cn('shadow-premium overflow-hidden rounded-3xl border bg-surface', post.kind === 'win' ? 'border-orange/40' : 'border-line/70')}>
      {post.kind === 'win' && <div className="brand-gradient h-1.5" aria-hidden />}
      <header className="flex items-start gap-3 p-4 pb-2.5">
        <Link to={profileLink}><Avatar user={author} size={44} /></Link>
        <div className="min-w-0 flex-1">
          <Link to={profileLink} className="block truncate text-[15px] font-semibold hover:text-orange-text">{mine ? `${fullName(author)} (you)` : fullName(author)}</Link>
          <p className="truncate text-xs text-muted">{author.profile.classification} · {author.profile.affiliation}</p>
          <p className="text-[11px] text-faint">{timeAgo(post.createdAt)}{post.editedAt && ' · Edited'}</p>
        </div>
        <span className={cn('flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold', K.cls)}><K.icon className="size-3.5" />{K.label}</span>
        <button aria-label="Post options" onClick={() => setMenu(true)} className="-mr-2 grid size-9 place-items-center rounded-full text-muted hover:bg-bg-soft"><MoreHorizontal className="size-5" /></button>
      </header>

      {post.kind === 'event' && post.when && (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl bg-[#7a3a9a]/[0.07] p-3">
          <div className="w-14 shrink-0 overflow-hidden rounded-xl bg-surface text-center shadow-sm">
            <p className="bg-[#7a3a9a] py-0.5 text-[10px] font-bold uppercase text-white">{new Date(post.when).toLocaleDateString(undefined, { month: 'short' })}</p>
            <p className="py-1 text-xl font-extrabold">{new Date(post.when).getDate()}</p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{post.title}</p>
            <p className="text-xs text-muted">{fmtDate(post.when)} · {fmtTime(post.when)}</p>
            {post.place && <p className="flex items-center gap-1 truncate text-xs text-muted"><MapPin className="size-3" />{post.place}</p>}
          </div>
          <Button size="sm" variant={going ? 'outline' : 'primary'} onClick={() => { toggleRsvp(post.id); toast(going ? 'RSVP removed' : 'You’re going! 🎉'); }}>
            {going ? '✓ Going' : 'RSVP'}
          </Button>
        </div>
      )}
      {post.kind === 'opportunity' && post.title && (
        <div className="mx-4 mb-3 rounded-2xl border border-success/25 bg-success/[0.06] p-3">
          <p className="flex items-center gap-1.5 font-bold"><Briefcase className="size-4 text-success" />{post.title}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted">
            {post.deadline && <span>Apply by <b className="text-text">{fmtDate(post.deadline)}</b></span>}
            {post.link && <a href={post.link} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 font-semibold text-success">Apply <ExternalLink className="size-3" /></a>}
          </div>
        </div>
      )}

      {editing ? (
        <div className="px-4 pb-3">
          <TextArea value={draft} onChange={(e) => setDraft(e.target.value)} max={POST_MAX} rows={4} autoFocus />
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button size="sm" disabled={!draft.trim()} onClick={() => { editPost(post.id, draft.trim()); setEditing(false); toast('Post updated'); }}>Save</Button>
          </div>
        </div>
      ) : (
        post.body && (
          <p className={cn('whitespace-pre-wrap break-words px-4 pb-3 leading-relaxed', post.kind === 'win' && post.body.length < 200 ? 'text-[17px] font-semibold' : 'text-[15px]')}>
            {long && !expanded ? `${post.body.slice(0, 220).trimEnd()}… ` : post.body}
            {long && !expanded && <button onClick={() => setExpanded(true)} className="font-semibold text-orange-text">see more</button>}
          </p>
        )
      )}
      {post.image && <img loading="lazy" decoding="async" src={post.image} alt="" className="max-h-[420px] w-full object-cover" />}

      <div className="flex min-h-9 items-center justify-between px-4 py-2 text-xs text-muted">
        {total > 0 ? (
          <span className="flex items-center gap-1.5"><span className="flex -space-x-1">{top.map((e) => <span key={e} className="grid size-5 place-items-center rounded-full bg-surface text-[13px] ring-2 ring-surface">{e}</span>)}</span>{total}</span>
        ) : <span />}
        <span className="flex gap-3">
          {post.kind === 'event' && post.rsvps.length > 0 && <span>{post.rsvps.length} going</span>}
          {comments.length > 0 && <button onClick={() => setShowComments(!showComments)} className="hover:underline">{comments.length} comment{comments.length === 1 ? '' : 's'}</button>}
        </span>
      </div>

      <div className="relative grid grid-cols-4 border-t border-line px-1">
        {picker && (
          <div className="fade-up absolute bottom-[calc(100%+4px)] left-2 z-20 flex gap-0.5 rounded-full border border-line bg-surface px-2 py-1.5 shadow-xl" role="menu">
            {REACTIONS.map((r) => (
              <button key={r.type} title={r.label} aria-label={r.label} onClick={() => { react(post.id, mineReaction === r.type ? null : r.type); setPicker(false); navigator.vibrate?.(10); }}
                className={cn('grid size-10 place-items-center rounded-full text-2xl transition hover:-translate-y-1 hover:scale-125', mineReaction === r.type && 'bg-orange-fill')}>{r.emoji}</button>
            ))}
          </div>
        )}
        <ActionBtn onClick={() => (mineReaction ? react(post.id, null) : setPicker(!picker))} onLongPress={() => setPicker(true)} active={!!mineReaction}>
          {mineReaction ? <span className="text-lg leading-none">{R[mineReaction].emoji}</span> : <ThumbsUp className="size-[18px]" />}
          {mineReaction ? R[mineReaction].label : 'React'}
        </ActionBtn>
        <ActionBtn onClick={() => setShowComments(!showComments)}><MessageCircle className="size-[18px]" />Comment</ActionBtn>
        <ActionBtn onClick={() => { toggleSave(post.id); toast(saved ? 'Removed from saved' : 'Saved'); }} active={saved}><Bookmark className={cn('size-[18px]', saved && 'fill-current')} />{saved ? 'Saved' : 'Save'}</ActionBtn>
        <ActionBtn onClick={share}><Share2 className="size-[18px]" />Share</ActionBtn>
      </div>

      {showComments && (
        <div className="space-y-3 border-t border-line bg-bg-soft/60 px-4 py-3">
          {comments.map((c) => <CommentRow key={c.id} id={c.id} authorId={c.authorId} body={c.body} createdAt={c.createdAt} mine={c.authorId === me.id} />)}
          <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (!draft.trim() || editing) return; addComment(post.id, draft.trim()); setDraft(''); }}>
            <Avatar user={me} size={32} />
            <input value={editing ? '' : draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a comment…" maxLength={500}
              className="h-10 flex-1 rounded-full border border-line-strong bg-surface px-4 text-sm outline-none focus:border-orange" />
            <button type="submit" aria-label="Send comment" disabled={!draft.trim() || editing} className="grid size-10 place-items-center rounded-full bg-navy text-white disabled:opacity-40"><Send className="size-4" /></button>
          </form>
        </div>
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} title={mine ? 'Your post' : `Post by ${author.profile.firstName}`}>
        <div className="space-y-1">
          {mine ? (
            <>
              <MenuRow icon={<Pencil />} label="Edit post" onClick={() => { setDraft(post.body); setEditing(true); setMenu(false); }} />
              <MenuRow icon={<Trash2 />} label="Delete post" danger onClick={() => { deletePost(post.id); setMenu(false); toast('Post deleted'); }} />
            </>
          ) : (
            <>
              <MenuRow icon={<UserRound />} label={`View ${author.profile.firstName}’s profile`} onClick={() => nav(`/member/${author.id}`)} />
              <MenuRow icon={<Bookmark />} label={saved ? 'Remove from saved' : 'Save post'} onClick={() => { toggleSave(post.id); setMenu(false); }} />
              <MenuRow icon={<Flag />} label="Report post" onClick={() => { setMenu(false); setReporting(true); }} />
              <MenuRow icon={<Ban />} label={`Block ${author.profile.firstName}`} danger onClick={() => { block(author.id); setMenu(false); toast(`${author.profile.firstName} is blocked`); }} />
            </>
          )}
        </div>
      </Sheet>
      <ReportSheet open={reporting} onClose={() => setReporting(false)} user={author} />
    </article>
  );
}

function ActionBtn({ onClick, onLongPress, active, children }: { onClick: () => void; onLongPress?: () => void; active?: boolean; children: React.ReactNode }) {
  const timer = useRef<number>(undefined);
  return (
    <button
      onClick={onClick}
      onPointerDown={() => { if (onLongPress) timer.current = window.setTimeout(onLongPress, 450); }}
      onPointerUp={() => clearTimeout(timer.current)}
      onPointerLeave={() => clearTimeout(timer.current)}
      className={cn('flex h-11 min-w-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl px-1 text-[13px] font-semibold hover:bg-bg-soft', active ? 'text-orange-text' : 'text-muted')}
    >
      {children}
    </button>
  );
}

function MenuRow({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-medium hover:bg-bg-soft [&_svg]:size-5', danger && 'text-danger')}>{icon}{label}</button>
  );
}

function CommentRow({ id, authorId, body, createdAt, mine }: { id: string; authorId: string; body: string; createdAt: string; mine: boolean }) {
  const author = useDb((d) => userById(authorId, d));
  if (!author) return null;
  return (
    <div className="flex gap-2.5">
      <Link to={mine ? '/profile' : `/member/${author.id}`}><Avatar user={author} size={32} /></Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md bg-surface px-3 py-2">
          <p className="text-[13px] font-semibold">{fullName(author)} <span className="font-normal text-faint">· {author.profile.classification}</span></p>
          <p className="whitespace-pre-wrap break-words text-sm">{body}</p>
        </div>
        <p className="mt-0.5 flex gap-3 pl-3 text-[11px] text-faint">
          {timeAgo(createdAt)}
          {mine && <button onClick={() => deleteComment(id)} className="font-semibold hover:text-danger">Delete</button>}
        </p>
      </div>
    </div>
  );
}

