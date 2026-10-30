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
type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'soft' | 'danger';
export function Button({ variant = 'primary', size = 'md', className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      {...p}
      className={cn(
        'items-center justify-center gap-2 rounded-full font-semibold transition active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none',
        size === 'lg' ? 'mx-auto flex w-full max-w-[300px]' : 'inline-flex',
        size === 'sm' && 'h-9 px-4 text-[15px]',
        size === 'md' && 'h-11 px-5 text-[15px]',
        size === 'lg' && 'h-13 px-6 text-[15px]',
        variant === 'primary' && 'bg-navy text-white shadow-[0_8px_20px_-10px_rgba(38,70,114,0.7)] hover:bg-navy-2',
        variant === 'accent' && 'brand-gradient text-white shadow-[0_10px_24px_-10px_rgba(60,106,151,0.8)] hover:brightness-110',
        variant === 'outline' && 'border border-line-strong bg-surface text-navy hover:bg-bg-soft',
        variant === 'ghost' && 'text-navy hover:bg-bg-soft',
        variant === 'soft' && 'bg-orange-fill text-navy hover:brightness-95',
        variant === 'danger' && 'bg-danger text-white',
        className,
      )}
    />
  );
}

// ---------- Layout ----------
export function Header({ title, back, right, sub }: { title: ReactNode; back?: boolean | string; right?: ReactNode; sub?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-surface/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="flex h-14 items-center gap-2 px-gutter">
        {back && (
          <button aria-label="Back" onClick={() => (typeof back === 'string' ? nav(back) : nav(-1))} className="-ml-2.5 grid size-10 place-items-center rounded-full hover:bg-bg-soft">
            <ChevronLeft className="size-6" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-[18px] font-bold">{title}</h1>
          {sub && <p className="truncate text-xs text-faint">{sub}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-gutter py-4', className)}>{children}</div>;
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={cn('shadow-premium rounded-2xl border border-line/80 bg-surface p-4', onClick && 'cursor-pointer hover:border-line-strong', className)}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 mt-5 flex items-center justify-between first:mt-0">
      <h2 className="text-xs font-bold uppercase tracking-wider text-faint">{children}</h2>
      {action}
    </div>
  );
}

export function Empty({ icon, title, body, action }: { icon: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-orange-fill text-orange-text ring-8 ring-orange-fill/40">{icon}</div>
      <p className="font-semibold">{title}</p>
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

// ---------- Avatar ----------
const AVATAR_BG = ['#203d64', '#3C6A97', '#2a527c', '#4B7BAA', '#1F3D63', '#5A86B1'];
export function Avatar({ user, size = 44, ring }: { user: Pick<User, 'id' | 'photo' | 'profile'>; size?: number; ring?: boolean }) {
  const initials = `${user.profile.firstName[0] ?? '?'}${user.profile.lastName[0] ?? ''}`.toUpperCase();
  const bg = AVATAR_BG[[...user.id].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_BG.length];
  return (
    <div
      className={cn('relative shrink-0 overflow-hidden rounded-full', ring && 'ring-2 ring-orange ring-offset-2 ring-offset-surface')}
      style={{ width: size, height: size, background: bg }}
      aria-hidden
    >
      {user.photo ? (
        <img src={user.photo} loading="lazy" decoding="async" alt="" className="size-full object-cover" />
      ) : (
        <span className="grid size-full place-items-center font-semibold text-white" style={{ fontSize: size * 0.36 }}>
          {initials}
        </span>
      )}
    </div>
  );
}

export function Badge({ children, tone = 'navy' }: { children: ReactNode; tone?: 'navy' | 'orange' | 'green' | 'gray' | 'red' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        tone === 'navy' && 'bg-navy text-white',
        tone === 'orange' && 'bg-orange-fill text-orange-text',
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
export function Field({ label, hint, children, required }: { label: string; hint?: ReactNode; children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-sm font-semibold">
        {label}
        {required && <span className="text-orange-text"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

const inputCls = 'w-full rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-[15px] outline-none placeholder:text-faint focus:border-orange focus:ring-2 focus:ring-orange/25';

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
      {max && <p className={cn('mt-1 text-right text-xs', len >= max ? 'text-danger' : 'text-faint')}>{len} / {max}</p>}
    </div>
  );
}

export function Select({ value, onChange, options, placeholder = 'Select…' }: { value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, 'appearance-none pr-10', !value && 'text-faint')}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o} className="text-text">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-faint" />
    </div>
  );
}

/** Check-all-that-apply dropdown, with optional search and add-your-own. */
export function MultiSelect({ value, onChange, options, placeholder = 'Select…', search, allowCustom }: { value: string[]; onChange: (v: string[]) => void; options: readonly string[]; placeholder?: string; search?: boolean; allowCustom?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState('');
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
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? all.filter((o) => o.toLowerCase().includes(t)) : all;
  }, [all, q]);
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  const add = () => {
    const c = custom.trim();
    if (c && !value.includes(c)) onChange([...value, c]);
    setCustom('');
  };
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(inputCls, 'flex items-center gap-2 pr-10 text-left', open && 'border-orange ring-2 ring-orange/25')}
      >
        <span className={cn('min-w-0 flex-1 truncate', !value.length && 'text-faint')}>{value.length ? value.join(', ') : placeholder}</span>
        {value.length > 1 && <span className="shrink-0 rounded-full bg-navy px-2 py-0.5 text-[11px] font-semibold text-white">{value.length}</span>}
      </button>
      <ChevronDown className={cn('pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-faint transition-transform', open && 'rotate-180')} />
      {open && (
        // preventDefault stops the wrapping <label> from re-toggling the trigger on inner clicks.
        <div onClick={(e) => e.preventDefault()} className="shadow-premium absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-xl border border-line-strong bg-surface">
          {search && (
            <div className="border-b border-line p-2">
              <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="py-2" autoFocus />
            </div>
          )}
          <ul role="listbox" aria-multiselectable className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {shown.map((o) => {
              const on = value.includes(o);
              return (
                <li key={o}>
                  <button type="button" role="option" aria-selected={on} onClick={() => toggle(o)} className={cn('flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[15px] hover:bg-bg-soft', on && 'font-semibold')}>
                    <span className={cn('grid size-5 shrink-0 place-items-center rounded-md border', on ? 'border-navy bg-navy text-white' : 'border-line-strong')}>{on && <Check className="size-3.5" strokeWidth={3} />}</span>
                    {o}
                  </button>
                </li>
              );
            })}
            {!shown.length && <li className="px-3.5 py-2.5 text-sm text-faint">No matches</li>}
          </ul>
          {allowCustom && (
            <div className="flex gap-2 border-t border-line p-2">
              <Input placeholder="Add another…" value={custom} onChange={(e) => setCustom(e.target.value)} className="py-2" onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  add();
                }
              }} />
              <Button type="button" variant="outline" size="sm" className="h-auto" onClick={add}>Add</Button>
            </div>
          )}
          {value.length > 0 && (
            <div className="flex items-center justify-between border-t border-line px-3.5 py-2 text-xs">
              <span className="text-faint">{value.length} selected</span>
              <button type="button" className="font-semibold text-orange-text" onClick={() => setOpen(false)}>Done</button>
            </div>
          )}
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
      className={cn(
        'rounded-full border px-3.5 py-2 text-sm transition',
        active ? 'border-navy bg-navy font-semibold text-white' : 'border-line-strong bg-surface text-text hover:border-navy/50',
      )}
    >
      {children}
    </button>
  );
}

/** Single choice chips (radio). */
export function ChipSingle({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o} active={value === o} onClick={() => onChange(value === o ? '' : o)}>
          {o}
        </Chip>
      ))}
    </div>
  );
}

