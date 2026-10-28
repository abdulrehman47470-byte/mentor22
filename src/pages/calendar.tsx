import { CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Clock, Mic, Plus, Trash2, Video } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { L } from '@/data/labels';
import { MEETING_REASONS, MEETING_TYPES, TIME_SLOTS } from '@/data/options';
import { Avatar, Badge, Button, Card, ChipSingle, Chip, Empty, Field, Header, Input, Select, SectionTitle, TextArea, ask, toast } from '@/components/ui';
import { cancelMeeting, fullName, respondMeeting, scheduleMeeting, setAvailability, userById } from '@/lib/api';
import { cn, fmtClock, fmtDay, fromYmd, useDb, ymd } from '@/lib/store';
import type { Meeting, MeetingType } from '@/lib/types';

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function MonthGrid({ month, selected, onSelect, marks }: { month: Date; selected: string; onSelect: (d: string) => void; marks: Set<string> }) {
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [month]);
  const today = ymd(new Date());
  return (
    <div className="grid grid-cols-7 gap-y-1 text-center" role="grid">
      {WEEK.map((w, i) => (
        <span key={i} className="pb-1 text-xs font-semibold text-muted">{w}</span>
      ))}
      {days.map((d) => {
        const key = ymd(d);
        const inMonth = d.getMonth() === month.getMonth();
        const sel = key === selected;
        return (
          <button key={key} onClick={() => onSelect(key)} aria-label={fmtDay(key)} aria-pressed={sel} className="grid place-items-center py-0.5">
            <span className={cn('relative grid size-10 place-items-center rounded-full text-sm transition', sel ? 'bg-brand font-bold text-white' : key === today ? 'font-bold text-brand ring-1 ring-brand' : inMonth ? 'text-ink hover:bg-bg-soft' : 'text-faint')}>
              {d.getDate()}
              {marks.has(key) && <span className={cn('absolute bottom-1 size-1.5 rounded-full', sel ? 'bg-white' : 'bg-brand')} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Calendar() {
  const nav = useNavigate();
  const uid = useDb((d) => d.sessionUserId);
  const meetings = useDb((d) => d.meetings.filter((m) => m.organizer === d.sessionUserId || m.invitee === d.sessionUserId));
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(() => ymd(new Date()));
  const active = meetings.filter((m) => m.status !== 'cancelled' && m.status !== 'declined');
  const marks = useMemo(() => new Set(active.map((m) => m.date)), [active]);
  const invites = meetings.filter((m) => m.invitee === uid && m.status === 'pending');
  const day = meetings.filter((m) => m.date === selected).sort((a, b) => a.start.localeCompare(b.start));
  const upcoming = active.filter((m) => m.date >= ymd(new Date()) && !invites.includes(m)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  return (
    <div>
      <Header
        title={L.calendar}
        right={
          <Button size="sm" onClick={() => nav('/schedule')}>
            <Plus className="size-4" />
            {L.schedule_meeting}
          </Button>
        }
      />
      <div className="px-4 py-4">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => shift(-1)} aria-label={L.previous} className="grid size-9 place-items-center rounded-full text-brand-dark hover:bg-bg-soft"><ChevronLeft className="size-5" /></button>
            <p className="font-bold text-brand-dark">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
            <button onClick={() => shift(1)} aria-label={L.next} className="grid size-9 place-items-center rounded-full text-brand-dark hover:bg-bg-soft"><ChevronRight className="size-5" /></button>
          </div>
          <MonthGrid month={month} selected={selected} onSelect={setSelected} marks={marks} />
        </Card>

        {invites.length > 0 && (
          <>
            <SectionTitle>{L.meeting_invite}</SectionTitle>
            <div className="space-y-3">{invites.map((m) => <MeetingCard key={m.id} m={m} />)}</div>
          </>
        )}

        <SectionTitle>{fmtDay(selected)}</SectionTitle>
        {day.length ? <div className="space-y-3">{day.map((m) => <MeetingCard key={m.id} m={m} />)}</div> : <Empty icon={<CalendarX2 className="size-7" />} title={L.no_appointment_found} />}

        <SectionTitle>Upcoming</SectionTitle>
        {upcoming.length ? (
          <div className="space-y-3">{upcoming.map((m) => <MeetingCard key={m.id} m={m} />)}</div>
        ) : (
          <Empty icon={<CalendarDays className="size-7" />} title={L.no_meetings_scheduled} />
        )}
      </div>
    </div>
  );
}

/** Meeting: title, name, date, time, note, photo (section 10). */
function MeetingCard({ m }: { m: Meeting }) {
  const nav = useNavigate();
  const uid = useDb((d) => d.sessionUserId);
  const otherId = m.organizer === uid ? m.invitee : m.organizer;
  const other = useDb((d) => userById(otherId, d));
  if (!other) return null;
  const incoming = m.invitee === uid;
  const Icon = m.type === 'Video' ? Video : Mic;
  return (
    <Card className="p-3.5">
      <div className="flex gap-3">
        <Link to={`/mentor/${other.id}`}>
          <Avatar user={other} size={48} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-ink">{m.title}</p>
            {m.status === 'accepted' && <Badge tone="green">{L.accepted}</Badge>}
            {m.status === 'pending' && <Badge tone="soft">{L.pending}</Badge>}
            {m.status === 'declined' && <Badge tone="red">{L.reject_request}</Badge>}
            {m.status === 'cancelled' && <Badge tone="gray">{L.cancel}</Badge>}
          </div>
          <p className="text-sm text-muted">{L.ics_meeting_with} {fullName(other)}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-ink">
            <span className="flex items-center gap-1"><CalendarDays className="size-3.5 text-brand" />{fmtDay(m.date)}</span>
            <span className="flex items-center gap-1"><Clock className="size-3.5 text-brand" />{fmtClock(m.start)} – {fmtClock(m.end)}</span>
            <span className="flex items-center gap-1"><Icon className="size-3.5 text-brand" />{m.type === 'Video' ? L.video_call : L.audio_call}</span>
          </p>
          {m.reason && <p className="mt-1 text-xs text-muted">{L.meeting_reason}: {m.reason}</p>}
          {m.note && <p className="mt-1 text-sm text-muted">{L.ics_note} {m.note}</p>}
          {m.declineReason && <p className="mt-1 text-sm text-muted">{L.reason}: {m.declineReason}</p>}
        </div>
      </div>
      {(m.status === 'pending' || m.status === 'accepted') && (
        <div className="mt-3 flex gap-2">
          {m.status === 'pending' && incoming ? (
            <>
              <Button size="sm" className="flex-1" onClick={() => respondMeeting(m.id, true)}>{L.accept}</Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={async () => {
                  const r = await ask({ message: `${L.reject_request} “${m.title}”?`, reason: 'optional', danger: true, confirm: L.reject_request });
                  if (r !== null) respondMeeting(m.id, false, r);
                }}
              >
                {L.reject_request}
              </Button>
            </>
          ) : (
            <>
              {m.status === 'accepted' && (
                <Button size="sm" className="flex-1" onClick={() => nav(`/call/${other.id}?type=${m.type.toLowerCase()}`)}>
                  <Icon className="size-4" />
                  {L.join_now}
                </Button>
              )}
              <Button size="sm" variant="outline" className="flex-1" onClick={async () => (await ask({ message: L.are_you_sure_cancel_meeting, danger: true })) !== null && cancelMeeting(m.id)}>
                {L.cancel}
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// ---------- Schedule meeting ----------
export function ScheduleMeeting() {
  const { id } = useParams();
  const nav = useNavigate();
  const connections = useDb((d) => d.connections.filter((c) => c.studentId === d.sessionUserId && c.status === 'accepted').map((c) => userById(c.mentorId, d)!).filter(Boolean));
  const [withId, setWithId] = useState(id ?? '');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const names = connections.map((u) => fullName(u));
  const submit = () => {
    if (!withId) return setErr(L.please_select_your_connection);
    if (!title.trim()) return setErr(L.please_enter_title);
    if (!date) return setErr(L.please_select_date);
    if (!start) return setErr(L.please_select_start_time);
    if (!end) return setErr(L.please_select_end_time);
    if (end <= start) return setErr(L.end_time_must_be_greater);
    if (fromYmd(date).setHours(+start.slice(0, 2), +start.slice(3)) <= Date.now()) return setErr(L.please_select_a_future_time);
    if (!type) return setErr(L.please_select_your_meeting_type);
    if (!reason) return setErr(L.please_select_reason);
    scheduleMeeting({ invitee: withId, title: title.trim(), note: note.trim(), reason, date, start, end, type: type as MeetingType });
    toast(`${L.meeting_invite}: ${fullName(userById(withId)!)}`);
    nav('/calendar', { replace: true });
  };
  return (
    <div className="min-h-app">
      <Header title={L.schedule_meeting} back />
      <div className="px-4 py-5">
        <Field label={L.select_mentor}>
          <Select value={withId ? fullName(userById(withId)!) : ''} onChange={(v) => (setWithId(connections[names.indexOf(v)]?.id ?? ''), setErr(''))} options={names} placeholder={L.select_mentor} />
        </Field>
        <Field label={L.title}>
          <Input value={title} onChange={(e) => (setTitle(e.target.value), setErr(''))} placeholder={L.enter_title} maxLength={80} />
        </Field>
        <Field label={L.date}>
          <Input type="date" min={ymd(new Date())} value={date} onChange={(e) => (setDate(e.target.value), setErr(''))} aria-label={L.select_date} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={L.start_time}>
            <Input type="time" value={start} onChange={(e) => (setStart(e.target.value), setErr(''))} aria-label={L.select_start_time} />
          </Field>
          <Field label={L.end_time}>
            <Input type="time" value={end} onChange={(e) => (setEnd(e.target.value), setErr(''))} aria-label={L.select_end_time} />
          </Field>
        </div>
        <Field label={L.notes}>
          <TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder={L.type_here} rows={3} max={300} />
        </Field>
        <div className="mb-4">
          <p className="mb-1.5 text-sm font-semibold">{L.meeting_type}</p>
          <ChipSingle value={type} onChange={(v) => (setType(v), setErr(''))} options={MEETING_TYPES} />
        </div>
        <Field label={L.meeting_reason}>
          <Select value={reason} onChange={(v) => (setReason(v), setErr(''))} options={MEETING_REASONS} placeholder={L.select_reason} />
        </Field>
        {err && <p className="mb-3 rounded-xl bg-danger/8 px-3.5 py-2.5 text-sm font-medium text-danger" role="alert">{err}</p>}
        <Button size="lg" onClick={submit}>{L.schedule_meeting}</Button>
      </div>
    </div>
  );
}

// ---------- Set availability ----------
export function Availability() {
  const saved = useDb((d) => d.availability.filter((a) => a.date >= ymd(new Date())));
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const pickDate = (d: string) => {
    setDate(d);
    setErr('');
    setSlots(saved.find((a) => a.date === d)?.slots ?? []);
  };
  return (
    <div className="min-h-app">
      <Header title={L.set_availability} back />
      <div className="px-4 py-5">
        <Field label={L.select_date}>
          <Input type="date" min={ymd(new Date())} value={date} onChange={(e) => pickDate(e.target.value)} />
        </Field>
        <p className="mb-2 text-sm font-semibold">{L.select_time_availability}</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {TIME_SLOTS.map((s) => (
            <Chip key={s} active={slots.includes(s)} onClick={() => (setSlots((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s])), setErr(''))}>
              {s}
            </Chip>
          ))}
        </div>
        {err && <p className="mb-3 rounded-xl bg-danger/8 px-3.5 py-2.5 text-sm font-medium text-danger" role="alert">{err}</p>}
        <Button
          size="lg"
          onClick={() => {
            if (!date) return setErr(L.please_select_date);
            if (!slots.length) return setErr(L.please_select_time_slot);
            setAvailability(date, TIME_SLOTS.filter((s) => slots.includes(s)));
            toast(L.success_availability_set);
          }}
        >
          {L.submit}
        </Button>

        <SectionTitle>{L.selected_time_availability}</SectionTitle>
        {saved.length ? (
          <div className="space-y-2.5">
            {saved.map((a) => (
              <Card key={a.date} className="flex items-start gap-3 p-3.5">
                <button className="min-w-0 flex-1 text-left" onClick={() => pickDate(a.date)}>
                  <p className="font-semibold text-ink">{fmtDay(a.date)}</p>
                  <p className="mt-0.5 text-sm text-muted">{a.slots.join(' · ')}</p>
                </button>
                <button aria-label={L.are_you_sure_you_want_to_delete} onClick={async () => (await ask({ message: L.are_you_sure_you_want_to_delete, danger: true })) !== null && setAvailability(a.date, [])} className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger/8">
                  <Trash2 className="size-4" />
                </button>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{L.no_data}</p>
        )}
      </div>
    </div>
  );
}
