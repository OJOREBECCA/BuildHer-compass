import { Navigate, Route, Routes } from 'react-router-dom';
import { Shell } from './components';
import { useStore } from './store';

import { Welcome, Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Detail, Apply, Submitted } from './pages/Detail';
import { Tracker, Deadlines } from './pages/Tracker';
import { Forgot, Reminders, Passport } from './pages/Extra';
import { Login, Ready, Communities, Profile, Chat } from './pages/More';

export default function App() {
  const done = !!useStore((s) => s.profile);

  return (
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/forgot" element={<Forgot />} />
      <Route path="/ready" element={<Ready />} />

      <Route element={done ? <Shell /> : <Navigate to="/welcome" replace />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/explore" element={<Dashboard explore />} />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/deadlines" element={<Deadlines />} />
        <Route path="/community" element={<Communities />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/passport" element={<Passport />} />
        <Route path="/chat" element={<Chat />} />

        <Route path="/opportunity/:id" element={<Detail />} />
        <Route path="/opportunity/:id/apply" element={<Apply />} />
        <Route path="/opportunity/:id/submitted" element={<Submitted />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
