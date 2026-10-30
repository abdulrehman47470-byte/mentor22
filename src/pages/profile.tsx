import { Ban, Bell, BookOpen, Briefcase, CalendarPlus, Camera, Check, ChevronRight, Clock, Eye, EyeOff, Flag, LifeBuoy, Link2, LogOut, Mail, MapPin, MessageCircle, MoreHorizontal, Pencil, Phone, Send, Settings as SettingsIcon, Shield, ShieldCheck, Trash2, UserCheck, UserMinus, UserPen, UserPlus, Video, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Badge, Button, Card, ChipSingle, Empty, Field, Header, Mark, SectionTitle, Sheet, TextArea, Toggle, toast, ask } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { L } from '@/data/labels';
import { REPORT_REASONS } from '@/data/options';
import {
  block, cancelRequest, deleteAccount, disconnect, fullName, isAdmin, isMentorType, profileCompleteness, report, respondRequest, sendRequest, setPhoto, setProfileVisible, setPushEnabled, signOut, statusBetween, userById,
} from '@/lib/api';
import { askPushPermission } from '@/lib/push';
import { cn, useDb, useMe } from '@/lib/store';
import type { User } from '@/lib/types';
import { coverFor, galleryFor } from '@/data/media';

/** Basic Info, Education and Goals & More (Attributes for mentors), shown read-only. */
export function ProfileSections({ user }: { user: User }) {
  const p = user.profile;
  const rows = (items: [string, string | string[] | undefined][]) =>
    items
      .filter(([, v]) => (Array.isArray(v) ? v.length : v))
      .map(([k, v]) => (
        <div key={k} className="border-b border-line py-2.5 last:border-0">
          <p className="text-xs font-semibold text-faint">{k}</p>
          {Array.isArray(v) ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">{v.map((x) => <span key={x} className="rounded-full bg-bg-soft px-2.5 py-1 text-[13px]">{x}</span>)}</div>
          ) : (
            <p className="mt-0.5 whitespace-pre-line text-[15px]">{v}</p>
          )}
        </div>
      ));
  const socials = Object.entries(p.socials).filter(([, v]) => v);
  const ethnicity = p.ethnicity.map((e) => (e === 'Other' && p.ethnicityOther ? `Other: ${p.ethnicityOther}` : e));
  const mentor = isMentorType(user.role);
  const edu = rows([
    [L.current_college_enrolled, p.college], [L.enrollment_status, p.academicStatus], [L.current_semester, p.currentSemester],
    [L.anticipated_graduation_year, p.gradYear], [L.grade_point_average, p.gpa], [L.college_major, p.major], [L.college_certificate, p.certificate],
    ['Education', p.education],
    ...p.educationEntries.map((e) => [L.college_degree_achieved, `${e.degree} · ${e.college}${e.location ? ` · ${e.location}` : ''}`] as [string, string]),
    ['Interested in these careers', p.careers], ['Personal / Professional Goals', p.goals],
  ]);
  const exp = rows(
    mentor
      ? [
          [L.the_following_best_describes_me_when_i_was_a_student, p.describesMe], [L.as_a_student_i_experienced_the_following, p.mentorExperienced],
          [L.as_a_student_i_could_be_described_as_having_the_following, p.describedHaving], [L.i_went_to_the_following_college_university, p.wentTo],
          [L.i_attended_the_following_type_of_college_university, p.attendedType], [L.are_you_a_counselorq, p.isCounselor], [L.do_you_work_within_financial_aidq, p.worksInFinancialAid],
          ['Extracurricular Academic Activities', p.extracurricular], ['Professional Affiliation', p.professionalAffiliation], ['Hobbies / Other Interests', p.hobbies],
        ]
      : [
          [L.college_goals, p.collegeGoals], [L.career_goals, p.careerGoals], [L.i_would_like_to_attend_the_following, p.attendType],
          [L.i_would_like_to_transfer, p.futureUniversity], [L.the_following_best_describe_me, p.describesMe], [L.i_can_be_described_as_having_the_following, p.describedHaving],
          [L.what_are_you_seeking_from_a_mentor, p.mentoringInterests], [L.have_you_met_with_a_counselor, p.metCounselor], [L.have_you_applied_for_financial_aid, p.appliedFinancialAid],
          ['Extracurricular Academic Activities', p.extracurricular], ['Hobbies / Other Interests', p.hobbies],
        ],
  );
  return (
    <>
      {p.bio && (
        <>
          <SectionTitle>{L.about}</SectionTitle>
          <Card><p className="whitespace-pre-line text-[15px] leading-relaxed">{p.bio}</p></Card>
        </>
      )}
      <SectionTitle>{L.basic_info}</SectionTitle>
      <Card className="py-1">
        {rows([
          [L.gender, p.gender], [L.sexual_orientation, p.pronouns], ['Affiliation', p.affiliation], [L.classification, p.classification], [L.college, p.college],
          ['Profession', p.profession], [L.office_location, p.officeLocation], [L.office_number, p.officeNumber], [L.office_phone_number, p.officePhone],
          ['Best Availability', p.availability], ['Communication Preference', p.communication],
          [L.age_range, p.ageRange], [L.ethnicity, ethnicity], [L.languages_spoken, p.languages], [L.religious_affiliation, p.religion],
          ...(mentor ? [['Mentoring Interest', p.mentoringInterests] as [string, string[]]] : []),
        ])}
        {socials.length > 0 && (
          <div className="py-2.5">
            <p className="text-xs font-semibold text-faint">Social Media</p>
            {socials.map(([k, v]) => (
              <p key={k} className="mt-1 flex items-center gap-2 text-[15px]"><Link2 className="size-4 text-orange-text" /> <span className="text-faint">{k}:</span> {v}</p>
            ))}
          </div>
        )}
      </Card>
      {edu.length > 0 && (<><SectionTitle>{L.education}</SectionTitle><Card className="py-1">{edu}</Card></>)}
      {exp.length > 0 && (<><SectionTitle>{mentor ? L.attributes : L.goals_and_more}</SectionTitle><Card className="py-1">{exp}</Card></>)}
    </>
  );
}

