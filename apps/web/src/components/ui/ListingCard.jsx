import { Link } from 'react-router-dom';
import Price from './Price';

export default function ListingCard({ to, cover, title, summary, price, seller, badge, footer }) {
  return (
    <Link
      to={to}
      className="panel group flex flex-col overflow-hidden transition hover:border-neon/40 hover:shadow-neon"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-void">
        {cover ? (
          <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-grid bg-gridcell opacity-40" />
        )}
        {badge && <span className="absolute left-3 top-3 chip border-neon/40 text-neon">{badge}</span>}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-base leading-snug text-white line-clamp-2">{title}</h3>
        {summary && <p className="text-sm text-slate-500 line-clamp-2">{summary}</p>}

        <div className="mt-auto flex items-center justify-between pt-3">
          {seller ? (
            <span className="text-xs text-slate-500">@{seller}</span>
          ) : <span />}
          {price !== undefined && <Price value={price} size="sm" />}
        </div>
        {footer}
      </div>
    </Link>
  );
}
