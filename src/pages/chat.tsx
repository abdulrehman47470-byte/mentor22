import { ChevronLeft, Download, FileText, MessageCircle, Mic, Paperclip, Search as SearchIcon, SendHorizontal, Video } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { L } from '@/data/labels';
import { Avatar, Button, Empty, Header, Input, toast } from '@/components/ui';
import { ImagePicker } from '@/components/media';
import { checkMessage, fullName, iBlocked, isBlocked, markThreadRead, sendMessage, threads, unblock, userById } from '@/lib/api';
import { cn, timeAgo, useDb } from '@/lib/store';
import type { Message } from '@/lib/types';

/** Chat list: name, photo, last message, date, unread count (section 10). */
export function ChatList() {
  const nav = useNavigate();
  const all = useDb((d) => threads(d));
  const connections = useDb((d) => d.connections.filter((c) => c.studentId === d.sessionUserId && c.status === 'accepted').map((c) => userById(c.mentorId, d)!).filter(Boolean));
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? all.filter((x) => fullName(x.other).toLowerCase().includes(t)) : all;
  }, [all, q]);
  return (
    <div>
      <Header title={L.chat} />
      <div className="px-4 py-4">
        <label className="relative block">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
          <Input type="search" placeholder={L.search_my_connections} aria-label={L.search_my_connections} value={q} onChange={(e) => setQ(e.target.value)} className="rounded-full pl-11" />
        </label>
        {connections.length > 0 && !q && (
          <>
            <p className="mb-2 mt-5 text-sm font-bold text-brand-dark">{L.my_connections}</p>
            <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1">
              {connections.map((u) => (
                <button key={u.id} onClick={() => nav(`/chat/${u.id}`)} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                  <Avatar user={u} size={56} ring />
                  <span className="w-full truncate text-center text-xs text-ink">{u.profile.firstName}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <ul className="mt-4 divide-y divide-line">
          {list.map(({ other, last, unread }) => (
            <li key={other.id}>
              <Link to={`/chat/${other.id}`} className="flex items-center gap-3 py-3">
                <Avatar user={other} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={cn('truncate text-ink', unread ? 'font-bold' : 'font-semibold')}>{fullName(other)}</p>
                    <span className={cn('shrink-0 text-xs', unread ? 'font-semibold text-brand' : 'text-muted')}>{timeAgo(last.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={cn('min-w-0 flex-1 truncate text-sm', unread ? 'font-medium text-ink' : 'text-muted')}>{preview(last)}</p>
                    {unread > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">{unread}</span>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {!list.length && <Empty icon={<MessageCircle className="size-7" />} title={L.no_chats_to_display} />}
      </div>
    </div>
  );
}

const preview = (m: Message) => (m.type === 'image' ? `📷 ${L.gallery}` : m.type === 'document' ? `📄 ${m.fileName ?? L.document}` : m.text);

/** Shrinks photos before sending, keeping the aspect ratio. */
function shrinkImage(file: File, max = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/webp', 0.82));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const MAX_DOC = 2 * 1024 * 1024;

function download(url: string, name: string) {
  toast(L.downloading_file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => toast(`${L.file_download_successfully_path}: ${name}`), 700);
}

export function ChatThread() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const other = useDb((d) => userById(id, d));
  const uid = useDb((d) => d.sessionUserId);
  const msgs = useDb((d) => d.messages.filter((m) => (m.from === uid && m.to === id) || (m.from === id && m.to === uid)));
  const blockedByMe = useDb((d) => iBlocked(id, d));
  const blocked = useDb((d) => isBlocked(d.sessionUserId ?? '', id, d));
  const [text, setText] = useState('');
  const [picker, setPicker] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const docInput = useRef<HTMLInputElement>(null);
  const unreadCount = msgs.filter((m) => m.from === id && !m.read).length;

  useEffect(() => {
    if (unreadCount) markThreadRead(id);
  }, [id, unreadCount]);
  useLayoutEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [msgs.length]);

  if (!other) return <Navigate to="/chat" replace />;

  const send = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t) return toast(L.please_enter_message);
    const problem = checkMessage(t);
    if (problem) return toast(problem);
    sendMessage(id, t);
    setText('');
  };

  const sendImage = async (f: File) => sendMessage(id, '', { type: 'image', name: f.name, url: await shrinkImage(f) });
  const sendDoc = (f?: File) => {
    if (!f) return;
    if (f.size > MAX_DOC) return toast(`${L.document}: max 2 MB`);
    const r = new FileReader();
    r.onload = () => sendMessage(id, '', { type: 'document', name: f.name, url: String(r.result) });
    r.readAsDataURL(f);
  };

  return (
    <div className="flex min-h-app flex-col bg-bg-soft">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-2 px-2">
          <button aria-label="Back" onClick={() => nav('/chat')} className="grid size-10 place-items-center rounded-full text-brand-dark hover:bg-bg-soft">
            <ChevronLeft className="size-6" />
          </button>
          <Link to={`/mentor/${other.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
            <Avatar user={other} size={40} />
            <span className="min-w-0">
              <span className="block truncate font-bold text-brand-dark">{fullName(other)}</span>
              <span className="block truncate text-xs text-muted">{other.profile.profession}</span>
            </span>
          </Link>
          {!blocked && (
            <>
              <button aria-label={L.audio_call} onClick={() => nav(`/call/${id}?type=audio`)} className="grid size-10 place-items-center rounded-full text-brand hover:bg-brand-light"><Mic className="size-5" /></button>
              <button aria-label={L.video_call} onClick={() => nav(`/call/${id}?type=video`)} className="grid size-10 place-items-center rounded-full text-brand hover:bg-brand-light"><Video className="size-5" /></button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-2 px-3 py-4">
        {msgs.map((m, i) => {
          const mine = m.from === uid;
          const showTime = i === msgs.length - 1 || msgs[i + 1].from !== m.from;
          return (
            <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <div className={cn('max-w-[80%] rounded-2xl text-[15px] leading-relaxed', mine ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md bg-surface text-ink shadow-card', m.type === 'text' ? 'px-3.5 py-2.5' : 'p-1.5')}>
                {m.type === 'text' && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                {m.type === 'image' && m.fileUrl && (
                  <button onClick={() => download(m.fileUrl!, m.fileName ?? 'image.webp')} aria-label={L.download}>
                    <img src={m.fileUrl} alt="" className="max-h-64 rounded-xl object-cover" loading="lazy" />
                  </button>
                )}
                {m.type === 'document' && (
                  <div className="flex items-center gap-2.5 px-2 py-1.5">
                    <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', mine ? 'bg-white/15' : 'bg-brand-light text-brand')}><FileText className="size-5" /></span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{m.fileName}</span>
                    <button aria-label={L.download} onClick={() => m.fileUrl && download(m.fileUrl, m.fileName ?? 'file')} className={cn('grid size-9 place-items-center rounded-full', mine ? 'hover:bg-white/15' : 'text-brand hover:bg-brand-light')}>
                      <Download className="size-4" />
                    </button>
                  </div>
                )}
              </div>
              {showTime && <span className="mt-1 px-1 text-[11px] text-muted">{timeAgo(m.createdAt)}</span>}
            </div>
          );
        })}
        <div ref={end} />
      </div>

      <div className="sticky bottom-0 z-20 border-t border-line bg-surface px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5">
        {blocked ? (
          <div className="flex items-center justify-between gap-3 py-1.5 text-sm font-medium text-danger">
            {blockedByMe ? L.the_user_has_been_blocked : L.you_have_been_blocked_by_this_user}
            {blockedByMe && <Button size="sm" variant="outline" onClick={() => unblock(id)}>{L.unblock}</Button>}
          </div>
        ) : (
          <form onSubmit={send} className="flex items-end gap-2">
            <button type="button" aria-label={L.select} onClick={() => setPicker(true)} className="grid size-11 shrink-0 place-items-center rounded-full text-brand hover:bg-brand-light">
              <Paperclip className="size-5" />
            </button>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={L.write_a_message}
              aria-label={L.write_a_message}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-3xl bg-field px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-brand/25"
            />
            <button type="submit" aria-label={L.message} className="brand-gradient grid size-11 shrink-0 place-items-center rounded-full text-white disabled:opacity-40" disabled={!text.trim()}>
              <SendHorizontal className="size-5" />
            </button>
          </form>
        )}
      </div>
      <input ref={docInput} type="file" hidden accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx" onChange={(e) => (sendDoc(e.target.files?.[0]), (e.target.value = ''))} />
      <ImagePicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={sendImage}
        extra={
          <button onClick={() => (setPicker(false), docInput.current?.click())} className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-brand-light py-4 font-semibold text-brand-dark hover:bg-field">
            <FileText className="size-6 text-brand" />
            {L.document}
          </button>
        }
      />
    </div>
  );
}