function Hero({ user, children }: { user: User; children?: React.ReactNode }) {
  const p = user.profile;
  return (
    <div className="flex flex-col items-center pb-2 text-center">
      <div className="relative h-40 w-full overflow-hidden">
        <img loading="lazy" decoding="async" src={coverFor(user)} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/10 via-navy/25 to-bg" />
      </div>
      <div className="-mt-16 rounded-full bg-bg p-1">{children ?? <Avatar user={user} size={112} ring />}</div>
      <h1 className="mt-4 text-[22px] font-extrabold tracking-tight">{fullName(user)}</h1>
      {p.pronouns && <p className="text-sm text-faint">{p.pronouns}</p>}
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {p.classification && <Badge>{p.classification}</Badge>}
        {p.affiliation && <Badge tone="orange">{p.affiliation}</Badge>}
        {user.role === 'super_admin' && <Badge tone="red">Super Admin</Badge>}
      </div>
      {p.college && <p className="mt-2 px-gutter text-sm text-muted">{p.college}</p>}
    </div>
  );
}

// ---------- My profile ----------
export function MyProfile() {
  const user = useMe()!;
  const nav = useNavigate();
  const pendingMeetings = useDb((d) => d.meetings.filter((m) => m.invitee === d.sessionUserId && m.status === 'pending').length);
  const input = useRef<HTMLInputElement>(null);
  const pct = profileCompleteness(user.profile);
  const mentor = isMentorType(user.role);
  const p = user.profile;
  const pick = (f?: File) => {
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const r = Math.min(img.width, img.height);
      c.width = c.height = 480;
      c.getContext('2d')!.drawImage(img, (img.width - r) / 2, (img.height - r) / 2, r, r, 0, 0, 480, 480);
      setPhoto(c.toDataURL('image/jpeg', 0.82));
      toast('Photo updated');
    };
    img.src = URL.createObjectURL(f);
  };
  return (
    <div>
      <Header title="Profile" />
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => (pick(e.target.files?.[0]), (e.target.value = ''))} />
      <div className="px-gutter pb-6">
        {/* Tapping the photo opens the full profile; the camera changes the photo. */}
        <div className="flex flex-col items-center pt-6 text-center">
          <div className="relative">
            <button onClick={() => nav('/profile/view')} aria-label="See profile" className="rounded-full p-1 ring-2 ring-line-strong transition active:scale-[0.98]">
              <Avatar user={user} size={132} />
            </button>
            <button onClick={() => input.current?.click()} aria-label="Change photo" className="absolute bottom-1 right-1 grid size-11 place-items-center rounded-full border-[3px] border-bg bg-navy text-white shadow-lg">
              <Camera className="size-5" />
            </button>
          </div>
          <h1 className="mt-4 text-[22px] font-extrabold uppercase tracking-tight text-navy">{fullName(user)}</h1>
          {(p.profession || p.major) && (
            <p className="mt-1 flex items-center gap-1.5 text-[15px] text-muted"><Briefcase className="size-4 shrink-0" /> {p.profession || p.major}</p>
          )}
          {p.college && <p className="mt-0.5 flex items-center gap-1.5 text-[15px] text-faint"><MapPin className="size-4 shrink-0" /> {p.college}</p>}
          <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
            {p.classification && <Badge>{p.classification}</Badge>}
            {p.affiliation && <Badge tone="gray">{p.affiliation}</Badge>}
            {user.role === 'super_admin' && <Badge tone="red">Super Admin</Badge>}
          </div>
          <Link to="/profile/view" className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-brand-light px-5 text-[15px] font-semibold text-navy transition hover:bg-field">
            <Eye className="size-4" /> See Profile
          </Link>
        </div>

        <Card className="mt-6 p-5">
          <div className="flex items-center justify-between text-[15px]">
            <span className="font-semibold">Profile {pct}% complete</span>
            <Link to="/profile/edit" className="font-semibold text-brand">{pct < 100 ? 'Finish It' : 'Edit'}</Link>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg-soft"><div className="brand-gradient h-full rounded-full" style={{ width: `${pct}%` }} /></div>
        </Card>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link to="/profile/edit"><Button variant="outline" className="h-13 w-full"><Pencil className="size-4" /> Edit Profile</Button></Link>
          {mentor ? (
            <Link to="/availability"><Button variant="outline" className="h-13 w-full"><Clock className="size-4" /> Availability</Button></Link>
          ) : (
            <Link to="/search"><Button variant="outline" className="h-13 w-full"><UserPlus className="size-4" /> Find Mentors</Button></Link>
          )}
        </div>

        <Link to="/meetings" className="mt-3 block">
          <Card className="flex items-center gap-4 p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-light text-navy"><CalendarPlus className="size-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-semibold">My Meetings</span>
              <span className="block text-sm text-muted">Upcoming, requests and booking</span>
            </span>
            {pendingMeetings > 0 && <Badge tone="gray">{pendingMeetings} new</Badge>}
          </Card>
        </Link>

        <Card className="mt-3 px-5 py-2">
          <Toggle
            checked={user.profileVisible}
            onChange={(v) => { setProfileVisible(v); toast(v ? 'Your profile is visible' : 'Your profile is hidden'); }}
            label="Show Me in the Member Directory"
            sub={user.profileVisible ? 'Members can find you in Discover and Search.' : 'Hidden: no new requests. Current connections stay.'}
          />
        </Card>

        <ControlCenter />
      </div>
    </div>
  );
}

