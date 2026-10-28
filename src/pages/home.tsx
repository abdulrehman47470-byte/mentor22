import { Ban, Bell, Building2, CalendarPlus, Check, ChevronRight, Clock, Flag, GraduationCap, Mail, MapPin, MessageCircle, MoreVertical, Phone, Search as SearchIcon, Settings, SlidersHorizontal, Sparkles, UserPlus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { L, fill } from '@/data/labels';
import { AGE_RANGES, COLLEGE_TYPES, DESCRIBED_HAVING, DESCRIBES_ME, ETHNICITIES, GENDERS, MAJORS, PRONOUNS, REPORT_REASONS, TRANSFER_TARGETS } from '@/data/options';
import { Avatar, Badge, Button, Card, Empty, Field, Header, Mark, Segments, Select, SectionTitle, Sheet, TextArea, ask, toast } from '@/components/ui';
import {
  NO_FILTERS, acceptConnection, addRecentSearch, block, cancelRequest, clearRecentSearches, collegeName, connect, connectionWith, fullName, iBlocked, isBlocked,
  profileCompletion, recommended, removeConnection, reportUser, roleLabel, searchMentors, statusWith, unblock, userById, type Filters,
} from '@/lib/api';
import { cn, useDb, useMe } from '@/lib/store';
import type { User } from '@/lib/types';

// ---------- Connect button (shared) ----------
/** The right action for the student's link with a mentor: Connect, Requested, Accept/Reject or Message. */
export function ConnectAction({ mentor, size = 'sm', full }: { mentor: User; size?: 'sm' | 'md'; full?: boolean }) {
  const nav = useNavigate();
  const status = useDb((d) => statusWith(mentor.id, d));
  const conn = useDb((d) => connectionWith(mentor.id, d));
  const cls = full ? 'flex-1' : '';
  if (status === 'none')
    return (
      <Button size={size} className={cls} onClick={() => connect(mentor.id)}>
        <UserPlus className="size-4" />
        {L.connect}
      </Button>
    );
  if (status === 'requested')
    return (
      <Button size={size} variant="soft" className={cls} onClick={async () => (await ask({ message: L.are_you_sure_want_to_cancel_request })) !== null && cancelRequest(mentor.id)}>
        <Clock className="size-4" />
        {L.requested}
      </Button>
    );
  if (status === 'invited')
    return (
      <div className={cn('flex gap-2', cls)}>
        <Button size={size} className="flex-1" onClick={() => acceptConnection(conn!.id)}>
          {L.accept}
        </Button>
        <Button
          size={size}
          variant="outline"
          className="flex-1"
          onClick={async () => {
            const r = await ask({ message: L.are_you_sure_to_deny_mentoring_request, reason: 'optional', danger: true, confirm: L.reject_request });
            if (r !== null) removeConnection(conn!.id, r);
          }}
        >
          {L.reject_request}
        </Button>
      </div>
    );
  return (
    <Button size={size} variant="soft" className={cls} onClick={() => nav(`/chat/${mentor.id}`)}>
      <MessageCircle className="size-4" />
      {L.message}
    </Button>
  );
}

/** Card: name, profession, college, photo (section 10, "Home card"). */
export function MentorCard({ m }: { m: User }) {
  const nav = useNavigate();
  return (
    <Card className="flex gap-3.5 p-3.5">
      <button onClick={() => nav(`/mentor/${m.id}`)} aria-label={`${L.view_profile}: ${fullName(m)}`}>
        <Avatar user={m} size={64} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-bold text-ink">{fullName(m)}</p>
          {m.role === 'peer_mentor' && <Badge tone="soft">Peer Mentor</Badge>}
        </div>
        <p className="truncate text-sm text-muted">{m.profile.profession}</p>
        <p className="flex items-center gap-1 truncate text-xs text-muted">
          <Building2 className="size-3.5 shrink-0" />
          {collegeName(m)}
        </p>
        <div className="mt-2.5 flex gap-2">
          <ConnectAction mentor={m} />
          <Button size="sm" variant="outline" onClick={() => nav(`/mentor/${m.id}`)}>
            {L.view_profile}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ---------- Home ----------
export function Home() {
  const nav = useNavigate();
  const user = useMe()!;
  const list = useDb((d) => recommended(d));
  const unread = useDb((d) => d.notifications.filter((n) => !n.read).length);
  const pct = profileCompletion(user.profile);
  return (
    <div>
      <div className="brand-gradient rounded-b-[32px] px-5 pb-6 pt-[max(14px,env(safe-area-inset-top))] text-white">
        <div className="flex items-center gap-3">
          <Link to="/profile" aria-label={L.profile}>
            <Avatar user={user} size={46} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/80">{L.hello},</p>
            <p className="truncate text-lg font-bold">{user.profile.firstName}</p>
          </div>
          <Link to="/notifications" aria-label={L.notifications} className="relative grid size-11 place-items-center rounded-full bg-white/12 hover:bg-white/20">
            <Bell className="size-5" />
            {unread > 0 && <span className="absolute right-2.5 top-2.5 size-2.5 rounded-full bg-danger ring-2 ring-brand" />}
          </Link>
          <Link to="/settings" aria-label={L.settings} className="grid size-11 place-items-center rounded-full bg-white/12 hover:bg-white/20">
            <Settings className="size-5" />
          </Link>
        </div>
        <h1 className="mt-5 text-2xl font-bold">{L.connect_to_explore_the_possibilities}</h1>
        <button onClick={() => nav('/search')} className="mt-3 flex h-12 w-full items-center gap-3 rounded-2xl bg-white px-4 text-left text-[15px] text-muted shadow-lg">
          <SearchIcon className="size-5 text-brand" />
          <span className="flex-1">{L.search_mentors}</span>
          <SlidersHorizontal className="size-5 text-brand" />
        </button>
      </div>

      <div className="px-4 pt-4">
        {pct < 100 && (
          <Card onClick={() => nav('/profile/edit')} className="mb-2 flex items-center gap-3.5">
            <div className="relative grid size-14 shrink-0 place-items-center">
              <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--line)" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 97.4} 97.4`} />
              </svg>
              <span className="text-xs font-bold text-brand-dark">{pct}%</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-ink">{fill(L.your_profile_is_xx_completed, `${pct}%`)}</p>
              <p className="text-sm text-muted">{L.edit_profile}</p>
            </div>
            <ChevronRight className="size-5 text-muted" />
          </Card>
        )}

        <SectionTitle action={<Link to="/search" className="text-sm font-semibold text-brand">{L.show_all}</Link>}>{L.recommended_mentors}</SectionTitle>
        {list.length ? (
          <div className="space-y-3">
            {list.map((m) => (
              <MentorCard key={m.id} m={m} />
            ))}
          </div>
        ) : (
          <Empty icon={<Sparkles className="size-7" />} title={L.no_match_found} body={L.there_are_no_pending_matches} />
        )}

        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted">
          <Mark size={14} />
          {L.mentor_match_educational_purpose_only}
        </p>
      </div>
    </div>
  );
}

// ---------- Search and filter ----------
export function Search() {
  const nav = useNavigate();
  const recent = useDb((d) => d.recentSearches);
  const [q, setQ] = useState('');
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const [open, setOpen] = useState(false);
  const active = Object.values(f).filter(Boolean).length;
  const results = useDb((d) => searchMentors(q, f, d));
  const browsing = !q.trim() && !active;
  return (
    <div className="min-h-app">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-2 px-3">
          <button aria-label="Back" onClick={() => nav(-1)} className="grid size-10 place-items-center rounded-full text-brand-dark hover:bg-bg-soft">
            <X className="size-5" />
          </button>
          <form
            className="relative flex-1"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              addRecentSearch(q);
              (document.activeElement as HTMLElement)?.blur();
            }}
          >
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => addRecentSearch(q)} placeholder={L.search_mentors} aria-label={L.search} autoFocus className="h-11 w-full rounded-full bg-field pl-11 pr-4 text-[15px] outline-none focus:ring-2 focus:ring-brand/25" />
          </form>
          <button onClick={() => setOpen(true)} aria-label={L.filter} className="relative grid size-11 place-items-center rounded-full bg-brand-light text-brand">
            <SlidersHorizontal className="size-5" />
            {active > 0 && <span className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">{active}</span>}
          </button>
        </div>
      </header>
      <div className="px-4 py-4">
        {browsing && recent.length > 0 && (
          <>
            <SectionTitle action={<button onClick={clearRecentSearches} className="text-sm font-semibold text-brand">{L.clear_all}</button>}>{L.recent}</SectionTitle>
            <div className="mb-2 flex flex-wrap gap-2">
              {recent.map((r) => (
                <button key={r} onClick={() => setQ(r)} className="flex items-center gap-1.5 rounded-full bg-bg-soft px-3.5 py-2 text-sm text-ink hover:bg-brand-light">
                  <Clock className="size-3.5 text-muted" />
                  {r}
                </button>
              ))}
            </div>
          </>
        )}
        {browsing && <SectionTitle>{L.recommended_mentors}</SectionTitle>}
        {results.length ? (
          <div className="space-y-3">
            {results.map((m) => (
              <MentorCard key={m.id} m={m} />
            ))}
          </div>
        ) : (
          <Empty icon={<SearchIcon className="size-7" />} title={L.no_mentor_found} />
        )}
      </div>
      <FilterSheet open={open} onClose={() => setOpen(false)} value={f} onApply={setF} />
    </div>
  );
}

