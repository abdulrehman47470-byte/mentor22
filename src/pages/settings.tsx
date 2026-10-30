import {
  Accessibility as AccessibilityIcon, Award, Ban, Bell, BookOpen, Briefcase, Building2, CalendarClock, CalendarDays, ChevronRight, Clock, ExternalLink, Eye, FileText, GraduationCap,
  HeartHandshake, HelpCircle, KeyRound, LifeBuoy, LogOut, MessageCircle, MessageSquareText, Phone, ScrollText, ShieldAlert, ShieldCheck, Siren, Trash2, UserCheck, UserPen, UserPlus,
} from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { L, type LabelKey } from '@/data/labels';
import { HELP_REASONS, LINKS, RESOURCE_ITEMS, SETTINGS, type SettingsItem } from '@/data/options';
import { POLICIES, type PolicyKey } from '@/data/policies';
import { Avatar, Button, Card, Empty, Field, Header, Input, Mark, Page, PasswordInput, PoweredBy, SectionTitle, Select, Sheet, TextArea, Toggle, ask, openExternal, toast } from '@/components/ui';
import { PolicyBody } from '@/components/policy';
import { Strength } from '@/pages/auth';
import {
  changePassword, deleteAccount, fullName, isAdmin, isMentorType, markNotificationsRead, sendHelp, setPushEnabled, setReduceMotion, setTextScale, signOut, strongPassword, unblock, userById, validEmail,
} from '@/lib/api';
import { askPushPermission } from '@/lib/push';
import { cn, timeAgo, useDb, useMe } from '@/lib/store';
import type { AppNotification } from '@/lib/types';
import { resourceImage } from '@/data/media';

const ICONS: Record<AppNotification['type'], React.ReactNode> = {
  view_profile: <Eye />, request: <UserPlus />, accepted: <UserCheck />, chat: <MessageCircle />, meeting: <CalendarDays />, call: <Phone />, system: <Bell />,
};

/** Each notification type opens its screen (architecture: type tells the app where to go). */
function target(n: AppNotification) {
  switch (n.type) {
    case 'view_profile': return `/member/${n.relatedId}`;
    case 'request': return '/connections';
    case 'accepted': return `/member/${n.relatedId}`;
    case 'chat': return `/messages/${n.relatedId}`;
    case 'meeting': return '/meetings';
    case 'call': return `/messages/${n.relatedId}`;
    default: return null;
  }
}

