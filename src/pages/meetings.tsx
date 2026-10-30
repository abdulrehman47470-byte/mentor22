import { CalendarDays, CalendarPlus, CalendarX2, Check, ChevronLeft, ChevronRight, Clock, MapPin, Mic, Plus, Trash2, Video, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { L } from '@/data/labels';
import { Avatar, Badge, Button, Card, ChipSingle, Empty, Field, Header, Input, SectionTitle, Select, Sheet, TextArea, ask, toast } from '@/components/ui';
import { MEETING_REASONS, MEETING_TYPES } from '@/data/options';
import { addSlot, fullName, isMentorType, removeSlot, respondMeeting, scheduleMeeting, userById } from '@/lib/api';
import { cn, fmtDate, fmtTime, useDb, useMe } from '@/lib/store';
import type { Meeting } from '@/lib/types';

/** Local YYYY-MM-DD for a date. */
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function MonthGrid({ month, selected, onSelect, marks }: { month: Date; selected: string; onSelect: (d: string) => void; marks: Set<string> }) {
  const days = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    start.setDate(1 - start.getDay());
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }, [month]);
  const today = ymd(new Date());
  return (
    <div className="grid grid-cols-7 gap-y-1 text-center">
      {WEEK.map((w, i) => <span key={i} className="pb-1 text-xs font-semibold text-faint">{w}</span>)}
      {days.map((d) => {
        const key = ymd(d);
        const sel = key === selected;
        return (
          <button key={key} onClick={() => onSelect(key)} aria-pressed={sel} aria-label={d.toDateString()} className="grid place-items-center py-0.5">
            <span className={cn('relative grid size-10 place-items-center rounded-full text-sm transition', sel ? 'bg-navy font-bold text-white' : key === today ? 'font-bold text-orange-text ring-1 ring-orange' : d.getMonth() === month.getMonth() ? 'hover:bg-bg-soft' : 'text-faint/60')}>
              {d.getDate()}
              {marks.has(key) && <span className={cn('absolute bottom-1 size-1.5 rounded-full', sel ? 'bg-white' : 'bg-orange')} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Meetings: month calendar, meeting invites, upcoming and past meetings. */
export function Meetings() {
  const me = useMe()!;
  const nav = useNavigate();
  const all = useDb((d) => d.meetings.filter((m) => m.organizer === me.id || m.invitee === me.id).sort((a, b) => a.start.localeCompare(b.start)));
  const connections = useDb((d) =>
    d.connections.filter((c) => c.status === 'connected' && (c.from === me.id || c.to === me.id)).map((c) => userById(c.from === me.id ? c.to : c.from, d)!).filter(Boolean),
  );
  const [pick, setPick] = useState(false);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(() => ymd(new Date()));
  const now = new Date().toISOString();
  const pendingForMe = all.filter((m) => m.status === 'pending' && m.invitee === me.id && m.end > now);
  const upcoming = all.filter((m) => m.end > now && !(m.status === 'pending' && m.invitee === me.id) && m.status !== 'declined' && m.status !== 'cancelled');
  const past = all.filter((m) => m.end <= now || m.status === 'declined' || m.status === 'cancelled').reverse();
  const marks = useMemo(() => new Set(all.filter((m) => m.status === 'accepted' || m.status === 'pending').map((m) => ymd(new Date(m.start)))), [all]);
  const day = all.filter((m) => ymd(new Date(m.start)) === selected);

  return (
    <div>
      <Header title="Meetings" back right={<Link to="/availability" className="mr-1 text-sm font-semibold text-orange-text">{L.set_availability}</Link>} />
      <div className="px-gutter py-4">
        <Button size="lg" variant="accent" onClick={() => (connections.length ? setPick(true) : toast(L.please_select_your_connection))}>
          <CalendarPlus className="size-5" /> {L.schedule_meeting}
        </Button>
        <Card className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} aria-label={L.previous} className="grid size-9 place-items-center rounded-full hover:bg-bg-soft"><ChevronLeft className="size-5" /></button>
            <p className="font-bold text-navy">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
            <button onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} aria-label={L.next} className="grid size-9 place-items-center rounded-full hover:bg-bg-soft"><ChevronRight className="size-5" /></button>
          </div>
          <MonthGrid month={month} selected={selected} onSelect={setSelected} marks={marks} />
        </Card>
        <SectionTitle>{new Date(`${selected}T12:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</SectionTitle>
        {day.length ? <div className="space-y-3">{day.map((m) => <MeetingCard key={m.id} m={m} meId={me.id} />)}</div> : (
          <p className="rounded-2xl bg-bg-soft px-4 py-3 text-sm text-muted">{L.no_appointment_found}</p>
        )}
        {pendingForMe.length > 0 && (
          <>
            <SectionTitle>{L.meeting_invite}</SectionTitle>
            <div className="space-y-3">{pendingForMe.map((m) => <MeetingCard key={m.id} m={m} meId={me.id} />)}</div>
          </>
        )}
        <SectionTitle>Upcoming</SectionTitle>
        {upcoming.length ? <div className="space-y-3">{upcoming.map((m) => <MeetingCard key={m.id} m={m} meId={me.id} />)}</div> : (
          <Empty icon={<CalendarDays className="size-7" />} title={L.no_meetings_scheduled} body="Book a time from a mentor’s free slots." />
        )}
        {past.length > 0 && (
          <>
            <SectionTitle>Past & cancelled</SectionTitle>
            <div className="space-y-3 opacity-70">{past.map((m) => <MeetingCard key={m.id} m={m} meId={me.id} />)}</div>
          </>
        )}
      </div>
      <Sheet open={pick} onClose={() => setPick(false)} title={L.select_mentor}>
        <ul className="divide-y divide-line">
          {connections.map((u) => (
            <li key={u.id}>
              <button onClick={() => nav(`/meetings/new/${u.id}`)} className="flex w-full items-center gap-3 py-3 text-left">
                <Avatar user={u} size={44} />
                <span className="flex-1"><span className="block font-semibold">{fullName(u)}</span><span className="text-sm text-muted">{u.profile.profession || u.profile.classification}</span></span>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>
    </div>
  );
}

/** Meeting: title, name, date, time, note and photo (content document, section 10). */
function MeetingCard({ m, meId }: { m: Meeting; meId: string }) {
  const otherId = m.organizer === meId ? m.invitee : m.organizer;
  const other = useDb((d) => userById(otherId, d));
  const nav = useNavigate();
  if (!other) return null;
  const tone = m.status === 'accepted' ? 'green' : m.status === 'pending' ? 'orange' : 'gray';
  const label = { accepted: L.accepted, pending: L.pending, declined: L.reject_request, cancelled: L.cancel }[m.status];
  const ModeIcon = m.mode === 'In Person' ? MapPin : m.mode === 'Audio' ? Mic : Video;
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="w-14 shrink-0 rounded-xl bg-orange-fill py-1.5 text-center text-orange-text">
          <p className="text-[11px] font-bold uppercase">{new Date(m.start).toLocaleDateString(undefined, { month: 'short' })}</p>
          <p className="text-xl font-extrabold leading-none">{new Date(m.start).getDate()}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="flex-1 truncate font-semibold">{m.title}</p>
            <Badge tone={tone}>{label}</Badge>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted"><Clock className="size-3.5" /> {fmtDate(m.start)} · {fmtTime(m.start)}–{fmtTime(m.end)}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted"><ModeIcon className="size-3.5" /> {m.mode} · {m.reason}</p>
          <button onClick={() => nav(`/member/${other.id}`)} className="mt-2 flex items-center gap-2 text-sm">
            <Avatar user={other} size={24} /> {L.ics_meeting_with} <b>{fullName(other)}</b>
          </button>
          {m.note && <p className="mt-2 rounded-lg bg-bg-soft px-3 py-2 text-sm">{L.ics_note} {m.note}</p>}
          {m.declineReason && <p className="mt-2 text-sm text-muted">{L.reason}: {m.declineReason}</p>}
        </div>
      </div>
      {m.status === 'pending' && m.invitee === meId && (
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={async () => {
            const r = await ask({ message: `${L.reject_request} “${m.title}”?`, reason: 'optional', danger: true, confirm: L.reject_request });
            if (r === null) return;
            respondMeeting(m.id, 'declined', r);
            toast('Meeting declined');
          }}><X className="size-4" /> {L.reject_request}</Button>
          <Button size="sm" className="flex-1" onClick={() => { respondMeeting(m.id, 'accepted'); toast('Meeting accepted'); }}><Check className="size-4" /> {L.accept}</Button>
        </div>
      )}
      {(m.status === 'accepted' || (m.status === 'pending' && m.organizer === meId)) && new Date(m.end) > new Date() && (
        <div className="mt-3 flex gap-2">
          {m.mode !== 'In Person' && m.status === 'accepted' && (
            <Button size="sm" className="flex-1" onClick={() => nav(`/call/${other.id}${m.mode === 'Video' ? '?video=1' : ''}`)}>{L.join_now}</Button>
          )}
          <Button variant="ghost" size="sm" className="flex-1 text-danger" onClick={async () => {
            if ((await ask({ message: L.are_you_sure_cancel_meeting, danger: true })) === null) return;
            respondMeeting(m.id, 'cancelled');
            toast('Meeting cancelled');
          }}>{L.cancel}</Button>
        </div>
      )}
    </Card>
  );
}

/** Schedule Meeting: Title, Date, Start Time, End Time, Notes, Meeting Type, Meeting Reason (or one of the mentor's free slots). */
export function NewMeeting() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const other = useDb((d) => userById(id, d));
  const slots = useDb((d) => d.slots.filter((s) => s.mentorId === id && s.start > new Date().toISOString()).sort((a, b) => a.start.localeCompare(b.start)));
  const [slotId, setSlotId] = useState('');
  const [custom, setCustom] = useState({ date: '', start: '', end: '' });
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  if (!other) return null;
  const mentor = isMentorType(other.role);
  const byDay = slots.reduce<Record<string, typeof slots>>((acc, s) => ((acc[fmtDate(s.start)] ??= []).push(s), acc), {});
  const slot = slots.find((s) => s.id === slotId);

  const submit = () => {
    if (!title.trim()) return setErr(L.please_enter_title);
    let start: string, end: string;
    if (slot) {
      start = slot.start;
      end = slot.end;
    } else {
      if (!custom.date) return setErr(L.please_select_date);
      if (!custom.start) return setErr(L.please_select_start_time);
      if (!custom.end) return setErr(L.please_select_end_time);
      if (custom.end <= custom.start) return setErr(L.end_time_must_be_greater);
      start = new Date(`${custom.date}T${custom.start}`).toISOString();
      end = new Date(`${custom.date}T${custom.end}`).toISOString();
      if (new Date(start) <= new Date()) return setErr(L.please_select_a_future_time);
    }
    if (!mode) return setErr(L.please_select_your_meeting_type);
    if (!reason) return setErr(L.please_select_reason);
    scheduleMeeting({ invitee: id, title: title.trim(), note: note.trim(), reason, mode, start, end }, slotId || undefined);
    toast(`${L.meeting_invite}: ${other.profile.firstName}`);
    nav('/meetings', { replace: true });
  };

  return (
    <div className="pb-28">
      <Header title={L.schedule_meeting} sub={`${L.ics_meeting_with} ${fullName(other)}`} back />
      <div className="px-gutter py-4">
        {mentor && (
          <>
            <SectionTitle>{other.profile.firstName}’s free times</SectionTitle>
            {Object.keys(byDay).length ? (
              <div className="space-y-3">
                {Object.entries(byDay).slice(0, 7).map(([day, ss]) => (
                  <div key={day}>
                    <p className="mb-1.5 text-sm font-semibold">{day}</p>
                    <div className="flex flex-wrap gap-2">
                      {ss.map((s) => (
                        <button key={s.id} onClick={() => { setSlotId(slotId === s.id ? '' : s.id); setCustom({ date: '', start: '', end: '' }); setErr(''); }}
                          className={cn('rounded-full border px-3.5 py-2 text-sm', slotId === s.id ? 'border-navy bg-navy font-semibold text-white' : 'border-line-strong')}>
                          {fmtTime(s.start)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted">No free slots posted. Suggest a time below.</p>}
          </>
        )}
        <SectionTitle>{mentor ? 'Or suggest another time' : 'Suggest a time'}</SectionTitle>
        <Field label={L.date}><Input type="date" min={ymd(new Date())} value={custom.date} onChange={(e) => { setCustom({ ...custom, date: e.target.value }); setSlotId(''); setErr(''); }} aria-label={L.select_date} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={L.start_time}><Input type="time" value={custom.start} onChange={(e) => { setCustom({ ...custom, start: e.target.value }); setSlotId(''); setErr(''); }} aria-label={L.select_start_time} /></Field>
          <Field label={L.end_time}><Input type="time" value={custom.end} onChange={(e) => { setCustom({ ...custom, end: e.target.value }); setSlotId(''); setErr(''); }} aria-label={L.select_end_time} /></Field>
        </div>
        <SectionTitle>Details</SectionTitle>
        <Field label={L.title} required><Input value={title} onChange={(e) => { setTitle(e.target.value); setErr(''); }} placeholder={L.enter_title} maxLength={80} /></Field>
        <Field label={L.meeting_type} required><ChipSingle value={mode} onChange={(v) => { setMode(v); setErr(''); }} options={MEETING_TYPES} /></Field>
        <Field label={L.meeting_reason} required><Select value={reason} onChange={(v) => { setReason(v); setErr(''); }} options={MEETING_REASONS} placeholder={L.select_reason} /></Field>
        <Field label={L.notes}><TextArea value={note} onChange={(e) => setNote(e.target.value)} max={300} rows={3} placeholder={L.type_here} /></Field>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-line bg-surface px-gutter pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        {err && <p className="mb-2 rounded-xl bg-danger/10 px-3.5 py-2 text-sm font-medium text-danger" role="alert">{err}</p>}
        <Button size="lg" onClick={submit}>{L.schedule_meeting}</Button>
      </div>
    </div>
  );
}

/** Set Availability: choose the days and times you can meet. */
export function Availability() {
  const me = useMe()!;
  const slots = useDb((d) => d.slots.filter((s) => s.mentorId === me.id && s.start > new Date().toISOString()).sort((a, b) => a.start.localeCompare(b.start)));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: '', time: '', minutes: '30', repeat: '1' });
  const [err, setErr] = useState('');
  const mentor = isMentorType(me.role);
  return (
    <div>
      <Header title={L.set_availability} back right={<button onClick={() => setOpen(true)} aria-label={L.add_new} className="grid size-10 place-items-center rounded-full hover:bg-bg-soft"><Plus className="size-5" /></button>} />
      <div className="px-gutter py-4">
        <p className="mb-3 text-sm text-muted">
          {mentor ? 'Mentees book these times from your profile.' : 'Let your mentors know when you can meet.'} General availability: <b>{me.profile.availability.join(', ') || 'not set'}</b>.
        </p>
        <Button size="lg" variant="outline" onClick={() => setOpen(true)}><Plus className="size-5" /> {L.select_time_availability}</Button>
        <SectionTitle>{L.selected_time_availability}</SectionTitle>
        {slots.length ? (
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {slots.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-gutter py-3">
                <Clock className="size-4 text-orange-text" />
                <span className="flex-1 text-[15px]">{fmtDate(s.start)} · {fmtTime(s.start)}–{fmtTime(s.end)}</span>
                <button aria-label={L.are_you_sure_you_want_to_delete} onClick={async () => { if ((await ask({ message: L.are_you_sure_you_want_to_delete, danger: true })) !== null) { removeSlot(s.id); toast('Slot removed'); } }} className="grid size-9 place-items-center rounded-full text-muted hover:bg-bg-soft"><Trash2 className="size-4" /></button>
              </li>
            ))}
          </ul>
        ) : <Empty icon={<CalendarX2 className="size-7" />} title={L.no_data} body={mentor ? 'Add times so mentees can book you.' : 'Add the times you are free to meet.'} />}
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={L.select_time_availability}>
        <Field label={L.select_date}><Input type="date" min={ymd(new Date())} value={form.date} onChange={(e) => { setForm({ ...form, date: e.target.value }); setErr(''); }} /></Field>
        <Field label={L.start_time}><Input type="time" value={form.time} onChange={(e) => { setForm({ ...form, time: e.target.value }); setErr(''); }} /></Field>
        <Field label="Length (minutes)"><ChipSingle value={form.minutes} onChange={(v) => setForm({ ...form, minutes: v || '30' })} options={['15', '30', '45', '60']} /></Field>
        <Field label="Repeat weekly for"><ChipSingle value={form.repeat} onChange={(v) => setForm({ ...form, repeat: v || '1' })} options={['1', '2', '4', '8']} /></Field>
        {err && <p className="mb-3 text-sm font-medium text-danger" role="alert">{err}</p>}
        <Button size="lg" onClick={() => {
          if (!form.date) return setErr(L.please_select_date);
          if (!form.time) return setErr(L.please_select_time_slot);
          const base = new Date(`${form.date}T${form.time}`);
          if (base <= new Date()) return setErr(L.please_select_a_future_time);
          for (let w = 0; w < Number(form.repeat); w++) {
            const s = new Date(base.getTime() + w * 7 * 86400000);
            addSlot(s.toISOString(), new Date(s.getTime() + Number(form.minutes) * 60000).toISOString());
          }
          toast(L.success_availability_set);
          setOpen(false);
        }}>{L.submit}</Button>
      </Sheet>
    </div>
  );
}

