import { Link } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import ListingCard from '@/components/ui/ListingCard';
import Spinner from '@/components/ui/Spinner';

const pillars = [
  { title: 'Marketplace', body: 'Sell templates, assets, ebooks and code. Delivery is instant, payout is same-second.', to: '/marketplace', accent: 'text-neon' },
  { title: 'Freelance', body: 'Three-tier packages with escrow. Funds unlock only when the buyer accepts delivery.', to: '/services', accent: 'text-plasma' },
  { title: 'Courses', body: 'Structured modules, lesson progress, and a certificate at 100%.', to: '/courses', accent: 'text-mint' },
];

export default function Home() {
  const { data, loading } = useFetch('/products?limit=6');

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl border border-edge bg-panel/60 px-6 py-16 text-center sm:px-12">
        <div className="pointer-events-none absolute inset-0 bg-grid bg-gridcell opacity-20" />
        <div className="relative mx-auto max-w-2xl space-y-5">
          <span className="chip border-neon/30 text-neon">USDT settlement · no card processor needed</span>
          <h1 className="glow-title text-4xl leading-tight sm:text-6xl">
            Build, sell and learn<br />in one community.
          </h1>
          <p className="text-base text-slate-400 sm:text-lg">
            ZAFONEX brings a digital marketplace, a freelance board and a course platform
            onto a single wallet — designed for creators whose regions the big
            platforms refuse to pay.
          </p>
          <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
            <Link to="/register" className="btn-primary px-6 py-3">Create your account</Link>
            <Link to="/marketplace" className="btn-ghost px-6 py-3">Browse the marketplace</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {pillars.map((p) => (
          <Link key={p.to} to={p.to} className="panel p-6 transition hover:border-neon/40">
            <h2 className={`font-display text-lg ${p.accent}`}>{p.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{p.body}</p>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="glow-title text-2xl">Fresh drops</h2>
          <Link to="/marketplace" className="text-sm text-neon hover:underline">See all</Link>
        </div>

        {loading ? <Spinner /> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.items?.map((p) => (
              <ListingCard
                key={p.id}
                to={`/marketplace/${p.slug}`}
                cover={p.coverUrl}
                title={p.title}
                summary={p.summary}
                price={p.priceUsdt}
                seller={p.seller?.username}
                badge={p.category?.name}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
