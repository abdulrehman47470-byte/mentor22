import { Ban, Bell, BookOpen, CalendarPlus, Camera, Check, ChevronRight, Clock, Eye, EyeOff, FileText, Flag, HeartHandshake, LifeBuoy, Link2, LogOut, Mail, MessageCircle, MoreHorizontal, Pencil, Phone, Settings as SettingsIcon, Shield, ShieldCheck, Trash2, UserCheck, UserMinus, UserPlus, Video, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Avatar, Badge, Button, Card, ChipSingle, Empty, Field, Header, PoweredBy, SectionTitle, Sheet, TextArea, Toggle, toast, ask } from '@/components/ui';
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
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{fullName(user)}</h1>
      {p.pronouns && <p className="text-sm text-faint">{p.pronouns}</p>}
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {p.classification && <Badge>{p.classification}</Badge>}
        {p.affiliation && <Badge tone="orange">{p.affiliation}</Badge>}
        {user.role === 'super_admin' && <Badge tone="red">Super Admin</Badge>}
      </div>
      {p.college && <p className="mt-2 px-4 text-sm text-muted">{p.college}</p>}
    </div>
  );
}

// ---------- My profile ----------
export function MyProfile() {
  const user = useMe()!;
  const pendingMeetings = useDb((d) => d.meetings.filter((m) => m.invitee === d.sessionUserId && m.status === 'pending').length);
  const input = useRef<HTMLInputElement>(null);
  const pct = profileCompleteness(user.profile);
  const mentor = isMentorType(user.role);
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
      <Hero user={user}>
        <button className="relative" onClick={() => input.current?.click()} aria-label="Change photo">
          <Avatar user={user} size={112} ring />
          <span className="absolute bottom-0 right-0 grid size-9 place-items-center rounded-full bg-navy text-white"><Camera className="size-4" /></span>
        </button>
      </Hero>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      <div className="px-4 pb-6">
        <Card className="mt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Profile {pct}% complete</span>
            <Link to="/profile/edit" className="font-semibold text-orange-text">{pct < 100 ? 'Finish it' : 'Edit'}</Link>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-soft"><div className="brand-gradient h-full rounded-full" style={{ width: `${pct}%` }} /></div>
        </Card>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link to="/profile/edit"><Button variant="outline" className="w-full"><Pencil className="size-4" /> Edit profile</Button></Link>
          {mentor ? (
            <Link to="/availability"><Button variant="outline" className="w-full"><Clock className="size-4" /> Availability</Button></Link>
          ) : (
            <Link to="/search"><Button variant="outline" className="w-full"><UserPlus className="size-4" /> Find mentors</Button></Link>
          )}
        </div>
        <Link to="/meetings">
          <Card className="mt-3 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-orange-fill text-orange-text"><CalendarPlus className="size-5" /></span>
            <span className="flex-1"><span className="block font-semibold">My meetings</span><span className="text-xs text-faint">Upcoming, requests and booking</span></span>
            {pendingMeetings > 0 && <Badge tone="orange">{pendingMeetings} new</Badge>}
          </Card>
        </Link>
        {mentor && (
          <Card className="mt-3 py-1">
            <Toggle checked={user.profileVisible} onChange={(v) => { setProfileVisible(v); toast(v ? 'Your profile is visible' : 'Your profile is hidden'); }}
              label="Show my profile" sub={user.profileVisible ? 'Mentees can find you in Discover and Search.' : 'Hidden: no new requests. Current connections stay.'} />
          </Card>
        )}
        <ProfileSections user={user} />
        <ControlCenter />
      </div>
    </div>
  );
}

function Row({ icon, label, sub, to, onClick, badge, danger }: { icon: React.ReactNode; label: string; sub?: string; to?: string; onClick?: () => void; badge?: number; danger?: boolean }) {
  const nav = useNavigate();
  return (
    <button type="button" onClick={() => (to ? nav(to) : onClick?.())} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-bg-soft">
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl [&>svg]:size-[18px]', danger ? 'bg-danger/10 text-danger' : 'bg-orange-fill text-orange-text')}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-[15px] font-medium', danger && 'text-danger')}>{label}</span>
        {sub && <span className="block truncate text-xs text-faint">{sub}</span>}
      </span>
      {!!badge && <Badge tone="orange">{badge}</Badge>}
      {!danger && <ChevronRight className="size-4 text-faint" />}
    </button>
  );
}

