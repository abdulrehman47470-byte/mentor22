import { Camera, Check, ChevronDown, ChevronLeft, Fingerprint, GraduationCap, Images, MailCheck, ScanFace, Search, ShieldCheck, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { L, fill } from '@/data/labels';
import { DEMO_EMAIL, DEMO_OTP, DEMO_PASSWORD } from '@/data/mock';
import { COLLEGES, COLLEGE_CITIES } from '@/data/options';
import { POLICIES } from '@/data/policies';
import { Avatar, Button, Field, Input, Mark, PasswordInput, Sheet, ask, toast } from '@/components/ui';
import { PolicyBody } from '@/components/policy';
import { cropToSquare } from '@/components/media';
import { acceptEducational, forgotPassword, logIn, pendingEmail, resendOtp, setCollege, setNewPassword, setPhoto, strongPassword, validEmail, verifyOtp } from '@/lib/api';
import { cn, useDb, useMe } from '@/lib/store';

/** Blue curved header shared by the sign-in screens. */
function AuthLayout({ title, intro, back, children }: { title: string; intro?: ReactNode; back?: string | false; children: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="min-h-app bg-bg">
      <div className="auth-top px-gutter pb-16 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="relative z-10 flex h-12 items-center">
          {back !== false && (
            <button aria-label="Back" onClick={() => (back ? nav(back) : nav(-1))} className="-ml-2.5 grid size-10 place-items-center rounded-full hover:bg-white/10">
              <ChevronLeft className="size-6" />
            </button>
          )}
          <span className="ml-auto grid size-10 place-items-center rounded-full bg-white shadow">
            <Mark size={22} />
          </span>
        </div>
        <h1 className="relative z-10 mt-4 text-[29px] font-bold leading-tight tracking-tight">{title}</h1>
        {intro && <p className="relative z-10 mt-2 max-w-[320px] text-[15px] leading-relaxed text-white/85">{intro}</p>}
      </div>
      <div className="relative z-10 -mt-6 px-gutter pb-10">{children}</div>
    </div>
  );
}

function Err({ children }: { children: string }) {
  return children ? <p className="mb-3 rounded-xl bg-danger/8 px-3.5 py-2.5 text-sm font-medium text-danger" role="alert">{children}</p> : null;
}

// ---------- Log In ----------
export function Login() {
  const nav = useNavigate();
  const user = useMe();
  const termsAccepted = useDb((d) => d.device.termsAccepted);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(termsAccepted);
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState('');
  // Only redirect someone who arrives already signed in; a fresh log-in navigates itself.
  const [signedInOnArrival] = useState(!!user);
  if (signedInOnArrival) return <Navigate to="/discover" replace />;

  const proceed = (agreed: boolean) => {
    if (!email.trim()) return setErr(L.please_enter_email_address);
    if (!validEmail(email)) return setErr(L.please_enter_a_valid_email_address);
    if (!password) return setErr(L.please_enter_password);
    if (!strongPassword(password)) return setErr(fill(L.password_length_must_be_xx_digit_only, BRAND.minPassword));
    // First time only: the full Terms of Service must be accepted before logging in.
    if (!agreed) return setTerms(true);
    setErr('');
    const r = logIn(email, password);
    if ('error' in r) return setErr(r.error);
    nav(r.next);
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    proceed(agree);
  };
  // "I Agree" goes straight on to the verification code once the email and password are filled in.
  const accept = () => {
    setAgree(true);
    setTerms(false);
    if (email.trim() && password) proceed(true);
  };

  return (
    <AuthLayout title={L.log_in} intro={L.please_login_to_continue_your_mentoring} back="/welcome">
      <form onSubmit={submit} noValidate className="shadow-card rounded-3xl border border-line bg-surface p-5">
        <Field label={L.email_address}>
          <Input type="email" inputMode="email" autoComplete="username" placeholder={L.email_address} value={email} onChange={(e) => (setEmail(e.target.value), setErr(''))} />
        </Field>
        <Field label={L.password}>
          <PasswordInput autoComplete="current-password" placeholder={L.password} value={password} onChange={(e) => (setPassword(e.target.value), setErr(''))} />
        </Field>
        <div className="-mt-1 mb-4 text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-brand">
            {L.forgot_passwordq}
          </Link>
        </div>
        <div className="mb-4 flex items-center gap-2.5 text-sm">
          <button type="button" role="checkbox" aria-checked={agree} aria-label={`${L.i_agree_with} ${L.terms_and_conditions}`} onClick={() => (agree ? setAgree(false) : setTerms(true))} className={cn('grid size-5 shrink-0 place-items-center rounded-md border-2 transition', agree ? 'border-brand bg-brand text-white' : 'border-line-strong')}>
            {agree && <Check className="size-3.5" strokeWidth={3} />}
          </button>
          <span className="text-muted">
            {L.i_agree_with}{' '}
            <button type="button" onClick={() => setTerms(true)} className="font-semibold text-brand-dark underline underline-offset-2">
              {L.terms_and_conditions}
            </button>
          </span>
        </div>
        <Err>{err}</Err>
        <Button size="lg" type="submit">
          {L.log_in}
        </Button>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {[
            { label: L.fingerprint, icon: Fingerprint },
            { label: L.face_id_slash_biometrics, icon: ScanFace },
          ].map(({ label, icon: Icon }) => (
            // Biometric log-in is for mentors only (it is switched on in their Settings).
            <button key={label} type="button" onClick={() => toast(L.this_feature_you_cant_access)} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-brand-dark hover:bg-bg-soft">
              <Icon className="size-5 text-brand" />
              {label}
            </button>
          ))}
        </div>
      </form>
      <button type="button" onClick={() => (setEmail(DEMO_EMAIL), setPassword(DEMO_PASSWORD), setErr(''))} className="mx-auto mt-5 block rounded-2xl bg-brand-light px-4 py-3 text-center text-xs text-brand-dark">
        <b>Demo account:</b> {DEMO_EMAIL} · {DEMO_PASSWORD}
        <span className="mt-0.5 block font-semibold underline underline-offset-2">Tap to fill</span>
      </button>
      <TermsSheet open={terms} onClose={() => setTerms(false)} onAccept={accept} />
    </AuthLayout>
  );
}

/** First-time pop-up with the full Terms of Service. */
function TermsSheet({ open, onClose, onAccept }: { open: boolean; onClose: () => void; onAccept: () => void }) {
  const [tick, setTick] = useState(false);
  const terms = useDb((d) => d.cms.terms);
  return (
    <Sheet open={open} onClose={onClose} title={L.terms_of_service}>
      <PolicyBody body={terms} />
      <div className="sticky bottom-0 -mx-4 -mb-4 mt-4 border-t border-line bg-surface px-4 pb-4 pt-4">
        <button type="button" onClick={() => setTick((t) => !t)} className="mb-3 flex items-center gap-2.5 text-left text-sm font-medium" role="checkbox" aria-checked={tick}>
          <span className={cn('grid size-5 shrink-0 place-items-center rounded-md border-2', tick ? 'border-brand bg-brand text-white' : 'border-line-strong')}>{tick && <Check className="size-3.5" strokeWidth={3} />}</span>
          {L.i_agree_with_terms_of_Service}
        </button>
        <Button size="lg" disabled={!tick} onClick={onAccept}>
          {L.accept_terms}
        </Button>
      </div>
    </Sheet>
  );
}

// ---------- Forgot password ----------
export function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <AuthLayout title={L.please_check_email} back="/login">
        <div className="shadow-card rounded-3xl border border-line bg-surface p-6 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-brand-light text-brand">
            <MailCheck className="size-8" />
          </div>
          <p className="text-[15px] text-ink">{L.we_have_sent_instructions_to_your_email}</p>
          <p className="mt-1 text-sm font-semibold text-brand-dark">{email}</p>
          <Button size="lg" className="mt-6" onClick={() => nav('/login', { replace: true })}>
            {L.log_in}
          </Button>
          {/* Demo: stands in for the link in the email. */}
          <button className="mt-4 text-sm font-semibold text-brand underline underline-offset-2" onClick={() => nav('/create-password')}>
            Open the email link (demo)
          </button>
        </div>
      </AuthLayout>
    );
  return (
    <AuthLayout title={L.forgot_passwordq} intro={L.enter_the_email_associated_with_your_account} back="/login">
      <form
        noValidate
        className="shadow-card rounded-3xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!email.trim()) return setErr(L.please_enter_email_address);
          if (!validEmail(email)) return setErr(L.please_enter_a_valid_email_address);
          const r = forgotPassword(email);
          if ('error' in r) return setErr(r.error);
          setSent(true);
        }}
      >
        <Field label={L.email_address}>
          <Input type="email" inputMode="email" autoComplete="email" placeholder={L.email_address} value={email} onChange={(e) => (setEmail(e.target.value), setErr(''))} autoFocus />
        </Field>
        <Err>{err}</Err>
        <Button size="lg" type="submit">
          {L.submit}
        </Button>
      </form>
    </AuthLayout>
  );
}

