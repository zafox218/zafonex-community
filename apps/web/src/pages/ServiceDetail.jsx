import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import { useCart } from '@/store/cartStore';
import Spinner from '@/components/ui/Spinner';
import Price from '@/components/ui/Price';

export default function ServiceDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const { data, loading, error } = useFetch(`/services/${slug}`, [slug]);
  const [tier, setTier] = useState(0);

  if (loading) return <Spinner />;
  if (error) return <p className="panel p-6 text-ember">{error}</p>;

  const s = data.service;
  const pkg = s.packages[tier];

  const order = () => {
    add({
      kind: 'SERVICE', id: s.id, packageId: pkg.id,
      title: `${s.title} — ${pkg.name}`, priceUsdt: pkg.priceUsdt, cover: s.coverUrl,
    });
    navigate('/cart');
  };

  return (
    <article className="grid gap-8 lg:grid-cols-[1.6fr,1fr]">
      <div className="space-y-6">
        <div className="panel aspect-[16/9] overflow-hidden">
          {s.coverUrl ? <img src={s.coverUrl} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full bg-grid bg-gridcell opacity-30" />}
        </div>
        <h1 className="glow-title text-3xl">{s.title}</h1>
        <p className="text-slate-400">{s.summary}</p>
        <div className="panel p-6 text-sm leading-relaxed text-slate-300 whitespace-pre-line">{s.description}</div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="panel overflow-hidden">
          <div className="grid grid-cols-3 border-b border-edge">
            {s.packages.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setTier(i)}
                className={`px-2 py-3 text-xs font-medium transition ${i === tier ? 'bg-neon/10 text-neon' : 'text-slate-500 hover:text-white'}`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="space-y-4 p-6">
            <Price value={pkg.priceUsdt} size="lg" />
            <p className="text-sm text-slate-400">{pkg.description}</p>

            <ul className="space-y-2 text-sm text-slate-300">
              {pkg.features.map((f) => (
                <li key={f} className="flex gap-2"><span className="text-mint">▸</span>{f}</li>
              ))}
            </ul>

            <dl className="flex justify-between border-t border-edge pt-4 text-xs text-slate-500">
              <div><dt>Delivery</dt><dd className="text-slate-300">{pkg.deliveryDays} days</dd></div>
              <div className="text-right"><dt>Revisions</dt><dd className="text-slate-300">{pkg.revisions}</dd></div>
            </dl>

            <button onClick={order} className="btn-plasma w-full py-3">Order this package</button>
            <p className="text-center text-[11px] text-slate-600">Funds stay in escrow until you accept the work.</p>
          </div>
        </div>
      </aside>
    </article>
  );
}
