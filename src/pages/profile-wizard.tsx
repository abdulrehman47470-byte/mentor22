import { Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ChipSingle, Field, Header, Input, MultiSelect, Select, TextArea, toast } from '@/components/ui';
import { L } from '@/data/labels';
import {
  ACADEMIC_STATUS, AFFILIATIONS, AGE_RANGES, AVAILABILITY, BIO_MAX, CAREER_GOALS, CERTIFICATES, CLASSIFICATIONS, COLLEGES, COLLEGE_GOALS, COLLEGE_TYPES, COMMUNICATION,
  DEGREES, DESCRIBED_HAVING, DESCRIBES_ME, ETHNICITIES, GENDERS, GRAD_YEARS, HOBBIES, LANGUAGES, MAJORS, MENTORING_INTERESTS, PRONOUNS, RELIGIONS, SEMESTERS, SOCIALS,
  TRANSFER_TARGETS, YES_NO,
} from '@/data/options';
import { isMentorClass, saveProfile } from '@/lib/api';
import { cn, useMe } from '@/lib/store';
import type { Profile } from '@/lib/types';

/** Basic Info, Education, Goals & More (content document, section 5). */
const STEPS = [L.basic_info, L.education, L.goals_and_more] as const;
type Step = (typeof STEPS)[number];

