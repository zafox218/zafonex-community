import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/authStore';

export default function Login() {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await login(form.email, form.password);
    setBusy(false);
    if (ok) navigate(location.state?.from ?? '/dashboard', { replace: true });
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="panel space-y-5 p-8">
        <div className="space-y-1 text-center">
          <h1 className="glow-title text-2xl">Welcome back</h1>
          <p className="text-sm text-slate-500">Sign in to your ZAFONEX account</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input className="field" type="email" placeholder="Email" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" type="password" placeholder="Password" autoComplete="current-password" required
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

          {error && <p className="rounded-lg border border-ember/40 bg-ember/10 p-3 text-xs text-ember">{error}</p>}

          <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>

        <p className="text-center text-sm text-slate-500">
          New here? <Link to="/register" className="text-neon hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
