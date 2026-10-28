// Live app updates. Every deploy gets a new hashed script name in index.html; the app checks for it
// every minute and whenever it comes back to the foreground, so every open phone or desktop picks up
// the new version without the member having to clear their cache.

const CHECK_EVERY_MS = 60_000;

/** The hashed entry script this page is running, e.g. "/assets/index-AbC123.js". */
function currentBuild() {
  const s = document.querySelector<HTMLScriptElement>('script[type="module"][src*="/assets/"]');
  return s ? new URL(s.src).pathname : null;
}

async function latestBuild() {
  const res = await fetch(`/index.html?v=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return (await res.text()).match(/\/assets\/index-[^"']+\.js/)?.[0] ?? null;
}

/** Calls `onUpdate` once when a newer deploy is live. Returns a cleanup function. */
export function watchForUpdates(onUpdate: () => void) {
  const running = currentBuild();
  if (!import.meta.env.PROD || !running) return () => {};
  let found = false;
  const check = async () => {
    if (found) return;
    try {
      const latest = await latestBuild();
      if (latest && latest !== running) {
        found = true;
        onUpdate();
      }
    } catch {
      /* offline: try again later */
    }
  };
  const onVisible = () => document.visibilityState === 'visible' && check();
  const t = setInterval(check, CHECK_EVERY_MS);
  document.addEventListener('visibilitychange', onVisible);
  window.addEventListener('focus', check);
  return () => {
    clearInterval(t);
    document.removeEventListener('visibilitychange', onVisible);
    window.removeEventListener('focus', check);
  };
}
