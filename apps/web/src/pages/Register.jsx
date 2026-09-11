import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/authStore';

export default function Register() {
  const { register, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', username: '', password: '', displayName: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await register(form);
    setBusy(false);
    if (ok) navigate('/dashboard', { replace: true });
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="panel space-y-5 p-8">
        <div className="space-y-1 text-center">
          <h1 className="glow-title text-2xl">Join ZAFONEX</h1>
          <p className="text-sm text-slate-500">Sell, hire and learn on one wallet</p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input className="field" placeholder="Display name" value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          <input className="field" placeholder="Username" required value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className="field" type="email" placeholder="Email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" type="password" placeholder="Password (10+ characters)" required minLength={10}
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

          {error && <p className="rounded-lg border border-ember/40 bg-ember/10 p-3 text-xs text-ember">{error}</p>}

          <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="text-neon hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
