import { useFetch } from '@/hooks/useFetch';
import ListingCard from '@/components/ui/ListingCard';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';

export default function Courses() {
  const { data, loading } = useFetch('/courses?limit=12');

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="glow-title text-3xl">Courses</h1>
        <p className="text-sm text-slate-500">Project-based, taught by people who ship.</p>
      </header>

      {loading ? <Spinner /> : !data?.items?.length ? (
        <EmptyState title="No courses published yet" hint="Instructors — this is your opening." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((c) => (
            <ListingCard
              key={c.id}
              to={`/courses/${c.slug}`}
              cover={c.coverUrl}
              title={c.title}
              summary={c.summary}
              price={c.priceUsdt}
              seller={c.instructor?.username}
              badge={c.level}
            />
          ))}
        </div>
      )}
    </div>
  );
}