/** Notifications: title, description, time and photo (content document, section 10). */
export function Notifications() {
  const nav = useNavigate();
  const list = useDb((d) => d.notifications.filter((n) => n.userId === d.sessionUserId));
  const users = useDb((d) => d.users);
  const unread = list.some((n) => !n.read);
  return (
    <div>
      <Header title={L.notifications} back right={unread && <button onClick={markNotificationsRead} className="text-sm font-semibold text-orange-text">Mark all read</button>} />
      <ul className="divide-y divide-line">
        {list.map((n) => {
          const from = users.find((u) => u.id === n.relatedId);
          return (
            <li key={n.id}>
              <button onClick={() => { const t = target(n); if (t) nav(t); }} className={cn('flex w-full items-start gap-3 px-gutter py-3 text-left hover:bg-bg-soft', !n.read && 'bg-orange-fill/50')}>
                {from ? <Avatar user={from} size={40} /> : <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-fill text-orange-text [&_svg]:size-5">{ICONS[n.type]}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{n.title}</span>
                  <span className="block text-sm text-muted">{n.body}</span>
                  <span className="text-xs text-faint">{timeAgo(n.createdAt)}</span>
                </span>
                {!n.read && <span className="mt-2 size-2.5 rounded-full bg-orange" />}
              </button>
            </li>
          );
        })}
      </ul>
      {!list.length && <Empty icon={<Bell className="size-7" />} title={L.no_data} />}
    </div>
  );
}

function Row({ icon, label, to, onClick, sub, danger, external }: { icon: React.ReactNode; label: string; to?: string; onClick?: () => void; sub?: string; danger?: boolean; external?: boolean }) {
  const inner = (
    <span className={cn('flex items-center gap-3 px-4 py-3.5 [&>svg:first-child]:size-5', danger ? 'text-danger' : '[&>svg:first-child]:text-orange-text')}>
      {icon}
      <span className="flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        {sub && <span className="block text-xs text-faint">{sub}</span>}
      </span>
      {!danger && (external ? <ExternalLink className="size-4 text-faint" /> : <ChevronRight className="size-4 text-faint" />)}
    </span>
  );
  return to ? <Link to={to} className="block hover:bg-bg-soft">{inner}</Link> : <button onClick={onClick} className="block w-full text-left hover:bg-bg-soft">{inner}</button>;
}

// ---------- Settings menu (content document, section 4) ----------
const ITEM_ICONS: Partial<Record<LabelKey, ComponentType>> = {
  mentee_resources: BookOpen,
  mentee_training: Award,
  edvisorly_transfer_planning: GraduationCap,
  national_domestic_violence_hotline: HeartHandshake,
  suicide_prevention_hotline: LifeBuoy,
  mental_health_crisis_hotline: MessageSquareText,
  _911: Siren,
  _24_7_virtual_mental_health_counseling: Phone,
  national_crisis_hotline: ShieldAlert,
  handshake: Briefcase,
  my_college_resources: Building2,
  set_availability: CalendarClock,
  student_code_of_conduct: ScrollText,
  reset_password: KeyRound,
  accessibility: AccessibilityIcon,
  help_and_support: HelpCircle,
  terms_of_service: FileText,
  confidentiality: ShieldCheck,
  privacy_policy: ShieldCheck,
};

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/** Runs a Settings item: opens a screen, an outside link (after the Disclaimer), a call or a text. */
function useRunItem() {
  const nav = useNavigate();
  return async (item: SettingsItem) => {
    const a = item.action;
    if (a.kind === 'route') return nav(a.to);
    if (a.kind === 'external') return openExternal(a.url === 'edvisorly' ? (isIos() ? LINKS.edvisorlyIos : LINKS.edvisorlyAndroid) : a.url, a.notice ?? true);
    if (a.kind === 'sms') {
      if ((await ask({ title: L[item.label], message: `Text ${a.body} to ${a.number}.`, confirm: 'Text', cancel: L.cancel })) === null) return;
      return void (location.href = `sms:${a.number}${isIos() ? '&' : '?'}body=${a.body}`);
    }
    if (a.notice && (await ask({ title: L[item.label], message: `This will call ${a.number}.`, confirm: L.get_help_now, cancel: L.cancel })) === null) return;
    location.href = `tel:${a.number.replace(/[^\d+]/g, '')}`;
  };
}

function ItemRow({ item }: { item: SettingsItem }) {
  const run = useRunItem();
  const Icon = ITEM_ICONS[item.label] ?? ChevronRight;
  const a = item.action;
  const sub = a.kind === 'call' ? a.number : a.kind === 'sms' ? `Text ${a.body} to ${a.number}` : undefined;
  return <Row icon={<Icon />} label={L[item.label]} sub={sub} onClick={() => run(item)} external={a.kind === 'external'} />;
}

const group = 'divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface';

export function Settings() {
  const me = useMe()!;
  const nav = useNavigate();
  const push = useDb((d) => d.pushEnabled);
  const admin = useDb((d) => isAdmin(d));
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div>
      <Header title={L.settings} back />
      <Page>
        <Card className="flex items-center gap-3">
          <Avatar user={me} size={52} />
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{fullName(me)}</p><p className="truncate text-sm text-muted">{me.email}</p></div>
        </Card>
        <SectionTitle>Account</SectionTitle>
        <div className={group}>
          <Row icon={<UserPen />} label={L.edit_profile} to="/profile/edit" />
          {isMentorType(me.role) && <Row icon={<Clock />} label={L.set_availability} to="/availability" />}
          {admin && <Row icon={<ShieldCheck />} label="Super Admin panel" sub="Admin only · Users, branding, push, content" to="/admin" />}
          <Row icon={<Ban />} label="Blocked members" to="/blocked" />
        </div>
        <SectionTitle>{L.notifications}</SectionTitle>
        <div className={cn(group, 'px-4')}>
          <Toggle checked={push} onChange={async (v) => {
            setPushEnabled(v);
            if (v) {
              const r = await askPushPermission();
              toast(r === 'granted' ? 'Push notifications on' : 'In-app notifications on');
            }
          }} label="Push notifications" sub="Requests, messages, meetings and calls" />
        </div>
        {SETTINGS.map((g) => (
          <div key={g.title}>
            <SectionTitle>{g.title}</SectionTitle>
            <div className={group}>
              {g.items.filter((i) => !(i.label === 'set_availability' && isMentorType(me.role))).map((i) => <ItemRow key={i.label} item={i} />)}
            </div>
          </div>
        ))}
        <div className={cn(group, 'mt-5')}>
          <Row icon={<LogOut />} label={L.sign_out} danger onClick={async () => {
            if ((await ask({ message: L.are_you_sure_you_want_to_logout_q, danger: true, confirm: L.sign_out })) === null) return;
            signOut();
            toast(L.logout_successfully);
            nav('/welcome', { replace: true });
          }} />
          <Row icon={<Trash2 />} label="Delete account" danger onClick={() => setConfirmDelete(true)} />
        </div>
        <div className="mt-8 flex flex-col items-center gap-1 pb-6 text-center">
          <Mark size={40} />
          <p className="mt-1 text-xs font-semibold">{BRAND.appName}</p>
          <p className="text-xs text-faint">{L.mentor_match_educational_purpose_only}</p>
          <PoweredBy className="mt-3" />
        </div>
      </Page>
      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete account?">
        <p className="text-muted">This permanently removes your profile, connections and messages. This can’t be undone.</p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)}>{L.cancel}</Button>
          <Button variant="danger" className="flex-1" onClick={() => { deleteAccount(); nav('/welcome', { replace: true }); }}>Delete</Button>
        </div>
      </Sheet>
    </div>
  );
}

