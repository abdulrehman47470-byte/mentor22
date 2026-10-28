import { Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { L } from '@/data/labels';
import { Avatar, toast } from '@/components/ui';
import { fullName, userById } from '@/lib/api';
import { cn, useDb } from '@/lib/store';

/**
 * Audio/video call (sends `to_user_id`, `call_type`). The real app connects through Agora; this demo
 * opens the camera and microphone and simulates the other person joining.
 */
export function Call() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const video = params.get('type') !== 'audio';
  const nav = useNavigate();
  const other = useDb((d) => userById(id, d));
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [phase, setPhase] = useState<'permission' | 'ringing' | 'live'>('permission');
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [secs, setSecs] = useState(0);
  const self = useRef<HTMLVideoElement>(null);

  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);
  useEffect(() => {
    if (self.current && stream) self.current.srcObject = stream;
  }, [stream, phase]);
  useEffect(() => {
    if (phase !== 'ringing') return;
    const t = setTimeout(() => setPhase('live'), 2200);
    return () => clearTimeout(t);
  }, [phase]);
  useEffect(() => {
    if (phase !== 'live') return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  if (!other) return <Navigate to="/chat" replace />;

  const allow = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video });
      setStream(s);
      setPhase('ringing');
    } catch (e) {
      const name = (e as DOMException).name;
      toast(name === 'NotAllowedError' ? (video ? L.app_does_not_have_access_to_your_camera : L.app_does_not_have_access_to_your_microphone) : L.call_disconnected_please_try_again);
    }
  };
  const end = () => {
    stream?.getTracks().forEach((t) => t.stop());
    nav(-1);
  };
  const toggleMute = () => {
    stream?.getAudioTracks().forEach((t) => (t.enabled = muted));
    setMuted((m) => !m);
  };
  const toggleCam = () => {
    stream?.getVideoTracks().forEach((t) => (t.enabled = camOff));
    setCamOff((c) => !c);
  };
  const clock = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center bg-gradient-to-b from-[#16273f] via-brand-dark to-[#16273f] px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-16 text-white">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative">
          {phase !== 'live' && <span className="ring-wave absolute inset-0 rounded-full border-2 border-white/40" aria-hidden />}
          <Avatar user={other} size={132} />
        </div>
        <h1 className="mt-6 text-2xl font-bold">{fullName(other)}</h1>
        <p className="mt-1 text-sm text-white/75">{phase === 'live' ? clock : phase === 'ringing' ? `${video ? L.video_call : L.audio_call}…` : other.profile.profession}</p>
        {phase === 'permission' && (
          <button className="mt-10 min-h-14 w-full max-w-xs rounded-full bg-white px-6 py-3 font-semibold text-brand-dark shadow-lg transition active:scale-[0.98]" onClick={allow}>
            {L.allow_camera_and_microphone_then_click_here}
          </button>
        )}
      </div>

      {video && stream && phase !== 'permission' && (
        <video ref={self} autoPlay muted playsInline className={cn('absolute right-4 top-4 h-40 w-28 rounded-2xl bg-black object-cover shadow-2xl ring-2 ring-white/30', camOff && 'opacity-0')} style={{ transform: 'scaleX(-1)' }} />
      )}

      <div className="flex items-center gap-5">
        {phase !== 'permission' && (
          <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted} className={cn('grid size-14 place-items-center rounded-full', muted ? 'bg-white text-brand-dark' : 'bg-white/15')}>
            {muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
          </button>
        )}
        <button onClick={end} aria-label={L.end_call} className="flex flex-col items-center gap-1.5">
          <span className="grid size-16 place-items-center rounded-full bg-danger shadow-lg">
            <PhoneOff className="size-7" />
          </span>
          <span className="text-xs text-white/80">{L.end_call}</span>
        </button>
        {phase !== 'permission' && video && (
          <button onClick={toggleCam} aria-label={camOff ? 'Camera on' : 'Camera off'} aria-pressed={camOff} className={cn('grid size-14 place-items-center rounded-full', camOff ? 'bg-white text-brand-dark' : 'bg-white/15')}>
            {camOff ? <VideoOff className="size-6" /> : <Video className="size-6" />}
          </button>
        )}
      </div>
    </div>
  );
}