/** Square shortcut tile in the Control Center grid. */
function Tile({ icon, label, sub, to, onClick, badge }: { icon: React.ReactNode; label: string; sub: string; to?: string; onClick?: () => void; badge?: number }) {
  const nav = useNavigate();
  return (
    <button type="button" onClick={() => (to ? nav(to) : onClick?.())} className="shadow-card relative flex flex-col items-center rounded-2xl border border-line bg-surface px-1.5 py-4 text-center transition hover:border-line-strong active:scale-[0.98]">
      {!!badge && <span className="absolute right-2 top-2 grid min-w-5 place-items-center rounded-full bg-navy px-1 text-[11px] font-bold text-white">{badge}</span>}
      <span className="grid size-11 place-items-center rounded-xl bg-brand-light text-navy [&>svg]:size-5">{icon}</span>
      <span className="mt-2.5 text-[14px] font-semibold leading-tight">{label}</span>
      <span className="mt-0.5 line-clamp-1 text-xs text-muted">{sub}</span>
    </button>
  );
}

/** Settings, shortcuts and (for Super Admins) the Admin panel, at the bottom of the profile. */
function ControlCenter() {
  const nav = useNavigate();
  const me = useMe()!;
  const push = useDb((d) => d.pushEnabled);
  const unread = useDb((d) => d.notifications.filter((n) => n.userId === d.sessionUserId && !n.read).length);
  const blocked = useDb((d) => d.blocks.filter((b) => b.userId === d.sessionUserId).length);
  const admin = useDb((d) => isAdmin(d));
  const openReports = useDb((d) => d.reports.filter((r) => (r.status ?? 'open') === 'open').length);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pct = profileCompleteness(me.profile);
  const mentor = isMentorType(me.role);
  return (
    <section aria-label="Settings" className="mt-8">
      <div className="navy-gradient shadow-premium relative overflow-hidden rounded-3xl p-5 text-white">
        <span className="pointer-events-none absolute -right-10 -top-16 size-44 rounded-full bg-white/5" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/12"><SettingsIcon className="size-6" /></span>
          <span className="flex-1">
            <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">Control Center</span>
            <span className="block text-[20px] font-bold leading-tight">Settings &amp; More</span>
          </span>
          <Link to="/settings" className="flex items-center gap-1 rounded-full bg-white/12 px-3.5 py-1.5 text-sm font-semibold hover:bg-white/20">All <ChevronRight className="size-4" /></Link>
        </div>
        <div className="relative mt-4 flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-1">
          <Bell className="size-5 shrink-0" />
          <div className="flex-1 [&_.text-faint]:text-white/70">
            <Toggle checked={push} onChange={async (v) => {
              setPushEnabled(v);
              if (v) {
                const r = await askPushPermission();
                toast(r === 'granted' ? 'Push notifications on' : 'In-app notifications on');
              } else toast('Push notifications off');
            }} label="Push Notifications" sub="Requests, messages, meetings and calls" />
          </div>
        </div>
      </div>

      <Link to="/invite" className="shadow-card mt-3 flex items-center gap-4 rounded-2xl border border-line bg-bg-soft p-5 transition hover:border-line-strong">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-surface text-navy shadow-card"><Send className="size-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-semibold">Send an Invite</span>
          <span className="block text-sm text-muted">{mentor ? 'Invite mentees to connect' : 'Invite mentors to connect'}, or a colleague by email</span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-faint" />
      </Link>

      {admin && (
        <Link to="/admin" className="shadow-card mt-3 flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition hover:border-line-strong">
          <span className="navy-gradient grid size-12 shrink-0 place-items-center rounded-2xl text-white"><ShieldCheck className="size-6" /></span>
          <span className="min-w-0 flex-1">
            <span className="mb-1 inline-block rounded-full bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Admin only</span>
            <span className="block text-[17px] font-semibold">Admin Console</span>
            <span className="block text-sm text-muted">Members, matches, reports, push, content</span>
          </span>
          {openReports > 0 && <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">{openReports}</span>}
          <ChevronRight className="size-5 shrink-0 text-faint" />
        </Link>
      )}

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Tile icon={<UserPen />} label="Edit Profile" sub={`${pct}% complete`} to="/profile/edit" />
        {mentor
          ? <Tile icon={<Clock />} label="Availability" sub="Your free slots" to="/availability" />
          : <Tile icon={<CalendarPlus />} label="Meetings" sub="Upcoming" to="/meetings" />}
        <Tile icon={<Bell />} label="Notifications" sub={unread ? `${unread} unread` : 'All caught up'} to="/notifications" badge={unread} />
        <Tile icon={<BookOpen />} label="Resources" sub="College & help" to="/resources" />
        <Tile icon={<Ban />} label="Blocked" sub={blocked ? `${blocked} member${blocked > 1 ? 's' : ''}` : 'No one'} to="/blocked" />
        <Tile icon={<Shield />} label="Privacy" sub="Terms & policy" to="/legal/privacy" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => (window.location.href = `mailto:${BRAND.supportEmail}`)} className="shadow-card flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left hover:border-line-strong">
          <Mail className="size-5 shrink-0 text-navy" />
          <span className="min-w-0"><span className="block font-semibold">Support</span><span className="block truncate text-xs text-muted">{BRAND.supportEmail}</span></span>
        </button>
        <button type="button" onClick={() => (window.location.href = `tel:${BRAND.crisisLine.phone}`)} className="shadow-card flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-surface p-4 text-left hover:border-line-strong">
          <LifeBuoy className="size-5 shrink-0 text-navy" />
          <span className="min-w-0"><span className="block truncate font-semibold" title={BRAND.crisisLine.label}>Crisis Line</span><span className="block truncate text-xs text-muted">Call or text {BRAND.crisisLine.phone}</span></span>
        </button>
      </div>

      <div className="mt-3 flex justify-center gap-4 text-sm font-medium text-muted">
        <Link to="/legal/guidelines" className="hover:text-navy">Community guidelines</Link>
        <span aria-hidden>·</span>
        <Link to="/legal/terms" className="hover:text-navy">Terms of Use</Link>
      </div>

      <button
        type="button"
        onClick={async () => {
          if ((await ask({ message: L.are_you_sure_you_want_to_logout_q, danger: true, confirm: L.sign_out })) === null) return;
          signOut();
          toast(L.logout_successfully);
          nav('/welcome', { replace: true });
        }}
        className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-surface text-[15px] font-semibold text-danger hover:bg-danger/5"
      >
        <LogOut className="size-5" /> {L.sign_out}
      </button>
      <button type="button" onClick={() => setConfirmDelete(true)} className="mx-auto mt-3 flex items-center gap-1.5 text-sm font-medium text-faint hover:text-danger">
        <Trash2 className="size-4" /> Delete account
      </button>

      <div className="mt-8 flex flex-col items-center gap-1 text-center">
        <Mark size={34} />
        <p className="mt-2 text-sm font-semibold text-navy">{BRAND.appName} · v0.1.0 (prototype)</p>
        <p className="text-xs text-faint">Powered by Mentor &amp; Match</p>
      </div>
      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete account?">
        <p className="text-muted">This permanently removes your profile, connections and messages. This can’t be undone.</p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={() => { deleteAccount(); nav('/welcome', { replace: true }); }}>Delete</Button>
        </div>
      </Sheet>
    </section>
  );
}