function FilterSheet({ open, onClose, value, onApply }: { open: boolean; onClose: () => void; value: Filters; onApply: (f: Filters) => void }) {
  const [f, setF] = useState(value);
  const set = (k: keyof Filters) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Sheet open={open} onClose={onClose} title={L.filter}>
      <Field label={L.age_range}><Select value={f.ageRange} onChange={set('ageRange')} options={AGE_RANGES} /></Field>
      <Field label={L.gender}><Select value={f.gender} onChange={set('gender')} options={GENDERS} /></Field>
      <Field label={L.ethnicity}><Select value={f.ethnicity} onChange={set('ethnicity')} options={ETHNICITIES} /></Field>
      <Field label={L.sexual_orientation}><Select value={f.pronouns} onChange={set('pronouns')} options={PRONOUNS} /></Field>
      <Field label={L.college_major}><Select value={f.major} onChange={set('major')} options={MAJORS} /></Field>
      <Field label={L.the_following_best_describes_me_when_i_was_a_student}><Select value={f.describesMe} onChange={set('describesMe')} options={DESCRIBES_ME} /></Field>
      <Field label={L.as_a_student_i_could_be_described_as_having_the_following}><Select value={f.describedHaving} onChange={set('describedHaving')} options={DESCRIBED_HAVING} /></Field>
      <Field label={L.i_attended_the_following_type_of_college_university}><Select value={f.attendedType} onChange={set('attendedType')} options={COLLEGE_TYPES} /></Field>
      <Field label={L.i_went_to_the_following_college_university}><Select value={f.wentTo} onChange={set('wentTo')} options={TRANSFER_TARGETS} /></Field>
      <div className="sticky bottom-0 -mx-5 -mb-5 grid grid-cols-2 gap-3 border-t border-line bg-surface px-5 py-4">
        <Button variant="outline" onClick={() => (setF(NO_FILTERS), onApply(NO_FILTERS))}>{L.reset}</Button>
        <Button onClick={() => (onApply(f), onClose())}>{L.done}</Button>
      </div>
    </Sheet>
  );
}