/** Check-all-that-apply chips, with optional search and add-your-own. */
export function ChipMulti({ value, onChange, options, search, allowCustom }: { value: string[]; onChange: (v: string[]) => void; options: readonly string[]; search?: boolean; allowCustom?: boolean }) {
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState('');
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const shown = q ? all.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : all;
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div>
      {search && <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-2" />}
      <div className="flex flex-wrap gap-2">
        {shown.map((o) => (
          <Chip key={o} active={value.includes(o)} onClick={() => toggle(o)}>
            {o}
          </Chip>
        ))}
      </div>
      {allowCustom && (
        <div className="mt-2 flex gap-2">
          <Input placeholder="Add another…" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => {
            if (e.key === 'Enter' && custom.trim()) {
              e.preventDefault();
              if (!value.includes(custom.trim())) onChange([...value, custom.trim()]);
              setCustom('');
            }
          }} />
          <Button type="button" variant="outline" onClick={() => {
            if (custom.trim() && !value.includes(custom.trim())) onChange([...value, custom.trim()]);
            setCustom('');
          }}>Add</Button>
        </div>
      )}
      {value.length > 0 && <p className="mt-2 text-xs text-faint">{value.length} selected</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center gap-3 py-3 text-left" role="switch" aria-checked={checked}>
      <span className="flex-1">
        <span className="block text-[15px] font-medium">{label}</span>
        {sub && <span className="block text-xs text-faint">{sub}</span>}
      </span>
      <span className={cn('relative h-7 w-12 rounded-full transition', checked ? 'bg-orange' : 'bg-line-strong')}>
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
      <div className="sheet-up relative max-h-[88vh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl bg-surface pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-10 flex items-center border-b border-line bg-surface px-4 py-3">
          <h2 className="flex-1 text-base font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full hover:bg-bg-soft">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
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

// ---------- Toast + branded push banner ----------
let pushToast: (msg: string) => void = () => {};
export const toast = (msg: string) => pushToast(msg);

export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ id: number; title: string; body: string } | null>(null);
  useEffect(() => {
    pushToast = (m) => {
      setMsg(m);
      setTimeout(() => setMsg((cur) => (cur === m ? null : cur)), 2400);
    };
    return onPush((b) => {
      setBanner(b);
      setTimeout(() => setBanner((cur) => (cur?.id === b.id ? null : cur)), 4500);
    });
  }, []);
  return (
    <>
      {banner && (
        <div className="fade-up fixed inset-x-0 top-2 z-[60] mx-auto w-[calc(100%-16px)] max-w-[414px]" role="status">
          <div className="flex items-start gap-3 rounded-2xl bg-navy p-3 text-white shadow-2xl" onClick={() => setBanner(null)}>
            <img src={BRAND.icon} alt="" className="size-10 rounded-xl bg-white object-contain p-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-2">{BRAND.appName} · now</p>
              <p className="truncate text-sm font-semibold">{banner.title}</p>
              <p className="line-clamp-2 text-sm text-white/80">{banner.body}</p>
            </div>
          </div>
        </div>
      )}
      {msg && (
        <div className="fade-up fixed inset-x-0 bottom-28 z-[60] mx-auto w-fit max-w-[90%] rounded-full bg-navy/95 px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_30px_-8px_rgba(38,70,114,0.6)] backdrop-blur" role="status">
          {msg}
        </div>
      )}
    </>
  );
}

