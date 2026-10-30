import { FileText, Image as ImageIcon, MessageCircle, Mic, MicOff, NotebookPen, Paperclip, Phone, PhoneOff, ScreenShare, Send, Video, VideoOff, Volume2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar, Button, Empty, Header, Sheet, toast } from '@/components/ui';
import { checkMessage, fullName, isBlocked, logCall, markThreadRead, sendMessage, statusBetween, threads, updateCall, userById } from '@/lib/api';
import { L } from '@/data/labels';
import { CallsHub, RecapForm, mmss as fmtSecs } from './calls';
import { cn, fmtDate, fmtTime, timeAgo, useDb, useMe } from '@/lib/store';

export function Messages() {
  const list = useDb((d) => threads(d));
  const connected = useDb((d) =>
    d.connections
      .filter((c) => c.status === 'connected' && (c.from === d.sessionUserId || c.to === d.sessionUserId))
      .map((c) => userById(c.from === d.sessionUserId ? c.to : c.from, d)!)
      .filter(Boolean),
  );
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'calls' ? 'calls' : 'chats';
  const missed = useDb((d) => d.calls.filter((c) => c.status === 'missed').length);
  return (
    <div>
      <Header title="Messages" />
      <div className="px-gutter pt-3">
        <div role="tablist" className="grid grid-cols-2 rounded-full bg-bg-soft p-1 ring-1 ring-line">
          {(['chats', 'calls'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setParams(t === 'calls' ? { tab: 'calls' } : {}, { replace: true })}
              className={cn('flex h-9 items-center justify-center gap-1.5 rounded-full text-sm font-semibold capitalize transition', tab === t ? 'bg-surface text-navy shadow-premium' : 'text-faint')}>
              {t === 'chats' ? <MessageCircle className="size-4" /> : <Phone className="size-4" />}{t}
              {t === 'calls' && missed > 0 && <span className="grid min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{missed}</span>}
            </button>
          ))}
        </div>
      </div>
      {tab === 'calls' ? <CallsHub /> : <>
      {connected.length > 0 && (
        <div className="border-b border-line py-3">
          <p className="mb-2 px-gutter text-xs font-bold uppercase tracking-wider text-faint">Your connections</p>
          <div className="no-scrollbar flex gap-4 overflow-x-auto px-gutter">
            {connected.map((u) => (
              <button key={u.id} onClick={() => nav(`/messages/${u.id}`)} className="flex w-16 shrink-0 flex-col items-center gap-1">
                <Avatar user={u} size={56} ring />
                <span className="w-full truncate text-xs">{u.profile.firstName}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <ul className="divide-y divide-line">
        {list.map((t) => (
          <li key={t.other.id}>
            <Link to={`/messages/${t.other.id}`} className="flex items-center gap-3 px-gutter py-3 hover:bg-bg-soft">
              <Avatar user={t.other} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className={cn('flex-1 truncate', t.unread ? 'font-bold' : 'font-semibold')}>{fullName(t.other)}</p>
                  <span className="text-xs text-faint">{timeAgo(t.last.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <p className={cn('flex-1 truncate text-sm', t.unread ? 'font-semibold text-text' : 'text-muted')}>
                    {t.last.type === 'text' ? t.last.text : t.last.type === 'image' ? '📷 Photo' : `📄 ${t.last.fileName}`}
                  </p>
                  {t.unread > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-orange px-1.5 text-[11px] font-bold text-white">{t.unread}</span>}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {!list.length && <Empty icon={<MessageCircle className="size-7" />} title={L.no_chats_to_display} body="Once you’re connected with someone you can chat here." />}
      </>}
    </div>
  );
}

export function Chat() {
  const { id = '' } = useParams();
  const me = useMe()!;
  const nav = useNavigate();
  const other = useDb((d) => userById(id, d));
  const status = useDb((d) => statusBetween(me.id, id, d));
  const blocked = useDb((d) => isBlocked(me.id, id, d));
  const blockedByMe = useDb((d) => d.blocks.some((b) => b.userId === me.id && b.blockedId === id));
  const msgs = useDb((d) => d.messages.filter((m) => (m.from === me.id && m.to === id) || (m.from === id && m.to === me.id)));
  const [text, setText] = useState('');
  const [attach, setAttach] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const docInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    markThreadRead(id);
  }, [id, msgs.length]);
  useLayoutEffect(() => {
    bottom.current?.scrollIntoView();
  }, [msgs.length]);
  if (!other) return null;
  const canChat = status === 3 && !blocked;

  const sendFile = (f: File | undefined, type: 'image' | 'document') => {
    setAttach(false);
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast('Files up to 5 MB in the prototype');
    if (type === 'image') {
      const r = new FileReader();
      r.onload = () => sendMessage(id, '', { type, name: f.name, url: String(r.result) });
      r.readAsDataURL(f);
    } else sendMessage(id, '', { type, name: f.name, url: '' });
  };

  let lastDay = '';
  return (
    <div className="flex min-h-app flex-col">
      <Header
        back="/messages"
        title={<Link to={`/member/${id}`} className="flex items-center gap-2"><Avatar user={other} size={32} />{fullName(other)}</Link>}
        right={canChat && (
          <div className="flex">
            <button aria-label="Audio call" onClick={() => nav(`/call/${id}`)} className="grid size-10 place-items-center rounded-full hover:bg-bg-soft"><Phone className="size-5" /></button>
            <button aria-label="Video call" onClick={() => nav(`/call/${id}?video=1`)} className="grid size-10 place-items-center rounded-full hover:bg-bg-soft"><Video className="size-5" /></button>
          </div>
        )}
      />
      <div className="flex-1 space-y-1.5 bg-bg-soft px-gutter py-4">
        {msgs.map((m) => {
          const mine = m.from === me.id;
          const day = fmtDate(m.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          return (
            <div key={m.id}>
              {showDay && <p className="my-3 text-center text-[11px] font-semibold text-faint">{day}</p>}
              <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px]', mine ? 'rounded-br-md bg-navy text-white' : 'rounded-bl-md border border-line bg-surface')}>
                  {m.type === 'image' && m.fileUrl && <img loading="lazy" decoding="async" src={m.fileUrl} alt={m.fileName} className="-mx-1.5 -mt-0.5 mb-1 max-h-60 rounded-xl" />}
                  {m.type === 'document' && (
                    <span className="flex items-center gap-2"><FileText className={cn('size-5', mine ? 'text-orange-2' : 'text-orange-text')} /><span className="underline">{m.fileName}</span></span>
                  )}
                  {m.text && <span className="whitespace-pre-wrap">{m.text}</span>}
                  <span className={cn('ml-2 text-[10px]', mine ? 'text-white/60' : 'text-faint')}>{fmtTime(m.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
        {!msgs.length && <p className="py-10 text-center text-sm text-faint">Say hello to {other.profile.firstName} 👋</p>}
        <div ref={bottom} />
      </div>
      {canChat ? (
        <form
          className="sticky bottom-0 flex items-end gap-2 border-t border-line bg-surface px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return toast(L.please_enter_message);
            // Phone numbers, emails and inappropriate words aren't allowed in chat.
            const problem = checkMessage(text);
            if (problem) return toast(problem);
            sendMessage(id, text.trim());
            setText('');
          }}
        >
          <button type="button" aria-label="Attach" onClick={() => setAttach(true)} className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-bg-soft"><Paperclip className="size-5" /></button>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }}
            rows={1}
            placeholder={L.write_a_message}
            aria-label={L.write_a_message}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl border border-line-strong px-4 py-2.5 text-[15px] outline-none focus:border-orange"
          />
          <button type="submit" aria-label="Send" disabled={!text.trim()} className="grid size-11 shrink-0 place-items-center rounded-full bg-navy text-white disabled:opacity-40"><Send className="size-5" /></button>
        </form>
      ) : (
        <div className="sticky bottom-0 border-t border-line bg-surface p-4 text-center text-sm text-muted">
          {blocked ? (blockedByMe ? L.the_user_has_been_blocked : L.you_have_been_blocked_by_this_user) : `You can message ${other.profile.firstName} once you’re connected.`}
          <Button size="sm" variant="outline" className="ml-2" onClick={() => nav(`/member/${id}`)}>View profile</Button>
        </div>
      )}
      <input ref={imgInput} type="file" accept="image/*" hidden onChange={(e) => sendFile(e.target.files?.[0], 'image')} />
      <input ref={docInput} type="file" accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" hidden onChange={(e) => sendFile(e.target.files?.[0], 'document')} />
      <Sheet open={attach} onClose={() => setAttach(false)} title={L.select_image}>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => imgInput.current?.click()} className="flex flex-col items-center gap-2 rounded-2xl border border-line py-6 font-semibold"><ImageIcon className="size-7 text-orange-text" /> {L.gallery}</button>
          <button onClick={() => docInput.current?.click()} className="flex flex-col items-center gap-2 rounded-2xl border border-line py-6 font-semibold"><FileText className="size-7 text-orange-text" /> {L.document}</button>
        </div>
      </Sheet>
    </div>
  );
}

/** Audio / video call (mock). Phase 1 issues a server call token and connects via Agora/LiveKit. */
export function Call() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const other = useDb((d) => userById(id, d));
  const [video, setVideo] = useState(params.get('video') === '1');
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [state, setState] = useState<'ringing' | 'live'>('ringing');
  const [secs, setSecs] = useState(0);
  const [share, setShare] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [ended, setEnded] = useState<string | null>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const incoming = params.get('incoming') === '1';

  useEffect(() => {
    const t = setTimeout(() => setState('live'), incoming ? 300 : 2500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (state !== 'live') return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);
  useEffect(() => {
    if (!video) return;
    let stream: MediaStream | null = null;
    navigator.mediaDevices?.getUserMedia({ video: true }).then((s) => {
      stream = s;
      if (vidRef.current) vidRef.current.srcObject = s;
    }).catch(() => {});
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [video]);

  if (!other) return null;
  const mmss = fmtSecs(secs);
  const end = () => {
    const live = state === 'live';
    const id = logCall({ withId: other.id, direction: incoming ? 'incoming' : 'outgoing', kind: video ? 'video' : 'audio', status: live ? 'completed' : 'missed', duration: secs, ...(notes.trim() ? { notes: notes.trim() } : {}) });
    if (!live) { toast('Call cancelled'); nav(-1); return; }
    setEnded(id);
  };
  if (ended) {
    return (
      <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col bg-bg px-6 pb-[max(32px,env(safe-area-inset-bottom))] pt-16">
        <div className="flex flex-col items-center text-center">
          <Avatar user={other} size={88} ring />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-orange-text">Call ended · {mmss}</p>
          <h1 className="font-display mt-1 text-2xl font-extrabold">Session recap</h1>
        </div>
        <div className="mt-6">
          <RecapForm name={other.profile.firstName}
            onBook={() => nav(`/meetings/new/${other.id}`, { replace: true })}
            onSave={(rating, n) => { updateCall(ended, { ...(rating ? { rating } : {}), ...(n || notes.trim() ? { notes: [notes.trim(), n].filter(Boolean).join(' · ') } : {}) }); toast('Recap saved to your call history'); nav(-1); }} />
          <button onClick={() => nav(-1)} className="mt-4 w-full text-center text-sm font-medium text-faint">Skip</button>
        </div>
      </div>
    );
  }
  return (
    <div className="navy-gradient fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col items-center overflow-hidden px-6 pb-[max(32px,env(safe-area-inset-bottom))] pt-20 text-white">
      {other.photo && <img loading="lazy" decoding="async" src={other.photo} alt="" className="absolute inset-0 size-full scale-110 object-cover opacity-20 blur-2xl" />}
      {video && state === 'live' && other.photo
        ? <div className="relative -mt-8 h-72 w-60 overflow-hidden rounded-[28px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.6)] ring-1 ring-white/20"><img loading="lazy" decoding="async" src={other.photo} alt="" className="size-full object-cover" /><span className="absolute bottom-2 left-2 flex h-3 items-end gap-0.5">{[0, 1, 2].map((i) => <span key={i} className="eq-bar w-1 rounded-full bg-orange-2" style={{ height: '100%', animationDelay: `${i * 0.15}s` }} />)}</span></div>
        : <div className={cn('relative rounded-full', state === 'ringing' && 'pulse-ring')}><Avatar user={other} size={140} /></div>}
      <h1 className="font-display relative mt-6 text-center text-[29px] font-bold leading-tight">{fullName(other)}</h1>
      <p className="relative mt-1 flex items-center gap-2 text-white/80">
        {state === 'live' && <span className="size-2 rounded-full bg-success" />}
        {state === 'ringing' ? (video ? 'Video calling…' : 'Calling…') : mmss}
        {state === 'live' && <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">HD · Encrypted</span>}
      </p>
      {share && state === 'live' && <p className="relative mt-3 flex items-center gap-1.5 rounded-full bg-orange px-3 py-1 text-xs font-bold text-white"><ScreenShare className="size-3.5" /> You’re sharing your screen</p>}
      {video && (
        <video ref={vidRef} autoPlay playsInline muted className="absolute right-4 top-4 h-32 w-24 -scale-x-100 rounded-2xl border-2 border-white/30 bg-black/40 object-cover shadow-xl" />
      )}
      {state === 'live' && (
        <div className="relative mt-5 w-full rounded-2xl bg-black/30 p-3 text-left backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-2">Suggested agenda</p>
          <ul className="mt-1 space-y-0.5 text-sm text-white/85">
            {(other.profile.mentoringInterests.length ? other.profile.mentoringInterests : ['Goals']).slice(0, 2).map((t) => <li key={t}>• {t}: what’s one next step?</li>)}
            <li>• Book a follow-up before you hang up</li>
          </ul>
        </div>
      )}
      <p className="relative mt-3 text-xs text-white/40">Prototype call: no audio is sent</p>
      <div className="relative mt-auto mb-5 flex w-full justify-center gap-3">
        <CallBtn label="Notes" on={notesOpen} onClick={() => setNotesOpen(true)}><NotebookPen /></CallBtn>
        <CallBtn label="Share" on={share} onClick={() => { setShare(!share); toast(share ? 'Stopped sharing' : 'Screen sharing (demo)'); }}><ScreenShare /></CallBtn>
      </div>
      <div className="relative grid w-full grid-cols-4 gap-2">
        <CallBtn label={muted ? 'Unmute' : 'Mute'} on={muted} onClick={() => setMuted(!muted)}>{muted ? <MicOff /> : <Mic />}</CallBtn>
        <CallBtn label={video ? 'Camera off' : 'Camera'} on={video} onClick={() => setVideo(!video)}>{video ? <Video /> : <VideoOff />}</CallBtn>
        <CallBtn label="Speaker" on={speaker} onClick={() => setSpeaker(!speaker)}><Volume2 /></CallBtn>
        <button aria-label="End call" onClick={end} className="flex flex-col items-center gap-1.5 text-[15px] font-medium">
          <span className="grid size-16 place-items-center rounded-full bg-danger"><PhoneOff className="size-7" /></span>End
        </button>
      </div>
      <Sheet open={notesOpen} onClose={() => setNotesOpen(false)} title="Call notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} autoFocus placeholder="Jot down advice, links and action items. Saved with this call."
          className="w-full resize-none rounded-xl border border-line-strong px-3.5 py-3 text-[15px] text-text outline-none focus:border-orange" />
        <Button size="lg" className="mt-3" onClick={() => { setNotesOpen(false); toast('Notes saved'); }}>Done</Button>
      </Sheet>
    </div>
  );
}

function CallBtn({ label, on, onClick, children }: { label: string; on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button aria-label={label} onClick={onClick} className="flex flex-col items-center gap-1.5 whitespace-nowrap text-[15px] font-medium">
      <span className={cn('grid size-16 place-items-center rounded-full [&_svg]:size-7', on ? 'bg-white text-navy' : 'bg-white/15')}>{children}</span>
      {label}
    </button>
  );
}
