import { Check, ChevronDown, ChevronLeft, Eye, EyeOff, WifiOff, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { L } from '@/data/labels';
import { onPush } from '@/lib/push';
import { watchForUpdates } from '@/lib/update';
import { cn } from '@/lib/store';
import type { User } from '@/lib/types';

// ---------- Button ----------
type Variant = 'primary' | 'outline' | 'ghost' | 'soft' | 'danger';
export function Button({ variant = 'primary', size = 'md', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      type="button"
      {...p}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45',
        size === 'sm' && 'h-9 px-4 text-sm',
        size === 'md' && 'h-11 px-5 text-[15px]',
        size === 'lg' && 'h-14 w-full px-6 text-base',
        variant === 'primary' && 'brand-gradient text-white shadow-[0_10px_22px_-10px_rgba(60,106,151,0.8)] hover:brightness-110',
        variant === 'outline' && 'border border-line-strong bg-surface text-brand-dark hover:bg-bg-soft',
        variant === 'ghost' && 'text-brand-dark hover:bg-bg-soft',
        variant === 'soft' && 'bg-brand-light text-brand-dark hover:bg-field',
        variant === 'danger' && 'bg-danger text-white hover:brightness-110',
        className,
      )}
    />
  );
}

// ---------- Layout ----------
export function Header({ title, back, right, sub }: { title: ReactNode; back?: boolean | string; right?: ReactNode; sub?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2 px-4">
        {back && (
          <button aria-label="Back" onClick={() => (typeof back === 'string' ? nav(back) : history.length > 1 ? nav(-1) : nav('/home'))} className="-ml-2 grid size-10 place-items-center rounded-full text-brand-dark hover:bg-bg-soft">
            <ChevronLeft className="size-6" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[18px] font-bold text-brand-dark">{title}</h1>
          {sub && <p className="truncate text-xs text-muted">{sub}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className={cn('shadow-card block w-full rounded-2xl border border-line bg-surface p-4 text-left', onClick && 'transition hover:border-line-strong', className)}>
      {children}
    </Tag>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2.5 mt-6 flex items-center justify-between first:mt-0">
      <h2 className="text-[17px] font-bold text-brand-dark">{children}</h2>
      {action}
    </div>
  );
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-brand-light text-brand ring-8 ring-brand-light/50">{icon}</div>
      <p className="font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------- Brand ----------
/** The hexagon "M". `white` for blue backgrounds. */
export function Mark({ size = 20, white, className }: { size?: number; white?: boolean; className?: string }) {
  return <img src={white ? BRAND.markWhite : BRAND.mark} alt="" width={size} height={size} className={className} style={{ width: size, height: size }} />;
}

export function PoweredBy({ className }: { className?: string }) {
  return (
    <div className={cn('powered flex flex-col items-center gap-2', className)}>
      <small className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7f93a8]">Powered by</small>
      <span className="pill-brand">
        <i>
          <Mark white size={15} />
        </i>
        Mentor &amp; Match
      </span>
    </div>
  );
}

// ---------- Avatar ----------
const AVATAR_BG = ['#264672', '#3C6A97', '#2F5A84', '#4B7BAA', '#1F3D63'];
export function Avatar({ user, size = 44, ring }: { user: Pick<User, 'id' | 'photo' | 'profile'>; size?: number; ring?: boolean }) {
  const initials = `${user.profile.firstName[0] ?? ''}${user.profile.lastName[0] ?? ''}`.toUpperCase() || '?';
  const bg = AVATAR_BG[[...user.id].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_BG.length];
  return (
    <div className={cn('relative shrink-0 overflow-hidden rounded-full', ring && 'ring-2 ring-brand ring-offset-2 ring-offset-surface')} style={{ width: size, height: size, background: bg }} aria-hidden>
      {user.photo ? (
        <img src={user.photo} width={size} height={size} loading="lazy" decoding="async" alt="" className="size-full object-cover" />
      ) : (
        <span className="grid size-full place-items-center font-semibold text-white" style={{ fontSize: size * 0.36 }}>
          {initials}
        </span>
      )}
    </div>
  );
}

export function Badge({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'soft' | 'green' | 'gray' | 'red' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        tone === 'brand' && 'bg-brand text-white',
        tone === 'soft' && 'bg-brand-light text-brand-dark',
        tone === 'green' && 'bg-success/10 text-success',
        tone === 'gray' && 'bg-bg-soft text-muted',
        tone === 'red' && 'bg-danger/10 text-danger',
      )}
    >
      {children}
    </span>
  );
}

// ---------- Form controls ----------
export function Field({ label, children, error, hint }: { label: string; children: ReactNode; error?: string; hint?: ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-danger" role="alert">{error}</span> : hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

const inputCls = 'w-full rounded-xl border border-transparent bg-field px-4 py-3.5 text-[15px] text-ink outline-none transition placeholder:text-[#8a9bb0] focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/20';

export function Input(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cn(inputCls, p.className)} />;
}

export function PasswordInput(p: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...p} type={show ? 'text' : 'password'} className="pr-12" />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-brand-dark">
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  );
}