// ---------- See Profile: my profile as others see it ----------
export function MyProfileView() {
  const user = useMe()!;
  const nav = useNavigate();
  return (
    <div className="pb-28">
      <Header title="My Profile" back="/profile" right={
        <Link to="/profile/edit" className="flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-2 text-sm font-semibold text-navy"><Pencil className="size-4" /> Edit</Link>
      } />
      <Hero user={user} />
      <div className="px-gutter">
        <p className="mt-2 text-center text-xs text-faint">This is how other members see your profile.</p>
        <PhotoStrip user={user} />
        <ProfileSections user={user} />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] gap-3 border-t border-line bg-surface px-gutter pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        <Button className="flex-1" onClick={() => nav('/profile/edit')}><Pencil className="size-4" /> Edit Profile</Button>
      </div>
    </div>
  );
}

// ---------- Another member's profile ----------
export function MemberProfile() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const meUser = useMe()!;
  const user = useDb((d) => userById(id, d));
  const status = useDb((d) => statusBetween(meUser.id, id, d));
  const [menu, setMenu] = useState(false);
  const [reporting, setReporting] = useState(false);
  if (!user) return <><Header title="Profile" back /><Empty icon={<X className="size-7" />} title="Member not found" /></>;
  const name = user.profile.firstName;
  return (
    <div className="pb-28">
      <Header title={fullName(user)} back right={<button aria-label="More" onClick={() => setMenu(true)} className="grid size-10 place-items-center rounded-full hover:bg-bg-soft"><MoreHorizontal className="size-5" /></button>} />
      <Hero user={user} />
      <div className="px-gutter">
        {status === 3 && (
          <div className="mt-3 grid grid-cols-4 gap-2">
            <Action icon={<MessageCircle />} label="Message" onClick={() => nav(`/messages/${id}`)} />
            <Action icon={<Phone />} label="Call" onClick={() => nav(`/call/${id}`)} />
            <Action icon={<Video />} label="Video" onClick={() => nav(`/call/${id}?video=1`)} />
            <Action icon={<CalendarPlus />} label="Meet" onClick={() => nav(`/meetings/new/${id}`)} />
          </div>
        )}
        <PhotoStrip user={user} />
        <ProfileSections user={user} />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] gap-3 border-t border-line bg-surface px-gutter pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        {status === 0 && <Button className="flex-1" variant="accent" onClick={() => { sendRequest(id); toast(`Request sent to ${name}`); }}><UserPlus className="size-5" /> Send mentoring request</Button>}
        {status === 1 && <Button className="flex-1" variant="outline" onClick={() => { cancelRequest(id); toast('Request withdrawn'); }}><Clock className="size-5" /> Requested · Withdraw</Button>}
        {status === 2 && (
          <>
            <Button variant="outline" className="flex-1" onClick={() => { respondRequest(id, false); toast('Request declined'); }}><X className="size-5" /> Decline</Button>
            <Button className="flex-1" onClick={() => { respondRequest(id, true); toast(`You and ${name} are connected`); }}><Check className="size-5" /> Accept</Button>
          </>
        )}
        {status === 3 && <Button className="flex-1" onClick={() => nav(`/messages/${id}`)}><UserCheck className="size-5" /> Connected · Message</Button>}
      </div>

      <Sheet open={menu} onClose={() => setMenu(false)} title={fullName(user)}>
        <div className="space-y-1">
          {status === 3 && <MenuItem icon={<UserMinus />} label="Disconnect" onClick={() => { disconnect(id); setMenu(false); toast('Disconnected'); }} />}
          <MenuItem icon={<Flag />} label="Report" onClick={() => { setMenu(false); setReporting(true); }} />
          <MenuItem icon={<Ban />} label={`Block ${name}`} danger onClick={() => { block(id); setMenu(false); toast(`${name} is blocked`); nav(-1); }} />
        </div>
      </Sheet>
      <ReportSheet open={reporting} onClose={() => setReporting(false)} user={user} />
    </div>
  );
}

