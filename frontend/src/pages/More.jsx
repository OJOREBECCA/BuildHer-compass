import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Send,
  Sparkles,
  Check,
  Users,
  CalendarDays,
  Bell,
  Moon,
  LogOut,
  ShieldCheck,
  CircleHelp,
  UserPlus,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { useStore } from '../store';
import { communityService, aiService } from '../services';
import { Loading, ErrorBox } from '../components';

const inp =
  'w-full rounded-2xl border border-line bg-white p-4 pl-12 outline-none focus:ring-2 focus:ring-brand';

export function Login() {
  const nav = useNavigate();
  const { profile, setProfile } = useStore();
  const [e, setE] = useState('');
  const [p, setP] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');

  const ok = /^\S+@\S+\.\S+$/.test(e) && p.length >= 8;

  const submit = () => {
    if (!ok) {
      return setErr('Enter a valid email and a password of at least 8 characters.');
    }
    if (!profile) {
      setProfile({
        firstName: e.split('@')[0],
        lastName: '',
        country: 'Nigeria',
        city: '',
        stage: 'Student',
        level: 'Beginner',
        interests: [],
        preferences: [],
      });
    }
    nav('/', { replace: true });
  };

  return (
    <div className="mx-auto max-w-md space-y-5 px-5 py-8">
      <Link to="/welcome" aria-label="Back">
        <ArrowLeft className="text-brand" />
      </Link>

      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-brand p-3 text-white">
          <Compass />
        </div>
        <div>
          <b className="font-display">BuildHer Compass</b>
          <p className="text-xs text-slate-500">Navigate your next opportunity</p>
        </div>
      </div>

      <h1 className="font-display text-3xl font-bold">Welcome back</h1>
      <p className="text-slate-500">Sign in to continue your journey</p>

      {/* Email Field */}
      <label className="relative block text-sm font-medium">
        Email address
        <Mail
          className="absolute left-4 top-[46px] text-slate-400"
          size={18}
        />
        <input
          type="email"
          value={e}
          onChange={(x) => setE(x.target.value)}
          placeholder="you@example.com"
          className={`${inp} mt-2`}
        />
      </label>

      {/* Password Field */}
      <label className="relative block text-sm font-medium">
        Password
        <Lock
          className="absolute left-4 top-[46px] text-slate-400"
          size={18}
        />
        <input
          type={show ? 'text' : 'password'}
          value={p}
          onChange={(x) => setP(x.target.value)}
          placeholder="••••••••"
          className={`${inp} mt-2`}
        />
        <button
          type="button"
          aria-label="Toggle password"
          onClick={() => setShow(!show)}
          className="absolute right-4 top-[44px] text-slate-400"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </label>

      <Link to="/forgot" className="block text-right text-sm text-brand">
        Forgot password?
      </Link>

      {err && (
        <p role="alert" className="text-sm text-red-600">
          {err}
        </p>
      )}

      <button className="btn" onClick={submit}>
        Sign In
      </button>

      <Link
        to="/onboarding"
        className="block rounded-2xl border border-line bg-white py-4 text-center font-semibold text-brand"
      >
        Create an account
      </Link>
    </div>
  );
}

export function Ready() {
  const nav = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="rounded-full bg-brand/10 p-10 text-brand"
      >
        <Compass size={72} />
      </motion.div>

      <h1 className="font-display text-3xl font-bold">Your Compass is ready.</h1>
      <p className="text-slate-500">
        We're finding opportunities that match your goals.
      </p>

      <div className="h-1.5 w-full rounded-full bg-line">
        <motion.div
          className="h-1.5 rounded-full bg-brand"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.2 }}
        />
      </div>

      <button
        className="btn"
        disabled={!done}
        onClick={() => nav('/', { replace: true })}
      >
        {done ? 'Go to my Dashboard' : 'Building your dashboard...'}
      </button>
    </div>
  );
}