export function TextArea({ max, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { max?: number }) {
  const len = String(p.value ?? '').length;
  return (
    <div>
      <textarea {...p} maxLength={max} rows={p.rows ?? 4} className={cn(inputCls, 'resize-none', p.className)} />
      {max && <p className={cn('mt-1 text-right text-xs', len >= max ? 'text-danger' : 'text-muted')}>{len} / {max}</p>}
    </div>
  );
}

export function Select({ value, onChange, options, placeholder = L.select_one }: { value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, 'appearance-none pr-10', !value && 'text-[#8a9bb0]')}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o} className="text-ink">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
    </div>
  );
}

/** Check-all-that-apply dropdown. */
export function MultiSelect({ value, onChange, options, placeholder = L.select }: { value: string[]; onChange: (v: string[]) => void; options: readonly string[]; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  const all = useMemo(() => [...options, ...value.filter((v) => !options.includes(v))], [options, value]);
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div ref={root} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={cn(inputCls, 'flex items-center gap-2 pr-10 text-left', open && 'border-brand bg-surface ring-2 ring-brand/20')}>
        <span className={cn('min-w-0 flex-1 truncate', !value.length && 'text-[#8a9bb0]')}>{value.length ? value.join(', ') : placeholder}</span>
        {value.length > 1 && <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white">{value.length}</span>}
      </button>
      <ChevronDown className={cn('pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-muted transition-transform', open && 'rotate-180')} />
      {open && (
        // preventDefault stops the wrapping <label> from re-toggling the trigger on inner clicks.
        <div onClick={(e) => e.preventDefault()} className="shadow-card absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-line-strong bg-surface">
          <ul role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {all.map((o) => {
              const on = value.includes(o);
              return (
                <li key={o}>
                  <button type="button" role="option" aria-selected={on} onClick={() => toggle(o)} className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] hover:bg-bg-soft', on && 'font-semibold')}>
                    <span className={cn('grid size-5 shrink-0 place-items-center rounded-md border', on ? 'border-brand bg-brand text-white' : 'border-line-strong')}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
                    {o}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between border-t border-line px-4 py-2 text-xs">
            <span className="text-muted">{value.length} selected</span>
            <button type="button" className="font-semibold text-brand" onClick={() => setOpen(false)}>{L.done}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn('rounded-full border px-4 py-2 text-sm transition', active ? 'border-brand bg-brand font-semibold text-white' : 'border-line-strong bg-surface text-ink hover:border-brand/60')}
    >
      {children}
    </button>
  );
}

/** Single choice chips (radio). */
export function ChipSingle({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((o) => (
        <Chip key={o} active={value === o} onClick={() => onChange(value === o ? '' : o)}>
          {o}
        </Chip>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center gap-3 py-3 text-left" role="switch" aria-checked={checked}>
      <span className="flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        {sub && <span className="block text-xs text-muted">{sub}</span>}
      </span>
      <span className={cn('relative h-7 w-12 shrink-0 rounded-full transition', checked ? 'bg-brand' : 'bg-line-strong')}>
        <span className={cn('absolute top-0.5 size-6 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
    </button>
  );
}

/** Pending / Accepted style segmented control. */
export function Segments<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="grid rounded-full bg-bg-soft p-1" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }} role="tablist">
      {items.map((i) => (
        <button key={i.id} role="tab" aria-selected={value === i.id} onClick={() => onChange(i.id)} className={cn('flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition', value === i.id ? 'bg-surface text-brand-dark shadow-card' : 'text-muted')}>
          {i.label}
          {!!i.count && <span className={cn('grid min-w-5 place-items-center rounded-full px-1 text-[11px]', value === i.id ? 'bg-brand text-white' : 'bg-line-strong text-brand-dark')}>{i.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------- Sheet ----------
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal aria-label={title}>
      <div className="absolute inset-0 bg-scrim" onClick={onClose} />
      <div className="sheet-up relative max-h-[88%] w-full max-w-[480px] overflow-y-auto rounded-t-3xl bg-surface pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-10 flex items-center border-b border-line bg-surface px-5 py-3.5">
          <h2 className="flex-1 text-base font-bold text-brand-dark">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-bg-soft">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- Confirm dialog ----------
type Ask = {
  title?: string;
  message: string;
  confirm?: string;
  cancel?: string;
  danger?: boolean;
  /** Show a "Reason" box. `required` makes it mandatory ("Please enter reason"). */
  reason?: 'optional' | 'required';
  /** A single OK button (alerts). */
  alert?: boolean;
};
let openAsk: (a: Ask, done: (r: string | null) => void) => void = () => {};

/** Shows a confirm dialog. Resolves with the reason text ('' if none) when confirmed, or null when cancelled. */
export const ask = (a: Ask) => new Promise<string | null>((resolve) => openAsk(a, resolve));

export function DialogHost() {
  const [state, setState] = useState<{ a: Ask; done: (r: string | null) => void } | null>(null);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    openAsk = (a, done) => {
      setReason('');
      setErr('');
      setState({ a, done });
    };
  }, []);
  if (!state) return null;
  const { a, done } = state;
  const close = (r: string | null) => {
    setState(null);
    done(r);
  };
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-6" role="alertdialog" aria-modal aria-label={a.title ?? a.message}>
      <div className="absolute inset-0 bg-scrim" onClick={() => !a.alert && close(null)} />
      <div className="pop relative w-full max-w-[340px] rounded-3xl bg-surface p-6 text-center shadow-2xl">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-brand-light">
          <Mark size={24} />
        </div>
        {a.title && <h2 className="text-lg font-bold text-brand-dark">{a.title}</h2>}
        <p className={cn('text-[15px] leading-relaxed text-ink', a.title && 'mt-1.5 text-muted')}>{a.message}</p>
        {a.reason && (
          <div className="mt-4 text-left">
            <span className="mb-1.5 block text-sm font-semibold">{L.reason}</span>
            <TextArea value={reason} onChange={(e) => (setReason(e.target.value), setErr(''))} placeholder={L.brief_description_dot} rows={3} />
            {err && <p className="mt-1 text-xs font-medium text-danger">{err}</p>}
          </div>
        )}
        <div className={cn('mt-5 grid gap-2.5', !a.alert && 'grid-cols-2')}>
          {!a.alert && (
            <Button variant="outline" onClick={() => close(null)}>
              {a.cancel ?? L.no}
            </Button>
          )}
          <Button
            variant={a.danger ? 'danger' : 'primary'}
            onClick={() => {
              if (a.reason === 'required' && !reason.trim()) return setErr(L.please_enter_reason);
              close(reason.trim());
            }}
          >
            {a.confirm ?? (a.alert ? L.ok : L.yes)}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Opens an outside website or app, after the third-party Disclaimer when `notice` is set. */
export async function openExternal(url: string, notice = true) {
  if (notice && (await ask({ title: L.disclaimer, message: L.disclaimer_text, confirm: L.ok, cancel: L.cancel })) === null) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

// ---------- Toast + push banner ----------
let pushToast: (msg: string) => void = () => {};
export const toast = (msg: string) => pushToast(msg);

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ id: number; title: string; body: string } | null>(null);
  useEffect(() => {
    pushToast = (m) => {
      setMsg(m);
      setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 2600);
    };
    return onPush((b) => {
      setBanner(b);
      setTimeout(() => setBanner((cur) => (cur?.id === b.id ? null : cur)), 4500);
    });
  }, []);
  return (
    <>
      {banner && (
        <div className="fade-up fixed inset-x-0 top-2 z-[80] mx-auto w-[calc(100%-16px)] max-w-[464px]" role="status">
          <button className="flex w-full items-start gap-3 rounded-2xl bg-brand-dark p-3 text-left text-white shadow-2xl" onClick={() => setBanner(null)}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white">
              <Mark size={24} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/70">{BRAND.shortName} · now</span>
              <span className="block truncate text-sm font-semibold">{banner.title}</span>
              <span className="line-clamp-2 block text-sm text-white/85">{banner.body}</span>
            </span>
          </button>
        </div>
      )}
      {msg && (
        <div className="fade-up fixed inset-x-0 bottom-28 z-[80] mx-auto w-fit max-w-[90%] rounded-full bg-brand-dark px-5 py-2.5 text-center text-sm font-medium text-white shadow-[0_12px_30px_-8px_rgba(38,70,114,0.6)]" role="status">
          {msg}
        </div>
      )}
    </>
  );
}

// ---------- App update ----------
export function UpdateBanner() {
  const [ready, setReady] = useState(false);
  useEffect(() => watchForUpdates(() => setReady(true)), []);
  if (!ready) return null;
  return (
    <div className="fade-up fixed inset-x-0 top-2 z-[90] mx-auto w-[calc(100%-16px)] max-w-[464px]" role="status">
      <div className="shadow-card flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-light">
          <Mark size={24} />
        </span>
        <p className="min-w-0 flex-1 text-sm font-semibold text-brand-dark">{L.new_version_of_mentor_available}</p>
        <Button size="sm" variant="ghost" onClick={() => setReady(false)}>{L.exit}</Button>
        <Button size="sm" onClick={() => window.location.reload()}>{L.download_now}</Button>
      </div>
    </div>
  );
}

// ---------- No internet ----------
export function Offline() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const up = () => {
      setOnline(true);
      toast(L.you_re_back_online);
    };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  if (online) return null;
  return (
    <div className="fixed inset-0 z-[85] flex flex-col items-center justify-center bg-surface px-8 text-center" role="alert">
      <div className="mb-6 grid size-24 place-items-center rounded-full bg-brand-light text-brand">
        <WifiOff className="size-11" />
      </div>
      <h2 className="text-3xl font-bold tracking-wide text-brand-dark">{L.whoops}</h2>
      <p className="mt-2 font-semibold text-ink">{L.slow_or_no_internet_connection}</p>
      <p className="mt-4 text-sm font-semibold text-brand-dark">{L.no_active_internet}</p>
      <p className="mt-1 text-sm text-muted">{L.check_your_internet_settings_and_try_again}</p>
      <Button className="mt-8 w-48" onClick={() => navigator.onLine && setOnline(true)}>{L.retry}</Button>
    </div>
  );
}