// ---------- Mentor profile ----------
type Tab = 'about' | 'basic' | 'education' | 'attributes';

function InfoRow({ label, value }: { label: string; value?: string | string[] }) {
  const v = Array.isArray(value) ? value.join(', ') : value;
  return (
    <div className="border-b border-line py-3 last:border-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-[15px] text-ink">{v || '—'}</p>
    </div>
  );
}

export function SeeMore({ text, lines = 4 }: { text: string; lines?: number }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 180;
  return (
    <div>
      <p className={cn('whitespace-pre-line text-[15px] leading-relaxed text-ink', !open && long && 'line-clamp-4')} style={!open && long ? { WebkitLineClamp: lines } : undefined}>{text || '—'}</p>
      {long && (
        <button onClick={() => setOpen((o) => !o)} className="mt-1 text-sm font-semibold text-brand">
          {open ? L.resizable_text_read_less : L.resizable_text_read_more}
        </button>
      )}
    </div>
  );
}

export function Socials({ u }: { u: User }) {
  const s = u.profile.socials;
  const items = [
    { k: 'facebook', label: L.facebook, url: s.facebook },
    { k: 'linkedin', label: L.linkedin, url: s.linkedin },
    { k: 'x', label: L.twitter, url: s.x },
    { k: 'instagram', label: L.instagram, url: s.instagram },
    { k: 'threads', label: L.thread, url: s.threads },
  ].filter((i) => i.url);
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2">
      {items.map((i) => (
        <a key={i.k} href={i.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand-dark hover:bg-field">
          {i.label}
        </a>
      ))}
    </div>
  );
}

