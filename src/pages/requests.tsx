import { Building2, Inbox, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { L } from '@/data/labels';
import { Avatar, Badge, Button, Card, Empty, Header, Segments, ask } from '@/components/ui';
import { acceptConnection, collegeName, fullName, removeConnection, userById } from '@/lib/api';
import { timeAgo, useDb } from '@/lib/store';
import type { Connection } from '@/lib/types';

type Tab = 'pending' | 'accepted' | 'requested';

/** Requests: shows name, profession, college, date and "Referred By" (section 10). */
export function Requests() {
  const [tab, setTab] = useState<Tab>('pending');
  const mine = useDb((d) => d.connections.filter((c) => c.studentId === d.sessionUserId));
  const by = (s: Connection['status']) => mine.filter((c) => c.status === s).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const lists: Record<Tab, Connection[]> = { pending: by('invited'), accepted: by('accepted'), requested: by('requested') };
  const list = lists[tab];
  return (
    <div>
      <Header title={L.requests} />
      <div className="px-4 py-4">
        <Segments<Tab>
          value={tab}
          onChange={setTab}
          items={[
            { id: 'pending', label: L.pending, count: lists.pending.length },
            { id: 'accepted', label: L.accepted },
            { id: 'requested', label: L.requested },
          ]}
        />
        <div className="mt-4 space-y-3">
          {list.map((c) => (
            <RequestCard key={c.id} c={c} />
          ))}
        </div>
        {!list.length &&
          (tab === 'accepted' ? (
            <Empty icon={<UserCheck className="size-7" />} title={L.no_accepted_request} />
          ) : (
            <Empty icon={<Inbox className="size-7" />} title={L.no_pending_request} />
          ))}
      </div>
    </div>
  );
}

function RequestCard({ c }: { c: Connection }) {
  const nav = useNavigate();
  const m = useDb((d) => userById(c.mentorId, d));
  if (!m) return null;
  return (
    <Card className="p-3.5">
      <button onClick={() => nav(`/mentor/${m.id}`)} className="flex w-full gap-3 text-left">
        <Avatar user={m} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-bold text-ink">{fullName(m)}</p>
            <span className="shrink-0 text-xs text-muted">{timeAgo(c.createdAt)}</span>
          </div>
          <p className="truncate text-sm text-muted">{m.profile.profession}</p>
          <p className="flex items-center gap-1 truncate text-xs text-muted">
            <Building2 className="size-3.5 shrink-0" />
            {collegeName(m)}
          </p>
          {c.referredBy && (
            <p className="mt-1.5">
              <Badge tone="soft">
                {L.referred_by} {c.referredBy}
              </Badge>
            </p>
          )}
        </div>
      </button>
      <div className="mt-3 flex gap-2">
        {c.status === 'invited' && (
          <>
            <Button size="sm" className="flex-1" onClick={() => acceptConnection(c.id)}>
              {L.accept}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={async () => {
                const r = await ask({ message: L.are_you_sure_to_deny_mentoring_request, reason: 'optional', danger: true, confirm: L.reject_request });
                if (r !== null) removeConnection(c.id, r);
              }}
            >
              {L.reject_request}
            </Button>
          </>
        )}
        {c.status === 'accepted' && (
          <>
            <Button size="sm" variant="soft" className="flex-1" onClick={() => nav(`/chat/${m.id}`)}>
              {L.message}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={async () => {
                const r = await ask({ message: L.are_you_sure_you_want_to_disconnect, reason: 'optional', danger: true, confirm: L.disconnect });
                if (r !== null) removeConnection(c.id, r);
              }}
            >
              {L.disconnect}
            </Button>
          </>
        )}
        {c.status === 'requested' && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={async () => (await ask({ message: L.are_you_sure_want_to_cancel_request })) !== null && removeConnection(c.id)}
          >
            {L.cancel}
          </Button>
        )}
      </div>
    </Card>
  );
}