/** "Mentee Resources" sub-menu: Mentee Training and EDvisorly Transfer Planning. */
export function ResourcesMenu() {
  return (
    <div>
      <Header title={L.mentee_resources} back />
      <Page>
        <div className={group}>
          {RESOURCE_ITEMS.map((i) => <ItemRow key={i.label} item={i} />)}
        </div>
      </Page>
    </div>
  );
}

const CERTIFICATES = [
  { id: 't1', title: 'Mentee Orientation', completedAt: '2026-09-02T17:00:00Z' },
  { id: 't2', title: 'Making the Most of Your Mentor', completedAt: '2026-09-15T17:00:00Z' },
  { id: 't3', title: 'Professional Communication', completedAt: null },
];

/** Mentee Training: training certificates (loaded per college after log-in; demo entries here). */
export function Training() {
  return (
    <div>
      <Header title={L.mentee_training} back />
      <Page>
        <SectionTitle>{L.training_certificates}</SectionTitle>
        <div className="space-y-3">
          {CERTIFICATES.map((c) => (
            <Card key={c.id} className="flex items-center gap-3.5">
              <span className={cn('grid size-12 shrink-0 place-items-center rounded-xl', c.completedAt ? 'bg-success/10 text-success' : 'bg-orange-fill text-orange-text')}><Award className="size-6" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs text-faint">{c.completedAt ? `${L.completed} · ${new Date(c.completedAt).toLocaleDateString()}` : L.pending}</p>
              </div>
            </Card>
          ))}
        </div>
      </Page>
    </div>
  );
}

