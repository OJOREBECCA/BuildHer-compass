import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Compass,
  ArrowLeft,
  Check,
  Hand,
  Globe,
  Rocket,
  Lightbulb,
  Target,
} from 'lucide-react';
import { useStore } from '../store';

export const Welcome = () => (
  <div className="flex min-h-screen flex-col items-center justify-between bg-gradient-to-br from-brand via-[#7A5CF5] to-[#8B6CF7] px-6 pb-10 pt-28 text-center text-white">
    <div className="flex flex-col items-center gap-5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative rounded-3xl border border-white/30 bg-white/15 p-6 backdrop-blur"
      >
        <Compass size={56} />
        <span className="absolute -right-24 -top-4 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs">
          96% Match
        </span>
        <span className="absolute -left-28 top-16 flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs">
          <Sparkles size={12} />
          Fellowship Found
        </span>
      </motion.div>
      <h1 className="font-display text-4xl font-bold">
        BuildHer
        <br />
        Compass
      </h1>
      <p className="max-w-xs text-white/85">
        Navigate your next tech opportunity.
      </p>
    </div>

    <div className="w-full max-w-sm space-y-3">
      <Link
        to="/onboarding"
        className="block rounded-2xl bg-white py-4 font-semibold text-brand"
      >
        Get Started
      </Link>
      <Link
        to="/login"
        className="block rounded-2xl border border-white/40 bg-white/15 py-4 font-medium"
      >
        Already have an account? Sign In
      </Link>
    </div>
  </div>
);

const countries = [
  'Nigeria',
  'Kenya',
  'Ghana',
  'South Africa',
  'Ethiopia',
  'Rwanda',
  'Uganda',
  'Tanzania',
  'Senegal',
  "Côte d'Ivoire",
  'Cameroon',
  'Egypt',
  'Morocco',
  'Zimbabwe',
  'Other',
];

const stages = [
  ['Student', 'Currently enrolled in a degree or diploma'],
  ['Recent Graduate', 'Finished studies in the last 2 years'],
  ['Early Career', '1–4 years of professional experience'],
  ['Career Switcher', 'Transitioning into tech from another field'],
];

const areas = [
  'Product Design',
  'Software Development',
  'Data & AI',
  'Cybersecurity',
  'Product Management',
  'Cloud & DevOps',
  'Content & Creative Tech',
  'Other',
];

const prefs = [
  'Internships',
  'Hackathons',
  'Scholarships',
  'Fellowships',
  'Bootcamps',
  'Remote Jobs',
  'Volunteering',
  'Communities',
];

const head = [Hand, Globe, Rocket, Lightbulb, Target];

const Chip = ({ on, t, fn }) => (
  <button
    type="button"
    aria-pressed={on}
    onClick={fn}
    className={`chip ${on ? 'chip-on' : ''}`}
  >
    {on && <Check size={14} className="mr-1 inline" />}
    {t}
  </button>
);

