import { useState } from 'react';
import { useFetch } from '@/hooks/useFetch';
import ListingCard from '@/components/ui/ListingCard';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function Marketplace() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const [page, setPage] = useState(1);

  const { data, loading } = useFetch(
    `/products?q=${encodeURIComponent(q)}&sort=${sort}&page=${page}&limit=12`,
    [q, sort, page]
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="glow-title text-3xl">Marketplace</h1>
        <p className="text-sm text-slate-500">Digital products delivered the moment payment clears.</p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="field flex-1"
          placeholder="Search UI kits, assets, templates…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <select className="field sm:w-52" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {loading ? <Spinner /> : !data?.items?.length ? (
        <EmptyState title="Nothing here yet" hint="Try a different search, or be the first to publish in this category." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((p) => (
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

          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button className="btn-ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="font-mono text-xs text-slate-500">{page} / {data.pages}</span>
              <button className="btn-ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