/** myCollege Resources: the college's own list, managed by Super Admins (Admin → Content). */
export function Resources() {
  const resources = useDb((d) => d.resources);
  const cats = [...new Set(resources.map((r) => r.category))];
  return (
    <div>
      <Header title={L.my_college_resources} back />
      <Page>
        <Card className="mb-2 flex items-center gap-3 border-orange/40 bg-orange-fill">
          <LifeBuoy className="size-6 text-orange-text" />
          <div className="flex-1"><p className="font-semibold">Need help now?</p><p className="text-sm text-muted">{L.suicide_prevention_hotline}: call <b>988</b> · {L.emergency}: <b>911</b></p></div>
        </Card>
        {cats.map((c) => (
          <div key={c}>
            <div className="relative mb-2 mt-5 h-24 overflow-hidden rounded-2xl">
              <img loading="lazy" decoding="async" src={resourceImage(c)} alt="" className="size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-navy/85 via-navy/40 to-transparent" />
              <p className="font-display absolute bottom-3 left-4 text-lg font-bold text-white">{c}</p>
            </div>
            <div className="space-y-2">
              {resources.filter((r) => r.category === c).map((r) => (
                <button key={r.id} onClick={() => openExternal(r.url)} className="block w-full text-left">
                  <Card className="flex items-start gap-3 hover:border-line-strong">
                    <div className="flex-1"><p className="font-semibold">{r.title}</p><p className="text-sm text-muted">{r.description}</p></div>
                    <ExternalLink className="size-4 text-faint" />
                  </Card>
                </button>
              ))}
            </div>
          </div>
        ))}
        {!resources.length && <Empty icon={<Building2 className="size-7" />} title={L.no_college_resource} />}
      </Page>
    </div>
  );
}

export function Blocked() {
  const ids = useDb((d) => d.blocks.filter((b) => b.userId === d.sessionUserId).map((b) => b.blockedId));
  const users = useDb((d) => ids.map((id) => userById(id, d)!).filter(Boolean));
  return (
    <div>
      <Header title="Blocked members" back />
      <ul className="divide-y divide-line">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 px-gutter py-3">
            <Avatar user={u} size={44} />
            <span className="flex-1 font-semibold">{fullName(u)}</span>
            <Button size="sm" variant="outline" onClick={() => { unblock(u.id); toast(`${u.profile.firstName} unblocked`); }}>{L.unblock}</Button>
          </li>
        ))}
      </ul>
      {!users.length && <Empty icon={<Ban className="size-7" />} title={L.no_data} />}
    </div>
  );
}

/** Older link names for the policy pages. */
const ALIASES: Record<string, PolicyKey> = { guidelines: 'code-of-conduct' };

/** Policy pages: the admin-editable copy (Admin → Content). Open to everyone. */
export function Legal() {
  const { key = 'terms' } = useParams();
  const k = (ALIASES[key] ?? key) as PolicyKey;
  const body = useDb((d) => d.cms[k]);
  if (!POLICIES[k]) return <Navigate to="/" replace />;
  return (
    <div>
      <Header title={POLICIES[k].title} back />
      <Page>
        <PolicyBody body={body ?? POLICIES[k].body} />
      </Page>
    </div>
  );
}

export function ResetPassword() {
  const nav = useNavigate();
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  return (
    <div>
      <Header title={L.reset_password} back />
      <form
        noValidate
        className="px-gutter py-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!cur) return setErr(L.please_enter_current_password);
          if (!strongPassword(cur)) return setErr(L.please_enter_valid_current_password);
          if (!pw) return setErr(L.please_enter_new_password);
          if (!strongPassword(pw)) return setErr(L.password_length_must_be_xx_digit_only.replace('xx', String(BRAND.minPassword)));
          if (!confirm) return setErr(L.please_enter_confirm_password);
          if (pw !== confirm) return setErr(L.new_password_and_confirm_must_same);
          const r = changePassword(cur, pw);
          if ('error' in r) return setErr(r.error);
          toast(L.your_password_has_been_reset_successfully);
          nav('/settings', { replace: true });
        }}
      >
        <p className="mb-5 text-sm text-muted">{L.your_new_password_should_be_different_from_previously_used}</p>
        <Field label={L.current_password}><PasswordInput autoComplete="current-password" value={cur} onChange={(e) => (setCur(e.target.value), setErr(''))} placeholder={L.current_password} /></Field>
        <Field label={L.new_password}><PasswordInput autoComplete="new-password" value={pw} onChange={(e) => (setPw(e.target.value), setErr(''))} placeholder={L.new_password} /></Field>
        <Strength password={pw} />
        <Field label={L.confirm_new_password}><PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => (setConfirm(e.target.value), setErr(''))} placeholder={L.confirm_new_password} /></Field>
        {err && <p className="mb-3 rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger" role="alert">{err}</p>}
        <Button size="lg" type="submit">{L.reset_password}</Button>
      </form>
    </div>
  );
}

