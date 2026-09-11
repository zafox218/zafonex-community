import { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import ListingCard from '@/components/ui/ListingCard';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function Services() {
  const [q, setQ] = useState('');
  const { data, loading } = useFetch(`/services?q=${encodeURIComponent(q)}&limit=12`, [q]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="glow-title text-3xl">Freelance services</h1>
        <p className="text-sm text-slate-500">Escrow-protected. The seller is paid when you accept the delivery.</p>
      </header>

      <input className="field" placeholder="Search gigs…" value={q} onChange={(e) => setQ(e.target.value)} />

      {loading ? <Spinner /> : !data?.items?.length ? (
        <EmptyState title="No gigs match that" hint="Try broader keywords." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((s) => (
            <ListingCard
              key={s.id}
              to={`/services/${s.slug}`}
              cover={s.coverUrl}
              title={s.title}
              summary={s.summary}
              price={s.packages?.[0]?.priceUsdt}
              seller={s.seller?.username}
              badge={s.packages?.length ? `from ${s.packages.length} tiers` : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
