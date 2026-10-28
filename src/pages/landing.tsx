import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { Mark } from '@/components/ui';
import { useMe } from '@/lib/store';

/** "/": signed-in students go straight to Home, everyone else to the landing page. */
export function Start() {
  const user = useMe();
  return <Navigate to={user ? '/discover' : '/welcome'} replace />;
}

/** Branded loading screen, shown once each time the app is opened. Short, so it never slows anyone down. */
export function BootSplash() {
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>(() => (sessionStorage.getItem('mm-booted') ? 'gone' : 'in'));
  useEffect(() => {
    if (phase === 'gone') return;
    sessionStorage.setItem('mm-booted', '1');
    const a = setTimeout(() => setPhase('out'), 900);
    const b = setTimeout(() => setPhase('gone'), 1250);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [phase === 'gone']);
  if (phase === 'gone') return null;
  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-gradient-to-b from-brand-dark to-brand transition-opacity duration-300 ${phase === 'out' ? 'pointer-events-none opacity-0' : ''}`}
      role="status"
      aria-label={`Loading ${BRAND.appName}`}
    >
      <div className="splash-in relative grid size-48 place-items-center">
        <span className="ring-wave absolute inset-0 rounded-full border border-white/40" aria-hidden />
        <div className="grid size-48 place-items-center rounded-full bg-white shadow-[0_24px_50px_rgba(5,15,35,0.35)]">
          <img src={BRAND.logo} alt={BRAND.appName} width={132} height={83} fetchPriority="high" />
        </div>
      </div>
    </div>
  );
}

/** Landing page (client design "N"): fits one screen on any phone. */
export function Welcome() {
  const nav = useNavigate();
  const user = useMe();
  if (user) return <Navigate to="/discover" replace />;
  // Accounts are created by the college on admin.mentorandmatch.com, so both buttons lead to Log In.
  const logIn = () => nav('/login');
  return (
    <div className="landing">
      <div className="sky" aria-hidden>
        <i className="band b1" />
        <i className="band b2" />
      </div>
      <header>
        <div className="brandmark">
          <i>
            <Mark size={20} />
          </i>
          {BRAND.shortName}
        </div>
        <button className="signin" onClick={logIn}>
          Sign In
        </button>
      </header>
      <div className="hero">
        <div className="halo">
          <div className="circle">
            <img src={BRAND.logo} alt="Mentor & Match" width={142} height={89} fetchPriority="high" decoding="sync" />
          </div>
        </div>
      </div>
      <p className="eyebrow">Mentor &amp; Match · Students</p>
      <h1>
        Find your mentor.
        <span>Shape your future.</span>
      </h1>
      <p className="sub">Connect with faculty, staff, alumni and peer mentors who’ve walked your path.</p>
      <div className="actions">
        <button className="p1" onClick={logIn}>
          Get started
        </button>
        <button className="p2" onClick={logIn}>
          I already have an account
        </button>
        <p className="terms">
          By continuing you agree to the <Link to="/policy/terms">Terms</Link> and <Link to="/policy/privacy">Privacy Policy</Link>.
        </p>
        <div className="powered">
          <small>Powered by</small>
          <span className="pill-brand">
            <i>
              <Mark white size={15} />
            </i>
            Mentor &amp; Match
          </span>
        </div>
      </div>
    </div>
  );
}
