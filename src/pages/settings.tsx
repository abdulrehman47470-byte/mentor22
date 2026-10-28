import {
  Accessibility as AccessibilityIcon, Award, Bell, BookOpen, Briefcase, CalendarClock, ChevronRight, ExternalLink, FileText, GraduationCap, HeartHandshake, HelpCircle,
  KeyRound, LifeBuoy, LogOut, MessageSquareText, Phone, ScrollText, ShieldAlert, ShieldCheck, Siren, Building2,
} from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { L, type LabelKey } from '@/data/labels';
import { CERTIFICATES } from '@/data/mock';
import { HELP_REASONS, LINKS, RESOURCE_ITEMS, SETTINGS, type SettingsItem } from '@/data/options';
import { POLICIES, type PolicyKey } from '@/data/policies';
import { Avatar, Button, Card, Empty, Field, Header, Input, Mark, PasswordInput, Select, TextArea, Toggle, ask, openExternal, toast } from '@/components/ui';
import { PolicyBody } from '@/components/policy';
import { Strength } from '@/pages/auth';
import { changePassword, collegeName, collegeResources, fullName, markNotificationsRead, sendHelp, setReduceMotion, setTextScale, signOut, strongPassword, validEmail } from '@/lib/api';
import { cn, timeAgo, useDb, useMe } from '@/lib/store';

