import { useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { BRAND } from '@/config/brand';
import { Mark } from '@/components/ui';
import { useMe } from '@/lib/store';

/** "/": signed-in students go straight to Home, everyone else to the landing page. */
export function Start() {
  const user = useMe();
  return <Navigate to={user ? '/discover' : '/welcome'} replace />;
}

/**
 * Fades out the loading screen from index.html (shown on every visit and refresh) once the first screen is ready.
 * It stays up at least half a second from the start of the load, so the logo reads as a splash, not a flicker.
 */
export function BootSplash() {
  useEffect(() => {
    const el = document.getElementById('boot');
    if (!el) return;
    const wait = Math.max(0, 500 - performance.now());
    const a = setTimeout(() => el.classList.add('out'), wait);
    const b = setTimeout(() => el.remove(), wait + 300);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);
  return null;
}

/** Same look as the loading screen, for the rare moment a page is still downloading. */
export function BrandLoader() {
  return (
    <div className="grid min-h-app place-items-center bg-gradient-to-b from-brand-dark to-brand" role="status" aria-label={`Loading ${BRAND.appName}`}>
      <div className="relative grid size-48 place-items-center">
        <span className="ring-wave absolute inset-0 rounded-full border border-white/40" aria-hidden />
        <div className="grid size-48 place-items-center rounded-full bg-white shadow-[0_24px_50px_rgba(5,15,35,0.35)]">
          <img src={BRAND.logo} alt="" width={116} height={73} />
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
