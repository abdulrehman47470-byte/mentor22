import { Bell, Briefcase, ChevronRight, Clock, GraduationCap, UserPlus, RotateCcw, Search as SearchIcon, SlidersHorizontal, Sparkles, UserRound, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { L, fill } from '@/data/labels';
import { Avatar, Badge, Button, ChipMulti, Empty, Header, Input, Mark, Sheet } from '@/components/ui';
import { AFFILIATIONS, AGE_RANGES, AVAILABILITY, CLASSIFICATIONS, COLLEGES, COLLEGE_TYPES, COMMUNICATION, DESCRIBED_HAVING, DESCRIBES_ME, ETHNICITIES, GENDERS, LANGUAGES, MAJORS, MENTORING_INTERESTS, PRONOUNS, TRANSFER_TARGETS } from '@/data/options';
import { discoverable, fullName, isBlocked, matchScore, pass, profileCompleteness, resetPasses, sendRequest, statusBetween } from '@/lib/api';
import { cn, useDb, useMe } from '@/lib/store';
import type { User } from '@/lib/types';
import { galleryFor } from '@/data/media';

// ---------- filters ----------
export type Filters = {
  classification: string[]; affiliation: string[]; college: string[]; interests: string[]; availability: string[]; communication: string[]; ethnicity: string[]; languages: string[];
  ageRange: string[]; gender: string[]; pronouns: string[]; major: string[]; describesMe: string[]; describedHaving: string[]; attendedType: string[]; wentTo: string[];
};
const EMPTY: Filters = {
  classification: [], affiliation: [], college: [], interests: [], availability: [], communication: [], ethnicity: [], languages: [],
  ageRange: [], gender: [], pronouns: [], major: [], describesMe: [], describedHaving: [], attendedType: [], wentTo: [],
};

function applyFilters(users: User[], f: Filters, q = '') {
  const any = (want: string[], have: string[]) => !want.length || want.some((w) => have.includes(w));
  const s = q.trim().toLowerCase();
  return users.filter((u) => {
    const p = u.profile;
    if (s && ![fullName(u), p.major, p.college, p.careers, p.bio, p.education, p.profession].join(' ').toLowerCase().includes(s)) return false;
    const field = [p.major, p.profession, p.careers, p.education, ...p.educationEntries.map((e) => e.degree)].join(' ').toLowerCase();
    return (
      any(f.classification, [p.classification]) && any(f.affiliation, [p.affiliation]) && any(f.college, [p.college]) &&
      any(f.interests, p.mentoringInterests) && any(f.availability, p.availability) && any(f.communication, p.communication) &&
      any(f.ethnicity, p.ethnicity) && any(f.languages, p.languages) &&
      any(f.ageRange, [p.ageRange]) && any(f.gender, [p.gender]) && any(f.pronouns, [p.pronouns]) &&
      (!f.major.length || f.major.some((m) => field.includes(m.toLowerCase()))) &&
      any(f.describesMe, p.describesMe) && any(f.describedHaving, [...p.describedHaving, ...p.mentorExperienced]) &&
      any(f.attendedType, [p.attendedType]) && any(f.wentTo, [p.wentTo, ...p.educationEntries.map((e) => e.college)])
    );
  });
}
const countFilters = (f: Filters) => Object.values(f).reduce((n, v) => n + v.length, 0);

function FilterSheet({ open, onClose, value, onChange }: { open: boolean; onClose: () => void; value: Filters; onChange: (f: Filters) => void }) {
  const [f, setF] = useState(value);
  const row = (label: string, k: keyof Filters, options: readonly string[], search = false) => (
    <div className="mb-5">
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <ChipMulti value={f[k]} onChange={(v) => setF({ ...f, [k]: v })} options={options} search={search} />
    </div>
  );
  return (
    <Sheet open={open} onClose={onClose} title={L.filter}>
      {row(L.classification, 'classification', CLASSIFICATIONS)}
      {row(L.age_range, 'ageRange', AGE_RANGES)}
      {row(L.gender, 'gender', GENDERS)}
      {row(L.ethnicity, 'ethnicity', ETHNICITIES, true)}
      {row(L.sexual_orientation, 'pronouns', PRONOUNS)}
      {row(L.college_major, 'major', MAJORS, true)}
      {row(L.the_following_best_describes_me_when_i_was_a_student, 'describesMe', DESCRIBES_ME)}
      {row(L.as_a_student_i_could_be_described_as_having_the_following, 'describedHaving', DESCRIBED_HAVING)}
      {row(L.i_attended_the_following_type_of_college_university, 'attendedType', COLLEGE_TYPES)}
      {row(L.i_went_to_the_following_college_university, 'wentTo', TRANSFER_TARGETS, true)}
      {row(L.what_are_you_seeking_from_a_mentor, 'interests', MENTORING_INTERESTS)}
      {row(L.college, 'college', COLLEGES, true)}
      {row('Affiliation', 'affiliation', AFFILIATIONS)}
      {row('Best Availability', 'availability', AVAILABILITY)}
      {row('Communication Preference', 'communication', COMMUNICATION)}
      {row(L.languages_spoken, 'languages', LANGUAGES, true)}
      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-line bg-surface px-4 pt-3">
        <Button variant="outline" onClick={() => setF(EMPTY)}>{L.reset}</Button>
        <Button className="flex-1" onClick={() => { onChange(f); onClose(); }}>{L.done}</Button>
      </div>
    </Sheet>
  );
}

// ---------- Home: swipe deck ----------
export function Discover() {
  const user = useMe()!;
  const nav = useNavigate();
  const pool = useDb((d) => discoverable(user, d));
  const unreadNotifs = useDb((d) => d.notifications.filter((n) => n.userId === d.sessionUserId && !n.read).length);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sent, setSent] = useState<User | null>(null);
  const deck = useMemo(() => applyFilters(pool, filters), [pool, filters]);
  const top = deck[0];
  const seeking = user.role === 'mentee' ? 'mentors' : user.role === 'peer_mentor' ? 'members' : 'mentees';
  const pct = profileCompleteness(user.profile);

  const connect = (u: User) => {
    sendRequest(u.id);
    setSent(u);
  };

  return (
    <div>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-4 backdrop-blur">
        <img src={BRAND.icon} alt="" className="size-9 rounded-full object-contain" />
        <div className="flex-1 leading-tight">
          <p className="text-[17px] font-extrabold tracking-tight">Discover</p>
          <p className="text-[11px] text-faint">Find your {seeking} · swipe right to connect</p>
        </div>
        <IconBtn label="Search" onClick={() => nav('/search')}><SearchIcon className="size-5" /></IconBtn>
        <IconBtn label="Filters" onClick={() => setFilterOpen(true)} badge={countFilters(filters)}><SlidersHorizontal className="size-5" /></IconBtn>
        <IconBtn label="Notifications" onClick={() => nav('/notifications')} badge={unreadNotifs}><Bell className="size-5" /></IconBtn>
      </header>

      <div className="px-4 pt-4">
        {pct < 100 && (
          <button onClick={() => nav('/profile/edit')} className="shadow-premium mb-4 flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left">
            <span className="relative grid size-12 shrink-0 place-items-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--line)" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 97.4} 97.4`} />
              </svg>
              <span className="text-[11px] font-bold text-navy">{pct}%</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{fill(L.your_profile_is_xx_completed, `${pct}%`)}</span>
              <span className="block text-sm text-muted">{L.edit_profile}</span>
            </span>
            <ChevronRight className="size-5 text-faint" />
          </button>
        )}
        {top ? (
          <>
            <SwipeCard key={top.id} viewer={user} user={top} onPass={() => pass(top.id)} onConnect={() => connect(top)} onOpen={() => nav(`/member/${top.id}`)} />
            <div className="mt-4 flex items-center justify-center gap-5">
              <RoundBtn label="Pass" onClick={() => pass(top.id)} className="size-14 border border-line-strong bg-surface text-muted"><X className="size-7" /></RoundBtn>
              <RoundBtn label={L.view_profile} onClick={() => nav(`/member/${top.id}`)} className="size-12 border border-line-strong bg-surface text-navy"><UserRound className="size-5" /></RoundBtn>
              <RoundBtn label={L.connect} onClick={() => connect(top)} className="brand-gradient size-16 text-white shadow-lg"><UserPlus className="size-7" strokeWidth={2.4} /></RoundBtn>
            </div>
            <p className="mt-3 text-center text-xs text-faint">Swipe right to send a mentoring request · left to pass · {deck.length} left</p>
            <p className="mt-6 flex items-center justify-center gap-2 pb-2 text-xs text-faint"><Mark size={14} />{L.mentor_match_educational_purpose_only}</p>
          </>
        ) : (
          <Empty
            icon={<Sparkles className="size-7" />}
            title={L.no_match_found}
            body={countFilters(filters) ? 'Try removing a filter.' : L.there_are_no_pending_matches}
            action={
              countFilters(filters) ? (
                <Button variant="outline" onClick={() => setFilters(EMPTY)}>{L.reset}</Button>
              ) : (
                <Button variant="outline" onClick={resetPasses}><RotateCcw className="size-4" /> Show passed members</Button>
              )
            }
          />
        )}
      </div>

      <FilterSheet key={String(filterOpen)} open={filterOpen} onClose={() => setFilterOpen(false)} value={filters} onChange={setFilters} />

      {sent && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col items-center justify-center bg-navy/95 px-8 text-center text-white fade-up">
          <div className="relative">
            <div className="pulse-ring rounded-full"><Avatar user={sent} size={130} /></div>
            <span className="brand-gradient absolute -bottom-1 -right-1 grid size-12 place-items-center rounded-full border-4 border-navy text-white"><UserPlus className="size-6" strokeWidth={2.6} /></span>
          </div>
          <h2 className="mt-8 text-2xl font-extrabold">Request sent!</h2>
          <p className="mt-2 text-white/80">We’ll let you know when {sent.profile.firstName} accepts. Once you’re connected you can chat, call and book meetings.</p>
          <div className="mt-8 w-full space-y-3">
            <Button variant="accent" size="lg" onClick={() => setSent(null)}>Keep discovering</Button>
            <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" onClick={() => nav('/connections')}>View my requests</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, badge = 0, children }: { label: string; onClick: () => void; badge?: number; children: React.ReactNode }) {
  return (
    <button aria-label={label} onClick={onClick} className="relative grid size-10 place-items-center rounded-full text-navy hover:bg-bg-soft">
      {children}
      {badge > 0 && <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-orange px-1 text-[10px] font-bold text-white">{badge}</span>}
    </button>
  );
}

function RoundBtn({ label, onClick, className, children }: { label: string; onClick: () => void; className: string; children: React.ReactNode }) {
  return (
    <button aria-label={label} onClick={onClick} className={cn('grid place-items-center rounded-full transition active:scale-90', className)}>
      {children}
    </button>
  );
}

function SwipeCard({ viewer, user, onPass, onConnect, onOpen }: { viewer: User; user: User; onPass: () => void; onConnect: () => void; onOpen: () => void }) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const moved = useRef(false);
  const p = user.profile;
  const match = matchScore(viewer, user);
  const photos = galleryFor(user);
  const [shot, setShot] = useState(0);
  const end = () => {
    if (dx > 110) onConnect();
    else if (dx < -110) onPass();
    start.current = null;
    setDx(0);
  };
  return (
    <div
      className="fade-up relative touch-pan-y select-none overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_8px_30px_rgba(38,70,114,0.12)]"
      style={{ transform: `translateX(${dx}px) rotate(${dx / 22}deg)`, transition: start.current === null ? 'transform .25s' : 'none' }}
      onPointerDown={(e) => { start.current = e.clientX; moved.current = false; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
      onPointerMove={(e) => { if (start.current !== null) { const d = e.clientX - start.current; if (Math.abs(d) > 6) moved.current = true; setDx(d); } }}
      onPointerUp={end}
      onPointerCancel={end}
      onClick={() => !moved.current && onOpen()}
    >
      {dx > 40 && <span className="absolute left-5 top-14 z-10 flex -rotate-12 items-center gap-1 rounded-lg border-2 border-orange bg-navy/40 px-3 py-1 text-lg font-extrabold text-orange"><UserPlus className="size-5" strokeWidth={3} /> CONNECT</span>}
      {dx < -40 && <span className="absolute right-5 top-5 z-10 rotate-12 rounded-lg border-2 border-muted px-3 py-1 text-lg font-extrabold text-muted">PASS</span>}
      <div className="navy-gradient relative h-[340px] overflow-hidden">
        {photos.map((src, i) => (
          <img key={src} src={src} alt="" draggable={false} decoding="async"
            className={cn('absolute inset-0 size-full object-cover transition-opacity duration-300', i === shot ? 'opacity-100' : 'opacity-0', i === 0 && user.photo && 'object-top')} />
        ))}
        {/* tap left / right to flip through photos */}
        <button type="button" aria-label="Previous photo" className="absolute inset-y-0 left-0 z-[1] w-1/3" onClick={(e) => { e.stopPropagation(); if (!moved.current) setShot((x) => Math.max(0, x - 1)); }} />
        <button type="button" aria-label="Next photo" className="absolute inset-y-0 right-0 z-[1] w-1/3" onClick={(e) => { e.stopPropagation(); if (!moved.current) setShot((x) => Math.min(photos.length - 1, x + 1)); }} />
        <div className="pointer-events-none absolute inset-x-3 top-2.5 flex gap-1">
          {photos.map((_, i) => <span key={i} className={cn('h-1 flex-1 rounded-full', i === shot ? 'bg-white' : 'bg-white/40')} />)}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
        <div className="pointer-events-none absolute right-4 top-6 flex flex-col items-center rounded-2xl bg-navy/40 px-3 py-1.5 text-white backdrop-blur">
          <span className="text-xl font-extrabold leading-none text-orange-2">{match.score}%</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide">match</span>
        </div>
        <div className="pointer-events-none absolute left-4 top-6 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-orange px-3 py-1 text-xs font-bold text-white">{p.affiliation}</span>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-white">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[26px] font-extrabold tracking-tight drop-shadow">{fullName(user)}</h2>
            {p.pronouns && <span className="text-sm text-white/75">{p.pronouns}</span>}
          </div>
          {p.profession && <p className="mt-0.5 flex items-start gap-1.5 text-sm text-white/90"><Briefcase className="mt-0.5 size-4 shrink-0" /> {p.profession}</p>}
          {(p.college || p.major) && <p className="mt-0.5 flex items-start gap-1.5 text-sm text-white/85"><GraduationCap className="mt-0.5 size-4 shrink-0" /> {[p.major, p.college].filter(Boolean).join(' · ')}</p>}
        </div>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge>{p.classification}</Badge>
          <Badge tone="gray">{p.affiliation}</Badge>
          {p.ageRange && <Badge tone="gray">{p.ageRange}</Badge>}
        </div>
        {p.availability.length > 0 && (
          <p className="mt-1.5 flex items-center gap-2 text-sm text-muted"><Clock className="size-4" /> {p.availability.join(', ')} · {p.communication.join(', ')}</p>
        )}
        {match.reasons.length > 0 && (
          <div className="mt-3 rounded-2xl bg-orange-fill/60 px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-orange-text">Why you match</p>
            <p className="mt-0.5 text-sm">{match.reasons.join(' · ')}</p>
          </div>
        )}
        <p className="mt-3 line-clamp-3 text-[15px] leading-relaxed">{p.bio}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.mentoringInterests.map((m) => <span key={m} className="rounded-full bg-orange-fill px-2.5 py-1 text-xs font-medium text-orange-text">{m}</span>)}
        </div>
      </div>
    </div>
  );
}

// ---------- Search / directory ----------
export function Search() {
  const user = useMe()!;
  const nav = useNavigate();
  const users = useDb((d) => d.users.filter((u) => u.id !== user.id && u.profileVisible && !u.suspended && u.profile.firstName && !isBlocked(user.id, u.id, d)));
  const statuses = useDb((d) => Object.fromEntries(d.users.map((u) => [u.id, statusBetween(user.id, u.id, d)])));
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [open, setOpen] = useState(false);
  const list = applyFilters(users, filters, q);
  return (
    <div>
      <Header title={L.search} back right={
        <button onClick={() => setOpen(true)} className="relative grid size-10 place-items-center rounded-full hover:bg-bg-soft" aria-label={L.filter}>
          <SlidersHorizontal className="size-5" />
          {countFilters(filters) > 0 && <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-orange text-[10px] font-bold text-white">{countFilters(filters)}</span>}
        </button>
      } />
      <div className="px-4 py-3">
        <Input type="search" placeholder={L.search_mentors} aria-label={L.search_mentors} value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {CLASSIFICATIONS.map((c) => {
            const on = filters.classification.includes(c);
            return (
              <button key={c} onClick={() => setFilters({ ...filters, classification: on ? filters.classification.filter((x) => x !== c) : [...filters.classification, c] })}
                className={cn('shrink-0 rounded-full border px-3.5 py-1.5 text-sm', on ? 'border-navy bg-navy text-white' : 'border-line-strong')}>
                {c}
              </button>
            );
          })}
        </div>
      </div>
      <ul className="divide-y divide-line">
        {list.map((u) => (
          <li key={u.id}>
            <Link to={`/member/${u.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-bg-soft">
              <Avatar user={u} size={52} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{fullName(u)} <span className="text-xs font-normal text-faint">{u.profile.pronouns}</span></p>
                <p className="truncate text-sm text-muted">{u.profile.profession || `${u.profile.classification} · ${u.profile.affiliation}`}</p>
                <p className="truncate text-xs text-faint">{u.profile.college || u.profile.careers}</p>
              </div>
              {statuses[u.id] === 3 && <Badge tone="green">{L.accepted}</Badge>}
              {statuses[u.id] === 1 && <Badge tone="orange">{L.requested}</Badge>}
              {statuses[u.id] === 2 && <Badge tone="orange">{L.pending}</Badge>}
            </Link>
          </li>
        ))}
      </ul>
      {!list.length && <Empty icon={<SearchIcon className="size-7" />} title={L.no_mentor_found} body="Try a different search or fewer filters." />}
      <FilterSheet key={String(open)} open={open} onClose={() => setOpen(false)} value={filters} onChange={setFilters} />
    </div>
  );
}