// ---------- Verification code ----------
const OTP_LEN = 6;

export function Verify() {
  const nav = useNavigate();
  const pending = useDb((d) => d.pendingOtp);
  const user = useMe();
  const email = useDb((d) => pendingEmail(d));
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!pending) return;
    const tick = () => setLeft(Math.max(0, Math.round((pending.expiresAt - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [pending]);
  // Once verified, pendingOtp clears just before we navigate on; don't bounce back to Log In then.
  if (!pending) return user ? null : <Navigate to="/login" replace />;
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <AuthLayout title={L.verification_code} intro={<>{L.we_have_sent_the_verification_code_to_your_email} <b className="text-white">{email}</b></>} back="/login">
      <form
        noValidate
        className="shadow-card rounded-3xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!code) return setErr(L.please_enter_otp_code);
          if (code.length < OTP_LEN) return setErr(L.please_enter_correct_otp);
          const r = verifyOtp(code);
          if ('error' in r) return setErr(r.error);
          nav(r.next, { replace: true });
        }}
      >
        <div className="mb-4 flex justify-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-light text-brand">
            <ShieldCheck className="size-7" />
          </span>
        </div>
        <CodeInput value={code} onChange={(v) => (setCode(v), setErr(''))} />
        <p className={cn('mt-4 text-center text-sm', left ? 'text-muted' : 'font-semibold text-danger')}>
          {L.expiring_in} <b className="tabular-nums text-brand-dark">{mm}:{ss}</b>
        </p>
        <div className="mt-3">
          <Err>{err}</Err>
        </div>
        <Button size="lg" type="submit">
          {L.verify}
        </Button>
        <p className="mt-4 text-center text-sm text-muted">
          {L.didnt_recieve}{' '}
          <button
            type="button"
            className="font-semibold text-brand underline underline-offset-2"
            onClick={() => {
              resendOtp();
              setCode('');
              setErr('');
              toast(L.otp_sent_to_your_registered_email_address_please_check);
            }}
          >
            {L.resend}
          </button>
        </p>
      </form>
      <p className="mt-5 text-center text-xs text-muted">
        Demo code: <b className="text-brand-dark">{DEMO_OTP}</b>
      </p>
    </AuthLayout>
  );
}

function CodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={OTP_LEN}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, OTP_LEN))}
        className="absolute inset-0 z-10 w-full cursor-text opacity-0"
        aria-label={L.verification_code}
        autoFocus
      />
      <div className="grid grid-cols-6 gap-2" aria-hidden>
        {Array.from({ length: OTP_LEN }, (_, i) => (
          <div key={i} className={cn('grid h-14 place-items-center rounded-xl bg-field text-xl font-bold text-brand-dark transition', i === value.length && 'ring-2 ring-brand')}>
            {value[i] ?? ''}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Create / reset password ----------
export function CreatePassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  if (done)
    return (
      <AuthLayout title={L.password_reset} back={false}>
        <div className="shadow-card rounded-3xl border border-line bg-surface p-6 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-success/10 text-success">
            <Check className="size-8" strokeWidth={2.5} />
          </div>
          <p className="text-[15px] text-ink">{L.your_password_has_been_reset_successfully}</p>
          <Button size="lg" className="mt-6" onClick={() => nav('/login', { replace: true })}>
            {L.log_in}
          </Button>
        </div>
      </AuthLayout>
    );
  return (
    <AuthLayout title={L.create_new_password} intro={L.your_new_password_should_be_different_from_previously_used} back="/login">
      <form
        noValidate
        className="shadow-card rounded-3xl border border-line bg-surface p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!pw) return setErr(L.please_enter_new_password);
          if (!strongPassword(pw)) return setErr(fill(L.password_length_must_be_xx_digit_only, BRAND.minPassword));
          if (!confirm) return setErr(L.please_enter_confirm_password);
          if (pw !== confirm) return setErr(L.new_password_and_confirm_must_same);
          const r = setNewPassword(pw);
          if ('error' in r) return setErr(r.error);
          setDone(true);
        }}
      >
        <Field label={L.new_password}>
          <PasswordInput autoComplete="new-password" placeholder={L.new_password} value={pw} onChange={(e) => (setPw(e.target.value), setErr(''))} />
        </Field>
        <Strength password={pw} />
        <Field label={L.confirm_password}>
          <PasswordInput autoComplete="new-password" placeholder={L.confirm_password} value={confirm} onChange={(e) => (setConfirm(e.target.value), setErr(''))} />
        </Field>
        <Err>{err}</Err>
        <Button size="lg" type="submit">
          {L.reset_password}
        </Button>
      </form>
    </AuthLayout>
  );
}