const ICONS: Partial<Record<LabelKey, ComponentType<{ className?: string }>>> = {
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

function ItemRow({ item, detail }: { item: SettingsItem; detail?: string }) {
  const run = useRunItem();
  const Icon = ICONS[item.label] ?? ChevronRight;
  const a = item.action;
  const hint = detail ?? (a.kind === 'call' ? a.number : a.kind === 'sms' ? `Text ${a.body} to ${a.number}` : undefined);
  return (
    <button onClick={() => run(item)} className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition hover:bg-bg-soft">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-light text-brand">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">{L[item.label]}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      {a.kind === 'external' ? <ExternalLink className="size-4 text-muted" /> : <ChevronRight className="size-5 text-muted" />}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted">{title}</h2>
      <div className="shadow-card divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">{children}</div>
    </section>
  );
}

export function Settings() {
  const nav = useNavigate();
  const user = useMe()!;
  return (
    <div className="min-h-app pb-10">
      <Header title={L.settings} back />
      <div className="px-4 py-4">
        <Card onClick={() => nav('/profile')} className="mb-5 flex items-center gap-3.5">
          <Avatar user={user} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-ink">{fullName(user)}</p>
            <p className="truncate text-sm text-muted">{collegeName(user)}</p>
          </div>
          <ChevronRight className="size-5 text-muted" />
        </Card>
        {SETTINGS.map((g) => (
          <Group key={g.title} title={g.title}>
            {g.items.map((i) => (
              <ItemRow key={i.label} item={i} />
            ))}
          </Group>
        ))}
        <Button
          size="lg"
          variant="outline"
          className="mt-6 text-danger"
          onClick={async () => {
            if ((await ask({ message: L.are_you_sure_you_want_to_logout_q, danger: true, confirm: L.sign_out })) === null) return;
            signOut();
            toast(L.logout_successfully);
            nav('/welcome', { replace: true });
          }}
        >
          <LogOut className="size-5" />
          {L.sign_out}
        </Button>
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <Mark size={14} />
          {L.app_name} · {L.mentor_match_educational_purpose_only}
        </p>
      </div>
    </div>
  );
}

/** "Mentee Resources" sub-menu. */
export function ResourcesMenu() {
  return (
    <div className="min-h-app">
      <Header title={L.mentee_resources} back="/settings" />
      <div className="px-4 py-4">
        <Group title={L.mentee_resources}>
          {RESOURCE_ITEMS.map((i) => (
            <ItemRow key={i.label} item={i} />
          ))}
        </Group>
      </div>
    </div>
  );
}

/** Mentee Training: training certificates (loaded per college after login). */
export function Training() {
  return (
    <div className="min-h-app">
      <Header title={L.mentee_training} back />
      <div className="px-4 py-4">
        <h2 className="mb-3 text-[17px] font-bold text-brand-dark">{L.training_certificates}</h2>
        <div className="space-y-3">
          {CERTIFICATES.map((c) => (
            <Card key={c.id} className="flex items-center gap-3.5">
              <span className={cn('grid size-12 shrink-0 place-items-center rounded-xl', c.completedAt ? 'bg-success/10 text-success' : 'bg-brand-light text-brand')}>
                <Award className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{c.title}</p>
                <p className="text-xs text-muted">{c.completedAt ? `${L.completed} · ${new Date(c.completedAt).toLocaleDateString()}` : L.pending}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/** myCollege Resources: the college's own resource list. */
export function CollegeResources() {
  const user = useMe()!;
  const list = collegeResources(user.collegeId);
  return (
    <div className="min-h-app">
      <Header title={L.my_college_resources} sub={collegeName(user)} back />
      <div className="space-y-3 px-4 py-4">
        {list.map((r) => (
          <Card key={r.id} className="flex gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-light text-brand">
              <Building2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{r.title}</p>
              <p className="mt-0.5 text-sm text-muted">{r.description}</p>
            </div>
          </Card>
        ))}
        {!list.length && <Empty icon={<Building2 className="size-7" />} title={L.no_college_resource} />}
      </div>
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
    <div className="min-h-app">
      <Header title={L.reset_password} back />
      <form
        noValidate
        className="px-4 py-5"
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
        {err && <p className="mb-3 rounded-xl bg-danger/8 px-3.5 py-2.5 text-sm font-medium text-danger" role="alert">{err}</p>}
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
    <div className="min-h-app">
      <Header title={L.accessibility} back />
      <div className="px-4 py-5">
        <Card>
          <p className="mb-3 font-semibold text-ink">Text size</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Text size">
            {sizes.map((s) => (
              <button key={s.v} role="radio" aria-checked={scale === s.v} onClick={() => setTextScale(s.v)} className={cn('rounded-xl border py-3 font-semibold transition', scale === s.v ? 'border-brand bg-brand text-white' : 'border-line-strong text-ink')} style={{ fontSize: 14 * s.v }}>
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-3 border-t border-line pt-1">
            <Toggle checked={reduce} onChange={setReduceMotion} label="Reduce motion" sub="Turns off animations." />
          </div>
        </Card>
        <p className="mt-4 text-sm text-muted">For screen readers, contrast and other options, use your phone’s accessibility settings. This app supports them.</p>
      </div>
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
    <div className="min-h-app">
      <Header title={L.help_and_support} back />
      <form
        noValidate
        className="px-4 py-5"
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
        {err && <p className="mb-3 rounded-xl bg-danger/8 px-3.5 py-2.5 text-sm font-medium text-danger" role="alert">{err}</p>}
        <Button size="lg" type="submit">{L.submit}</Button>
        <p className="mt-5 text-center text-xs text-muted">
          {BRAND.supportEmail} · {BRAND.supportPhone}
        </p>
      </form>
    </div>
  );
}

/** Policy pages (downloaded from the server each time in the real app). Open to everyone. */
export function Policy() {
  const { key = '' } = useParams();
  const page = POLICIES[key as PolicyKey];
  if (!page) return <Navigate to="/" replace />;
  return (
    <div className="min-h-app">
      <Header title={page.title} back />
      <article className="px-5 py-5">
        <PolicyBody body={page.body} />
      </article>
    </div>
  );
}

/** Notifications: title, description, time, photo (section 10). */
export function Notifications() {
  const nav = useNavigate();
  const list = useDb((d) => d.notifications);
  const users = useDb((d) => d.users);
  const unread = list.some((n) => !n.read);
  return (
    <div className="min-h-app">
      <Header title={L.notifications} back right={unread ? <Button size="sm" variant="ghost" onClick={markNotificationsRead}>{L.clear_all}</Button> : undefined} />
      <ul className="divide-y divide-line">
        {list.map((n) => {
          const from = n.fromId ? users.find((u) => u.id === n.fromId) ?? null : null;
          return (
            <li key={n.id}>
              <button onClick={() => (markNotificationsRead(), n.link && nav(n.link))} className={cn('flex w-full gap-3 px-4 py-3.5 text-left hover:bg-bg-soft', !n.read && 'bg-brand-light/60')}>
                {from ? <Avatar user={from} size={46} /> : <span className="grid size-[46px] shrink-0 place-items-center rounded-full bg-brand-light text-brand"><Bell className="size-5" /></span>}
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-semibold text-ink">{n.title}</span>
                    <span className="shrink-0 text-xs text-muted">{timeAgo(n.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{n.body}</span>
                </span>
                {!n.read && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
              </button>
            </li>
          );
        })}
      </ul>
      {!list.length && <Empty icon={<Bell className="size-7" />} title={L.no_data} />}
    </div>
  );
}
