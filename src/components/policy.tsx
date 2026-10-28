import { useMemo } from 'react';
import { parsePolicy } from '@/data/policies';

// Renders the policy pages (see data/policies.ts), turning URLs and email addresses into links.
const URL_RE = /(https?:\/\/[^\s]+|www\.[^\s]+|[\w.+-]+@[\w-]+\.[\w.]+)/g;
function Linkify({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <a key={i} href={p.includes('@') && !p.startsWith('http') ? `mailto:${p}` : p.startsWith('www.') ? `https://${p}` : p.replace(/^:/, '')} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-brand underline underline-offset-2">
            {p}
          </a>
        ) : (
          p
        ),
      )}
    </>
  );
}

export function PolicyBody({ body }: { body: string }) {
  const blocks = useMemo(() => parsePolicy(body), [body]);
  return (
    <div className="text-[15px] leading-relaxed text-ink">
      {blocks.map((b, i) =>
        b.kind === 'h' ? (
          <h2 key={i} className="mb-2 mt-6 text-[17px] font-bold text-brand-dark first:mt-0">{b.text[0]}</h2>
        ) : b.kind === 'sub' ? (
          <h3 key={i} className="mb-1.5 mt-4 font-semibold text-brand-dark">{b.text[0]}</h3>
        ) : b.kind === 'ul' ? (
          <ul key={i} className="mb-3 list-disc space-y-1.5 pl-5 marker:text-brand">
            {b.text.map((t, j) => (
              <li key={j}>
                <Linkify text={t} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i} className="mb-3 text-muted">
            <Linkify text={b.text[0]} />
          </p>
        ),
      )}
    </div>
  );
}