export function MentorProfile() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const m = useDb((d) => userById(id, d));
  const status = useDb((d) => statusWith(id, d));
  const blockedByMe = useDb((d) => iBlocked(id, d));
  const blocked = useDb((d) => isBlocked(d.sessionUserId ?? '', id, d));
  const others = useDb((d) => recommended(d).filter((x) => x.id !== id).slice(0, 6));
  const [tab, setTab] = useState<Tab>('about');
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  if (!m) return <Navigate to="/home" replace />;
  const p = m.profile;
  return (
    <div className="min-h-app pb-10">
      <Header
        title={fullName(m)}
        back
        right={
          <button aria-label="More" onClick={() => setMenu(true)} className="grid size-10 place-items-center rounded-full text-brand-dark hover:bg-bg-soft">
            <MoreVertical className="size-5" />
          </button>
        }
      />
      <div className="brand-gradient h-24" />
      <div className="-mt-14 px-4 text-center">
        <div className="mx-auto w-fit rounded-full bg-surface p-1.5 shadow-card">
          <Avatar user={m} size={104} />
        </div>
        <h2 className="mt-3 text-[22px] font-bold text-brand-dark">{fullName(m)}</h2>
        <p className="text-sm text-muted">{p.profession}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Badge>{roleLabel(m)}</Badge>
          <Badge tone="soft">{collegeName(m)}</Badge>
        </div>
        <Socials u={m} />
        {blocked ? (
          <div className="mt-5 rounded-2xl bg-danger/8 p-4 text-sm font-medium text-danger">
            {blockedByMe ? L.the_user_has_been_blocked : L.you_have_been_blocked_by_this_user}
            {blockedByMe && (
              <Button size="sm" variant="outline" className="ml-3" onClick={() => unblock(m.id)}>
                {L.unblock}
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-5 flex gap-2.5">
            <ConnectAction mentor={m} size="md" full />
            {status === 'accepted' && (
              <Button variant="outline" className="flex-1" onClick={() => nav(`/schedule/${m.id}`)}>
                <CalendarPlus className="size-4" />
                {L.schedule}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 px-4">
        <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
          <div className="min-w-[360px]">
            <Segments<Tab>
              value={tab}
              onChange={setTab}
              items={[
                { id: 'about', label: L.about },
                { id: 'basic', label: L.basic_info },
                { id: 'education', label: L.education },
                { id: 'attributes', label: L.attributes },
              ]}
            />
          </div>
        </div>
        <Card className="mt-3">
          {tab === 'about' && (
            <>
              <SeeMore text={p.about} />
              <div className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
                <p className="flex items-center gap-2.5 text-ink"><Mail className="size-4 text-brand" />{m.email}</p>
                {p.officeLocation && <p className="flex items-center gap-2.5 text-ink"><MapPin className="size-4 text-brand" />{p.officeLocation}</p>}
                {p.officePhone && <a href={`tel:${p.officePhone}`} className="flex items-center gap-2.5 text-ink"><Phone className="size-4 text-brand" />{p.officePhone}</a>}
              </div>
            </>
          )}
          {tab === 'basic' && (
            <>
              <InfoRow label={L.gender} value={p.gender} />
              <InfoRow label={L.ethnicity} value={p.ethnicity} />
              <InfoRow label={L.age_range} value={p.ageRange} />
              <InfoRow label={L.sexual_orientation} value={p.pronouns} />
              <InfoRow label={L.languages_spoken} value={p.languages} />
              <InfoRow label={L.religious_affiliation} value={p.religion} />
              <InfoRow label={L.classification} value={p.classification} />
              <InfoRow label={L.office_location} value={p.officeLocation} />
              <InfoRow label={L.office_number} value={p.officeNumber} />
              <InfoRow label={L.office_phone_number} value={p.officePhone} />
            </>
          )}
          {tab === 'education' &&
            (p.education?.length ? (
              <ul className="space-y-3">
                {p.education.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-light text-brand"><GraduationCap className="size-5" /></span>
                    <div>
                      <p className="font-semibold text-ink">{e.college}</p>
                      <p className="text-sm text-muted">{e.degree}</p>
                      <p className="text-xs text-muted">{e.location}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{L.no_data}</p>
            ))}
          {tab === 'attributes' && (
            <>
              <InfoRow label={L.the_following_best_describes_me_when_i_was_a_student} value={p.mentorDescribes} />
              <InfoRow label={L.as_a_student_i_experienced_the_following} value={p.mentorExperienced} />
              <InfoRow label={L.as_a_student_i_could_be_described_as_having_the_following} value={p.mentorHaving} />
              <InfoRow label={L.i_went_to_the_following_college_university} value={p.wentTo} />
              <InfoRow label={L.i_attended_the_following_type_of_college_university} value={p.attendedType} />
              <InfoRow label={L.are_you_a_counselorq} value={p.isCounselor} />
              <InfoRow label={L.do_you_work_within_financial_aidq} value={p.worksInFinancialAid} />
            </>
          )}
        </Card>

        {others.length > 0 && (
          <>
            <SectionTitle action={<Link to="/search" className="text-sm font-semibold text-brand">{L.show_all}</Link>}>{L.recommended_mentors}</SectionTitle>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {others.map((o) => (
                <Link key={o.id} to={`/mentor/${o.id}`} className="shadow-card flex w-36 shrink-0 flex-col items-center rounded-2xl border border-line bg-surface p-3 text-center">
                  <Avatar user={o} size={60} />
                  <p className="mt-2 w-full truncate text-sm font-bold text-ink">{fullName(o)}</p>
                  <p className="w-full truncate text-xs text-muted">{o.profile.profession}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title={fullName(m)}>
        <div className="space-y-1">
          {status === 'accepted' && (
            <MenuRow
              icon={<X className="size-5" />}
              label={L.disconnect}
              onClick={async () => {
                setMenu(false);
                const r = await ask({ message: L.are_you_sure_you_want_to_disconnect_from_xx.replace('xx', fullName(m)) + '?', reason: 'optional', danger: true, confirm: L.disconnect });
                if (r !== null) removeConnection(connectionWith(m.id)!.id, r);
              }}
            />
          )}
          <MenuRow icon={<Flag className="size-5" />} label={L.report} onClick={() => (setMenu(false), setReporting(true))} />
          <MenuRow
            icon={blockedByMe ? <Check className="size-5" /> : <Ban className="size-5" />}
            label={blockedByMe ? L.unblock : L.block}
            danger={!blockedByMe}
            onClick={async () => {
              setMenu(false);
              if (blockedByMe) return unblock(m.id);
              if ((await ask({ message: `${L.block} ${fullName(m)}?`, danger: true, confirm: L.block })) === null) return;
              block(m.id);
              toast(L.the_user_has_been_blocked);
            }}
          />
        </div>
      </Sheet>
      <ReportSheet user={m} open={reporting} onClose={() => setReporting(false)} />
    </div>
  );
}

export function MenuRow({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left text-[15px] font-medium hover:bg-bg-soft', danger ? 'text-danger' : 'text-ink')}>
      <span className={danger ? 'text-danger' : 'text-brand'}>{icon}</span>
      {label}
    </button>
  );
}

/** Report a user: Select Reason, Description. */
export function ReportSheet({ user, open, onClose }: { user: User; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [desc, setDesc] = useState('');
  const [err, setErr] = useState('');
  const reasons = useMemo(() => REPORT_REASONS, []);
  return (
    <Sheet open={open} onClose={onClose} title={L.report}>
      <Field label={L.select_reason} error={err}>
        <Select value={reason} onChange={(v) => (setReason(v), setErr(''))} options={reasons} placeholder={L.select_reason} />
      </Field>
      <Field label={L.description}>
        <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={L.brief_description_about_report} max={500} />
      </Field>
      <Button
        size="lg"
        onClick={() => {
          if (!reason) return setErr(L.please_select_reason);
          reportUser(user.id, reason, desc.trim());
          setReason('');
          setDesc('');
          onClose();
          toast('Thank you. Our team will review your report.');
        }}
      >
        {L.submit}
      </Button>
    </Sheet>
  );
}
