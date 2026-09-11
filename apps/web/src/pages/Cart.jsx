import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/store/cartStore';
import { useAuth } from '@/store/authStore';
import Price from '@/components/ui/Price';
import EmptyState from '@/components/ui/EmptyState';

export default function Cart() {
  const { items, remove, total, checkout } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!items.length) {
    return <EmptyState title="Your cart is empty" hint="Products, gigs and courses all check out through the same wallet."
      action={<Link to="/marketplace" className="btn-primary mt-2">Browse marketplace</Link>} />;
  }

  const submit = async () => {
    if (!user) return navigate('/login', { state: { from: '/cart' } });
    setBusy(true); setError(null);
    try {
      const order = await checkout();
      navigate('/dashboard', { state: { justOrdered: order.reference } });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr,1fr]">
      <div className="space-y-3">
        <h1 className="glow-title text-3xl">Cart</h1>
        {items.map((i) => (
          <div key={i.packageId ?? i.id} className="panel flex items-center gap-4 p-4">
            <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-void">
              {i.cover && <img src={i.cover} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">{i.title}</p>
              <span className="chip mt-1">{i.kind.toLowerCase()}</span>
            </div>
            <Price value={i.priceUsdt} size="sm" />
            <button onClick={() => remove(i.packageId ?? i.id)} className="text-slate-600 hover:text-ember">✕</button>
          </div>
        ))}
      </div>

      <aside className="panel h-fit space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-edge pb-4">
          <span className="text-sm text-slate-400">Total</span>
          <Price value={total()} size="lg" />
        </div>
        {error && <p className="rounded-lg border border-ember/40 bg-ember/10 p-3 text-xs text-ember">{error}</p>}
        <button className="btn-primary w-full py-3" onClick={submit} disabled={busy}>
          {busy ? 'Processing…' : 'Pay from wallet'}
        </button>
        <p className="text-center text-[11px] text-slate-600">
          Paid from your USDT balance. Top up in <Link to="/wallet" className="text-neon">your wallet</Link>.
        </p>
      </aside>
    </div>
  );
}