/** The web can't open the phone's accessibility settings, so the useful ones live here. */
export function AccessibilityPage() {
  const scale = useDb((d) => d.device.textScale);
  const reduce = useDb((d) => d.device.reduceMotion);
  const sizes = [
    { v: 1, label: 'Default' },
    { v: 1.125, label: 'Large' },
    { v: 1.25, label: 'Larger' },
  ];
  return (
    <div>
      <Header title={L.accessibility} back />
      <Page>
        <Card>
          <p className="mb-3 font-semibold">Text size</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Text size">
            {sizes.map((s) => (
              <button key={s.v} role="radio" aria-checked={scale === s.v} onClick={() => setTextScale(s.v)} className={cn('rounded-xl border py-3 font-semibold transition', scale === s.v ? 'border-navy bg-navy text-white' : 'border-line-strong')} style={{ fontSize: 14 * s.v }}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-3 border-t border-line pt-1">
            <Toggle checked={reduce} onChange={setReduceMotion} label="Reduce motion" sub="Turns off animations." />
          </div>
        </Card>
        <p className="mt-4 text-sm text-muted">For screen readers, contrast and other options, use your phone’s accessibility settings. This app supports them.</p>
      </Page>
    </div>
  );
}

/** Help & Support. Name and email are sent along with the reason and message. */
export function HelpSupport() {
  const nav = useNavigate();
  const user = useMe()!;
  const [reason, setReason] = useState('');
  const [name, setName] = useState(fullName(user));
  const [email, setEmail] = useState(user.email);
  const [message, setMessage] = useState('');
  const [err, setErr] = useState('');
  return (
    <div>
      <Header title={L.help_and_support} back />
      <form
        noValidate
        className="px-gutter py-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!reason) return setErr(L.please_select_reason);
          if (!name.trim()) return setErr(L.please_enter_name);
          if (!email.trim()) return setErr(L.please_enter_email_address);
          if (!validEmail(email)) return setErr(L.please_enter_a_valid_email_address);
          if (!message.trim()) return setErr(L.please_enter_message);
          sendHelp({ reason, name: name.trim(), email: email.trim(), message: message.trim() });
          toast('Thank you. We received your message.');
          nav('/settings', { replace: true });
        }}
      >
        <Field label={L.help_and_support_reason}><Select value={reason} onChange={(v) => (setReason(v), setErr(''))} options={HELP_REASONS} placeholder={L.select_reason} /></Field>
        <Field label={L.name}><Input value={name} onChange={(e) => (setName(e.target.value), setErr(''))} autoComplete="name" /></Field>
        <Field label={L.email}><Input type="email" value={email} onChange={(e) => (setEmail(e.target.value), setErr(''))} autoComplete="email" /></Field>
        <Field label={L.message}><TextArea value={message} onChange={(e) => (setMessage(e.target.value), setErr(''))} placeholder={L.write_your_message} rows={5} max={1000} /></Field>
        {err && <p className="mb-3 rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm font-medium text-danger" role="alert">{err}</p>}
        <Button size="lg" type="submit">{L.submit}</Button>
        <p className="mt-5 text-center text-xs text-faint">{BRAND.supportEmail} · {BRAND.supportPhone}</p>
      </form>
    </div>
  );
}
