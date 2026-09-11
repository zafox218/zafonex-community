import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import { useCart } from '@/store/cartStore';
import Spinner from '@/components/ui/Spinner';
import Price from '@/components/ui/Price';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const { data, loading, error } = useFetch(`/products/${slug}`, [slug]);

  if (loading) return <Spinner />;
  if (error) return <p className="panel p-6 text-ember">{error}</p>;

  const p = data.product;

  const addToCart = () => {
    add({ kind: 'PRODUCT', id: p.id, title: p.title, priceUsdt: p.priceUsdt, cover: p.coverUrl });
    navigate('/cart');
  };

  return (
    <article className="grid gap-8 lg:grid-cols-[1.6fr,1fr]">
      <div className="space-y-6">
        <div className="panel aspect-[16/9] overflow-hidden">
          {p.coverUrl
            ? <img src={p.coverUrl} alt="" className="h-full w-full object-cover" />
            : <div className="h-full w-full bg-grid bg-gridcell opacity-30" />}
        </div>

        <div className="space-y-3">
          <h1 className="glow-title text-3xl">{p.title}</h1>
          <p className="text-slate-400">{p.summary}</p>
          <div className="flex flex-wrap gap-2">
            {p.tags?.map((t) => <span key={t} className="chip">#{t}</span>)}
          </div>
        </div>

        <div className="panel space-y-3 p-6 text-sm leading-relaxed text-slate-300 whitespace-pre-line">
          {p.description}
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-lg text-white">Reviews ({p.ratingCount})</h2>
          {p.reviews?.length ? p.reviews.map((r) => (
            <div key={r.id} className="panel p-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>@{r.author.username}</span>
                <span className="text-neon">{'★'.repeat(r.rating)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{r.body}</p>
            </div>
          )) : <p className="text-sm text-slate-600">No reviews yet.</p>}
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="panel space-y-4 p-6">
          <Price value={p.priceUsdt} size="lg" />
          <button onClick={addToCart} className="btn-primary w-full py-3">Add to cart</button>
          <dl className="space-y-2 border-t border-edge pt-4 text-xs text-slate-500">
            <div className="flex justify-between"><dt>Seller</dt><dd className="text-slate-300">@{p.seller.username}</dd></div>
            <div className="flex justify-between"><dt>Sales</dt><dd className="text-slate-300">{p.salesCount}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd className="text-mint">Instant</dd></div>
          </dl>
        </div>
      </aside>
    </article>
  );
}