/** All settings and the Admin panel, in one simple list at the bottom of the profile. */
function ControlCenter() {
  const nav = useNavigate();
  const me = useMe()!;
  const push = useDb((d) => d.pushEnabled);
  const unread = useDb((d) => d.notifications.filter((n) => n.userId === d.sessionUserId && !n.read).length);
  const admin = useDb((d) => isAdmin(d));
  const openReports = useDb((d) => d.reports.filter((r) => (r.status ?? 'open') === 'open').length);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const group = 'divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface';
  return (
    <section aria-label="Settings">
      {admin && (<>
      <SectionTitle>Admin</SectionTitle>
      <Link to="/admin" className="navy-gradient flex items-center gap-3 rounded-2xl p-4 text-white shadow-premium active:scale-[0.99]">
        <span className="grid size-11 place-items-center rounded-xl bg-orange text-white"><ShieldCheck className="size-6" /></span>
        <span className="flex-1">
          <span className="block font-semibold">Admin panel</span>
          <span className="block text-xs text-white/70">Members, matches, reports, push, content</span>
        </span>
        {openReports > 0 && <span className="rounded-full bg-danger px-2 py-0.5 text-xs font-bold">{openReports}</span>}
        <ChevronRight className="size-5 text-white/70" />
      </Link>
      </>)}

      <SectionTitle>Settings</SectionTitle>
      <div className={group}>
        <Row icon={<Pencil />} label="Edit profile" to="/profile/edit" />
        {isMentorType(me.role) && <Row icon={<Clock />} label="My availability" to="/availability" />}
        <Row icon={<UserPlus />} label="Send invites" sub={isMentorType(me.role) ? 'Invite mentees to connect' : 'Invite mentors to connect'} to="/invite" />
        <Row icon={<CalendarPlus />} label="My meetings" to="/meetings" />
        <Row icon={<Bell />} label="Notifications" to="/notifications" badge={unread} />
        <div className="px-4">
          <Toggle checked={push} onChange={async (v) => {
            setPushEnabled(v);
            if (v) {
              const r = await askPushPermission();
              toast(r === 'granted' ? 'Push notifications on' : 'In-app notifications on');
            } else toast('Push notifications off');
          }} label="Push notifications" sub="Requests, messages, meetings and calls" />
        </div>
      </div>

      <SectionTitle>Help & safety</SectionTitle>
      <div className={group}>
        <Row icon={<BookOpen />} label="Resources" to="/resources" />
        <Row icon={<HeartHandshake />} label="Community guidelines" to="/legal/guidelines" />
        <Row icon={<Ban />} label="Blocked members" to="/blocked" />
        <Row icon={<LifeBuoy />} label={BRAND.crisisLine.label} sub={`Call or text ${BRAND.crisisLine.phone}, 24/7`} onClick={() => (window.location.href = `tel:${BRAND.crisisLine.phone}`)} />
        <Row icon={<Mail />} label="Contact support" sub={BRAND.supportEmail} onClick={() => (window.location.href = `mailto:${BRAND.supportEmail}`)} />
        <Row icon={<FileText />} label="Terms of Use" to="/legal/terms" />
        <Row icon={<Shield />} label="Privacy Policy" to="/legal/privacy" />
      </div>

      <div className={cn(group, 'mt-5')}>
        <Row icon={<LogOut />} label={L.sign_out} danger onClick={async () => {
          if ((await ask({ message: L.are_you_sure_you_want_to_logout_q, danger: true, confirm: L.sign_out })) === null) return;
          signOut();
          toast(L.logout_successfully);
          nav('/welcome', { replace: true });
        }} />
        <Row icon={<Trash2 />} label="Delete account" danger onClick={() => setConfirmDelete(true)} />
      </div>

      <div className="mt-8 flex flex-col items-center gap-1 text-center">
        <p className="text-xs font-semibold text-faint">{BRAND.appName} · v0.1.0 (prototype)</p>
        <PoweredBy className="mt-3" />
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
      <div className="px-4">
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

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[430px] gap-3 border-t border-line bg-surface px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
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
      <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4">
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
