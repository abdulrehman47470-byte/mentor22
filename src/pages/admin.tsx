import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, Bell, CalendarClock, CalendarDays, Check, ChevronRight, Database, Download, Eye, FileText, Flag, HardDrive, HeartHandshake,
  Inbox, LayoutTemplate, LineChart, LogIn, Mail, Menu, MessageCircle, Palette, PenLine, Pencil, Plus, RotateCcw, Search as SearchIcon, Send, Server, ShieldCheck,
  Sparkles, Trash2, Upload, UserPlus, UserRoundX, UserX, Users, Wand2, X, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createContext, useContext, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { POLICIES, type PolicyKey } from '@/data/policies';
import { Avatar, Badge, Button, Card, Empty, Field, Input, SectionTitle, Select, Sheet, TextArea, Toggle, toast } from '@/components/ui';
import { AUTO_RULES, DEFAULT_TEMPLATES, INVITE_TEMPLATE } from '@/data/templates';
import {
  adminCreateMatch, adminDeleteUser, adminRemoveConnection, adminSetMeetingStatus, broadcastPush, clearAdminLog, deleteResource, exportDbJson, fillTemplate, fullName, importDbJson,
  impersonate, inviteStatus, isMentorType, matchScore, profileCompleteness, pushAudience, resendInvite, resetDemoData, resetTemplate, revokeInvite, saveResource, saveTemplate,
  sendAdminEmail, setAdminAccess, setUserRole, setUserSuspended, setUserVisible, updateCms, updateEmailBranding, updateReport, userById,
  type Db, type InviteState,
} from '@/lib/api';
import { cn, fmtDate, fmtTime, timeAgo, useDb, useMe } from '@/lib/store';
import {
  ROLE_CODES, type Connection, type EmailBranding, type EmailTemplate, type EmailTemplateKey, type Meeting, type PushAudience, type Report, type ReportStatus, type Resource, type Role, type User,
} from '@/lib/types';

/** Admin console navigation, grouped like the web console. */
export const ADMIN_NAV = [
  { group: 'Program', items: [['overview', 'Overview', LineChart], ['mentorships', 'Mentorships', HeartHandshake], ['meetings', 'Meetings', CalendarDays]] },
  { group: 'Outreach', items: [['invitations', 'Invitations', Send], ['compose', 'Compose email', PenLine], ['templates', 'Email templates', LayoutTemplate], ['outbox', 'Outbox', Inbox], ['push', 'Push notifications', Bell]] },
  { group: 'Community', items: [['members', 'Members', Users], ['reports', 'Reports', Flag], ['content', 'Content & resources', FileText]] },
  { group: 'Settings', items: [['data', 'Data & storage', Database], ['branding', 'Email branding', Palette], ['team', 'Admin team', ShieldCheck], ['audit', 'Audit log', Activity]] },
] as const;
type Tab = (typeof ADMIN_NAV)[number]['items'][number][0];
const ALL_TABS = ADMIN_NAV.flatMap((g) => g.items as readonly (readonly [Tab, string, LucideIcon])[]);

/** One person an email goes to. `vars` adds per-person placeholders (e.g. match_name). */
type Recipient = { name: string; email: string; userId?: string; role?: Role; vars?: Record<string, string> };
type ComposeRequest = { recipients?: Recipient[]; templateKey?: EmailTemplateKey; reason?: string };

const AdminCtx = createContext<{ go: (t: Tab) => void; compose: (c: ComposeRequest) => void }>({ go: () => {}, compose: () => {} });
const useAdmin = () => useContext(AdminCtx);

const recipientOf = (u: User, vars?: Record<string, string>): Recipient => ({ name: fullName(u), email: u.email, userId: u.id, role: u.role, vars });

const ROLES: Role[] = ['mentor', 'mentee', 'peer_mentor', 'professional', 'super_admin'];
const ROLE_LABEL: Record<Role, string> = { mentor: 'Mentor', mentee: 'Mentee', peer_mentor: 'Peer Mentor', professional: 'Professional', super_admin: 'Super Admin' };
const DAY = 86_400_000;

// ---------- small shared pieces ----------

/** Downloads rows as a CSV file. */
function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const blob = new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${BRAND.id}-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('CSV downloaded');
}

function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string, number?][] }) {
  return (
    <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-bg-soft p-1">
      {options.map(([k, label, n]) => (
        <button key={k} type="button" onClick={() => onChange(k)} aria-pressed={value === k}
          className={cn('flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition', value === k ? 'bg-surface text-navy shadow-premium' : 'text-faint')}>
          {label}
          {n !== undefined && <span className={cn('rounded-full px-1.5 text-[11px]', value === k ? 'bg-orange-fill text-orange-text' : 'bg-line')}>{n}</span>}
        </button>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-10" />
    </div>
  );
}

function UserPick({ value, onChange, users, placeholder }: { value: string; onChange: (v: string) => void; users: User[]; placeholder: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={cn('w-full appearance-none rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-[15px] outline-none focus:border-orange focus:ring-2 focus:ring-orange/25', !value && 'text-faint')}>
      <option value="">{placeholder}</option>
      {users.map((u) => <option key={u.id} value={u.id} className="text-text">{fullName(u)} · {ROLE_LABEL[u.role]}</option>)}
    </select>
  );
}

function Confirm({ open, title, body, action, danger, onConfirm, onClose }: { open: boolean; title: string; body: string; action: string; danger?: boolean; onConfirm: () => void; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p className="text-muted">{body}</p>
      <div className="mt-5 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={() => { onConfirm(); onClose(); }}>{action}</Button>
      </div>
    </Sheet>
  );
}

function Stat({ label, value, sub, icon, onClick, tone }: { label: string; value: number | string; sub?: string; icon: React.ReactNode; onClick?: () => void; tone?: 'alert' }) {
  return (
    <Card onClick={onClick} className="p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-faint">{label}</p>
        <span className={cn('grid size-8 place-items-center rounded-xl [&_svg]:size-4', tone === 'alert' ? 'bg-danger/10 text-danger' : 'bg-orange-fill text-orange-text')}>{icon}</span>
      </div>
      <p className="font-display mt-1 text-[28px] font-extrabold leading-none">{value}</p>
      {sub && <p className="mt-1.5 text-[11px] font-medium text-faint">{sub}</p>}
    </Card>
  );
}

const reportStatus = (r: Report): ReportStatus => r.status ?? 'open';


// ---------- charts (tiny inline SVG, theme colours) ----------

function Sparkline({ values, color = 'var(--navy-2)' }: { values: number[]; color?: string }) {
  const id = useMemo(() => `sg${Math.random().toString(36).slice(2, 8)}`, []);
  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * 100, 30 - ((v - min) / (max - min || 1)) * 26]);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-12 w-full overflow-visible" aria-hidden>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L100,32 L0,32 Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {last && <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} stroke="white" strokeWidth="1" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-12 items-end gap-1" aria-hidden>
      {values.map((v, i) => (
        <div key={i} className={cn('flex-1 rounded-sm', v ? (i === values.length - 1 ? 'bg-navy-2' : 'bg-navy-2/35') : 'h-[2px] bg-line')} style={v ? { height: `${Math.max(12, (v / max) * 100)}%` } : undefined} />
      ))}
    </div>
  );
}

function TrendChart({ series, labels }: { series: { values: number[]; color: string }[]; labels: string[] }) {
  const max = Math.max(4, ...series.flatMap((s) => s.values));
  const top = Math.ceil(max / 4) * 4;
  const W = 300, H = 130, L = 22, B = 18;
  const x = (i: number, n: number) => L + (i / Math.max(1, n - 1)) * (W - L - 6);
  const y = (v: number) => 6 + (1 - v / top) * (H - B - 6);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Invitation activity chart">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={L} x2={W - 4} y1={y(top * f)} y2={y(top * f)} stroke="var(--line)" />
          <text x={L - 5} y={y(top * f) + 3} textAnchor="end" fontSize="8" fill="var(--faint)">{Math.round(top * f)}</text>
        </g>
      ))}
      {series.map((s, si) => {
        const n = s.values.length;
        const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i, n)},${y(v)}`).join(' ');
        return (
          <g key={si}>
            {si === 0 && <path d={`${d} L${x(n - 1, n)},${y(0)} L${x(0, n)},${y(0)} Z`} fill={s.color} opacity="0.08" />}
            <path d={d} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" />
            <circle cx={x(n - 1, n)} cy={y(s.values[n - 1] ?? 0)} r="3" fill={s.color} stroke="white" strokeWidth="1.5" />
            <text x={x(n - 1, n) - 4} y={y(s.values[n - 1] ?? 0) - 6} textAnchor="end" fontSize="9" fontWeight="700" fill="var(--text)">{s.values[n - 1]}</text>
          </g>
        );
      })}
      {[0, Math.floor((labels.length - 1) / 2), labels.length - 1].map((i) => (
        <text key={i} x={x(i, labels.length)} y={H - 4} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'} fontSize="8" fill="var(--faint)">{labels[i]}</text>
      ))}
    </svg>
  );
}

function StackedBars({ a, b, labels }: { a: number[]; b: number[]; labels: string[] }) {
  const max = Math.max(2, ...a.map((v, i) => v + b[i]));
  return (
    <div>
      <div className="flex h-36 items-end gap-1.5 border-b border-line">
        {a.map((v, i) => (
          <div key={i} className="flex flex-1 flex-col justify-end" title={`${labels[i]}: ${v} messages, ${b[i]} emails`}>
            {b[i] > 0 && <div className="rounded-t-sm bg-[#b8863b]" style={{ height: `${(b[i] / max) * 136}px` }} />}
            {v > 0 && <div className={cn('bg-navy-2', !b[i] && 'rounded-t-sm')} style={{ height: `${(v / max) * 136}px` }} />}
            {!v && !b[i] && <div className="h-[2px] bg-line" />}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-faint">
        {labels.map((l, i) => <span key={i} className={cn('flex-1 text-center', i % 3 !== 0 && i !== labels.length - 1 && 'invisible')}>{l}</span>)}
      </div>
    </div>
  );
}

function Donut({ parts, size = 120 }: { parts: [string, number, string][]; size?: number }) {
  const total = parts.reduce((n, [, v]) => n + v, 0) || 1;
  const r = 15.915;
  let offset = 25;
  return (
    <svg viewBox="0 0 42 42" style={{ width: size, height: size }} className="shrink-0 -rotate-0" aria-hidden>
      <circle cx="21" cy="21" r={r} fill="none" stroke="var(--bg-soft)" strokeWidth="6" />
      {parts.map(([k, v, c]) => {
        const pct = (v / total) * 100;
        const el = <circle key={k} cx="21" cy="21" r={r} fill="none" stroke={c} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset} />;
        offset -= pct;
        return el;
      })}
    </svg>
  );
}

function Gauge({ pct }: { pct: number }) {
  const a = Math.PI * (1 - Math.min(100, pct) / 100);
  const ex = 50 + 40 * Math.cos(a), ey = 50 - 40 * Math.sin(a);
  return (
    <svg viewBox="0 0 100 56" className="w-full max-w-[200px]" aria-hidden>
      <path d="M10,50 A40,40 0 0 1 90,50" fill="none" stroke="var(--bg-soft)" strokeWidth="9" strokeLinecap="round" />
      <path d={`M10,50 A40,40 0 0 1 ${ex.toFixed(2)},${ey.toFixed(2)}`} fill="none" stroke="var(--navy-2)" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

function Heatmap({ grid }: { grid: number[][] }) {
  const max = Math.max(1, ...grid.flat());
  const shades = ['var(--bg-soft)', 'rgba(43,74,126,0.18)', 'rgba(43,74,126,0.38)', 'rgba(43,74,126,0.6)', 'rgba(43,74,126,0.82)', 'var(--navy-2)'];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return (
    <div>
      <div className="ml-8 grid grid-cols-12 gap-[3px] text-[8.5px] text-faint">
        {['12a', '', '4a', '', '8a', '', '12p', '', '4p', '', '8p', ''].map((h, i) => <span key={i}>{h}</span>)}
      </div>
      {grid.map((row, d) => (
        <div key={d} className="mt-[3px] flex items-center">
          <span className="w-8 text-[10px] text-faint">{days[d]}</span>
          <div className="grid flex-1 grid-cols-12 gap-[3px]">
            {row.map((v, h) => <div key={h} title={`${days[d]} ${h * 2}:00 · ${v} messages`} className="h-5 rounded-[4px]" style={{ background: shades[v ? Math.min(5, Math.ceil((v / max) * 5)) : 0] }} />)}
          </div>
        </div>
      ))}
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-faint">Less {shades.map((c) => <span key={c} className="size-2.5 rounded-sm" style={{ background: c }} />)} More</div>
    </div>
  );
}

// ---------- shared panels ----------

function Panel({ title, action, children, className }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('shadow-premium mt-4 overflow-hidden rounded-3xl border border-line/80 bg-surface', className)}>
      <div className="flex items-center gap-2 border-b border-line px-4 py-3.5">
        <h3 className="flex-1 text-[15px] font-semibold">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function BlockHeader({ icon, title, sub, actions }: { icon: React.ReactNode; title: string; sub: string; actions?: React.ReactNode }) {
  return (
    <div className="mt-8">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-navy [&_svg]:size-5">{icon}</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold leading-tight">{title}</h2>
          <p className="text-xs text-faint">{sub}</p>
        </div>
      </div>
      {actions && <div className="mt-3 flex gap-2">{actions}</div>}
    </div>
  );
}

const PillBtn = ({ children, onClick, dark }: { children: React.ReactNode; onClick: () => void; dark?: boolean }) => (
  <button onClick={onClick} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 py-2.5 text-sm font-semibold transition active:scale-[0.98] [&_svg]:size-4', dark ? 'bg-navy text-white shadow-[0_8px_20px_-10px_rgba(38,70,114,0.7)]' : 'border border-line-strong bg-surface text-navy')}>{children}</button>
);

const STATUS_STYLE: Record<InviteState, string> = {
  scheduled: 'bg-[#e8eefb] text-[#1d4ed8]', sent: 'bg-bg-soft text-navy', opened: 'bg-[#fbf1e3] text-[#9a6418]', accepted: 'bg-success/10 text-success', pending: 'bg-orange-fill text-orange-text', declined: 'bg-bg-soft text-faint',
};
function StatusPill({ s }: { s: InviteState }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize', STATUS_STYLE[s])}><span className="size-1.5 rounded-full bg-current" />{s}</span>;
}

// ---------- program data helpers ----------

function connectedCount(id: string, d: Db) {
  return d.connections.filter((c) => c.status === 'connected' && (c.from === id || c.to === id)).length;
}

type Health = 'thriving' | 'steady' | 'nudge';
/** Mentorship momentum from how recently the pair messaged. */
function pairHealth(c: Connection, d: Db): Health {
  const last = d.messages.filter((m) => (m.from === c.from && m.to === c.to) || (m.from === c.to && m.to === c.from)).reduce((t, m) => (m.createdAt > t ? m.createdAt : t), '');
  const days = (Date.now() - new Date(last || c.createdAt).getTime()) / DAY;
  if (!last) return days < 7 ? 'steady' : 'nudge';
  return days <= 7 ? 'thriving' : days <= 21 ? 'steady' : 'nudge';
}
const HEALTH_SCORE: Record<Health, number> = { thriving: 100, steady: 55, nudge: 15 };

const dayKey = (t: string | number) => new Date(t).toDateString();
function lastDays(n: number) {
  return Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * DAY));
}
const shortDate = (dt: Date, i: number, n: number) => (i === n - 1 ? 'Today' : dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));

const QUOTA = 5 * 1024 * 1024;
const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(2)} MB` : `${(n / 1024).toFixed(1)} KB`);
const bytes = (...v: unknown[]) => v.reduce<number>((n, x) => n + new Blob([JSON.stringify(x ?? null)]).size, 0);