// ---------- Powered by Mentor & Match ----------
/** Company sign-off with the Mentor & Match logo. `dark` = sits on a blue background. */
export function PoweredBy({ dark, className }: { dark?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <span className={cn('text-[10px] font-semibold uppercase tracking-[0.28em]', dark ? 'text-white/60' : 'text-faint')}>Powered by</span>
      <span className={cn('pill-brand mt-2', dark && 'bg-white/95')}>
        <i>
          <Mark white size={15} />
        </i>
        Mentor &amp; Match
      </span>
    </div>
  );
}

// ---------- New version banner ----------
/** Shows when a newer version of the app has been deployed; one tap reloads into it. */
export function UpdateBanner() {
  const [ready, setReady] = useState(false);
  useEffect(() => watchForUpdates(() => setReady(true)), []);
  if (!ready) return null;
  return (
    <div className="fade-up fixed inset-x-0 top-2 z-[95] mx-auto w-[calc(100%-16px)] max-w-[464px]" role="status">
      <div className="shadow-premium flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-fill">
          <Mark size={24} />
        </span>
        <p className="min-w-0 flex-1 text-sm font-semibold text-navy">{L.new_version_of_mentor_available}</p>
        <Button size="sm" variant="ghost" onClick={() => setReady(false)}>{L.exit}</Button>
        <Button size="sm" variant="accent" onClick={() => window.location.reload()}>{L.download_now}</Button>
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