/** Weak / Strong password (minimum length from the server, currently 8). */
export function Strength({ password }: { password: string }) {
  if (!password) return null;
  const strong = strongPassword(password);
  const level = strong ? (/[A-Z]/.test(password) && /\d/.test(password) ? 3 : 2) : 1;
  return (
    <div className="-mt-2 mb-4" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full transition', i <= level ? (strong ? 'bg-success' : 'bg-danger') : 'bg-line')} />
        ))}
      </div>
      <p className={cn('mt-1.5 text-xs font-semibold', strong ? 'text-success' : 'text-danger')}>{strong ? L.strong_password : L.weak_password}</p>
    </div>
  );
}

// ---------- Select your college ----------
export function SelectCollege() {
  const nav = useNavigate();
  const user = useMe();
  const [picked, setPicked] = useState(user?.profile.college ?? '');
  const [err, setErr] = useState('');
  if (!user) return <Navigate to="/login" replace />;
  return (
    <AuthLayout title={L.select_your_college} back={false}>
      <div className="shadow-card rounded-3xl border border-line bg-surface p-5">
        <span className="mb-4 flex justify-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-light text-brand">
            <GraduationCap className="size-7" />
          </span>
        </span>
        <span className="mb-1.5 block text-sm font-semibold">{L.search_college}</span>
        <CollegeDropdown value={picked} onChange={(v) => (setPicked(v), setErr(''))} />
        <div className="mt-4">
          <Err>{err}</Err>
        </div>
        <Button
          size="lg"
          onClick={() => {
            if (!picked) return setErr(L.please_select_college);
            setCollege(picked);
            nav('/upload-photo');
          }}
        >
          {L.done}
        </Button>
      </div>
    </AuthLayout>
  );
}