function storageStats(d: Db) {
  const total = bytes(d);
  const groups: [string, number][] = [
    ['Email outbox', bytes(d.outbox)], ['Members & profiles', bytes(d.users)], ['Availability', bytes(d.slots)], ['Messages', bytes(d.messages)],
    ['Email templates', bytes(d.emailTemplates)], ['Community posts', bytes(d.posts, d.comments, d.stories)],
  ];
  groups.sort((a, b) => b[1] - a[1]);
  groups.push(['Everything else', Math.max(0, total - groups.reduce((n, [, v]) => n + v, 0))]);
  return { total, groups };
}

function downloadJson() {
  const blob = new Blob([exportDbJson()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${BRAND.id}-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Backup downloaded');
}

const membersCsv = (d: Db) => downloadCsv('members', [['Name', 'Email', 'Role', 'Classification', 'Affiliation', 'College', 'Profile %', 'Joined'], ...d.users.map((u) => [fullName(u), u.email, ROLE_LABEL[u.role], u.profile.classification, u.profile.affiliation, u.profile.college, profileCompleteness(u.profile), u.joinedAt.slice(0, 10)])]);
const matchesCsv = (d: Db) => downloadCsv('matches', [['From', 'To', 'Status', 'Health', 'Since'], ...d.connections.map((c) => [userById(c.from, d) ? fullName(userById(c.from, d)!) : c.from, userById(c.to, d) ? fullName(userById(c.to, d)!) : c.to, c.status, c.status === 'connected' ? pairHealth(c, d) : '', c.createdAt.slice(0, 10)])]);

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// ---------- console shell ----------

export function Admin() {
  const [params, setParams] = useSearchParams();
  const tab = (ALL_TABS.some(([k]) => k === params.get('tab')) ? params.get('tab') : 'overview') as Tab;
  const [menu, setMenu] = useState(false);
  const [compose, setCompose] = useState<ComposeRequest | null>(null);
  const go = (t: Tab) => {
    setMenu(false);
    if (t === 'compose') return setCompose({});
    setParams(t === 'overview' ? {} : { tab: t });
    window.scrollTo(0, 0);
  };
  const current = ALL_TABS.find(([k]) => k === tab)!;
  const ctx = useMemo(() => ({ go, compose: (c: ComposeRequest) => setCompose(c) }), [params]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <AdminCtx.Provider value={ctx}>
      <div className="min-h-app bg-bg-soft pb-10">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/85 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-2 px-3">
            <button aria-label="Open admin menu" onClick={() => setMenu(true)} className="grid size-10 place-items-center rounded-full hover:bg-bg-soft"><Menu className="size-5" /></button>
            <img loading="lazy" decoding="async" src={BRAND.icon} alt="" className="size-8 rounded-lg object-contain" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-display truncate text-[15px] font-bold">{current[1]}</p>
              <p className="truncate text-[11px] text-faint">Admin console · {BRAND.appName}</p>
            </div>
            <button aria-label="Compose email" onClick={() => setCompose({})} className="grid size-10 place-items-center rounded-full bg-navy text-white"><PenLine className="size-4" /></button>
          </div>
        </header>

        <div key={tab} className="fade-up px-4 pt-4">
          {tab === 'overview' && <Overview />}
          {tab === 'mentorships' && <MatchesTab />}
          {tab === 'meetings' && <MeetingsTab />}
          {tab === 'invitations' && <InvitationsTab />}
          {tab === 'templates' && <TemplatesTab />}
          {tab === 'outbox' && <OutboxTab />}
          {tab === 'push' && <PushTab />}
          {tab === 'members' && <MembersTab />}
          {tab === 'reports' && <ReportsTab />}
          {tab === 'content' && <ContentTab />}
          {tab === 'data' && <DataTab />}
          {tab === 'branding' && <EmailBrandingTab />}
          {tab === 'team' && <TeamTab />}
          {tab === 'audit' && <ActivityTab />}
        </div>
      </div>
      <AdminMenu open={menu} tab={tab} onClose={() => setMenu(false)} go={go} />
      {compose && <ComposeSheet key={JSON.stringify(compose)} req={compose} onClose={() => setCompose(null)} />}
    </AdminCtx.Provider>
  );
}

function AdminMenu({ open, tab, onClose, go }: { open: boolean; tab: Tab; onClose: () => void; go: (t: Tab) => void }) {
  const me = useMe()!;
  const owner = useDb((d) => d.adminIds[0] === (d.realUserId ?? d.sessionUserId));
  const badges = useDb((d) => ({
    invitations: d.invites.filter((i) => ['sent', 'opened', 'scheduled', 'pending'].includes(inviteStatus(i, d))).length,
    reports: d.reports.filter((r) => reportStatus(r) === 'open').length,
    outbox: d.outbox.filter((o) => o.status === 'scheduled').length,
  }) as Partial<Record<Tab, number>>);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px]" role="dialog" aria-modal aria-label="Admin menu">
      <div className="absolute inset-0 bg-scrim" onClick={onClose} />
      <nav className="navy-gradient relative flex h-full w-[86%] max-w-[330px] flex-col text-white shadow-2xl" style={{ animation: 'drawer-in 0.24s cubic-bezier(0.2,0.8,0.2,1) both' }}>
        <div className="flex items-center gap-3 px-5 pb-4 pt-[max(20px,env(safe-area-inset-top))]">
          <img loading="lazy" decoding="async" src={BRAND.icon} alt="" className="size-11 rounded-xl bg-white object-contain p-1" />
          <div className="min-w-0 flex-1">
            <p className="font-display truncate text-[17px] font-bold">{BRAND.appName}</p>
            <p className="truncate text-xs text-white/60">Admin console · Mentor &amp; Match</p>
          </div>
          <button aria-label="Close menu" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-white/10"><X className="size-5" /></button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
          {ADMIN_NAV.map((g) => (
            <div key={g.group} className="mt-3">
              <p className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-white/45">{g.group}</p>
              {g.items.map(([k, label, Icon]) => (
                <button key={k} onClick={() => go(k)} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] transition', tab === k && k !== 'compose' ? 'bg-white/12 font-semibold' : 'text-white/85 hover:bg-white/8')}>
                  <Icon className="size-[18px] text-white/75" />
                  <span className="flex-1">{label}</span>
                  {!!badges[k] && <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-bold', k === 'reports' ? 'bg-danger text-white' : 'bg-white/15')}>{badges[k]}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3 rounded-2xl bg-white/8 p-3">
            <Avatar user={me} size={40} />
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{fullName(me)}</p><p className="text-xs text-orange-2">{owner ? 'Owner' : 'Admin'}</p></div>
          </div>
          <Link to="/profile" className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/8"><ArrowLeft className="size-4" /> Back to the app</Link>
        </div>
      </nav>
    </div>
  );
}

// ---------- Overview ----------

function Overview() {
  const { go, compose } = useAdmin();
  const me = useMe()!;
  const d = useDb((x) => x);
  const owner = d.adminIds[0] === (d.realUserId ?? d.sessionUserId);
  const [range, setRange] = useState<'14' | '30' | '90'>('30');
  const s = useMemo(() => {
    const now = Date.now();
    const weekAgo = new Date(now - 7 * DAY).toISOString();
    const emailInv = d.invites.filter((i) => i.channel === 'email');
    const st = (i: (typeof d.invites)[number]) => inviteStatus(i, d);
    const pairs = d.connections.filter((c) => c.status === 'connected').map((c) => ({ c, h: pairHealth(c, d) }));
    const health = pairs.length ? Math.round(pairs.reduce((n, p) => n + HEALTH_SCORE[p.h], 0) / pairs.length) : 0;
    const days30 = lastDays(30);
    const cumulative = (dates: string[]) => days30.map((day) => dates.filter((t) => new Date(t) <= new Date(day.getTime() + DAY - 1)).length);
    const mentees = d.users.filter((u) => u.role === 'mentee');
    const unmatched = mentees.filter((u) => !d.connections.some((c) => c.status === 'connected' && (c.from === u.id || c.to === u.id)));
    const delivered = emailInv.filter((i) => st(i) !== 'scheduled');
    const opened = delivered.filter((i) => ['opened', 'accepted'].includes(st(i)));
    const accepted = delivered.filter((i) => st(i) === 'accepted');
    return {
      members: d.users.length,
      newMembers: d.users.filter((u) => u.joinedAt > weekAgo).length,
      mentors: d.users.filter((u) => isMentorType(u.role)).length,
      mentees: mentees.length,
      matches: pairs.length,
      newMatches: pairs.filter((p) => p.c.createdAt > weekAgo).length,
      requests: d.connections.filter((c) => c.status === 'requested').length,
      openInv: emailInv.filter((i) => ['sent', 'opened', 'scheduled'].includes(st(i))).length,
      newInv: emailInv.filter((i) => i.createdAt > weekAgo).length,
      scheduled: emailInv.filter((i) => st(i) === 'scheduled').length,
      acceptRate: delivered.length ? Math.round((accepted.length / delivered.length) * 100) : 0,
      acceptedWeek: accepted.filter((i) => i.createdAt > weekAgo).length,
      delivered, opened, accepted, emailInv,
      pairs, health,
      thriving: pairs.filter((p) => p.h === 'thriving').length,
      steady: pairs.filter((p) => p.h === 'steady').length,
      nudge: pairs.filter((p) => p.h === 'nudge'),
      sparkMembers: cumulative(d.users.map((u) => u.joinedAt)),
      sparkMatches: cumulative(pairs.map((p) => p.c.createdAt)),
      invBars: lastDays(10).map((day) => emailInv.filter((i) => dayKey(i.createdAt) === dayKey(day.getTime())).length),
      sparkRate: days30.map((day) => {
        const upTo = delivered.filter((i) => new Date(i.createdAt) <= new Date(day.getTime() + DAY - 1));
        return upTo.length ? (upTo.filter((i) => st(i) === 'accepted').length / upTo.length) * 100 : 0;
      }),
      incomplete: d.users.filter((u) => profileCompleteness(u.profile) < 80 && u.profile.firstName),
      unmatched,
      stale: emailInv.filter((i) => st(i) === 'sent' && now - new Date(i.createdAt).getTime() > 2 * DAY),
      openReports: d.reports.filter((r) => reportStatus(r) === 'open').length,
    };
  }, [d]);

  // invitation activity (cumulative sent vs accepted over range)
  const rDays = lastDays(Number(range));
  const inRange = s.emailInv.filter((i) => new Date(i.createdAt) >= rDays[0]);
  const cum = (list: typeof inRange) => rDays.map((day) => list.filter((i) => new Date(i.createdAt) <= new Date(day.getTime() + DAY - 1)).length);
  const rangeSent = inRange.filter((i) => inviteStatus(i, d) !== 'scheduled');
  const rangeOpened = rangeSent.filter((i) => ['opened', 'accepted'].includes(inviteStatus(i, d)));
  const rangeAccepted = rangeSent.filter((i) => inviteStatus(i, d) === 'accepted');

  // data block
  const d14 = lastDays(14);
  const msgs14 = d14.map((day) => d.messages.filter((m) => dayKey(m.createdAt) === dayKey(day.getTime())).length);
  const mails14 = d14.map((day) => d.outbox.filter((o) => dayKey(o.createdAt) === dayKey(day.getTime())).length);
  const heat = Array.from({ length: 7 }, () => Array(12).fill(0) as number[]);
  d.messages.forEach((m) => { const t = new Date(m.createdAt); heat[(t.getDay() + 6) % 7][Math.floor(t.getHours() / 2)]++; });
  const roleRows: [string, number][] = [['Mentees', d.users.filter((u) => u.role === 'mentee').length], ['Mentors', d.users.filter((u) => u.role === 'mentor').length], ['Peer mentors', d.users.filter((u) => u.role === 'peer_mentor').length], ['Professionals', d.users.filter((u) => u.role === 'professional').length]];
  const avgProfile = Math.round(d.users.reduce((n, u) => n + profileCompleteness(u.profile), 0) / Math.max(1, d.users.length));
  const storage = storageStats(d);
  const usedPct = (storage.total / QUOTA) * 100;
  const roleTable = (['mentee', 'mentor', 'peer_mentor', 'professional'] as Role[]).map((r) => {
    const inv = s.emailInv.filter((i) => i.role === r);
    const joined = inv.filter((i) => inviteStatus(i, d) === 'accepted').length;
    return [ROLE_LABEL[r], inv.length, joined, inv.length ? Math.round((joined / inv.length) * 100) : 0] as const;
  });
  const recentInv = [...s.emailInv].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const lastAudit = d.audit[0];
  const upcoming = d.meetings.filter((m) => m.status === 'accepted' || m.status === 'pending').filter((m) => m.start > new Date().toISOString()).length;

  const bestMatch = (u: User) => {
    const mentors = d.users.filter((m) => isMentorType(m.role) && m.profileVisible && !m.suspended && m.profile.firstName);
    return mentors.map((m) => ({ m, ...matchScore(u, m) })).sort((a, b) => b.score - a.score)[0]?.m;
  };
  const attention = [
    {
      n: s.incomplete.length, title: `${s.incomplete.length} incomplete profile${s.incomplete.length !== 1 ? 's' : ''}`, sub: 'Auto-picks the “Finish your profile” template', icon: <UserRoundX />, cta: 'Nudge',
      run: () => compose({ templateKey: 'finish_profile', reason: 'Profiles under 80% complete', recipients: s.incomplete.map((u) => recipientOf(u)) }),
    },
    {
      n: s.unmatched.length, title: `${s.unmatched.length} mentee${s.unmatched.length !== 1 ? 's' : ''} without a mentor`, sub: 'Introduces each one to their best match', icon: <Sparkles />, cta: 'Introduce',
      run: () => compose({ templateKey: 'introduction', reason: 'Mentees without a mentor', recipients: s.unmatched.map((u) => { const m = bestMatch(u); return recipientOf(u, { match_name: m ? fullName(m) : 'a mentor' }); }) }),
    },
    {
      n: s.stale.length, title: `${s.stale.length} invitation${s.stale.length !== 1 ? 's' : ''} not opened`, sub: 'Sends the “Invitation reminder” template', icon: <Send />, cta: 'Remind',
      run: () => compose({ templateKey: 'reminder', reason: 'Invitations not opened after 2 days', recipients: s.stale.map((i) => ({ name: i.name || i.email!, email: i.email!, role: i.role })) }),
    },
    {
      n: s.nudge.length, title: `${s.nudge.length} quiet mentorship${s.nudge.length !== 1 ? 's' : ''}`, sub: 'Sends the “We miss you (check-in)” template', icon: <HeartHandshake />, cta: 'Check in',
      run: () => compose({ templateKey: 'checkin', reason: 'Pairs with no messages in 3+ weeks', recipients: s.nudge.flatMap(({ c }) => [userById(c.from, d), userById(c.to, d)]).filter((u): u is User => !!u).map((u) => recipientOf(u)) }),
    },
    { n: s.openReports, title: `${s.openReports} open report${s.openReports !== 1 ? 's' : ''}`, sub: 'Review and resolve safety reports', icon: <Flag />, cta: 'Review', run: () => go('reports') },
  ].filter((a) => a.n > 0);

  return (
    <>
      {/* Hero */}
      <section className="apex-gradient relative overflow-hidden rounded-3xl p-5 text-white shadow-[0_24px_48px_-20px_rgba(38,70,114,0.7)]">
        <div className="apex-sheen pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-2">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          <h1 className="font-display mt-2 text-[26px] font-extrabold leading-tight">{greeting()}, {me.profile.firstName}</h1>
          <p className="mt-1 text-sm text-white/70">{BRAND.appName} · {BRAND.orgName} · signed in as {owner ? 'Owner' : 'Admin'}</p>
          <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
            <button onClick={() => go('invitations')} className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-[#f5d9a8] to-[#d9a55a] px-4 py-2.5 text-sm font-semibold text-navy shadow-lg"><UserPlus className="size-4" /> Invite people</button>
            <button onClick={() => compose({})} className="glass flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"><PenLine className="size-4" /> Compose email</button>
            <button onClick={() => go('mentorships')} className="glass flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"><HeartHandshake className="size-4" /> Mentorships</button>
          </div>
          <div className="glass mt-4 flex items-center gap-4 rounded-2xl p-3.5">
            <div className="relative grid size-[76px] shrink-0 place-items-center">
              <svg viewBox="0 0 42 42" className="absolute inset-0 size-full -rotate-90" aria-hidden>
                <circle cx="21" cy="21" r="17" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3.5" />
                <circle cx="21" cy="21" r="17" fill="none" stroke="#e7b977" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${(s.health / 100) * 106.8} 106.8`} />
              </svg>
              <span className="text-center"><span className="font-display block text-2xl font-extrabold leading-none">{s.health}</span><span className="text-[8.5px] font-bold tracking-widest text-white/70">HEALTH</span></span>
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-semibold">Program health</p>
              <p className="text-xs text-white/65">Average momentum of {s.matches} active pairs</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs"><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#34d399]" />{s.thriving} thriving</span><span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#f87171]" />{s.nudge.length} need a nudge</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Kpi label="Members" value={s.members} delta={`+${s.newMembers} this week`} sub={`${s.mentors} mentors · ${s.mentees} mentees`} icon={<Users />} onClick={() => go('members')}><Sparkline values={s.sparkMembers} /></Kpi>
        <Kpi label="Active matches" value={s.matches} delta={`+${s.newMatches} this week`} sub={`${s.requests} requests waiting`} icon={<HeartHandshake />} tint="green" onClick={() => go('mentorships')}><Sparkline values={s.sparkMatches} /></Kpi>
        <Kpi label="Open invitations" value={s.openInv} delta={`+${s.newInv} sent this week`} sub={`${s.scheduled} scheduled`} icon={<Send />} tint="gold" onClick={() => go('invitations')}><MiniBars values={s.invBars} /></Kpi>
        <Kpi label="Acceptance rate" value={`${s.acceptRate}%`} delta={`${s.acceptedWeek} accepted this week`} neutral={!s.acceptedWeek} sub={`${s.accepted.length} of ${s.delivered.length} invitations`} icon={<Mail />} tint="blue" onClick={() => go('invitations')}><Sparkline values={s.sparkRate} /></Kpi>
      </div>

      {/* Invitation activity */}
      <Panel title="Invitation activity" action={
        <div className="flex rounded-full border border-line bg-bg-soft p-0.5 text-xs font-semibold">
          {(['14', '30', '90'] as const).map((r) => <button key={r} onClick={() => setRange(r)} className={cn('rounded-full px-2.5 py-1', range === r ? 'bg-surface text-navy shadow-premium' : 'text-faint')}>{r}d</button>)}
        </div>
      }>
        <div className="grid grid-cols-3 divide-x divide-line rounded-2xl border border-line">
          {([['Sent', rangeSent.length], ['Opened', rangeOpened.length], ['Accepted', rangeAccepted.length]] as const).map(([k, v]) => (
            <div key={k} className="px-3 py-2.5"><p className="text-xs text-faint">{k}</p><p className="font-display text-xl font-extrabold">{v}</p></div>
          ))}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted"><span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-navy-2" />Sent</span><span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-[#b8863b]" />Accepted</span></div>
        <div className="mt-2"><TrendChart labels={rDays.map((x, i) => shortDate(x, i, rDays.length))} series={[{ values: cum(rangeSent), color: 'var(--navy-2)' }, { values: cum(rangeAccepted), color: '#b8863b' }]} /></div>
      </Panel>

      {/* Funnel */}
      <Panel title="Invitation funnel" action={<button onClick={() => go('invitations')} className="text-sm font-semibold text-[#9a6418]">All invitations</button>}>
        {([['Delivered', s.delivered.length, 'bg-navy'], ['Opened', s.opened.length, 'bg-navy-2'], ['Accepted', s.accepted.length, 'bg-[#6f9fd1]']] as const).map(([k, v, c], i, arr) => {
          const pct = s.delivered.length ? Math.round((v / s.delivered.length) * 100) : 0;
          const prev = i ? arr[i - 1][1] : 0;
          return (
            <div key={k}>
              {i > 0 && <div className="relative my-1 flex justify-center"><span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] text-muted">{prev ? Math.round((v / prev) * 100) : 0}% step conversion</span></div>}
              <div className="flex justify-between text-sm"><span>{k}</span><span><b>{v}</b> <span className="text-faint">· {pct}%</span></span></div>
              <div className="mt-1.5 flex h-9 justify-center rounded-xl bg-bg-soft"><div className={cn('h-full rounded-xl transition-all', c)} style={{ width: `${Math.max(pct, 4)}%` }} /></div>
            </div>
          );
        })}
        <div className="mt-4 overflow-hidden rounded-2xl border border-line text-sm">
          <div className="grid grid-cols-4 bg-bg-soft px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-faint"><span className="col-span-1">Role</span><span className="text-right">Invited</span><span className="text-right">Joined</span><span className="text-right">Rate</span></div>
          {roleTable.map(([r, inv, j, rate]) => (
            <div key={r} className="grid grid-cols-4 border-t border-line px-3 py-2.5"><span className="truncate">{r}</span><span className="text-right">{inv}</span><span className="text-right">{j}</span><span className="text-right font-semibold">{rate}%</span></div>
          ))}
        </div>
      </Panel>

      {/* Recent invitations */}
      <Panel title="Recent invitations" className="[&>div:last-child]:p-0">
        {recentInv.map((i) => (
          <div key={i.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{i.name || i.email}</p>
              <p className="truncate text-xs text-faint">{i.role ? ROLE_LABEL[i.role] : 'Member'} · {inviteStatus(i, d) === 'scheduled' && i.scheduledFor ? `scheduled ${fmtDate(i.scheduledFor)}, ${fmtTime(i.scheduledFor)}` : timeAgo(i.createdAt)}</p>
            </div>
            <StatusPill s={inviteStatus(i, d)} />
          </div>
        ))}
        {!recentInv.length && <p className="p-4 text-sm text-faint">No invitations yet.</p>}
      </Panel>

      {/* Needs attention */}
      <BlockHeader icon={<AlertTriangle />} title="Needs attention" sub="One tap loads the right email template for each group." />
      <div className="shadow-premium mt-3 overflow-hidden rounded-3xl border border-line/80 bg-surface">
        {attention.map((a) => (
          <div key={a.title} className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-0">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fbf1e3] text-[#9a6418] [&_svg]:size-5">{a.icon}</span>
            <div className="min-w-0 flex-1"><p className="font-semibold leading-tight">{a.title}</p><p className="text-xs text-faint">{a.sub}</p></div>
            <button onClick={a.run} className="shrink-0 rounded-full border border-line-strong px-4 py-2 text-sm font-semibold hover:bg-bg-soft">{a.cta}</button>
          </div>
        ))}
        {!attention.length && <p className="flex items-center gap-2 p-4 text-sm"><Check className="size-5 text-success" /> All clear. Nothing needs you right now.</p>}
      </div>

      {/* Mentorship health */}
      <Panel title="Mentorship health" action={<button onClick={() => go('mentorships')} className="text-sm font-semibold text-[#9a6418]">All pairs</button>}>
        <div className="flex items-center gap-5">
          <div className="relative">
            <Donut parts={[['Thriving', s.thriving, '#1f8a5b'], ['Steady', s.steady, '#e0a43c'], ['Needs a nudge', s.nudge.length, '#c62828']]} />
            <span className="absolute inset-0 grid place-items-center text-center"><span><b className="font-display block text-xl">{s.matches}</b><span className="text-[10px] text-faint">pairs</span></span></span>
          </div>
          <div className="flex-1 space-y-2 text-sm">
            {([['Thriving', s.thriving, '#1f8a5b'], ['Steady', s.steady, '#e0a43c'], ['Needs a nudge', s.nudge.length, '#c62828']] as const).map(([k, v, c]) => (
              <p key={k} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: c }} /><span className="flex-1">{k}</span><b>{v}</b><span className="w-9 text-right text-xs text-faint">{s.matches ? Math.round((v / s.matches) * 100) : 0}%</span></p>
            ))}
          </div>
        </div>
      </Panel>

      {/* Email templates */}
      <BlockHeader icon={<LayoutTemplate />} title="Email templates" sub={`${d.emailTemplates.length} active · the right one loads automatically for every action`}
        actions={<><PillBtn onClick={() => go('templates')}>Library</PillBtn><PillBtn dark onClick={() => compose({})}><PenLine /> Compose</PillBtn></>} />
      <div className="no-scrollbar -mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {d.emailTemplates.filter((t) => ['finish_profile', 'introduction', 'checkin', 'milestone', 'welcome', 'invite_mentee'].includes(t.key)).map((t) => (
          <TemplateCard key={t.key} t={t} sent={d.outbox.filter((o) => o.templateKey === t.key).length} branding={d.emailBranding} className="w-[78%] shrink-0 snap-start" />
        ))}
      </div>
      <AutoRules className="mt-3" />

      {/* Data */}
      <BlockHeader icon={<LineChart />} title="Data" sub="Engagement across the program in the last two weeks."
        actions={<><PillBtn onClick={() => membersCsv(d)}><Download /> Members CSV</PillBtn><PillBtn onClick={() => matchesCsv(d)}><Download /> Matches CSV</PillBtn></>} />
      <Panel title="Daily activity" action={<span className="flex gap-3 text-xs text-muted"><span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-navy-2" />Messages <b>{msgs14.reduce((a, b) => a + b, 0)}</b></span><span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-[#b8863b]" />Emails <b>{mails14.reduce((a, b) => a + b, 0)}</b></span></span>}>
        <StackedBars a={msgs14} b={mails14} labels={d14.map((x, i) => shortDate(x, i, 14))} />
      </Panel>
      <Panel title="Members">
        <div className="space-y-2">
          {roleRows.map(([k, v]) => {
            const pct = Math.round((v / Math.max(1, d.users.length)) * 100);
            return (
              <div key={k} className="flex items-center gap-3">
                <div className="relative h-10 flex-1 overflow-hidden rounded-xl border-l-4 border-navy-2 bg-bg-soft">
                  <div className="absolute inset-y-0 left-0 bg-[#dbe5f0]" style={{ width: `${Math.max(pct * 1.6, 30)}%` }} />
                  <span className="relative flex h-full items-center px-3 text-sm font-medium">{k}</span>
                </div>
                <span className="w-14 text-right text-sm text-muted">{v} · {pct}%</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {([[`${avgProfile}%`, 'Avg profile'], [d.meetings.length, 'Meetings'], [d.posts.length, 'Posts']] as const).map(([v, k]) => (
            <div key={k} className="rounded-2xl border border-line bg-bg-soft/60 py-3"><p className="font-display text-xl font-extrabold">{v}</p><p className="text-[10px] font-semibold uppercase tracking-wider text-faint">{k}</p></div>
          ))}
        </div>
      </Panel>
      <Panel title="When members are active" action={<span className="text-[11px] text-faint">Messages · all time</span>}>
        <Heatmap grid={heat} />
      </Panel>

      {/* Storage & system */}
      <BlockHeader icon={<HardDrive />} title="Storage & system" sub="Space used by program data, and the status of each service."
        actions={<><PillBtn onClick={downloadJson}><Download /> Backup</PillBtn><PillBtn dark onClick={() => go('data')}><Database /> Data & storage</PillBtn></>} />
      <Panel title="Storage">
        <div className="flex flex-col items-center">
          <Gauge pct={Math.max(usedPct, 2)} />
          <p className="-mt-6 font-display text-lg font-bold">{usedPct.toFixed(1)}%</p>
          <p className="font-display mt-1 text-3xl font-extrabold">{kb(storage.total)}</p>
          <p className="text-sm text-muted">{usedPct.toFixed(1)}% of {kb(QUOTA)}</p>
        </div>
        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-faint">What uses the space</p>
        <div className="space-y-2">
          {storage.groups.map(([k, v]) => (
            <div key={k} className="flex items-center gap-3">
              <div className="relative h-9 flex-1 overflow-hidden rounded-lg border-l-4 border-navy-2 bg-bg-soft">
                <div className="absolute inset-y-0 left-0 bg-[#dbe5f0]" style={{ width: `${Math.max(14, (v / Math.max(1, storage.groups[0][1])) * 100)}%` }} />
                <span className="relative flex h-full items-center px-3 text-sm">{k}</span>
              </div>
              <span className="w-16 text-right text-sm text-muted">{kb(v)}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title={<span className="flex items-center gap-2"><Server className="size-4" /> System status</span>} className="[&>div:last-child]:p-0">
        {([
          ['Database', 'Browser storage (mock) · Supabase in Phase 1'],
          ['Email', `Outbox · ${d.outbox.length} stored · Resend / Brevo in Phase 1`],
          ['Push notifications', 'In-app banners on · Firebase in Phase 1'],
          ['Calls & video', 'Demo call screen · Agora / LiveKit'],
          ['Scheduled emails', `${d.outbox.filter((o) => o.status === 'scheduled').length} queued · Sent at their time`],
        ] as const).map(([k, sub]) => (
          <div key={k} className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="size-2.5 shrink-0 rounded-full bg-success" />
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{k}</p><p className="truncate text-xs text-faint">{sub}</p></div>
            <span className="shrink-0 rounded-md bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">Operational</span>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2 px-4 py-3 text-[11px] text-muted">
          <span className="flex items-center gap-1"><Zap className="size-3.5 shrink-0" />Last action {lastAudit ? timeAgo(lastAudit.createdAt) : '—'}</span>
          <span className="flex items-center gap-1"><CalendarClock className="size-3.5 shrink-0" />{upcoming} upcoming meetings</span>
          <span className="flex items-center gap-1"><HeartHandshake className="size-3.5 shrink-0" />{s.matches} active pairs</span>
        </div>
      </Panel>

      {/* Quick links */}
      <div className="mt-6 space-y-2.5">
        {([
          [<UserPlus key="a" />, 'Invite people', 'Single, pasted list or CSV', 'invitations'],
          [<LayoutTemplate key="b" />, 'Email templates', `${d.emailTemplates.length} active templates`, 'templates'],
          [<Users key="c" />, 'Members', `${d.users.length} people in the program`, 'members'],
        ] as const).map(([icon, title, sub, t]) => (
          <button key={title} onClick={() => go(t)} className="shadow-premium flex w-full items-center gap-3 rounded-3xl border border-line/80 bg-surface p-4 text-left active:scale-[0.99]">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#fbf1e3] text-[#9a6418] [&_svg]:size-5">{icon}</span>
            <span className="min-w-0 flex-1"><span className="block text-[17px] font-semibold">{title}</span><span className="text-sm text-faint">{sub}</span></span>
            <ArrowRight className="size-5 text-muted" />
          </button>
        ))}
      </div>
    </>
  );
}

function Kpi({ label, value, delta, sub, icon, tint = 'navy', neutral, onClick, children }: { label: string; value: number | string; delta: string; sub: string; icon: React.ReactNode; tint?: 'navy' | 'green' | 'gold' | 'blue'; neutral?: boolean; onClick?: () => void; children: React.ReactNode }) {
  const tints = { navy: 'bg-[#eef2f8] text-navy-2', green: 'bg-success/10 text-success', gold: 'bg-[#fbf1e3] text-[#9a6418]', blue: 'bg-[#e8eefb] text-navy-2' };
  return (
    <button onClick={onClick} className="shadow-premium flex flex-col rounded-3xl border border-line/80 bg-surface p-3.5 text-left transition active:scale-[0.98]">
      <div className="flex w-full items-start justify-between gap-1">
        <span className="text-[13px] text-muted">{label}</span>
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-xl [&_svg]:size-4', tints[tint])}>{icon}</span>
      </div>
      <span className="font-display mt-1 text-[30px] font-extrabold leading-none">{value}</span>
      <span className={cn('mt-2 w-fit rounded-full px-2 py-0.5 text-[10.5px] font-semibold', neutral ? 'bg-bg-soft text-faint' : 'bg-success/10 text-success')}>{neutral ? '•' : '▲'} {delta}</span>
      <span className="mt-1 truncate text-[11.5px] text-faint">{sub}</span>
      <div className="mt-2 w-full">{children}</div>
    </button>
  );
}

// ---------- templates (cards, rules, library) ----------

function TemplateCard({ t, sent, branding, className }: { t: EmailTemplate; sent: number; branding: EmailBranding; className?: string }) {
  const { compose } = useAdmin();
  const [editing, setEditing] = useState(false);
  return (
    <div className={cn('shadow-premium rounded-3xl border border-line/80 bg-bg-soft/60 p-3', className)}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex flex-col items-center gap-1 py-3">
          <img loading="lazy" decoding="async" src={branding.logo} alt="" className="h-9 object-contain" />
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#264672]">{BRAND.appName}</span>
        </div>
        <div className="border-t-2 px-4 py-2.5 text-[13px] font-bold text-white" style={{ background: `linear-gradient(180deg, ${branding.primary}, ${branding.primary}dd)`, borderColor: branding.accent }}>{t.headline}</div>
        <div className="h-4 bg-gradient-to-b from-white to-transparent" />
      </div>
      <div className="mt-3 flex items-center gap-2 px-1"><span className="rounded-md bg-[#fbf1e3] px-2 py-0.5 text-[11px] font-semibold text-[#9a6418]">{t.category}</span><span className="text-[11px] text-faint">sent {sent}×</span></div>
      <p className="mt-1.5 px-1 text-[17px] font-semibold">{t.name}</p>
      <p className="truncate px-1 text-[12.5px] text-muted">{t.subject}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => setEditing(true)} className="rounded-full border border-line-strong bg-surface py-2.5 text-sm font-semibold">Edit</button>
        <button onClick={() => compose({ templateKey: t.key })} className="flex items-center justify-center gap-1.5 rounded-full bg-navy py-2.5 text-sm font-semibold text-white"><Send className="size-4" /> Use</button>
      </div>
      <TemplateEditor open={editing} t={t} onClose={() => setEditing(false)} />
    </div>
  );
}

function AutoRules({ className }: { className?: string }) {
  const templates = useDb((d) => d.emailTemplates);
  return (
    <div className={cn('shadow-premium overflow-hidden rounded-3xl border border-line/80 bg-surface', className)}>
      <p className="flex items-center gap-2 border-b border-line px-4 py-3.5 text-[15px] font-semibold"><Wand2 className="size-4 text-[#9a6418]" /> Auto-selection rules</p>
      {AUTO_RULES.map((r) => (
        <div key={r.when} className="border-b border-line px-4 py-2.5 last:border-0">
          <p className="text-xs text-faint">{r.when}</p>
          <p className="flex items-center gap-1.5 text-[15px] font-medium"><ArrowRight className="size-3.5" />{r.key === 'invite_mentee' ? 'Matching invitation by role' : templates.find((t) => t.key === r.key)?.name}</p>
        </div>
      ))}
    </div>
  );
}

const PLACEHOLDERS = ['first_name', 'program', 'org', 'admin_name', 'link', 'role', 'profile_score', 'match_name'];

function TemplateEditor({ open, t, onClose }: { open: boolean; t: EmailTemplate; onClose: () => void }) {
  const [x, setX] = useState(t);
  const ref = useRef<HTMLTextAreaElement>(null);
  const insert = (p: string) => { const at = ref.current?.selectionStart ?? x.body.length; setX({ ...x, body: `${x.body.slice(0, at)}{{${p}}}${x.body.slice(at)}` }); };
  return (
    <Sheet open={open} onClose={onClose} title={`Edit · ${t.name}`}>
      <Field label="Banner headline"><Input value={x.headline} onChange={(e) => setX({ ...x, headline: e.target.value })} /></Field>
      <Field label="Subject"><Input value={x.subject} onChange={(e) => setX({ ...x, subject: e.target.value })} /></Field>
      <p className="mb-1.5 text-sm font-semibold">Body</p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {PLACEHOLDERS.map((p) => <button key={p} type="button" onClick={() => insert(p)} className="rounded-full border border-dashed border-orange/60 px-2.5 py-1 font-mono text-[11px] text-orange-text hover:bg-orange-fill">{`{{${p}}}`}</button>)}
      </div>
      <textarea ref={ref} value={x.body} onChange={(e) => setX({ ...x, body: e.target.value })} rows={13} className="w-full resize-none rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-[14px] leading-relaxed outline-none focus:border-orange focus:ring-2 focus:ring-orange/25" />
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={() => { saveTemplate(x); toast('Template saved'); onClose(); }}><Check className="size-4" /> Save</Button>
        <Button variant="outline" onClick={() => { resetTemplate(t.key); setX(DEFAULT_TEMPLATES.find((d) => d.key === t.key)!); toast('Template reset'); }}><RotateCcw className="size-4" /> Reset</Button>
      </div>
    </Sheet>
  );
}

function TemplatesTab() {
  const { compose } = useAdmin();
  const d = useDb((x) => x);
  const [cat, setCat] = useState<'All' | EmailTemplate['category']>('All');
  const list = d.emailTemplates.filter((t) => cat === 'All' || t.category === cat);
  return (
    <>
      <p className="text-sm text-muted">{d.emailTemplates.length} active templates. The right one loads automatically for every action; edit once, use everywhere.</p>
      <div className="mt-3 flex gap-2"><PillBtn dark onClick={() => compose({})}><PenLine /> Compose</PillBtn></div>
      <div className="mt-4"><Seg value={cat} onChange={setCat} options={[['All', 'All', d.emailTemplates.length], ['Invitation', 'Invitations'], ['Direct message', 'Direct'], ['Announcement', 'Announcements']]} /></div>
      <div className="mt-3 space-y-3">
        {list.map((t) => <TemplateCard key={t.key} t={t} sent={d.outbox.filter((o) => o.templateKey === t.key).length} branding={d.emailBranding} />)}
      </div>
      <AutoRules className="mt-4" />
    </>
  );
}

// ---------- compose (auto-selects the template) ----------

/** Picks the best template for one member, and says why. */
function autoPick(u: User | undefined, d: Db): { key: EmailTemplateKey; why: string } {
  if (!u) return { key: 'announcement', why: 'General message' };
  if (u.suspended) return { key: 'notice', why: `${u.profile.firstName} is suspended` };
  if (profileCompleteness(u.profile) < 80) return { key: 'finish_profile', why: `${u.profile.firstName}’s profile is ${profileCompleteness(u.profile)}% complete` };
  if (Date.now() - new Date(u.joinedAt).getTime() < 14 * DAY) return { key: 'welcome', why: `${u.profile.firstName} joined recently` };
  const lastMsg = d.messages.filter((m) => m.from === u.id).reduce((t, m) => (m.createdAt > t ? m.createdAt : t), '');
  if (!lastMsg || Date.now() - new Date(lastMsg).getTime() > 21 * DAY) return { key: 'checkin', why: `${u.profile.firstName} hasn’t been active lately` };
  return { key: 'milestone', why: `${u.profile.firstName} is active and engaged` };
}

function ComposeSheet({ req, onClose }: { req: ComposeRequest; onClose: () => void }) {
  const me = useMe()!;
  const d = useDb((x) => x);
  const [recipients, setRecipients] = useState<Recipient[]>(req.recipients ?? []);
  const single = recipients.length === 1 ? (recipients[0].userId ? userById(recipients[0].userId, d) : undefined) : undefined;
  const auto = req.templateKey ? { key: req.templateKey, why: req.reason ?? 'Chosen for this action' } : recipients.length ? autoPick(single, d) : { key: 'announcement' as EmailTemplateKey, why: 'Pick who it’s for and the template updates' };
  const [key, setKey] = useState<EmailTemplateKey>(auto.key);
  const tpl = (k: EmailTemplateKey) => d.emailTemplates.find((t) => t.key === k)!;
  const [draft, setDraft] = useState({ subject: tpl(key).subject, body: tpl(key).body });
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [later, setLater] = useState(false);
  const [sendAt, setSendAt] = useState('');
  const [pick, setPick] = useState('');
  const [ext, setExt] = useState({ name: '', email: '' });
  const choose = (k: EmailTemplateKey) => { setKey(k); setDraft({ subject: tpl(k).subject, body: tpl(k).body }); };
  const add = (r: Recipient) => {
    if (recipients.some((x) => x.email === r.email)) return;
    const next = [...recipients, r];
    setRecipients(next);
    if (!req.templateKey && next.length === 1) choose(autoPick(r.userId ? userById(r.userId, d) : undefined, d).key);
  };
  const varsFor = (r?: Recipient) => {
    const u = r?.userId ? userById(r.userId, d) : undefined;
    return { first_name: (r?.name || 'there').split(' ')[0], program: BRAND.appName, org: BRAND.orgName, admin_name: fullName(me), link: `https://${BRAND.domain}/welcome`, role: r?.role ? ROLE_LABEL[r.role].toLowerCase() : 'member', profile_score: u ? `${profileCompleteness(u.profile)}%` : '60%', match_name: 'your match', ...r?.vars };
  };
  const send = () => {
    for (const r of recipients) {
      const v = varsFor(r);
      sendAdminEmail({ to: r.email, toName: r.name, userId: r.userId, role: r.role, templateKey: key, subject: fillTemplate(draft.subject, v), body: fillTemplate(draft.body, v), sendAt: later && sendAt ? new Date(sendAt).toISOString() : undefined });
    }
    toast(later && sendAt ? `Scheduled for ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}` : `Sent to ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`);
    onClose();
  };
  const preview = varsFor(recipients[0]);
  return (
    <Sheet open onClose={onClose} title="Compose email">
      <p className="mb-1.5 text-sm font-semibold">To</p>
      <div className="flex flex-wrap gap-1.5">
        {recipients.map((r) => (
          <span key={r.email} className="flex items-center gap-1 rounded-full bg-bg-soft py-1 pl-3 pr-1 text-sm">
            {r.name}<button aria-label={`Remove ${r.name}`} onClick={() => setRecipients(recipients.filter((x) => x !== r))} className="grid size-5 place-items-center rounded-full hover:bg-line"><X className="size-3" /></button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <div className="flex-1"><UserPick value={pick} onChange={(id) => { const u = userById(id, d); if (u) add(recipientOf(u)); setPick(''); }} users={d.users.filter((u) => !recipients.some((r) => r.userId === u.id))} placeholder="Add a member…" /></div>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_1.3fr_auto] gap-2">
        <Input placeholder="Name" value={ext.name} onChange={(e) => setExt({ ...ext, name: e.target.value })} />
        <Input placeholder="or any email" type="email" value={ext.email} onChange={(e) => setExt({ ...ext, email: e.target.value })} />
        <Button variant="outline" disabled={!/^\S+@\S+\.\S+$/.test(ext.email)} onClick={() => { add({ name: ext.name || ext.email, email: ext.email }); setExt({ name: '', email: '' }); }}><Plus className="size-4" /></Button>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#e7c48f] bg-[#fbf1e3] px-3 py-2.5 text-xs text-[#6b4712]">
        <Wand2 className="mt-0.5 size-4 shrink-0" />
        <span><b>Auto-selected “{tpl(auto.key).name}”</b> · {auto.why}</span>
      </div>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4">
        {d.emailTemplates.map((t) => (
          <button key={t.key} type="button" onClick={() => choose(t.key)} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-[13px]', key === t.key ? 'border-navy bg-navy font-semibold text-white' : 'border-line-strong')}>{t.name}</button>
        ))}
      </div>

      <div className="my-3 flex gap-1 rounded-full bg-bg-soft p-1">
        {(['write', 'preview'] as const).map((v) => <button key={v} type="button" onClick={() => setTab(v)} className={cn('flex-1 rounded-full py-1.5 text-sm font-semibold capitalize', tab === v ? 'bg-surface shadow-premium' : 'text-faint')}>{v}</button>)}
      </div>
      {tab === 'write' ? (
        <>
          <Field label="Subject"><Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} /></Field>
          <Field label="Message" hint="Placeholders like {{first_name}} are filled in for each person.">
            <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={11} className="w-full resize-none rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-[14px] leading-relaxed outline-none focus:border-orange focus:ring-2 focus:ring-orange/25" />
          </Field>
        </>
      ) : (
        <BrandedEmail b={d.emailBranding} headline={tpl(key).headline} to={recipients[0]?.email ?? 'recipient'} subject={fillTemplate(draft.subject, preview)} body={fillTemplate(draft.body, preview)} />
      )}
      <div className="mt-3 rounded-2xl border border-line px-4">
        <Toggle checked={later} onChange={setLater} label="Schedule for later" sub="Queued in the Outbox and sent at that time" />
        {later && <div className="pb-3"><Input type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} /></div>}
      </div>
      <Button size="lg" className="mt-4" disabled={!recipients.length || !draft.subject.trim() || (later && !sendAt)} onClick={send}>
        {later ? <CalendarClock className="size-5" /> : <Send className="size-5" />} {later ? 'Schedule' : 'Send'} to {recipients.length || '…'} {recipients.length === 1 ? 'person' : 'people'}
      </Button>
    </Sheet>
  );
}

function BrandedEmail({ b, headline, to, subject, body }: { b: EmailBranding; headline: string; to: string; subject: string; body: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#f4f5f7] p-3 text-[14px]">
      <p className="mb-2 truncate text-xs text-faint">To: {to} · <b>{subject}</b></p>
      <div className="overflow-hidden rounded-xl bg-white">
        <div className="flex flex-col items-center gap-1 py-4"><img loading="lazy" decoding="async" src={b.logo} alt="" className="h-12 object-contain" /><span className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#264672]">{BRAND.appName}</span></div>
        <div className="border-t-2 px-5 py-3 font-bold text-white" style={{ background: b.primary, borderColor: b.accent }}>{headline}</div>
        <div className="whitespace-pre-line p-5 leading-relaxed text-[#222]">{body}</div>
        <div className="px-5 pb-5 text-center"><span className="inline-block rounded-full px-5 py-2.5 font-semibold text-white" style={{ background: b.accent }}>Open {BRAND.appName}</span></div>
        <div className="border-t px-5 py-3 text-center text-[11px] text-[#888]">{b.footer}</div>
      </div>
    </div>
  );
}

// ---------- invitations ----------

function InvitationsTab() {
  const { compose } = useAdmin();
  const d = useDb((x) => x);
  const [filter, setFilter] = useState<'all' | InviteState>('all');
  const [inviting, setInviting] = useState(false);
  const rows = d.invites.map((i) => ({ i, s: inviteStatus(i, d), from: userById(i.fromId, d), to: i.toId ? userById(i.toId, d) : undefined })).sort((a, b) => b.i.createdAt.localeCompare(a.i.createdAt));
  const list = rows.filter((r) => filter === 'all' || r.s === filter);
  const n = (s: InviteState) => rows.filter((r) => r.s === s).length;
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <PillBtn dark onClick={() => setInviting(true)}><UserPlus /> Invite people</PillBtn>
        <PillBtn onClick={() => downloadCsv('invitations', [['Name', 'Email', 'Role', 'Channel', 'Status', 'Invited by', 'Sent'], ...rows.map(({ i, s, from, to }) => [to ? fullName(to) : i.name ?? '', i.email ?? to?.email ?? '', i.role ? ROLE_LABEL[i.role] : '', i.channel, s, from ? fullName(from) : '', i.createdAt.slice(0, 10)])])}><Download /> CSV</PillBtn>
      </div>
      <div className="mt-4"><Seg value={filter} onChange={setFilter} options={[['all', 'All', rows.length], ['scheduled', 'Scheduled', n('scheduled')], ['sent', 'Sent', n('sent')], ['opened', 'Opened', n('opened')], ['accepted', 'Accepted', n('accepted')], ['pending', 'In app', n('pending')]]} /></div>
      <div className="shadow-premium mt-3 overflow-hidden rounded-3xl border border-line/80 bg-surface">
        {list.map(({ i, s, from, to }) => (
          <div key={i.id} className="border-b border-line px-4 py-3 last:border-0">
            <div className="flex items-center gap-3">
              {to ? <Avatar user={to} size={40} /> : <span className="grid size-10 place-items-center rounded-full bg-[#fbf1e3] text-[#9a6418]"><Mail className="size-4" /></span>}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{to ? fullName(to) : i.name || i.email}</p>
                <p className="truncate text-xs text-faint">{i.role ? ROLE_LABEL[i.role] : to ? ROLE_LABEL[to.role] : ''} · by {from ? from.profile.firstName : 'Admin'} · {s === 'scheduled' && i.scheduledFor ? `for ${fmtDate(i.scheduledFor)}` : timeAgo(i.createdAt)}</p>
              </div>
              <StatusPill s={s} />
            </div>
            {i.channel === 'email' && s !== 'accepted' && (
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => compose({ templateKey: 'reminder', reason: 'Resending an invitation', recipients: [{ name: i.name || i.email!, email: i.email!, role: i.role }] })} className="rounded-full border border-line-strong px-3 py-1.5 text-xs font-semibold">Resend</button>
                <button onClick={() => { resendInvite(i.id); toast('Marked as resent'); }} className="rounded-full border border-line-strong px-3 py-1.5 text-xs font-semibold">Quick resend</button>
                <button onClick={() => { revokeInvite(i.id); toast('Invitation revoked'); }} className="rounded-full px-3 py-1.5 text-xs font-semibold text-danger hover:bg-danger/5">Revoke</button>
              </div>
            )}
          </div>
        ))}
        {!list.length && <Empty icon={<Send className="size-7" />} title="No invitations here" />}
      </div>
      <InvitePeopleSheet key={String(inviting)} open={inviting} onClose={() => setInviting(false)} />
    </>
  );
}

/** Invite one person, a pasted list or a CSV. The matching template for the role loads automatically. */
function InvitePeopleSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { compose } = useAdmin();
  const [mode, setMode] = useState<'single' | 'list' | 'csv'>('single');
  const [role, setRole] = useState<Role>('mentee');
  const [one, setOne] = useState({ name: '', email: '' });
  const [text, setText] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const parse = (t: string): Recipient[] =>
    t.split(/\r?\n/).map((line) => line.split(/[,;\t]/).map((x) => x.trim()).filter(Boolean)).map((parts) => {
      const email = parts.find((p) => /^\S+@\S+\.\S+$/.test(p));
      const name = parts.find((p) => p !== email) ?? email?.split('@')[0] ?? '';
      return email ? { name, email, role } : null;
    }).filter((x): x is { name: string; email: string; role: Role } => !!x);
  const people = mode === 'single' ? (/^\S+@\S+\.\S+$/.test(one.email) ? [{ name: one.name || one.email, email: one.email, role }] : []) : parse(text);
  return (
    <Sheet open={open} onClose={onClose} title="Invite people">
      <Seg value={mode} onChange={setMode} options={[['single', 'Single'], ['list', 'Pasted list'], ['csv', 'CSV']]} />
      <p className="mb-2 mt-4 text-sm font-semibold">Invite as</p>
      <div className="flex flex-wrap gap-2">
        {(['mentee', 'mentor', 'peer_mentor', 'professional'] as Role[]).map((r) => (
          <button key={r} onClick={() => setRole(r)} className={cn('rounded-full border px-3.5 py-1.5 text-sm', role === r ? 'border-navy bg-navy font-semibold text-white' : 'border-line-strong')}>{ROLE_LABEL[r]}</button>
        ))}
      </div>
      <div className="mt-4">
        {mode === 'single' && (
          <>
            <Field label="Name"><Input value={one.name} onChange={(e) => setOne({ ...one, name: e.target.value })} placeholder="Jordan Lee" /></Field>
            <Field label="Email" required><Input type="email" value={one.email} onChange={(e) => setOne({ ...one, email: e.target.value })} placeholder="name@csu.fullerton.edu" /></Field>
          </>
        )}
        {mode === 'list' && <Field label="One person per line" hint="Name, email · or just an email"><TextArea rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={'Jordan Lee, jordan@csu.fullerton.edu\nsam.kim@gmail.com'} /></Field>}
        {mode === 'csv' && (
          <div className="mb-4 rounded-2xl border-2 border-dashed border-line-strong p-5 text-center">
            <Upload className="mx-auto size-7 text-faint" />
            <p className="mt-2 text-sm font-semibold">{text ? `${parse(text).length} people found` : 'Upload a CSV with name and email columns'}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => file.current?.click()}>Choose file</Button>
            <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={(e) => { e.target.files?.[0]?.text().then(setText); e.target.value = ''; }} />
          </div>
        )}
      </div>
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-[#fbf1e3] px-3 py-2 text-xs text-[#6b4712]"><Wand2 className="size-4" /> Loads “Invitation · {ROLE_LABEL[role]}” automatically</div>
      <Button size="lg" disabled={!people.length} onClick={() => { onClose(); compose({ templateKey: INVITE_TEMPLATE[role], reason: `Inviting ${people.length} ${ROLE_LABEL[role].toLowerCase()}${people.length > 1 ? 's' : ''}`, recipients: people }); }}>
        Review & send to {people.length || '…'} <ArrowRight className="size-5" />
      </Button>
    </Sheet>
  );
}

// ---------- outbox ----------

function OutboxTab() {
  const d = useDb((x) => x);
  const [filter, setFilter] = useState<'all' | 'sent' | 'scheduled'>('all');
  const [open, setOpen] = useState<string | null>(null);
  const list = d.outbox.filter((o) => filter === 'all' || o.status === filter);
  const mail = d.outbox.find((o) => o.id === open);
  const tname = (k: EmailTemplateKey) => d.emailTemplates.find((t) => t.key === k)?.name ?? k;
  return (
    <>
      <Seg value={filter} onChange={setFilter} options={[['all', 'All', d.outbox.length], ['sent', 'Sent', d.outbox.filter((o) => o.status === 'sent').length], ['scheduled', 'Scheduled', d.outbox.filter((o) => o.status === 'scheduled').length]]} />
      <div className="shadow-premium mt-3 overflow-hidden rounded-3xl border border-line/80 bg-surface">
        {list.map((o) => (
          <button key={o.id} onClick={() => setOpen(o.id)} className="flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-bg-soft">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-bg-soft text-navy-2"><Mail className="size-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{o.toName}</span>
              <span className="block truncate text-sm">{o.subject}</span>
              <span className="block truncate text-xs text-faint">{tname(o.templateKey)} · {o.status === 'scheduled' && o.sendAt ? `sends ${fmtDate(o.sendAt)}, ${fmtTime(o.sendAt)}` : timeAgo(o.createdAt)}</span>
            </span>
            <StatusPill s={o.status} />
          </button>
        ))}
        {!list.length && <Empty icon={<Inbox className="size-7" />} title="Outbox is empty" body="Emails you send or schedule appear here." />}
      </div>
      <p className="mt-3 text-xs text-faint">Prototype: emails are stored here, not delivered. Connect Resend or Brevo in Phase 1.</p>
      {mail && (
        <Sheet open onClose={() => setOpen(null)} title={mail.status === 'scheduled' ? 'Scheduled email' : 'Sent email'}>
          {mail.body ? <BrandedEmail b={d.emailBranding} headline={d.emailTemplates.find((t) => t.key === mail.templateKey)?.headline ?? ''} to={mail.to} subject={mail.subject} body={mail.body} /> : <p className="text-sm text-muted">{mail.subject}<br /><span className="text-faint">To {mail.to}</span></p>}
        </Sheet>
      )}
    </>
  );
}

// ---------- admin team ----------

function TeamTab() {
  const d = useDb((x) => x);
  const [pick, setPick] = useState('');
  const admins = d.adminIds.map((id) => userById(id, d)).filter((u): u is User => !!u);
  return (
    <>
      <p className="text-sm text-muted">People who can open this console. The first admin is the Owner.</p>
      <div className="shadow-premium mt-3 overflow-hidden rounded-3xl border border-line/80 bg-surface">
        {admins.map((u, i) => (
          <div key={u.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-0">
            <Avatar user={u} size={42} />
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{fullName(u)}</p><p className="truncate text-xs text-faint">{u.email}</p></div>
            <Badge tone={i === 0 ? 'orange' : 'gray'}>{i === 0 ? 'Owner' : 'Admin'}</Badge>
            {i > 0 && <button aria-label="Remove admin" onClick={() => { setAdminAccess(u.id, false); toast('Admin removed'); }} className="grid size-9 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"><X className="size-4" /></button>}
          </div>
        ))}
      </div>
      <SectionTitle>Add an admin</SectionTitle>
      <div className="flex gap-2">
        <div className="flex-1"><UserPick value={pick} onChange={setPick} users={d.users.filter((u) => !d.adminIds.includes(u.id) && u.role !== 'professional')} placeholder="Choose a member…" /></div>
        <Button disabled={!pick} onClick={() => { setAdminAccess(pick, true); setPick(''); toast('Admin added'); }}><Plus className="size-4" /> Add</Button>
      </div>
      {BRAND.features.adminForEveryone && <p className="mt-3 rounded-2xl bg-orange-fill p-3 text-xs text-orange-text">Demo mode: every account except Professionals can open this console. Turn off <code>adminForEveryone</code> in brand.ts before launch.</p>}
    </>
  );
}

// ---------- data & storage ----------

const COLLECTIONS: [keyof Db, string][] = [
  ['users', 'Members'], ['connections', 'Connections'], ['messages', 'Messages'], ['meetings', 'Meetings'], ['invites', 'Invitations'], ['outbox', 'Emails'], ['notifications', 'Notifications'],
  ['reports', 'Reports'], ['posts', 'Posts'], ['comments', 'Comments'], ['stories', 'Moments'], ['calls', 'Call logs'], ['slots', 'Availability'], ['resources', 'Resources'], ['audit', 'Audit log'],
];

function DataTab() {
  const d = useDb((x) => x);
  const file = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState<'reset' | 'import' | null>(null);
  const [pending, setPending] = useState('');
  const st = useMemo(() => storageStats(d), [d]);
  const usedPct = (st.total / QUOTA) * 100;
  const max = Math.max(1, ...COLLECTIONS.map(([k]) => (d[k] as unknown[]).length));
  return (
    <>
      <Panel title="Storage" className="mt-0">
        <div className="flex flex-col items-center">
          <Gauge pct={Math.max(usedPct, 2)} />
          <p className="font-display -mt-4 text-3xl font-extrabold">{kb(st.total)}</p>
          <p className="text-sm text-muted">{usedPct.toFixed(1)}% of {kb(QUOTA)}</p>
        </div>
        <div className="mt-4 space-y-2">
          {st.groups.map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 text-sm"><span className="w-36 truncate">{k}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-soft"><div className="h-full rounded-full bg-navy-2" style={{ width: `${(v / Math.max(1, st.groups[0][1])) * 100}%` }} /></div><span className="w-16 text-right text-faint">{kb(v)}</span></div>
          ))}
        </div>
      </Panel>
      <SectionTitle>Backup & export</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={downloadJson}><Download className="size-4" /> Backup</Button>
        <Button variant="outline" onClick={() => file.current?.click()}><Upload className="size-4" /> Restore</Button>
        <Button variant="outline" onClick={() => membersCsv(d)}><Users className="size-4" /> Members CSV</Button>
        <Button variant="outline" onClick={() => matchesCsv(d)}><HeartHandshake className="size-4" /> Matches CSV</Button>
      </div>
      <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { e.target.files?.[0]?.text().then((t) => { setPending(t); setConfirm('import'); }); e.target.value = ''; }} />
      <Panel title="Collections">
        <div className="-my-1">
          {COLLECTIONS.map(([k, label]) => {
            const n = (d[k] as unknown[]).length;
            return (
              <div key={k} className="flex items-center gap-3 py-1.5 text-sm">
                <span className="w-28 truncate">{label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-soft"><div className="h-full rounded-full bg-navy" style={{ width: `${(n / max) * 100}%` }} /></div>
                <span className="w-8 text-right font-semibold">{n}</span>
                <span className="w-16 text-right text-xs text-faint">{kb(bytes(d[k]))}</span>
              </div>
            );
          })}
        </div>
      </Panel>
      <SectionTitle>Maintenance</SectionTitle>
      <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {([['audit', 'Clear audit log', d.audit.length], ['outbox', 'Clear outbox', d.outbox.length], ['pushHistory', 'Clear push history', d.pushHistory.length]] as const).map(([k, label, n]) => (
          <button key={k} disabled={!n} onClick={() => { clearAdminLog(k); toast('Cleared'); }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg-soft disabled:opacity-45">
            <Trash2 className="size-4 text-muted" /><span className="flex-1 text-sm font-medium">{label}</span><span className="text-xs text-faint">{n} items</span>
          </button>
        ))}
        <button onClick={() => setConfirm('reset')} className="flex w-full items-center gap-3 px-4 py-3 text-left text-danger hover:bg-danger/5"><RotateCcw className="size-4" /><span className="flex-1 text-sm font-medium">Reset demo data</span></button>
      </div>
      <Confirm open={confirm === 'reset'} onClose={() => setConfirm(null)} danger action="Reset" title="Reset all data?" body="Restores the original demo data. You stay signed in." onConfirm={() => { resetDemoData(); toast('Demo data restored'); }} />
      <Confirm open={confirm === 'import'} onClose={() => { setConfirm(null); setPending(''); }} danger action="Restore" title="Restore this backup?" body="This replaces all current data with the backup file." onConfirm={() => { toast(importDbJson(pending) ? 'Backup restored' : 'That file isn’t a valid backup'); setPending(''); }} />
    </>
  );
}

// ---------- Members ----------

type MemberFilter = 'all' | 'admins' | 'hidden' | 'suspended' | 'incomplete';

function MembersTab() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [filter, setFilter] = useState<MemberFilter>('all');
  const [sort, setSort] = useState('Newest');
  const [open, setOpen] = useState<string | null>(null);
  const users = useDb((d) => d.users);
  const adminIds = useDb((d) => d.adminIds);
  const is: Record<MemberFilter, (u: User) => boolean> = {
    all: () => true,
    admins: (u) => adminIds.includes(u.id),
    hidden: (u) => !u.profileVisible,
    suspended: (u) => !!u.suspended,
    incomplete: (u) => profileCompleteness(u.profile) < 60,
  };
  const list = users
    .filter((u) => (!role || u.role === role) && is[filter](u))
    .filter((u) => [fullName(u), u.email, u.profile.classification, u.profile.affiliation, u.profile.college, u.profile.major].join(' ').toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sort === 'Name A–Z' ? fullName(a).localeCompare(fullName(b)) : sort === 'Profile %' ? profileCompleteness(b.profile) - profileCompleteness(a.profile) : b.joinedAt.localeCompare(a.joinedAt)));

  const exportCsv = () => downloadCsv('members', [
    ['Name', 'Email', 'Role', 'Role code', 'Classification', 'Affiliation', 'College', 'Profile %', 'Visible', 'Suspended', 'Admin', 'Joined'],
    ...list.map((u) => [fullName(u), u.email, ROLE_LABEL[u.role], ROLE_CODES[u.role], u.profile.classification, u.profile.affiliation, u.profile.college, profileCompleteness(u.profile), u.profileVisible ? 'Yes' : 'No', u.suspended ? 'Yes' : 'No', adminIds.includes(u.id) ? 'Yes' : 'No', u.joinedAt.slice(0, 10)]),
  ]);

  return (
    <>
      <SearchBox value={q} onChange={setQ} placeholder="Search name, email, college, major…" />
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        {(['', ...ROLES] as const).map((r) => (
          <button key={r || 'all'} onClick={() => setRole(r)} className={cn('shrink-0 rounded-full border px-3 py-1.5 text-[13px]', role === r ? 'border-navy bg-navy font-semibold text-white' : 'border-line-strong')}>
            {r ? ROLE_LABEL[r] : 'All roles'}
          </button>
        ))}
      </div>
      <div className="mt-3">
        <Seg value={filter} onChange={setFilter} options={[['all', 'All'], ['admins', 'Admins', users.filter(is.admins).length], ['hidden', 'Hidden', users.filter(is.hidden).length], ['suspended', 'Suspended', users.filter(is.suspended).length], ['incomplete', 'Incomplete', users.filter(is.incomplete).length]]} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <p className="flex-1 text-xs text-faint">{list.length} member{list.length !== 1 && 's'}</p>
        <div className="w-36"><Select value={sort} onChange={(v) => setSort(v || 'Newest')} options={['Newest', 'Name A–Z', 'Profile %']} placeholder="Sort" /></div>
        <Button size="sm" variant="outline" onClick={exportCsv} aria-label="Export CSV"><Download className="size-4" /> CSV</Button>
      </div>
      <div className="mt-3 space-y-2">
        {list.map((u) => {
          const pct = profileCompleteness(u.profile);
          return (
            <Card key={u.id} onClick={() => setOpen(u.id)} className="flex items-center gap-3 p-3">
              <Avatar user={u} size={46} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{fullName(u)}</p>
                <p className="truncate text-xs text-faint">{u.email}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge tone="gray">{ROLE_LABEL[u.role]} ({ROLE_CODES[u.role]})</Badge>
                  {adminIds.includes(u.id) && <Badge tone="navy">Admin</Badge>}
                  {u.suspended && <Badge tone="red">Suspended</Badge>}
                  {!u.profileVisible && <Badge tone="orange">Hidden</Badge>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={cn('text-xs font-bold', pct < 60 ? 'text-danger' : 'text-success')}>{pct}%</span>
                <ChevronRight className="size-4 text-faint" />
              </div>
            </Card>
          );
        })}
        {!list.length && <Empty icon={<Users className="size-7" />} title="No members match" body="Try another search or filter." />}
      </div>
      <MemberSheet id={open} onClose={() => setOpen(null)} />
    </>
  );
}

function MemberSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const nav = useNavigate();
  const [confirm, setConfirm] = useState(false);
  const [matching, setMatching] = useState(false);
  const { compose } = useAdmin();
  const data = useDb((d) => {
    const u = id ? userById(id, d) : undefined;
    if (!u) return null;
    return {
      u,
      admin: d.adminIds.includes(u.id),
      self: u.id === (d.realUserId ?? d.sessionUserId),
      connections: connectedCount(u.id, d),
      messages: d.messages.filter((m) => m.from === u.id).length,
      meetings: d.meetings.filter((m) => m.organizer === u.id || m.invitee === u.id).length,
      reports: d.reports.filter((r) => r.reportedId === u.id).length,
    };
  });
  if (!data) return null;
  const { u, admin, self } = data;
  const pct = profileCompleteness(u.profile);
  return (
    <>
      <Sheet open={!!id && !confirm && !matching} onClose={onClose} title="Member">
        <div className="flex items-center gap-3">
          <Avatar user={u} size={64} ring />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">{fullName(u)}</p>
            <p className="truncate text-sm text-faint">{u.email}</p>
            <p className="text-xs text-faint">Joined {fmtDate(u.joinedAt)} · {u.profile.affiliation || 'No affiliation'}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {([['Matches', data.connections], ['Messages', data.messages], ['Meetings', data.meetings], ['Reports', data.reports]] as const).map(([k, v]) => (
            <div key={k} className={cn('rounded-xl py-2', k === 'Reports' && v ? 'bg-danger/10 text-danger' : 'bg-bg-soft')}>
              <p className="font-display text-lg font-extrabold">{v}</p>
              <p className="text-[10.5px] font-semibold text-faint">{k}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold"><span>Profile complete</span><span>{pct}%</span></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg-soft"><div className="brand-gradient h-full rounded-full" style={{ width: `${pct}%` }} /></div>
        </div>
        <Field label="Role" hint="Role codes: Mentor 5, Mentee 6, Peer Mentor 7, Super Admin 8, Professional 9">
          <Select value={u.role} onChange={(v) => { if (v) { setUserRole(u.id, v as Role); toast('Role updated'); } }} options={ROLES} />
        </Field>
        <div className="divide-y divide-line rounded-2xl border border-line px-4">
          <Toggle checked={u.profileVisible} onChange={(v) => { setUserVisible(u.id, v); toast(v ? 'Profile visible' : 'Profile hidden'); }} label="Visible in Discover & Search" sub="Hidden members get no new requests." />
          <Toggle checked={!!u.suspended} onChange={(v) => { if (self) return toast('You can’t suspend yourself'); setUserSuspended(u.id, v); toast(v ? 'Member suspended' : 'Member reinstated'); }} label="Suspended" sub="Blocks the app and hides them from everyone." />
          <Toggle checked={admin} onChange={(v) => { if (!setAdminAccess(u.id, v)) toast('There must be at least one Super Admin'); else toast(v ? 'Super Admin access granted' : 'Super Admin access removed'); }} label="Super Admin access" sub="Can open this console." />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => { onClose(); nav(`/member/${u.id}`); }}><Eye className="size-4" /> View profile</Button>
          <Button variant="outline" disabled={self} onClick={() => { impersonate(u.id); toast(`Viewing as ${fullName(u)}`); nav('/discover'); }}><LogIn className="size-4" /> Log in as</Button>
          <Button variant="outline" onClick={() => setMatching(true)}><HeartHandshake className="size-4" /> Match…</Button>
          <Button className="col-span-2" onClick={() => { onClose(); compose({ recipients: [recipientOf(u)] }); }}><Mail className="size-4" /> Email {u.profile.firstName} · template auto-selected</Button>
          <Button variant="outline" disabled={self} className="text-danger" onClick={() => setConfirm(true)}><Trash2 className="size-4" /> Delete</Button>
        </div>
      </Sheet>
      <Confirm open={confirm} onClose={() => setConfirm(false)} danger action="Delete member" title={`Delete ${u.profile.firstName}?`}
        body={`This permanently removes ${fullName(u)} with their connections, messages, meetings and posts. This can’t be undone.`}
        onConfirm={() => { adminDeleteUser(u.id); toast('Member deleted'); onClose(); }} />
      <MatchSheet open={matching} onClose={() => setMatching(false)} preset={u} />
    </>
  );
}

// ---------- Matches ----------

function MatchSheet({ open, onClose, preset }: { open: boolean; onClose: () => void; preset?: User }) {
  const users = useDb((d) => d.users.filter((u) => !u.suspended && u.profile.firstName));
  const presetMentor = preset && isMentorType(preset.role);
  const [a, setA] = useState(presetMentor ? preset.id : '');
  const [b, setB] = useState(preset && !presetMentor ? preset.id : '');
  const status = useDb((d) => d.connections.find((c) => (c.from === a && c.to === b) || (c.from === b && c.to === a))?.status);
  const ua = users.find((u) => u.id === a);
  const ub = users.find((u) => u.id === b);
  const fit = ua && ub ? matchScore(ua, ub) : null;
  return (
    <Sheet open={open} onClose={onClose} title="Create a match">
      <p className="mb-4 text-sm text-muted">Pair two members directly. Both get a notification and can start messaging right away.</p>
      <Field label="Mentor"><UserPick value={a} onChange={setA} users={users.filter((u) => isMentorType(u.role) && u.id !== b)} placeholder="Choose a mentor…" /></Field>
      <Field label="Mentee"><UserPick value={b} onChange={setB} users={users.filter((u) => u.id !== a && (!isMentorType(u.role) || u.role === 'peer_mentor'))} placeholder="Choose a mentee…" /></Field>
      {ua && ub && fit && (
        <Card className="mb-4 flex items-center gap-3">
          <div className="flex -space-x-3"><Avatar user={ua} size={44} ring /><Avatar user={ub} size={44} ring /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold"><span className="text-orange-text">{fit.score}%</span> fit</p>
            <p className="truncate text-xs text-faint">{fit.reasons.join(' · ') || 'Few shared interests'}</p>
          </div>
        </Card>
      )}
      {status === 'connected' && <p className="mb-3 text-sm font-semibold text-success">These two are already matched.</p>}
      <Button size="lg" disabled={!a || !b || status === 'connected'} onClick={() => { adminCreateMatch(a, b); toast('Match created'); onClose(); }}>
        <Sparkles className="size-5" /> Create match
      </Button>
    </Sheet>
  );
}

function MatchesTab() {
  const nav = useNavigate();
  const [status, setStatus] = useState<Connection['status']>('connected');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Connection | null>(null);
  const d = useDb((x) => x);
  const all = d.connections;
  const list = all
    .filter((c) => c.status === status)
    .map((c) => ({ c, from: userById(c.from, d), to: userById(c.to, d) }))
    .filter((x) => x.from && x.to && (fullName(x.from) + fullName(x.to)).toLowerCase().includes(q.toLowerCase()))
    .sort((x, y) => y.c.createdAt.localeCompare(x.c.createdAt));

  const suggestions = useMemo(() => {
    const busy = (id: string) => d.connections.some((c) => c.status !== 'declined' && (c.from === id || c.to === id));
    const mentors = d.users.filter((u) => isMentorType(u.role) && u.profileVisible && !u.suspended && u.profile.firstName);
    return d.users
      .filter((u) => u.role === 'mentee' && !u.suspended && u.profile.firstName && !busy(u.id))
      .map((m) => {
        const best = mentors.map((t) => ({ t, ...matchScore(m, t) })).sort((x, y) => y.score - x.score)[0];
        return best ? { m, ...best } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x)
      .slice(0, 5);
  }, [d]);

  return (
    <>
      <Button className="w-full" variant="accent" onClick={() => setCreating(true)}><Plus className="size-5" /> Create a match</Button>

      {suggestions.length > 0 && (
        <>
          <SectionTitle>Smart suggestions · mentees waiting</SectionTitle>
          <div className="space-y-2">
            {suggestions.map(({ m, t, score, reasons }) => (
              <Card key={m.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3"><Avatar user={m} size={40} ring /><Avatar user={t} size={40} ring /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.profile.firstName} + {t.profile.firstName} <span className="text-orange-text">{score}%</span></p>
                    <p className="truncate text-xs text-faint">{reasons.join(' · ') || ROLE_LABEL[t.role]}</p>
                  </div>
                  <Button size="sm" onClick={() => { adminCreateMatch(t.id, m.id); toast(`${m.profile.firstName} matched with ${t.profile.firstName}`); }}>Match</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <SectionTitle>All connections</SectionTitle>
      <Seg value={status} onChange={setStatus} options={[['connected', 'Matched', all.filter((c) => c.status === 'connected').length], ['requested', 'Pending', all.filter((c) => c.status === 'requested').length], ['declined', 'Declined', all.filter((c) => c.status === 'declined').length]]} />
      <div className="mt-3"><SearchBox value={q} onChange={setQ} placeholder="Search by name…" /></div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => downloadCsv(`connections-${status}`, [['From', 'To', 'Status', 'Since'], ...list.map((x) => [fullName(x.from!), fullName(x.to!), x.c.status, x.c.createdAt.slice(0, 10)])])}><Download className="size-4" /> Export</Button>
      </div>
      <div className="space-y-2">
        {list.map(({ c, from, to }) => (
          <Card key={c.id} className="flex items-center gap-3 p-3">
            <div className="flex -space-x-3"><Avatar user={from!} size={40} ring /><Avatar user={to!} size={40} ring /></div>
            <button className="min-w-0 flex-1 text-left" onClick={() => nav(`/member/${from!.id}`)}>
              <p className="truncate text-sm font-semibold">{fullName(from!)} {status === 'requested' ? '→' : '↔'} {fullName(to!)}</p>
              {status === 'connected' && (() => { const h = pairHealth(c, d); return <span className={cn('mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10.5px] font-semibold', h === 'thriving' ? 'bg-success/10 text-success' : h === 'steady' ? 'bg-[#fbf1e3] text-[#9a6418]' : 'bg-danger/10 text-danger')}>{h === 'nudge' ? 'Needs a nudge' : h === 'thriving' ? 'Thriving' : 'Steady'}</span>; })()}
              <p className="text-xs text-faint">{ROLE_LABEL[from!.role]} · {ROLE_LABEL[to!.role]} · {timeAgo(c.createdAt)}</p>
            </button>
            <button aria-label="Remove connection" onClick={() => setRemoving(c)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-danger/10 hover:text-danger"><X className="size-4" /></button>
          </Card>
        ))}
        {!list.length && <Empty icon={<HeartHandshake className="size-7" />} title="Nothing here" body={status === 'requested' ? 'No requests are waiting.' : undefined} />}
      </div>
      <MatchSheet key={String(creating)} open={creating} onClose={() => setCreating(false)} />
      <Confirm open={!!removing} onClose={() => setRemoving(null)} danger action="Remove" title="Remove this connection?"
        body="Both members will no longer be connected. Their past messages stay." onConfirm={() => { if (removing) adminRemoveConnection(removing.id); toast('Connection removed'); }} />
    </>
  );
}

// ---------- Meetings ----------

function MeetingsTab() {
  const [status, setStatus] = useState<Meeting['status'] | 'all'>('all');
  const [when, setWhen] = useState<'upcoming' | 'past'>('upcoming');
  const d = useDb((x) => x);
  const now = new Date().toISOString();
  const scoped = d.meetings.filter((m) => (when === 'upcoming' ? m.start >= now : m.start < now));
  const list = scoped.filter((m) => status === 'all' || m.status === status).sort((a, b) => (when === 'upcoming' ? a.start.localeCompare(b.start) : b.start.localeCompare(a.start)));
  const tone: Record<Meeting['status'], 'green' | 'orange' | 'gray' | 'red'> = { accepted: 'green', pending: 'orange', declined: 'gray', cancelled: 'red' };
  const name = (id: string) => { const u = userById(id, d); return u ? fullName(u) : 'Unknown'; };
  return (
    <>
      <Seg value={when} onChange={setWhen} options={[['upcoming', 'Upcoming', d.meetings.filter((m) => m.start >= now).length], ['past', 'Past', d.meetings.filter((m) => m.start < now).length]]} />
      <div className="mt-2"><Seg value={status} onChange={setStatus} options={[['all', 'All'], ['pending', 'Pending'], ['accepted', 'Accepted'], ['declined', 'Declined'], ['cancelled', 'Cancelled']]} /></div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => downloadCsv('meetings', [['Title', 'Organizer', 'Invitee', 'Start', 'End', 'Mode', 'Reason', 'Status'], ...list.map((m) => [m.title, name(m.organizer), name(m.invitee), m.start, m.end, m.mode, m.reason, m.status])])}><Download className="size-4" /> Export</Button>
      </div>
      <div className="space-y-2">
        {list.map((m) => (
          <Card key={m.id} className="p-3">
            <div className="flex items-start gap-3">
              <div className="grid w-12 shrink-0 place-items-center rounded-xl bg-orange-fill py-1.5 text-orange-text">
                <span className="text-[10px] font-bold uppercase">{new Date(m.start).toLocaleDateString(undefined, { month: 'short' })}</span>
                <span className="font-display text-lg font-extrabold leading-none">{new Date(m.start).getDate()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><p className="truncate font-semibold">{m.title}</p><Badge tone={tone[m.status]}>{m.status}</Badge></div>
                <p className="text-xs text-faint">{fmtDate(m.start)} · {fmtTime(m.start)}–{fmtTime(m.end)} · {m.mode}</p>
                <p className="mt-1 truncate text-sm text-muted">{name(m.organizer)} → {name(m.invitee)}</p>
              </div>
            </div>
            {(m.status === 'pending' || m.status === 'accepted') && (
              <div className="mt-2 flex justify-end gap-2">
                {m.status === 'pending' && <Button size="sm" variant="outline" onClick={() => { adminSetMeetingStatus(m.id, 'accepted'); toast('Meeting confirmed'); }}><Check className="size-4" /> Confirm</Button>}
                <Button size="sm" variant="outline" className="text-danger" onClick={() => { adminSetMeetingStatus(m.id, 'cancelled'); toast('Meeting cancelled'); }}><X className="size-4" /> Cancel</Button>
              </div>
            )}
          </Card>
        ))}
        {!list.length && <Empty icon={<CalendarDays className="size-7" />} title={`No ${when} meetings`} />}
      </div>
    </>
  );
}

// ---------- Reports ----------

function ReportsTab() {
  const { compose } = useAdmin();
  const nav = useNavigate();
  const [status, setStatus] = useState<ReportStatus>('open');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const d = useDb((x) => x);
  const all = d.reports.map((r) => ({ ...r, reporter: userById(r.reporterId, d), reported: userById(r.reportedId, d) }));
  const list = all.filter((r) => reportStatus(r) === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const count = (s: ReportStatus) => all.filter((r) => reportStatus(r) === s).length;
  return (
    <>
      <Seg value={status} onChange={setStatus} options={[['open', 'Open', count('open')], ['resolved', 'Resolved', count('resolved')], ['dismissed', 'Dismissed', count('dismissed')]]} />
      <div className="mt-3 space-y-3">
        {list.map((r) => (
          <Card key={r.id}>
            <div className="flex items-center gap-2"><Badge tone="red">{r.reason}</Badge><span className="flex-1 text-xs text-faint">{timeAgo(r.createdAt)}</span>{r.closedAt && <span className="text-xs text-faint">closed {timeAgo(r.closedAt)}</span>}</div>
            <button className="mt-3 flex w-full items-center gap-3 text-left" onClick={() => r.reported && nav(`/member/${r.reported.id}`)}>
              {r.reported && <Avatar user={r.reported} size={40} />}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{r.reported ? fullName(r.reported) : 'Deleted member'} {r.reported?.suspended && <Badge tone="red">Suspended</Badge>}</span>
                <span className="block truncate text-xs text-faint">Reported by {r.reporter ? fullName(r.reporter) : 'Unknown'}</span>
              </span>
              <ChevronRight className="size-4 text-faint" />
            </button>
            {r.description && <p className="mt-2 rounded-xl bg-bg-soft p-3 text-sm text-muted">“{r.description}”</p>}
            {r.adminNote && <p className="mt-2 text-xs text-faint"><b>Admin note:</b> {r.adminNote}</p>}
            {status === 'open' ? (
              <>
                <div className="mt-3"><TextArea rows={2} max={300} placeholder="Internal note (optional)" value={notes[r.id] ?? ''} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} /></div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => { updateReport(r.id, 'resolved', notes[r.id]); toast('Report resolved'); }}><Check className="size-4" /> Resolve</Button>
                  <Button size="sm" variant="outline" onClick={() => { updateReport(r.id, 'dismissed', notes[r.id]); toast('Report dismissed'); }}>Dismiss</Button>
                  {r.reported && !r.reported.suspended && (
                    <Button size="sm" variant="outline" className="text-danger" onClick={() => { setUserSuspended(r.reportedId, true); updateReport(r.id, 'resolved', notes[r.id] || 'Member suspended'); toast('Member suspended'); if (r.reported) compose({ templateKey: 'notice', reason: 'Member was suspended after a report', recipients: [recipientOf(r.reported)] }); }}><UserX className="size-4" /> Suspend & resolve</Button>
                  )}
                </div>
              </>
            ) : (
              <Button size="sm" variant="ghost" className="mt-2" onClick={() => { updateReport(r.id, 'open'); toast('Report reopened'); }}><RotateCcw className="size-4" /> Reopen</Button>
            )}
          </Card>
        ))}
        {!list.length && <Empty icon={<Flag className="size-7" />} title={status === 'open' ? 'No open reports' : `No ${status} reports`} body={status === 'open' ? 'Reports members send appear here.' : undefined} />}
      </div>
    </>
  );
}

// ---------- Push ----------

const AUDIENCES: [PushAudience, string][] = [['all', 'Everyone'], ['mentor_types', 'All mentors'], ['mentee', 'Mentees'], ['peer_mentor', 'Peer mentors'], ['super_admin', 'Admins']];

function PushTab() {
  const [title, setTitle] = useState('Mentoring Mixer this Friday');
  const [body, setBody] = useState('Join mentors and mentees at the TSU Pavilion, 5pm. Food provided!');
  const [audience, setAudience] = useState<PushAudience>('all');
  const [confirm, setConfirm] = useState(false);
  const counts = useDb((d) => Object.fromEntries(AUDIENCES.map(([k]) => [k, pushAudience(k, d).length])) as Record<PushAudience, number>);
  const history = useDb((d) => d.pushHistory);
  return (
    <>
      <p className="mb-4 text-sm text-muted">Send a branded push notification to members of {BRAND.orgName}.</p>
      <Field label="Audience">
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map(([k, label]) => (
            <button key={k} type="button" onClick={() => setAudience(k)} className={cn('rounded-full border px-3 py-1.5 text-[13px]', audience === k ? 'border-navy bg-navy font-semibold text-white' : 'border-line-strong')}>
              {label} · {counts[k]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} /></Field>
      <Field label="Message"><TextArea value={body} onChange={(e) => setBody(e.target.value)} max={180} rows={3} /></Field>
      <SectionTitle>Preview (Android lock screen)</SectionTitle>
      <div className="navy-gradient rounded-2xl p-4">
        <div className="flex items-start gap-3 rounded-2xl bg-white/95 p-3">
          <img loading="lazy" decoding="async" src={BRAND.icon} alt="" className="size-10 rounded-xl object-contain" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase text-orange-text">{BRAND.appName} · now</p>
            <p className="truncate font-semibold">{title || 'Title'}</p>
            <p className="line-clamp-2 text-sm text-muted">{body || 'Message'}</p>
          </div>
        </div>
      </div>
      <Button size="lg" className="mt-4" disabled={!title || !body || !counts[audience]} onClick={() => setConfirm(true)}>
        <Bell className="size-5" /> Send to {counts[audience]} member{counts[audience] !== 1 && 's'}
      </Button>
      <SectionTitle>Sent</SectionTitle>
      {history.length ? (
        <div className="space-y-2">
          {history.map((h) => (
            <Card key={h.id} className="p-3">
              <div className="flex items-center gap-2"><p className="flex-1 truncate font-semibold">{h.title}</p><span className="text-xs text-faint">{timeAgo(h.createdAt)}</span></div>
              <p className="line-clamp-2 text-sm text-muted">{h.body}</p>
              <p className="mt-1 text-xs text-faint">{AUDIENCES.find(([k]) => k === h.audience)?.[1]} · {h.recipients} recipients</p>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-faint">No pushes sent yet.</p>
      )}
      <Confirm open={confirm} onClose={() => setConfirm(false)} action="Send now" title="Send this push?"
        body={`“${title}” goes to ${counts[audience]} member${counts[audience] !== 1 ? 's' : ''} right away. This can’t be unsent.`}
        onConfirm={() => { const n = broadcastPush(title, body, audience); toast(`Push sent to ${n} members`); }} />
    </>
  );
}

// ---------- Emails ----------

function EmailBrandingTab() {
  const saved = useDb((d) => d.emailBranding);
  const [b, setB] = useState<EmailBranding>(saved);
  const upload = (f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setB({ ...b, logo: String(r.result) });
    r.readAsDataURL(f);
  };
  return (
    <>
      <p className="mb-4 text-sm text-muted">Change the logo and colours used in every email (sign-in codes, request alerts, meeting invites).</p>
      <Field label="Email logo">
        <div className="flex items-center gap-3">
          <img loading="lazy" decoding="async" src={b.logo} alt="" className="size-16 rounded-xl border border-line object-contain" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setB({ ...b, logo: BRAND.logo })}>Mentor & Match</Button>
            <Button size="sm" variant="outline" onClick={() => setB({ ...b, logo: BRAND.mark })}>Logo mark</Button>
            <label className="inline-flex h-9 cursor-pointer items-center rounded-full border border-line-strong px-4 text-sm font-semibold">
              Upload<input type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          </div>
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Primary colour"><ColorInput value={b.primary} onChange={(v) => setB({ ...b, primary: v })} /></Field>
        <Field label="Accent colour"><ColorInput value={b.accent} onChange={(v) => setB({ ...b, accent: v })} /></Field>
      </div>
      <Field label="Footer"><Input value={b.footer} onChange={(e) => setB({ ...b, footer: e.target.value })} /></Field>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => { updateEmailBranding(b); toast('Email branding saved'); }}><Palette className="size-4" /> Save</Button>
        <Button variant="outline" onClick={() => setB({ logo: BRAND.logo, primary: BRAND.colors.primary, accent: BRAND.colors.accent, footer: `${BRAND.orgName} · ${BRAND.poweredBy}` })}>Reset</Button>
      </div>
      <SectionTitle>Preview</SectionTitle>
      <EmailPreview b={b} />
    </>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line-strong px-2 py-1.5">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-9 cursor-pointer rounded border-0 bg-transparent" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full text-sm uppercase outline-none" />
    </div>
  );
}

function EmailPreview({ b }: { b: EmailBranding }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#f4f5f7] p-3 text-[14px]">
      <p className="mb-2 text-xs text-faint">From: {BRAND.appName} &lt;no-reply@{BRAND.domain}&gt; · Subject: Your sign-in code</p>
      <div className="overflow-hidden rounded-xl bg-white">
        <div className="flex items-center justify-center p-4" style={{ background: b.primary }}>
          <img loading="lazy" decoding="async" src={b.logo} alt="" className="h-16 rounded-lg bg-white object-contain p-1" />
        </div>
        <div className="p-5 text-[#222]">
          <p className="font-semibold">Hi Alex,</p>
          <p className="mt-2">Use this code to sign in to {BRAND.appName}:</p>
          <p className="my-4 text-center text-3xl font-extrabold tracking-[0.3em]" style={{ color: b.primary }}>123456</p>
          <p className="text-center"><span className="inline-block rounded-full px-5 py-2.5 font-semibold text-white" style={{ background: b.accent }}>Open {BRAND.appName}</span></p>
          <p className="mt-4 text-xs text-[#666]">This code expires in 10 minutes. If you didn’t request it, ignore this email.</p>
        </div>
        <div className="border-t px-5 py-3 text-center text-[11px] text-[#888]">{b.footer}</div>
      </div>
    </div>
  );
}

// ---------- Content ----------

const BLANK_RESOURCE: Resource = { id: '', category: '', title: '', url: '', description: '' };

function ContentTab() {
  const cms = useDb((d) => d.cms);
  const resources = useDb((d) => d.resources);
  const [key, setKey] = useState<PolicyKey>('terms');
  const [text, setText] = useState(cms[key]);
  const [r, setR] = useState<Resource>(BLANK_RESOURCE);
  return (
    <>
      <SectionTitle>Policy pages (CMS)</SectionTitle>
      <p className="mb-2 text-xs text-faint">Shown in the app under Settings. Use “# ” for a heading, “## ” for a sub-heading and “- ” for a bullet.</p>
      <div className="mb-2 flex flex-wrap gap-2">
        {(Object.keys(POLICIES) as PolicyKey[]).map((k) => (
          <button key={k} onClick={() => { setKey(k); setText(cms[k]); }} className={cn('rounded-full border px-3 py-1.5 text-sm', key === k ? 'border-navy bg-navy text-white' : 'border-line-strong')}>{POLICIES[k].title}</button>
        ))}
      </div>
      <TextArea value={text} onChange={(e) => setText(e.target.value)} rows={12} />
      <div className="mt-2 flex gap-2">
        <Button size="sm" onClick={() => { updateCms(key, text); toast('Content saved'); }}>Save {POLICIES[key].title}</Button>
        <Button size="sm" variant="outline" onClick={() => setText(POLICIES[key].body)}>Restore original</Button>
      </div>

      <SectionTitle>myCollege Resources · {resources.length}</SectionTitle>
      <div className="space-y-2">
        {resources.map((x) => (
          <Card key={x.id} className={cn('flex items-center gap-3 p-3', r.id === x.id && 'border-orange')}>
            <div className="min-w-0 flex-1"><p className="truncate font-semibold">{x.title}</p><p className="text-xs text-faint">{x.category}</p></div>
            <button aria-label="Edit" onClick={() => setR(x)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-bg-soft"><Pencil className="size-4" /></button>
            <button aria-label="Delete" onClick={() => { deleteResource(x.id); if (r.id === x.id) setR(BLANK_RESOURCE); toast('Resource removed'); }} className="grid size-9 place-items-center rounded-full text-muted hover:bg-bg-soft"><Trash2 className="size-4" /></button>
          </Card>
        ))}
      </div>
      <Card className="mt-3">
        <p className="mb-3 font-semibold">{r.id ? 'Edit resource' : 'Add resource'}</p>
        <Field label="Category"><Input value={r.category} onChange={(e) => setR({ ...r, category: e.target.value })} placeholder="Campus, Career, Wellness…" /></Field>
        <Field label="Title"><Input value={r.title} onChange={(e) => setR({ ...r, title: e.target.value })} /></Field>
        <Field label="Link"><Input value={r.url} onChange={(e) => setR({ ...r, url: e.target.value })} placeholder="https://" /></Field>
        <Field label="Description"><Input value={r.description} onChange={(e) => setR({ ...r, description: e.target.value })} /></Field>
        <div className="flex gap-2">
          <Button size="sm" disabled={!r.title || !r.category} onClick={() => { saveResource(r); setR(BLANK_RESOURCE); toast(r.id ? 'Resource updated' : 'Resource added'); }}>
            {r.id ? <><Check className="size-4" /> Save</> : <><Plus className="size-4" /> Add</>}
          </Button>
          {r.id && <Button size="sm" variant="outline" onClick={() => setR(BLANK_RESOURCE)}>Cancel</Button>}
        </div>
      </Card>
    </>
  );
}

// ---------- Activity (audit log) ----------

function ActivityTab() {
  const [q, setQ] = useState('');
  const d = useDb((x) => x);
  const list = d.audit.map((a) => ({ ...a, actor: userById(a.actorId, d) })).filter((a) => (a.action + a.detail + (a.actor ? fullName(a.actor) : '')).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <p className="mb-3 text-sm text-muted">Every Super Admin action is recorded here.</p>
      <SearchBox value={q} onChange={setQ} placeholder="Search activity…" />
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="ghost" disabled={!list.length} onClick={() => downloadCsv('admin-activity', [['When', 'Admin', 'Action', 'Detail'], ...list.map((a) => [a.createdAt, a.actor ? fullName(a.actor) : a.actorId, a.action, a.detail])])}><Download className="size-4" /> Export</Button>
      </div>
      {list.length ? (
        <ol className="relative ml-3 border-l-2 border-line">
          {list.map((a) => (
            <li key={a.id} className="relative pb-4 pl-5">
              <span className="absolute -left-[7px] top-1.5 size-3 rounded-full border-2 border-surface bg-orange" />
              <p className="text-sm"><b>{a.action}</b> <span className="text-muted">· {a.detail}</span></p>
              <p className="text-xs text-faint">{a.actor ? fullName(a.actor) : 'Admin'} · {timeAgo(a.createdAt)}</p>
            </li>
          ))}
        </ol>
      ) : (
        <Empty icon={<Activity className="size-7" />} title="No activity yet" body="Role changes, matches, pushes and more show up here." />
      )}
    </>
  );
}