export function Onboarding() {
  const nav = useNavigate();
  const setProfile = useStore((s) => s.setProfile);
  const [step, setStep] = useState(0);

  const [f, setF] = useState({
    firstName: '',
    lastName: '',
    country: 'Nigeria',
    city: '',
    stage: 'Student',
    level: 'Beginner',
    linkedin: '',
    portfolio: '',
    github: '',
    interests: [],
    preferences: [],
  });

  const tog = (k, v) =>
    setF((p) => ({
      ...p,
      [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v],
    }));

  const valid = [
    Boolean(f.firstName.trim() && f.lastName.trim()),
    true,
    true,
    f.interests.length > 0,
    f.preferences.length > 0,
  ][step];

  const finish = () => {
    setProfile(f);
    nav('/ready', { replace: true });
  };

  const Icon = head[step];
  const inp =
    'mt-2 w-full rounded-2xl border border-line bg-white p-4 outline-none focus:ring-2 focus:ring-brand';

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
      {/* Progress Bars */}
      <div className="mb-6 flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= step ? 'bg-brand' : 'bg-line'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          className="flex-1"
        >
          <p className="text-xs text-slate-500">Step {step + 1} of 5</p>
          <Icon className="my-3 text-brand" size={28} />

          {/* Step 0: Name */}
          {step === 0 && (
            <>
              <h1 className="font-display text-2xl font-bold">
                What should we call you?
              </h1>
              <p className="mb-6 text-sm text-slate-500">
                Your name helps us personalise your experience.
              </p>
              {['firstName', 'lastName'].map((k) => (
                <label key={k} className="mb-4 block text-sm font-medium">
                  {k === 'firstName' ? 'First name' : 'Last name'}
                  <input
                    value={f[k]}
                    onChange={(e) => setF({ ...f, [k]: e.target.value })}
                    className={inp}
                  />
                </label>
              ))}
              {f.firstName && (
                <p className="rounded-2xl border border-line bg-mist p-4 text-sm text-brand">
                  Welcome, {f.firstName}! Let's build your compass.
                </p>
              )}
            </>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <>
              <h1 className="font-display text-2xl font-bold">
                Where are you based?
              </h1>
              <p className="mb-6 text-sm text-slate-500">
                We'll show opportunities relevant to your region.
              </p>
              <div className="flex flex-wrap gap-2">
                {countries.map((c) => (
                  <Chip
                    key={c}
                    on={f.country === c}
                    t={c}
                    fn={() => setF({ ...f, country: c })}
                  />
                ))}
              </div>
              <label className="mt-6 block text-sm font-medium">
                City
                <input
                  value={f.city}
                  placeholder="e.g. Lagos, Nairobi, Accra"
                  onChange={(e) => setF({ ...f, city: e.target.value })}
                  className={inp}
                />
              </label>
            </>
          )}

          {/* Step 2: Experience */}
          {step === 2 && (
            <>
              <h1 className="font-display text-2xl font-bold">
                Tell us about yourself
              </h1>
              <p className="mb-6 text-sm text-slate-500">
                Helps us match the right level of opportunity for you.
              </p>
              <div className="space-y-3">
                {stages.map(([t, s]) => (
                  <button
                    key={t}
                    onClick={() => setF({ ...f, stage: t })}
                    className={`card w-full border-2 text-left ${
                      f.stage === t ? 'border-brand' : 'border-transparent'
                    }`}
                  >
                    <b className="block">{t}</b>
                    <span className="text-sm text-slate-500">{s}</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map((l) => (
                  <Chip
                    key={l}
                    on={f.level === l}
                    t={l}
                    fn={() => setF({ ...f, level: l })}
                  />
                ))}
              </div>
            </>
          )}

          {/* Step 3: Interests */}
          {step === 3 && (
            <>
              <h1 className="font-display text-2xl font-bold">
                What are you into?
              </h1>
              <p className="mb-6 text-sm text-slate-500">
                Pick all the areas that excite you.
              </p>
              <div className="flex flex-wrap gap-2">
                {areas.map((a) => (
                  <Chip
                    key={a}
                    on={f.interests.includes(a)}
                    t={a}
                    fn={() => tog('interests', a)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Step 4: Preferences & Links */}
          {step === 4 && (
            <>
              <h1 className="font-display text-2xl font-bold">
                What are you looking for?
              </h1>
              <p className="mb-6 text-sm text-slate-500">
                Choose every opportunity type that interests you.
              </p>
              <div className="flex flex-wrap gap-2">
                {prefs.map((a) => (
                  <Chip
                    key={a}
                    on={f.preferences.includes(a)}
                    t={a}
                    fn={() => tog('preferences', a)}
                  />
                ))}
              </div>

              <p className="my-6 text-center text-xs text-slate-500">
                Profile links — optional
              </p>

              {['linkedin', 'portfolio', 'github'].map((k) => (
                <label key={k} className="mb-3 block text-sm font-medium">
                  {{
                    linkedin: 'LinkedIn',
                    portfolio: 'Portfolio',
                    github: 'GitHub',
                  }[k]}
                  <input
                    value={f[k]}
                    onChange={(e) => setF({ ...f, [k]: e.target.value })}
                    placeholder={
                      {
                        linkedin: 'linkedin.com/in/yourname',
                        portfolio: 'yourportfolio.com',
                        github: 'github.com/yourhandle',
                      }[k]
                    }
                    className={inp}
                  />
                </label>
              ))}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-6">
        {step > 0 && (
          <button
            aria-label="Back"
            onClick={() => setStep(step - 1)}
            className="rounded-2xl bg-white px-5 text-brand"
          >
            <ArrowLeft />
          </button>
        )}
        <button
          className="btn"
          disabled={!valid}
          onClick={() => (step < 4 ? setStep(step + 1) : finish())}
        >
          {step < 4 ? 'Continue' : 'Build My Compass'}
        </button>
      </div>
    </div>
  );
}
