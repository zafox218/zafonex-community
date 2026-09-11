import { Link } from 'react-router-dom';
import { useAuth } from '@/store/authStore';
import { useFetch } from '@/hooks/useFetch';
import { post } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import Price from '@/components/ui/Price';

export default function Dashboard() {
  const { user, becomeSeller } = useAuth();
  const { data: orders, loading } = useFetch('/orders');
  const { data: selling, reload } = useFetch('/orders/selling');

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="glow-title text-3xl">Hey, {user?.displayName ?? user?.username}</h1>
          <p className="text-sm text-slate-500">Role: <span className="text-neon">{user?.role}</span></p>
        </div>
        <div className="flex gap-2">
          <Link to="/wallet" className="btn-ghost">Wallet</Link>
          {user?.role === 'USER' && <button onClick={becomeSeller} className="btn-primary">Start selling</button>}
          {user?.role === 'ADMIN' && <Link to="/admin" className="btn-plasma">Admin</Link>}
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-lg text-white">Your orders</h2>
        {loading ? <Spinner /> : !orders?.orders?.length ? (
          <p className="panel p-6 text-sm text-slate-500">Nothing purchased yet.</p>
        ) : orders.orders.map((o) => (
          <div key={o.id} className="panel p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-slate-500">{o.reference}</span>
              <span className="chip border-neon/30 text-neon">{o.status}</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-slate-300">
              {o.items.map((i) => <li key={i.id} className="flex justify-between gap-4"><span className="truncate">{i.title}</span><Price value={i.unitUsdt} size="sm" /></li>)}
            </ul>
          </div>
        ))}
      </section>

      {selling?.items?.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg text-white">Work to deliver</h2>
          {selling.items.map((i) => (
            <div key={i.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm text-white">{i.title}</p>
                <p className="text-xs text-slate-500">
                  {i.order.reference} · @{i.order.buyer.username}
                  {i.dueAt && ` · due ${new Date(i.dueAt).toLocaleDateString()}`}
                </p>
              </div>
              {i.kind === 'SERVICE' && !i.deliveredAt && (
                <button
                  className="btn-primary"
                  onClick={async () => {
                    await post(`/orders/items/${i.id}/deliver`);
                    reload();
                  }}
                >
                  Mark delivered
                </button>
              )}
              {i.deliveredAt && <span className="chip border-mint/30 text-mint">delivered</span>}
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