export function Communities() {
  const { joined, toggleJoin } = useStore();
  const [list, setList] = useState();
  const [q, setQ] = useState('');
  const [err, setErr] = useState(false);

  useEffect(() => {
    communityService
      .list()
      .then(setList)
      .catch(() => setErr(true));
  }, []);

  if (err) return <ErrorBox />;
  if (!list) return <Loading />;

  const rows = list.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">Communities</h1>
        <p className="text-slate-500">
          Connect with women in tech across Africa
        </p>
      </header>

      <input
        aria-label="Search communities"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search communities..."
        className="card w-full outline-none"
      />

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        {joined.length
          ? `You're in ${joined.length} communit${
              joined.length > 1 ? 'ies' : 'y'
            }! Keep building your network.`
          : 'Join a community to build your network.'}
      </div>

      {!rows.length ? (
        <p className="text-center text-slate-500">
          No communities match "{q}".
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((c) => {
            const j = joined.includes(c.id);
            return (
              <div key={c.id} className="card space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-mist p-3 text-brand">
                    <Users />
                  </div>
                  <div>
                    <b>{c.name}</b>
                    <p className="flex gap-3 text-xs text-slate-500">
                      <span>{c.members} members</span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} />
                        {c.events} events
                      </span>
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">{c.desc}</p>
                <button
                  onClick={() => toggleJoin(c.id)}
                  aria-pressed={j}
                  className={`w-full rounded-xl py-3 font-semibold ${
                    j
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-600'
                      : 'bg-brand text-white'
                  }`}
                >
                  {j ? (
                    <>
                      <Check size={16} className="mr-1 inline" />
                      Joined
                    </>
                  ) : (
                    'Join Community'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Profile() {
  const nav = useNavigate();
  const { profile: p, apps, joined, reminders, toggleReminders, signOut } =
    useStore();
  const list = Object.values(apps);

  const score =
    300 +
    list.reduce(
      (n, a) =>
        n +
        Object.values(a.checklist).filter(Boolean).length * 10 +
        (a.status === 'submitted' ? 100 : 0),
      0
    );

  const row = (I, t, end) => (
    <div className="flex items-center gap-3 py-3">
      <I size={20} className="text-brand" />
      <span className="flex-1">{t}</span>
      {end ?? <ChevronRight size={18} className="text-slate-400" />}
    </div>
  );

  if (!p) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="font-display text-2xl font-bold">Profile</h1>

      {/* Profile Header */}
      <div className="card flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand font-display text-xl font-bold text-white">
          {(p.firstName[0] ?? '') + (p.lastName[0] ?? '')}
        </div>
        <div>
          <b className="font-display text-lg">
            {p.firstName} {p.lastName}
          </b>
          <p className="text-sm text-slate-500">
            {p.stage}
            {p.city && ` – ${p.city}`}
          </p>
          <p className="text-sm text-brand">Score: {score}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          ['Saved', list.length],
          ['Applied', list.filter((a) => a.status === 'submitted').length],
          ['Communities', joined.length],
        ].map(([l, n]) => (
          <div key={l} className="card">
            <b className="font-display text-2xl">{n}</b>
            <p className="text-xs text-slate-500">{l}</p>
          </div>
        ))}
      </div>

      {/* Opportunity Passport Card */}
      <Link
        to="/passport"
        className="flex items-center gap-3 rounded-2xl bg-ink p-4 text-white"
      >
        <Trophy />
        <div className="flex-1">
          <b>Opportunity Passport</b>
          <p className="text-xs text-white/70">View achievements & badges</p>
        </div>
        <ChevronRight />
      </Link>

      {/* Settings Menu List */}
      <div className="card divide-y divide-line">
        {row(
          Bell,
          'Reminder Settings',
          <button
            role="switch"
            aria-checked={reminders}
            aria-label="Reminders"
            onClick={toggleReminders}
            className={`h-7 w-12 rounded-full p-1 transition ${
              reminders ? 'bg-brand' : 'bg-line'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white transition ${
                reminders ? 'translate-x-5' : ''
              }`}
            />
          </button>
        )}
        <Link to="/reminders" className="block">
          {row(Bell, 'Manage reminder timing')}
        </Link>
        {row(
          Moon,
          'Dark Mode',
          <span className="text-xs text-slate-400">Coming soon</span>
        )}
        {row(ShieldCheck, 'Privacy & Security')}
        {row(CircleHelp, 'Help Center')}
        {row(UserPlus, 'Invite Friends')}
      </div>

      {/* Sign Out Button */}
      <button
        onClick={() => {
          signOut();
          nav('/welcome', { replace: true });
        }}
        className="w-full rounded-2xl border border-red-200 bg-red-50 py-4 font-semibold text-red-500"
      >
        <LogOut size={18} className="mr-2 inline" />
        Sign Out
      </button>
    </div>
  );
}

const sug = [
  'What should I apply for this week?',
  'Find remote internships',
];

export function Chat() {
  const nav = useNavigate();
  const name = useStore((s) => s.profile?.firstName);
  const [m, setM] = useState([
    {
      from: 'ai',
      text: `Hi ${name}! I'm Compass AI, your personal opportunity guide. Ask me about opportunities, your applications, or what to focus on this week.`,
    },
  ]);
  const [t, setT] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' });
  }, [m, busy]);

  const send = async (text) => {
    if (!text.trim() || busy) return;
    setM((x) => [...x, { from: 'me', text }]);
    setT('');
    setBusy(true);
    try {
      const r = await aiService.reply(text);
      setM((x) => [...x, { from: 'ai', text: r }]);
    } catch {
      setM((x) => [
        ...x,
        {
          from: 'ai',
          text: 'I could not reach the server. Try again in a moment.',
        },
      ]);
    }
    setBusy(false);
  };

  return (
    <div className="mx-auto flex h-[80dvh] min-h-0 max-w-2xl flex-col">
      <header className="flex shrink-0 items-center gap-3 pb-4">
        <button aria-label="Back" onClick={() => nav(-1)}>
          <ArrowLeft className="text-brand" />
        </button>
        <div className="rounded-full bg-brand p-2 text-white">
          <Sparkles size={18} />
        </div>
        <div>
          <b className="font-display">Compass AI</b>
          <p className="text-xs text-emerald-600">Online – Always here for you</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto" aria-live="polite">
        {m.map((x, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl p-4 text-sm ${
              x.from === 'me'
                ? 'ml-auto bg-brand text-white'
                : 'bg-white shadow-card'
            }`}
          >
            {x.text}
          </div>
        ))}
        {busy && (
          <div className="flex w-16 justify-center gap-1 rounded-2xl bg-white p-4 shadow-card">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-2 w-2 rounded-full bg-brand"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  repeat: Infinity,
                  duration: 1,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}
        <div ref={end} />
      </div>

      {/* Suggestions */}
      <div className="flex gap-2 overflow-x-auto py-3">
        {sug.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="chip shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <div className="flex gap-2">
        <input
          aria-label="Message"
          value={t}
          onChange={(e) => setT(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(t)}
          placeholder="Ask Compass AI anything..."
          className="card flex-1 outline-none"
        />
        <button
          aria-label="Send"
          disabled={!t.trim() || busy}
          onClick={() => send(t)}
          className="rounded-full bg-brand p-4 text-white disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
