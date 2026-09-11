import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import { useCart } from '@/store/cartStore';
import Spinner from '@/components/ui/Spinner';
import Price from '@/components/ui/Price';

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);
  const { data, loading, error } = useFetch(`/courses/${slug}`, [slug]);

  if (loading) return <Spinner />;
  if (error) return <p className="panel p-6 text-ember">{error}</p>;

  const c = data.course;
  const lessons = c.modules.reduce((n, m) => n + m.lessons.length, 0);

  return (
    <article className="grid gap-8 lg:grid-cols-[1.6fr,1fr]">
      <div className="space-y-6">
        <h1 className="glow-title text-3xl">{c.title}</h1>
        <p className="text-slate-400">{c.summary}</p>
        <div className="flex gap-2">
          <span className="chip">{c.level}</span>
          <span className="chip">{lessons} lessons</span>
          <span className="chip">{c._count.enrollments} enrolled</span>
        </div>

        <div className="panel p-6 text-sm leading-relaxed text-slate-300 whitespace-pre-line">{c.description}</div>

        <section className="space-y-3">
          <h2 className="font-display text-lg text-white">Curriculum</h2>
          {c.modules.map((m) => (
            <div key={m.id} className="panel overflow-hidden">
              <div className="border-b border-edge px-4 py-3 text-sm font-medium text-white">
                {m.position}. {m.title}
              </div>
              <ul>
                {m.lessons.map((l) => (
                  <li key={l.id} className="flex items-center justify-between px-4 py-3 text-sm text-slate-400">
                    <span className="flex items-center gap-2">
                      <span className={l.locked ? 'text-slate-700' : 'text-mint'}>{l.locked ? '🔒' : '▶'}</span>
                      {l.title}
                    </span>
                    <span className="font-mono text-xs text-slate-600">
                      {Math.round((l.durationSec || 0) / 60)}m
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="panel space-y-4 p-6">
          <Price value={c.priceUsdt} size="lg" />
          {data.enrolled ? (
            <button className="btn-ghost w-full py-3" onClick={() => navigate('/dashboard')}>Continue learning</button>
          ) : (
            <button
              className="btn-primary w-full py-3"
              onClick={() => {
                add({ kind: 'COURSE', id: c.id, title: c.title, priceUsdt: c.priceUsdt, cover: c.coverUrl });
                navigate('/cart');
              }}
            >
              Enroll now
            </button>
          )}
          <p className="text-center text-[11px] text-slate-600">Lifetime access · instant enrolment</p>
        </div>
      </aside>
    </article>
  );
}
