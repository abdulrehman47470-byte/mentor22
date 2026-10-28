import { Building2, Camera, Mail, PencilLine, Settings } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { L, fill } from '@/data/labels';
import {
  ABOUT_MAX, AGE_RANGES, CAREER_GOALS, CERTIFICATES, COLLEGE_GOALS, COLLEGE_TYPES, DESCRIBED_HAVING, DESCRIBES_ME, ENROLLMENT, ETHNICITIES, GENDERS, GRAD_YEARS,
  LANGUAGES, MAJORS, PRONOUNS, RELIGIONS, SEEKING, SEMESTERS, TRANSFER_TARGETS, YES_NO,
} from '@/data/options';
import { COLLEGES } from '@/data/mock';
import { Avatar, Button, Card, ChipSingle, Field, Header, Input, MultiSelect, Segments, Select, TextArea, ask, toast } from '@/components/ui';
import { ImagePicker, cropToSquare } from '@/components/media';
import { SeeMore, Socials } from '@/pages/home';
import { collegeName, fullName, profileCompletion, saveProfile, setPhoto } from '@/lib/api';
import { useMe } from '@/lib/store';
import type { Profile, Socials as SocialLinks } from '@/lib/types';

function Row({ label, value }: { label: string; value?: string | string[] }) {
  const v = Array.isArray(value) ? value.join(', ') : value;
  return (
    <div className="border-b border-line py-3 last:border-0">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-0.5 text-[15px] text-ink">{v || '—'}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const nav = useNavigate();
  return (
    <Card className="mt-4">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-brand-dark">{title}</h2>
        <button onClick={() => nav('/profile/edit')} aria-label={`${L.edit_profile}: ${title}`} className="grid size-9 place-items-center rounded-full text-brand hover:bg-brand-light">
          <PencilLine className="size-4" />
        </button>
      </div>
      {children}
    </Card>
  );
}

export function MyProfile() {
  const nav = useNavigate();
  const user = useMe()!;
  const [picker, setPicker] = useState(false);
  const p = user.profile;
  const pct = profileCompletion(p);
  return (
    <div>
      <Header
        title={L.profile}
        right={
          <Link to="/settings" aria-label={L.settings} className="grid size-10 place-items-center rounded-full text-brand-dark hover:bg-bg-soft">
            <Settings className="size-5" />
          </Link>
        }
      />
      <div className="brand-gradient h-24" />
      <div className="-mt-14 px-4 pb-6">
        <div className="text-center">
          <button onClick={() => setPicker(true)} className="relative mx-auto block w-fit rounded-full bg-surface p-1.5 shadow-card" aria-label={L.select_image}>
            <Avatar user={user} size={108} />
            <span className="absolute bottom-1.5 right-1.5 grid size-9 place-items-center rounded-full bg-brand text-white ring-4 ring-surface">
              <Camera className="size-4" />
            </span>
          </button>
          <h1 className="mt-3 text-[22px] font-bold text-brand-dark">{fullName(user)}</h1>
          <p className="flex items-center justify-center gap-1.5 text-sm text-muted"><Mail className="size-4" />{user.email}</p>
          <p className="mt-0.5 flex items-center justify-center gap-1.5 text-sm text-muted"><Building2 className="size-4" />{collegeName(user)}</p>
          <Socials u={user} />
        </div>

        <Card className="mt-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-brand-dark">{fill(L.your_profile_is_xx_completed, `${pct}%`)}</span>
            <span className="font-bold text-brand">{pct}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="brand-gradient h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <Button className="mt-4 w-full" onClick={() => nav('/profile/edit')}>
            <PencilLine className="size-4" />
            {L.edit_profile}
          </Button>
        </Card>

        <Section title={L.about}>
          <SeeMore text={p.about} />
        </Section>
        <Section title={L.basic_info}>
          <Row label={L.first_name} value={p.firstName} />
          <Row label={L.last_name} value={p.lastName} />
          <Row label={L.gender} value={p.gender} />
          <Row label={L.age_range} value={p.ageRange} />
          <Row label={L.ethnicity} value={p.ethnicity} />
          <Row label={L.sexual_orientation} value={p.pronouns} />
          <Row label={L.languages_spoken} value={p.languages} />
          <Row label={L.religious_affiliation} value={p.religion} />
        </Section>
        <Section title={L.education}>
          <Row label={L.current_college_enrolled} value={p.currentCollege} />
          <Row label={L.enrollment_status} value={p.enrollmentStatus} />
          <Row label={L.current_semester} value={p.currentSemester} />
          <Row label={L.anticipated_graduation_year} value={p.gradYear} />
          <Row label={L.grade_point_average} value={p.gpa} />
          <Row label={L.college_major} value={p.major} />
          <Row label={L.college_certificate} value={p.certificate} />
        </Section>
        <Section title={L.goals_and_more}>
          <Row label={L.college_goals} value={p.collegeGoals} />
          <Row label={L.career_goals} value={p.careerGoals} />
          <Row label={L.i_would_like_to_attend_the_following} value={p.attendType} />
          <Row label={L.i_would_like_to_transfer} value={p.transferTo} />
          <Row label={L.the_following_best_describe_me} value={p.describesMe} />
          <Row label={L.i_can_be_described_as_having_the_following} value={p.describedHaving} />
          <Row label={L.what_are_you_seeking_from_a_mentor} value={p.seeking} />
          <Row label={L.have_you_met_with_a_counselor} value={p.metCounselor} />
          <Row label={L.have_you_applied_for_financial_aid} value={p.appliedFinancialAid} />
        </Section>
      </div>
      <ImagePicker
        open={picker}
        onClose={() => setPicker(false)}
        onPick={async (f) => {
          const url = await cropToSquare(f);
          if ((await ask({ message: user.photo ? L.are_you_sure_change_profile_pictureq : L.are_you_sure_you_want_to_upload_profile_imageq })) === null) return;
          setPhoto(url);
          toast(L.profile_image_uploaded_successfully);
        }}
      />
    </div>
  );
}

// ---------- Edit profile ----------
type Tab = 'basic' | 'education' | 'goals';
const URL_RE = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i;
const SOCIAL_FIELDS: { k: keyof SocialLinks; label: string; ph: string }[] = [
  { k: 'facebook', label: L.facebook, ph: L.enter_facebook_link },
  { k: 'linkedin', label: L.linkedin, ph: L.enter_linkedin_link },
  { k: 'x', label: L.twitter, ph: L.enter_twitter_link },
  { k: 'instagram', label: L.instagram, ph: L.enter_instagram_link },
  { k: 'threads', label: L.thread, ph: L.enter_threads_link },
];

export function EditProfile() {
  const nav = useNavigate();
  const user = useMe()!;
  const [p, setP] = useState<Profile>(user.profile);
  const [tab, setTab] = useState<Tab>('basic');
  const [err, setErr] = useState<{ tab: Tab; msg: string } | null>(null);
  const set = <K extends keyof Profile>(k: K) => (v: Profile[K]) => (setP((x) => ({ ...x, [k]: v })), setErr(null));
  const setSocial = (k: keyof SocialLinks, v: string) => (setP((x) => ({ ...x, socials: { ...x.socials, [k]: v } })), setErr(null));
  const colleges = COLLEGES.map((c) => c.name);

  const save = () => {
    const fail = (t: Tab, msg: string) => (setTab(t), setErr({ tab: t, msg }));
    if (!p.firstName.trim()) return fail('basic', L.please_enter_first_name);
    if (!p.lastName.trim()) return fail('basic', L.please_enter_last_name);
    const name = `${p.firstName.trim()} ${p.lastName.trim()}`;
    if (name.length < 3 || name.length > 40) return fail('basic', L.name_must_be_between);
    for (const s of SOCIAL_FIELDS) if (p.socials[s.k] && !URL_RE.test(p.socials[s.k].trim())) return fail('basic', `${s.label}: ${L.not_valid_url}`);
    if (p.gpa && !(Number(p.gpa) >= 0 && Number(p.gpa) <= 4.0)) return fail('education', `${L.grade_point_average}: 0.0 – 4.0`);
    saveProfile({ ...p, firstName: p.firstName.trim(), lastName: p.lastName.trim(), about: p.about.trim() });
    toast(L.profile_updated_successfully);
    nav('/profile', { replace: true });
  };

  return (
    <div className="min-h-app">
      <Header title={L.edit_profile} back="/profile" />
      <div className="sticky top-14 z-20 bg-bg/95 px-4 py-3 backdrop-blur">
        <Segments<Tab>
          value={tab}
          onChange={setTab}
          items={[
            { id: 'basic', label: L.basic_info },
            { id: 'education', label: L.education },
            { id: 'goals', label: L.goals_and_more },
          ]}
        />
      </div>
      <div className="px-4 pb-32 pt-2">
        {tab === 'basic' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={L.first_name}><Input value={p.firstName} onChange={(e) => set('firstName')(e.target.value)} placeholder={L.enter_first_name} autoComplete="given-name" maxLength={30} /></Field>
              <Field label={L.last_name}><Input value={p.lastName} onChange={(e) => set('lastName')(e.target.value)} placeholder={L.enter_last_name} autoComplete="family-name" maxLength={30} /></Field>
            </div>
            <Field label={L.gender}><Select value={p.gender} onChange={set('gender')} options={GENDERS} /></Field>
            <Field label={L.age_range}><Select value={p.ageRange} onChange={set('ageRange')} options={AGE_RANGES} /></Field>
            <Field label={L.ethnicity}><Select value={p.ethnicity} onChange={set('ethnicity')} options={ETHNICITIES} /></Field>
            <Field label={L.sexual_orientation}><Select value={p.pronouns} onChange={set('pronouns')} options={PRONOUNS} /></Field>
            <Field label={L.languages_spoken}><MultiSelect value={p.languages} onChange={set('languages')} options={LANGUAGES} /></Field>
            <Field label={L.religious_affiliation}><Select value={p.religion} onChange={set('religion')} options={RELIGIONS} /></Field>
            <Field label={L.please_describe_your_skills_title}>
              <TextArea value={p.about} onChange={(e) => set('about')(e.target.value)} placeholder={L.type_here} max={ABOUT_MAX} rows={5} />
            </Field>
            {SOCIAL_FIELDS.map((s) => (
              <Field key={s.k} label={s.label}>
                <Input type="url" inputMode="url" value={p.socials[s.k]} onChange={(e) => setSocial(s.k, e.target.value)} placeholder={s.ph} />
              </Field>
            ))}
          </>
        )}
        {tab === 'education' && (
          <>
            <Field label={L.current_college_enrolled}><Select value={p.currentCollege} onChange={set('currentCollege')} options={colleges} /></Field>
            <Field label={L.enrollment_status}><Select value={p.enrollmentStatus} onChange={set('enrollmentStatus')} options={ENROLLMENT} /></Field>
            <Field label={L.current_semester}><Select value={p.currentSemester} onChange={set('currentSemester')} options={SEMESTERS} /></Field>
            <Field label={L.anticipated_graduation_year}><Select value={p.gradYear} onChange={set('gradYear')} options={GRAD_YEARS} /></Field>
            <Field label={L.grade_point_average}><Input inputMode="decimal" value={p.gpa} onChange={(e) => set('gpa')(e.target.value.replace(/[^\d.]/g, '').slice(0, 4))} placeholder="0.0 – 4.0" /></Field>
            <Field label={L.college_major}><Select value={p.major} onChange={set('major')} options={MAJORS} /></Field>
            <Field label={L.college_certificate}><Select value={p.certificate} onChange={set('certificate')} options={CERTIFICATES} /></Field>
          </>
        )}
        {tab === 'goals' && (
          <>
            <Field label={L.college_goals}><MultiSelect value={p.collegeGoals} onChange={set('collegeGoals')} options={COLLEGE_GOALS} /></Field>
            <Field label={L.career_goals}><MultiSelect value={p.careerGoals} onChange={set('careerGoals')} options={CAREER_GOALS} /></Field>
            <Field label={L.i_would_like_to_attend_the_following}><Select value={p.attendType} onChange={set('attendType')} options={COLLEGE_TYPES} /></Field>
            <Field label={L.i_would_like_to_transfer}><Select value={p.transferTo} onChange={set('transferTo')} options={TRANSFER_TARGETS} /></Field>
            <Field label={L.the_following_best_describe_me}><MultiSelect value={p.describesMe} onChange={set('describesMe')} options={DESCRIBES_ME} /></Field>
            <Field label={L.i_can_be_described_as_having_the_following}><MultiSelect value={p.describedHaving} onChange={set('describedHaving')} options={DESCRIBED_HAVING} /></Field>
            <Field label={L.what_are_you_seeking_from_a_mentor}><MultiSelect value={p.seeking} onChange={set('seeking')} options={SEEKING} /></Field>
            <div className="mb-4">
              <p className="mb-1.5 text-sm font-semibold">{L.have_you_met_with_a_counselor}</p>
              <ChipSingle value={p.metCounselor} onChange={set('metCounselor')} options={YES_NO} />
            </div>
            <div className="mb-4">
              <p className="mb-1.5 text-sm font-semibold">{L.have_you_applied_for_financial_aid}</p>
              <ChipSingle value={p.appliedFinancialAid} onChange={set('appliedFinancialAid')} options={YES_NO} />
            </div>
          </>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] border-t border-line bg-surface/95 px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        {err && <p className="mb-2 rounded-xl bg-danger/8 px-3.5 py-2 text-sm font-medium text-danger" role="alert">{err.msg}</p>}
        <Button size="lg" onClick={save}>{L.save}</Button>
      </div>
    </div>
  );
}