/** Scenes from the member's world, with a full-screen viewer. */
function PhotoStrip({ user }: { user: User }) {
  const photos = galleryFor(user).filter((x) => x !== user.photo);
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;
  return (
    <>
      <SectionTitle>Photos</SectionTitle>
      <div className="no-scrollbar -mx-gutter flex snap-x gap-2 overflow-x-auto px-gutter">
        {photos.map((src, i) => (
          <button key={src} onClick={() => setOpen(i)} className="h-32 w-44 shrink-0 snap-start overflow-hidden rounded-2xl">
            <img loading="lazy" decoding="async" src={src} alt="" className="size-full object-cover transition hover:scale-105" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="fade-up fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col bg-black/95" role="dialog" aria-modal aria-label="Photo">
          <div className="flex items-center justify-between p-3 text-white">
            <span className="text-sm">{open + 1} / {photos.length}</span>
            <button aria-label="Close" onClick={() => setOpen(null)} className="grid size-10 place-items-center rounded-full hover:bg-white/10"><X className="size-6" /></button>
          </div>
          <div className="relative flex flex-1 items-center">
            <img loading="lazy" decoding="async" src={photos[open]} alt="" className="max-h-full w-full object-contain" />
            <button aria-label="Previous" className="absolute inset-y-0 left-0 w-1/3" onClick={() => setOpen(Math.max(0, open - 1))} />
            <button aria-label="Next" className="absolute inset-y-0 right-0 w-1/3" onClick={() => setOpen(Math.min(photos.length - 1, open + 1))} />
          </div>
        </div>
      )}
    </>
  );
}

function Action({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 rounded-2xl border border-line py-3 text-xs font-semibold hover:bg-bg-soft [&_svg]:size-5 [&_svg]:text-orange-text">
      {icon}{label}
    </button>
  );
}

export function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-medium hover:bg-bg-soft [&_svg]:size-5 ${danger ? 'text-danger' : ''}`}>
      {icon}{label}
    </button>
  );
}

export function ReportSheet({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const [reason, setReason] = useState('');
  const [desc, setDesc] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  return (
    <Sheet open={open} onClose={onClose} title={`Report ${user.profile.firstName}`}>
      <p className="mb-4 text-sm text-muted">Reports are confidential. Our team reviews every report.</p>
      <Field label="Reason" required><ChipSingle value={reason} onChange={setReason} options={REPORT_REASONS} /></Field>
      <Field label="What happened?"><TextArea value={desc} onChange={(e) => setDesc(e.target.value)} max={500} placeholder="Add any details that will help us." /></Field>
      <Toggle checked={alsoBlock} onChange={setAlsoBlock} label="Also block this member" sub="They won’t be able to see or message you." />
      <Button size="lg" className="mt-3" disabled={!reason} onClick={() => {
        report(user.id, reason, desc);
        if (alsoBlock) block(user.id);
        toast('Thanks. Your report was sent.');
        onClose();
      }}>Submit report</Button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-faint">{alsoBlock ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />} If you feel unsafe, call 911 or campus police.</p>
    </Sheet>
  );
}