export function ProfileWizard({ mode }: { mode: 'setup' | 'edit' }) {
  const user = useMe();
  const nav = useNavigate();
  const [p, setP] = useState<Profile | null>(() => (user ? structuredClone(user.profile) : null));
  const [step, setStep] = useState<Step>(L.basic_info);
  const [showErrors, setShowErrors] = useState(false);
  if (!user || !p) return null;

  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP({ ...p, [k]: v });
  const missing = [!p.firstName && L.first_name, !p.lastName && L.last_name, !p.affiliation && 'Affiliation', !p.classification && L.classification].filter(Boolean) as string[];
  const mentor = isMentorClass(p.classification);
  const name = `${p.firstName.trim()} ${p.lastName.trim()}`;
  const badUrl = SOCIALS.find((k) => p.socials[k] && !/^https?:\/\/\S+\.\S{2,}/i.test(p.socials[k].trim()));
  const fieldError = !p.firstName.trim() ? L.please_enter_first_name
    : !p.lastName.trim() ? L.please_enter_last_name
    : name.length < 3 || name.length > 40 ? L.name_must_be_between
    : badUrl ? `${badUrl}: ${L.not_valid_url}`
    : p.gpa && !(Number(p.gpa) >= 0 && Number(p.gpa) <= 4) ? `${L.grade_point_average}: 0.0 – 4.0`
    : '';
  const addEntry = () => set('educationEntries', [...p.educationEntries, { id: Math.random().toString(36).slice(2, 8), college: '', degree: '', location: '' }]);
  const setEntry = (k: number, patch: Partial<Profile['educationEntries'][number]>) => set('educationEntries', p.educationEntries.map((x, j) => (j === k ? { ...x, ...patch } : x)));
  const i = STEPS.indexOf(step);

  const next = () => {
    if (step === L.basic_info && (missing.length || fieldError)) {
      setShowErrors(true);
      toast(fieldError || `Please fill in: ${missing.join(', ')}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (mode === 'edit' || i === STEPS.length - 1) {
      if (missing.length || fieldError) return toast(fieldError || `Please fill in: ${missing.join(', ')}`);
      saveProfile(p);
      toast(mode === 'edit' ? L.profile_updated_successfully : 'Welcome to Mentor & Match!');
      nav(mode === 'edit' ? '/profile' : '/discover', { replace: true });
      return;
    }
    setStep(STEPS[i + 1]);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-app pb-28">
      <Header
        title={mode === 'edit' ? L.edit_profile : 'Build your profile'}
        sub={mode === 'setup' ? `Step ${i + 1} of 3 · ${step}` : undefined}
        back={mode === 'edit' ? true : undefined}
      />
      {/* Section tabs */}
      <div className="sticky top-14 z-20 flex gap-1 border-b border-line bg-surface px-4 py-2">
        {STEPS.map((s, idx) => (
          <button
            key={s}
            onClick={() => (mode === 'edit' || idx <= i ? setStep(s) : undefined)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition',
              s === step ? 'bg-navy text-white' : idx < i && mode === 'setup' ? 'text-success' : 'text-faint',
            )}
          >
            {idx < i && mode === 'setup' && <Check className="size-4" />}
            {s}
          </button>
        ))}
      </div>

      <div className="fade-up px-4 py-5" key={step}>
        {step === L.basic_info && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={L.first_name} required>
                <Input value={p.firstName} onChange={(e) => set('firstName', e.target.value)} autoComplete="given-name" className={cn(showErrors && !p.firstName && 'border-danger')} />
              </Field>
              <Field label={L.last_name} required>
                <Input value={p.lastName} onChange={(e) => set('lastName', e.target.value)} autoComplete="family-name" className={cn(showErrors && !p.lastName && 'border-danger')} />
              </Field>
            </div>
            <Field label={L.gender}>
              <Select value={p.gender} onChange={(v) => set('gender', v)} options={GENDERS} placeholder={L.select_one} />
            </Field>
            <Field label={L.sexual_orientation}>
              <Select value={p.pronouns} onChange={(v) => set('pronouns', v)} options={PRONOUNS} placeholder={L.select_one} />
            </Field>
            <Field label="Affiliation" required hint="Shown on your profile card.">
              <Select value={p.affiliation} onChange={(v) => set('affiliation', v)} options={AFFILIATIONS} placeholder="Select affiliation" />
            </Field>
            <Field label={L.classification} required hint="Mentors, Peer Mentors and Professionals receive mentoring requests.">
              <Select value={p.classification} onChange={(v) => set('classification', v)} options={CLASSIFICATIONS} placeholder="Select classification" />
            </Field>
            <Field label={L.college}>
              <Select value={p.college} onChange={(v) => set('college', v)} options={COLLEGES} placeholder={L.please_select_college} />
            </Field>
            {mentor && (
              <>
                <Field label="Profession">
                  <Input value={p.profession} onChange={(e) => set('profession', e.target.value)} placeholder="e.g. Transfer Counselor" />
                </Field>
                <Field label={L.office_location}>
                  <Input value={p.officeLocation} onChange={(e) => set('officeLocation', e.target.value)} />
                </Field>
                <Field label={L.office_phone_number}>
                  <Input type="tel" value={p.officePhone} onChange={(e) => set('officePhone', e.target.value)} placeholder={L.enter_phone_number} />
                </Field>
              </>
            )}
            <Field label={`${L.office_number} (If Applicable)`}>
              <Input value={p.officeNumber} onChange={(e) => set('officeNumber', e.target.value)} placeholder="e.g. 214" />
            </Field>
            <Field label="Best Availability">
              <MultiSelect value={p.availability} onChange={(v) => set('availability', v)} options={AVAILABILITY} placeholder="Select availability" />
            </Field>
            <Field label="Communication Preference">
              <MultiSelect value={p.communication} onChange={(v) => set('communication', v)} options={COMMUNICATION} placeholder="Select communication preferences" />
            </Field>
            <Field label={L.age_range}>
              <Select value={p.ageRange} onChange={(v) => set('ageRange', v)} options={AGE_RANGES} placeholder={L.select_one} />
            </Field>
            <Field label={`${L.ethnicity} (check all that apply)`}>
              <MultiSelect value={p.ethnicity} onChange={(v) => set('ethnicity', v)} options={ETHNICITIES} search placeholder="Select ethnicity" />
            </Field>
            {p.ethnicity.includes('Other') && (
              <Field label="Ethnicity: Other">
                <Input value={p.ethnicityOther} onChange={(e) => set('ethnicityOther', e.target.value)} placeholder="Please specify" />
              </Field>
            )}
            <Field label={L.languages_spoken}>
              <MultiSelect value={p.languages} onChange={(v) => set('languages', v)} options={LANGUAGES} search placeholder="Select languages" />
            </Field>
            <Field label={L.religious_affiliation}>
              <Select value={p.religion} onChange={(v) => set('religion', v)} options={RELIGIONS} placeholder={L.select_one} />
            </Field>
            <Field label={L.please_describe_your_skills_title}>
              <TextArea value={p.bio} onChange={(e) => set('bio', e.target.value.slice(0, BIO_MAX))} max={BIO_MAX} rows={5} placeholder={L.type_here} />
            </Field>
            <p className="mb-2 text-sm font-semibold">
              Social Media <span className="font-normal text-faint">(Optional)</span>
            </p>
            {SOCIALS.map((s) => (
              <Field key={s} label={s}>
                <Input type="url" inputMode="url" value={p.socials[s] ?? ''} onChange={(e) => set('socials', { ...p.socials, [s]: e.target.value })} placeholder={`Enter ${s} link`} />
              </Field>
            ))}
          </>
        )}

        {step === L.education && (
          <>
            <Field label={L.current_college_enrolled}>
              <Select value={p.college} onChange={(v) => set('college', v)} options={COLLEGES} placeholder={L.please_select_college} />
            </Field>
            <Field label={L.enrollment_status}>
              <Select value={p.academicStatus} onChange={(v) => set('academicStatus', v)} options={ACADEMIC_STATUS} placeholder={L.select_one} />
            </Field>
            <Field label={L.current_semester}>
              <Select value={p.currentSemester} onChange={(v) => set('currentSemester', v)} options={SEMESTERS} placeholder={L.select_one} />
            </Field>
            <Field label={L.anticipated_graduation_year}>
              <Select value={p.gradYear} onChange={(v) => set('gradYear', v)} options={GRAD_YEARS} placeholder={L.select_one} />
            </Field>
            <Field label={L.grade_point_average}>
              <Input inputMode="decimal" value={p.gpa} onChange={(e) => set('gpa', e.target.value.replace(/[^\d.]/g, '').slice(0, 4))} placeholder="0.0 – 4.0" />
            </Field>
            <Field label={L.college_major}>
              <Select value={MAJORS.includes(p.major as (typeof MAJORS)[number]) ? p.major : ''} onChange={(v) => set('major', v)} options={MAJORS} placeholder={p.major || L.select_one} />
            </Field>
            <Field label={L.college_certificate}>
              <Select value={p.certificate} onChange={(v) => set('certificate', v)} options={CERTIFICATES} placeholder={L.select_one} />
            </Field>
            <Field label="Education" hint="Degrees earned or in progress.">
              <Input value={p.education} onChange={(e) => set('education', e.target.value)} />
            </Field>
            {mentor && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-semibold">{L.college_degree_achieved}</p>
                {p.educationEntries.map((e, k) => (
                  <div key={e.id} className="mb-3 space-y-2 rounded-2xl border border-line p-3">
                    <Input value={e.college} onChange={(ev) => setEntry(k, { college: ev.target.value })} placeholder={L.college} />
                    <Select value={e.degree} onChange={(v) => setEntry(k, { degree: v })} options={DEGREES} placeholder={L.college_degree_achieved} />
                    <Input value={e.location} onChange={(ev) => setEntry(k, { location: ev.target.value })} placeholder={L.college_location} />
                    <button type="button" onClick={() => set('educationEntries', p.educationEntries.filter((_, j) => j !== k))} className="flex items-center gap-1 text-sm font-semibold text-danger"><Trash2 className="size-4" /> Remove</button>
                  </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={addEntry}><Plus className="size-4" /> {L.add_education}</Button>
              </div>
            )}
            <Field label="I am interested in the following careers">
              <TextArea value={p.careers} onChange={(e) => set('careers', e.target.value)} rows={2} />
            </Field>
            <Field label="Personal / Professional Goals">
              <TextArea value={p.goals} onChange={(e) => set('goals', e.target.value)} rows={3} />
            </Field>
          </>
        )}

        {step === L.goals_and_more && (
          <>
            {mentor ? (
              <>
                <Field label={L.the_following_best_describes_me_when_i_was_a_student}>
                  <MultiSelect value={p.describesMe} onChange={(v) => set('describesMe', v)} options={DESCRIBES_ME} placeholder="Select all that apply" />
                </Field>
                <Field label={L.as_a_student_i_experienced_the_following}>
                  <MultiSelect value={p.mentorExperienced} onChange={(v) => set('mentorExperienced', v)} options={DESCRIBED_HAVING} placeholder="Select all that apply" />
                </Field>
                <Field label={L.as_a_student_i_could_be_described_as_having_the_following}>
                  <MultiSelect value={p.describedHaving} onChange={(v) => set('describedHaving', v)} options={DESCRIBED_HAVING} placeholder="Select all that apply" />
                </Field>
                <Field label={L.i_went_to_the_following_college_university}>
                  <Input value={p.wentTo} onChange={(e) => set('wentTo', e.target.value)} />
                </Field>
                <Field label={L.i_attended_the_following_type_of_college_university}>
                  <Select value={p.attendedType} onChange={(v) => set('attendedType', v)} options={COLLEGE_TYPES} placeholder={L.select_one} />
                </Field>
                <Field label="Mentoring Interest">
                  <MultiSelect value={p.mentoringInterests} onChange={(v) => set('mentoringInterests', v)} options={MENTORING_INTERESTS} placeholder="Select mentoring interests" />
                </Field>
                <div className="mb-4"><p className="mb-1.5 text-sm font-semibold">{L.are_you_a_counselorq}</p><ChipSingle value={p.isCounselor} onChange={(v) => set('isCounselor', v)} options={YES_NO} /></div>
                <div className="mb-4"><p className="mb-1.5 text-sm font-semibold">{L.do_you_work_within_financial_aidq}</p><ChipSingle value={p.worksInFinancialAid} onChange={(v) => set('worksInFinancialAid', v)} options={YES_NO} /></div>
              </>
            ) : (
              <>
                <Field label={L.college_goals}>
                  <MultiSelect value={p.collegeGoals} onChange={(v) => set('collegeGoals', v)} options={COLLEGE_GOALS} placeholder="Select all that apply" />
                </Field>
                <Field label={L.career_goals}>
                  <MultiSelect value={p.careerGoals} onChange={(v) => set('careerGoals', v)} options={CAREER_GOALS} placeholder="Select all that apply" />
                </Field>
                <Field label={L.i_would_like_to_attend_the_following}>
                  <Select value={p.attendType} onChange={(v) => set('attendType', v)} options={COLLEGE_TYPES} placeholder={L.select_one} />
                </Field>
                <Field label={L.i_would_like_to_transfer}>
                  <Select value={TRANSFER_TARGETS.includes(p.futureUniversity as (typeof TRANSFER_TARGETS)[number]) ? p.futureUniversity : ''} onChange={(v) => set('futureUniversity', v)} options={TRANSFER_TARGETS} placeholder={p.futureUniversity || L.select_one} />
                </Field>
                <Field label={L.the_following_best_describe_me}>
                  <MultiSelect value={p.describesMe} onChange={(v) => set('describesMe', v)} options={DESCRIBES_ME} placeholder="Select all that apply" />
                </Field>
                <Field label={L.i_can_be_described_as_having_the_following}>
                  <MultiSelect value={p.describedHaving} onChange={(v) => set('describedHaving', v)} options={DESCRIBED_HAVING} placeholder="Select all that apply" />
                </Field>
                <Field label={L.what_are_you_seeking_from_a_mentor}>
                  <MultiSelect value={p.mentoringInterests} onChange={(v) => set('mentoringInterests', v)} options={MENTORING_INTERESTS} placeholder="Select all that apply" />
                </Field>
                <div className="mb-4"><p className="mb-1.5 text-sm font-semibold">{L.have_you_met_with_a_counselor}</p><ChipSingle value={p.metCounselor} onChange={(v) => set('metCounselor', v)} options={YES_NO} /></div>
                <div className="mb-4"><p className="mb-1.5 text-sm font-semibold">{L.have_you_applied_for_financial_aid}</p><ChipSingle value={p.appliedFinancialAid} onChange={(v) => set('appliedFinancialAid', v)} options={YES_NO} /></div>
              </>
            )}
            <Field label="Extracurricular Academic Activities">
              <TextArea value={p.extracurricular} onChange={(e) => set('extracurricular', e.target.value)} rows={2} />
            </Field>
            <Field label="Professional Affiliation">
              <Input value={p.professionalAffiliation} onChange={(e) => set('professionalAffiliation', e.target.value)} placeholder="e.g. ACM, NACE" />
            </Field>
            <Field label="Hobbies / Other Interests">
              <MultiSelect value={p.hobbies} onChange={(v) => set('hobbies', v)} options={HOBBIES} allowCustom placeholder="Select hobbies" />
            </Field>
          </>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-[480px] gap-3 border-t border-line bg-surface px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        {mode === 'setup' && i > 0 && (
          <Button variant="outline" onClick={() => setStep(STEPS[i - 1])}>
            Back
          </Button>
        )}
        <Button className="flex-1" onClick={next}>
          {mode === 'edit' ? L.save : i === STEPS.length - 1 ? L.done : L.next}
        </Button>
      </div>
    </div>
  );
}