const COLLEGE_LIST = COLLEGES.map((name, i) => ({ name, city: COLLEGE_CITIES[i] }));
const initials = (name: string) => name.split(' ').filter((w) => /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join('');

/** Searchable single-choice dropdown of the colleges. */
function CollegeDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
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
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? COLLEGE_LIST.filter((c) => `${c.name} ${c.city}`.toLowerCase().includes(t)) : COLLEGE_LIST;
  }, [q]);
  const current = COLLEGE_LIST.find((c) => c.name === value);
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (setOpen((o) => !o), setQ(''))}
        className={cn('flex w-full items-center gap-3 rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-left text-[15px] outline-none transition', open && 'border-brand ring-2 ring-brand/25')}
      >
        {current ? (
          <>
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-xs font-bold text-white">{initials(current.name)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink">{current.name}</span>
              <span className="block truncate text-xs text-muted">{current.city}</span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-faint">{L.search_college_university}</span>
        )}
        <ChevronDown className={cn('size-5 shrink-0 text-faint transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="pop shadow-premium absolute inset-x-0 top-full z-40 mt-1.5 overflow-hidden rounded-2xl border border-line-strong bg-surface">
          <label className="relative block border-b border-line p-2">
            <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input placeholder={L.search_college_university} aria-label={L.search_college} value={q} onChange={(e) => setQ(e.target.value)} className="py-2.5 pl-10" autoFocus />
          </label>
          <ul role="listbox" aria-label={L.select_your_college} className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {list.map((c) => {
              const on = c.name === value;
              return (
                <li key={c.name}>
                  <button type="button" role="option" aria-selected={on} onClick={() => (onChange(c.name), setOpen(false))} className={cn('flex w-full items-center gap-3 px-3 py-2.5 text-left transition', on ? 'bg-brand-light' : 'hover:bg-bg-soft')}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand text-xs font-bold text-white">{initials(c.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{c.name}</span>
                      <span className="block text-xs text-muted">{c.city}</span>
                    </span>
                    {on && <Check className="size-5 shrink-0 text-brand" strokeWidth={2.6} />}
                  </button>
                </li>
              );
            })}
            {!list.length && <li className="py-6 text-center text-sm text-muted">{L.no_data}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------- Upload profile photo ----------
export function UploadPhoto() {
  const nav = useNavigate();
  const user = useMe();
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  if (!user) return <Navigate to="/login" replace />;
  const next = () => nav('/educational-notice');
  const onFile = async (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) return toast(L.app_does_not_have_access_to_your_photos);
    setPreview(await cropToSquare(f));
  };
  const upload = async () => {
    if (!preview) return gallery.current?.click();
    if ((await ask({ message: L.are_you_sure_you_want_to_upload_profile_imageq })) === null) return;
    setPhoto(preview);
    toast(L.profile_image_uploaded_successfully);
    next();
  };
  const shown = preview ? { ...user, photo: preview } : user;
  return (
    <AuthLayout title={L.upload_profile} intro="Members are more likely to connect with someone whose face they can see." back={false}>
      <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ''))} />
      <input ref={camera} type="file" accept="image/*" capture="user" hidden onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ''))} />
      <div className="shadow-card flex flex-col items-center rounded-3xl border border-line bg-surface p-6">
        <button onClick={() => gallery.current?.click()} className="relative" aria-label={L.select_image}>
          <Avatar user={shown} size={140} ring />
          <span className="absolute bottom-1 right-1 grid size-10 place-items-center rounded-full bg-brand text-white shadow-lg">
            <Camera className="size-5" />
          </span>
        </button>
        <p className="mt-5 text-sm font-semibold text-muted">{L.select_image}</p>
        <div className="mt-3 grid w-full max-w-[300px] grid-cols-2 gap-3">
          {[
            { label: L.gallery, icon: Images, el: gallery },
            { label: L.camera, icon: Camera, el: camera },
          ].map(({ label, icon: Icon, el }) => (
            <button key={label} type="button" onClick={() => el.current?.click()} className="flex flex-col items-center gap-1.5 rounded-2xl bg-brand-light py-4 text-[15px] font-semibold text-brand-dark transition hover:bg-field active:scale-[0.98]">
              <Icon className="size-6 text-brand" />
              {label}
            </button>
          ))}
        </div>
        <div className="mt-6 w-full space-y-2">
          <Button size="lg" onClick={upload}>
            <Upload className="size-5" />
            {L.upload}
          </Button>
          <Button size="lg" variant="ghost" onClick={next}>
            {L.skip}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}

// ---------- Educational purposes notice ----------
/** Fills the screen: the notice scrolls on its own and OK stays pinned at the bottom, always in reach. */
export function EducationalNotice() {
  const nav = useNavigate();
  const user = useMe();
  const body = useDb((d) => d.cms.educational);
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex h-app flex-col overflow-hidden bg-bg">
      <div className="auth-top shrink-0 px-gutter pb-14 pt-[max(20px,env(safe-area-inset-top))]">
        <span className="relative z-10 grid size-10 place-items-center rounded-full bg-white shadow">
          <Mark size={22} />
        </span>
        <h1 className="relative z-10 mt-4 text-[29px] font-bold leading-tight tracking-tight">{L.mentor_match_educational_purpose_only}</h1>
      </div>
      <div className="relative z-10 -mt-6 flex min-h-0 flex-1 flex-col px-gutter">
        <div className="shadow-card flex min-h-0 flex-1 flex-col rounded-t-3xl border border-b-0 border-line bg-surface">
          <h2 className="px-5 pb-2 pt-5 text-lg font-bold text-brand-dark">{POLICIES.educational.title}</h2>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
            <PolicyBody body={body} />
          </div>
        </div>
      </div>
      <div className="shrink-0 border-t border-line bg-surface px-gutter pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
        <Button
          size="lg"
          onClick={() => {
            acceptEducational();
            nav('/discover', { replace: true });
          }}
        >
          {L.ok}
        </Button>
      </div>
    </div>
  );
}
